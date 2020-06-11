'use strict';

const fs = require('fs');
const argv = require('yargs').argv;
const readlineSync = require('readline-sync');

const helpers = require('./lib/helpers');
const log = require('./lib/log');

const pathToRoot = process.cwd();
const pathToPackage = argv.pathToPackage || `${pathToRoot}/package.json`;
const info = helpers.getPackageInfo(pathToPackage);

const versionCurrent = info.version;
const versions = helpers.versions(versionCurrent);

const args = {
  hasMajor: () => argv.major || argv.mj || false,
  hasMinor: () => argv.minor || argv.mn || false,
  hasPatch: () => argv.patch || argv.p || false,
  major: () => {
    const major = argv.major || argv.mj || false;

    return helpers.version(versions[0], major, false, 'major');
  },
  minor: (major) => {
    const minor = argv.minor || argv.mn || false;

    return helpers.version(versions[1], minor, major);
  },
  patch: (major, minor) => {
    const patch = argv.patch || argv.p || false;

    return helpers.version(versions[2], patch, major || minor, 'patch');
  },
  message: (version) => {
    if (argv.message || argv.m) {
      return argv.message || argv.m;
    }

    return `Release ${version}: increase version.`
  },
  tag: (version) => {
    if (argv.tag || argv.t) {
      return argv.tag || argv.t;
    }

    return `"v${version}"`;
  },
  version: (major, minor, patch) => `${major}.${minor}.${patch}`
}

const major = args.major();
const minor = args.minor(args.hasMajor());
const patch = args.patch(args.hasMajor(), args.hasMinor());

// getting next version
const version = args.version(major, minor, patch);

// getting commit message
const message = args.message(version);

// getting commit tag
const commitTag = args.tag(version);

const initialize = new Promise((resolve, reject) => {
  helpers
      .ensureGitBranchClean()
      .then(() => {
        helpers.getGitBranch()
            .then((branch) => {
              return helpers.confirmBranch(branch)
                  .then(resolve).catch(reject);
            });
      })
      .catch(reject);

  log.info('\nI\'m going to increase the version in:');
  log.info(`- package.json (${pathToPackage});`, 1);

  log.notice(`\nThe version will be changed:`);
  log.notice(`- from: ${versionCurrent}`, 1);
  log.notice(`- to:   ${version}`, 1);

  if (version === versionCurrent) {
    log.warning('\nNothing to change in the version. Canceled.');
    process.exit();
  }
});

const chain = initialize.then(() => {
  return new Promise((resolve, reject) => {
    log.line();

    if (versions.length !== 3) {
      log.warning(`I can\'t understand format of the version "${versionCurrent}".`);
    }

    const question = log.info(`Use "${version}" as the next version? [y/n] `, 0, true);
    const answer = readlineSync.question(question).toLowerCase();
    answer === 'y' ? resolve() : reject('Process canceled.');
  });
});

const update = chain.then(() => {
  log.notice('\nUpdating versions');
}).then(() => {
  log.info('Updating version in package.json...', 1);

  helpers.changeVersionInPackage(pathToPackage, version);

  log.success(`Version in package.json changed.`, 2);
});

const commit = update.then(() => {
  log.notice(`\nI'm ready to cooperate with git!`);
  log.info('I want to make a commit with message:', 1);
  log.info(`"${message}"`, 2);

  const question = log.info(`\nDo you want me to do this? [y/n] `, 1, true);

  const answer = readlineSync.question(question).toLowerCase();

  if (answer === 'y') {
    return helpers.commitVersionIncrease(version, message, [
      pathToPackage,
    ]).then(() => {
      log.success(`\nCommitted!\n`, 1);

      return 'committed';
    });
  } else {
    log.warning(`Skipped.`, 1);

    return 'skipped';
  }
});

const pushCommit = commit.then((status) => {
  if (status === 'committed') {
    const question = log.info('I want to push this commit. Is this okay? [y/n]', 1);

    const answer = readlineSync.question(question).toLowerCase();

    if (answer === 'y') {
      return helpers.pushCommit()
          .then(() => {
            log.success('\nCommit Pushed!\n');

            return 'pushed'
          });
    } else {
      log.info('\nCommit Skipped!\n', 1);

      return 'skipped';
    }
  }

  return 'skipped';
});

const tag = pushCommit.then((status) => {
  if (status === 'pushed') {
    log.info(`I want to add a tag:\n`, 1);
    log.info(commitTag, 1)

    const question = log.info(`\nDo you allow me to do this? [y/n]`);

    const answer = readlineSync.question(question).toLowerCase();

    if (answer === 'y') {
      return helpers.tag(commitTag)
          .then(() => {
            log.success(`\nBranch Tagged!\n`);

            return 'tagged';
          });
    } else {
      log.info('\nTagging skipped\n');

      return 'skipped';
    }
  }

  return 'skipped';
});

const pushTag = tag.then((status) => {
  if (status === 'tagged') {
    const question = log.info(`\nDo you want me to push this tag? [y/n]`);

    const answer = readlineSync.question(question).toLowerCase();

    if (answer === 'y') {
      return helpers.pushTag()
          .then(() => {
            log.info('\nTag pushed!\n');

            return 'pushed';
          });
    } else {
      log.info('\nPushing tag skipped\n', 1);

      return 'skipped';
    }
  }

  return 'skipped';
});

pushTag.then(() => {
  log.success(`\nYou're all done!`);
}).catch(e => {
  log.line();
  log.error(e)
});
