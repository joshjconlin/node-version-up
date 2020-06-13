'use strict';

const argv = require('yargs').argv;
// todo: update yargs
const readlineSync = require('readline-sync');

const helpers = require('./lib/helpers');
const log = require('./lib/log');
const constants = require('./lib/constants');

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
    version: (major, minor, patch) => `${major}.${minor}.${patch}`,
    force: () => {
        return !!(argv.force || argv.f);
    }
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

const force = args.force();

const initialize = new Promise((resolve, reject) => {
    log.line();
    log.success('Welcome to Node Version Up!');
    log.line();

    helpers
        .ensureGitBranchClean(force)
        .then(() => {
            helpers.getGitBranch()
                .then((branch) => {
                    return helpers.confirmBranch(branch)
                        .then(resolve).catch(reject);
                });
        })
        .catch(reject);

    log.warning('I\'m going to increase the application version in:');
    log.notice(`- package.json (${pathToPackage});`, 1);

    log.warning(`\nThe version will be changed:`);
    log.notice(`- from: ${versionCurrent}`, 1);
    log.notice(`- to:   ${version}`, 1);
    log.line();

    if (version === versionCurrent) {
        log.warning('Nothing to change in the version. Canceled.');
        process.exit();
    }
});

const chain = initialize.then(() => {
    return new Promise((resolve, reject) => {
        if (versions.length !== 3) {
            log.warning(`I can\'t understand format of the version "${versionCurrent}". Process Failed`);
            return reject('Process canceled.') // todo: error codes/messages
        }

        const question = log.danger(`Use "${version}" as the next version? [y/n] `, 1, true);
        const answer = readlineSync.question(question).toLowerCase();

        log.line();

        // todo: status in resolve
        return answer === 'y' ? resolve() : reject('Process canceled.');
    });
});

// get dialog()

const update = chain.then(() => {
    log.notice('Updating version in package.json...', 0);
    log.line();

    helpers.changeVersionInPackage(pathToPackage, version);

    log.success(`Version in package.json changed successfully!`, 1);

    log.line();
});

const commit = update.then(() => {
    log.success(`I'm ready to cooperate with git!`);

    log.line();

    log.warning('I want to make a commit with message:', 1);

    log.notice(`"${message}"`, 2);

    const question = log.danger(`Is that ok? [y/n] `, 1, true);
    log.line();

    const answer = readlineSync.question(question).toLowerCase();

    if (answer === 'y') {
        return helpers.commitVersionIncrease(version, message, [
            pathToPackage,
        ], force).then(() => {
            log.line();
            log.success(`Committed!`, 1);
            log.line();

            return 'committed';
        });
    } else {
        log.warning(`Skipped.`, 1);

        return 'skipped';
    }
});

const pushCommit = commit.then((status) => {
    if (status === 'committed') {
        log.warning('I want to push this commit.', 1);

        log.line();

        const question = log.danger('Is that okay? [y/n] ', 1, true);

        const answer = readlineSync.question(question).toLowerCase();

        log.line();

        if (answer === 'y') {
            return helpers.pushCommit()
                .then(() => {
                    log.success('Commit Pushed!', 1);
                    log.line();

                    return 'pushed'
                });
        } else {
            log.warning('Commit Skipped!', 1);

            return 'skipped';
        }
    }

    return 'skipped';
});

const tag = pushCommit.then((status) => {
    if (status === 'pushed') {
        log.warning(`I want to add a tag:`, 1);
        log.notice(`"${commitTag}"`, 2)

        log.line();

        const question = log.danger(`Is that ok? [y/n] `, 1, true);

        const answer = readlineSync.question(question).toLowerCase();

        log.line();

        if (answer === 'y') {
            return helpers.tag(commitTag)
                .then(() => {
                    log.success(`Branch Tagged!`, 1);
                    log.line();

                    return 'tagged';
                });
        } else {
            log.info('Tagging skipped', 1);
            log.line()

            return 'skipped';
        }
    }

    return 'skipped';
});

const pushTag = tag.then((status) => {
    if (status === 'tagged') {
        const question = log.danger(`Do you want me to push this tag? [y/n] `, 1, true);

        const answer = readlineSync.question(question).toLowerCase();

        log.line();

        if (answer === 'y') {
            return helpers.pushTag()
                .then(() => {
                    log.success('Tag pushed!', 1);

                    return 'pushed';
                });
        } else {
            log.warning('Pushing tag skipped', 1);
            log.line();

            return 'skipped';
        }
    }

    return 'skipped';
});

pushTag.then(() => {
    log.line();
    log.success(`You're all done!`);
}).catch(e => {
    log.line();
    log.danger(e)
    log.line();
});
