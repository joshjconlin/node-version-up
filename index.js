'use strict';

const fs = require('fs');
const argv = require('yargs').argv;
const readlineSync = require('readline-sync');

const helpers = require('./lib/helpers');
const log = require('./lib/log');


const pathToRoot = process.cwd();
const pathToPackage = argv.pathToPackage || `${pathToRoot}/package.json`;
const pathToAppJson = `${pathToRoot}/app.json`;
const info = helpers.getPackageInfo(pathToPackage);

const pathToPlist = argv.pathToPlist || `${pathToRoot}/ios/${info.name}/Info.plist`;
const pathToGradle = argv.pathToGradle || `${pathToRoot}/android/app/build.gradle`;

// getting next version
const versionCurrent = info.version;
const versions = helpers.versions(versionCurrent);
let major = helpers.version(versions[0], argv.major);
let minor = helpers.version(versions[1], argv.minor, argv.major);
let patch = helpers.version(versions[2], argv.patch, argv.major || argv.minor);
let buildOption = argv.build || false;
let jsBundle = argv.jsBundle || false;

if (jsBundle) {
  const appJson = require(pathToAppJson);
  let version = parseInt(appJson.jsBundleIdentifier, 10);
  version += 1;
  helpers.changeJsBundleVersionInAppJson(pathToAppJson, version);
  console.log(`jsBundleIdentifier changed in app.json to ${version}`);
  return;
}

// getting next build number
const buildCurrent = helpers.getBuildNumberFromPlist(pathToPlist);
const build = buildCurrent + 1;

if (buildOption) {
  if (argv.ios) {
    helpers.changeBuildInPlist(pathToPlist, build);
    helpers.changeIosBuildNumberInAppJson(pathToAppJson, build);
    console.log(`Build number in plist incremented from ${buildCurrent} to ${build}`);
    return;
  } else if (argv.android) {
    helpers.changeBuildInGradle(pathToGradle, build);
    helpers.changeAndroidVersionCodeInAppJson(pathToAppJson, build);
    console.log(`Build number in gradle incremented from ${buildCurrent} to ${build}`);
  } else {
    helpers.changeBuildInPlist(pathToPlist, build);
    helpers.changeBuildInGradle(pathToGradle, build);
    helpers.changeIosBuildNumberInAppJson(pathToAppJson, build);
    helpers.changeAndroidVersionCodeInAppJson(pathToAppJson, build);
    console.log(`Build number incremented in plist and gradle from ${buildCurrent} to ${build}`);
  }
  return;
}

const version = `${major}.${minor}.${patch}`;

// getting commit message
const message = argv.m || argv.message || `release ${version}: increase versions and build numbers`;


log.info('\nI\'m going to increase the version in:');
log.info(`- package.json (${pathToPackage});`, 1);
log.info(`- ios project (${pathToPlist});`, 1);
log.info(`- android project (${pathToGradle}).`, 1);

log.notice(`\nThe version will be changed:`);
log.notice(`- from: ${versionCurrent} (${buildCurrent});`, 1);
log.notice(`- to:   ${version} (${build}).`, 1);

if (version === versionCurrent) {
  log.warning('\nNothing to change in the version. Canceled.');
  process.exit();
}


const chain = new Promise((resolve, reject) => {
  log.line();

  if (versions.length !== 3) {
    log.warning(`I can\'t understand format of the version "${versionCurrent}".`);
  }

  const question = log.info(`Use "${version}" as the next version? [y/n] `, 0, true);
  const answer = readlineSync.question(question).toLowerCase();
  answer === 'y' ? resolve() : reject('Process canceled.');
});


const update = chain.then(() => {
  log.notice('\nUpdating versions');
}).then(() => {
  log.info('Updating version in package.json...', 1);

  helpers.changeVersionInPackage(pathToPackage, version);
  if (fs.existsSync(pathToAppJson)) {
    helpers.changeVersionInAppJson(pathToAppJson, version);
    helpers.changeIosBuildNumberInAppJson(pathToAppJson, build);
    helpers.changeAndroidVersionCodeInAppJson(pathToAppJson, build);
    log.success(`Version and builds in app.json changed.`, 2)
  }
  log.success(`Version in package.json changed.`, 2);
}).then(() => {
  log.info('Updating version in xcode project...', 1);

  helpers.changeVersionAndBuildInPlist(pathToPlist, version, build);
  log.success(`Version and build number in ios project (plist file) changed.`, 2);
}).then(() => {
  log.info('Updating version in android project...', 1);

  helpers.changeVersionAndBuildInGradle(pathToGradle, version, build);
  log.success(`Version and build number in android project (gradle file) changed.`, 2);
});

const commit = update.then(() => {
  log.notice(`\nI'm ready to cooperate with the git!`);
  log.info('I want to make a commit with message:', 1);
  log.info(`"${message}"`, 2);
  log.info(`I want to add a tag:`, 1);
  log.info(`"v${version}"`, 2);

  const question = log.info(`Do you allow me to do this? [y/n] `, 1, true);
  const answer = readlineSync.question(question).toLowerCase();
  if (answer === 'y') {
    return helpers.commitVersionIncrease(version, message, [
      pathToPackage,
      pathToPlist,
      pathToGradle
    ]).then(() => {
      log.success(`Commit with files added. Run "git push".`, 1);
    });
  } else {
    log.warning(`Skipped.`, 1);
  }
});

commit.then(() => {
  log.success(`\nDone!`);
}).catch(e => {
  log.line();
  log.error(e)
});
