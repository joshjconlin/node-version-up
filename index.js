'use strict';

const constants = require('./lib/constants');

// todo: update yargs
const argv = require('yargs').argv;
const utils = require('./lib/utils');

const pathToRoot = process.cwd();
const pathToPackage = argv.pathToPackage || `${pathToRoot}/package.json`;
const info = utils.getPackageInfo(pathToPackage);

const currentVersion = info.version;

const versions = utils.versions(currentVersion);

// helpers for handling arguments
const args = {
    hasMajor: () => argv.major || argv.mj || false,
    hasMinor: () => argv.minor || argv.mn || false,
    hasPatch: () => argv.patch || argv.p || false,
    getMajor: () => {
        const major = argv.major || argv.mj || false;

        return utils.incrementVersion(versions[0], major, false, 'major');
    },
    getMinor: (major) => {
        const minor = argv.minor || argv.mn || false;

        return utils.incrementVersion(versions[1], minor, major);
    },
    getPatch: (major, minor) => {
        const patch = argv.patch || argv.p || false;

        return utils.incrementVersion(versions[2], patch, major || minor, 'patch');
    },
    getCommitMessage: (version) => { // todo: template for version
        if (argv.message || argv.m) {
            return argv.message || argv.m;
        }

        return `Release ${version}: increase version.`
    },
    getTagName: (version) => {
        if (argv.tag || argv.t) {
            return argv.tag || argv.t;
        }

        return `"v${version}"`;
    },
    getVersion: (major, minor, patch) => `${major}.${minor}.${patch}`,
    shouldForceGit: () => {
        return !!(argv.force || argv.f);
    }
}

const major = args.getMajor();
const minor = args.getMinor(args.hasMajor());
const patch = args.getPatch(args.hasMajor(), args.hasMinor());

// getting next version
const version = args.getVersion(major, minor, patch);

// getting commit message
const message = args.getCommitMessage(version);

// getting commit tag
const commitTag = args.getTagName(version);

const shouldForceGit = args.shouldForceGit();

const noChange = version === currentVersion;

const {
    messages: {
        dialog,
        answers,
        questions,
        errors,
    },
    enums,
    supportedFormatLengths,
    currentFormat,

} = constants;

// todo: automate chaining, simple run function, abstract this down
const run = () => {
    utils.chain(
        ['welcome'],
        utils.runDialog,
    )
        .then(
            () => (utils.ensureGitBranchClean(shouldForceGit))
            // utils.chain(
            //     [],
            //     utils.passFuncWithArgs(
            //         [shouldForceGit],
            //         utils.ensureGitBranchClean,
            //     ))
                .then(utils.getGitBranch)
                .then(utils.confirmBranch) // todo: can pull out to outer level?
        )
        .then(
            utils.conditional(
                () => noChange,
                utils.chain(['noChange'], utils.error)
            )
        )
        .then(
            utils.chain(
                [version, constants.currentFormat, 'reject'],
                utils.isVersionCorrectFormat,
            )
                .then(
                    utils.chain(
                        ['displayVersionInfo', [pathToPackage, currentVersion, version]],
                        utils.runDialog,
                    )
                        .then(
                            utils.chain(
                                [
                                    utils.chain([questions.useVersion(version)], utils.handleQuestion),
                                    enums.answers.confirm,
                                    'resolve',
                                    'reject',
                                    errors.cancelled,
                                ]
                            )
                        )
                )
        )
        .then(
            utils.chain(
                ['updateInProcess'],
                utils.runDialog
            )
                .then(
                    utils.chain(
                        [pathToPackage, version],
                        utils.changeVersionInPackage,
                    )
                        .then(
                            utils.chain(
                                ['updateSuccess'],
                                utils.runDialog,
                            )
                        )
                )
        ).catch((e) => utils.formattedLog(e, enums.logOptions.danger))
}


// const updateVersion = confirmVersionChange.then(() => {
//     utils.runDialog('updateInProcess'); // todo make runDialog an HOF that returns a promise chain
//
//     utils.changeVersionInPackage(pathToPackage, version);
//
//     utils.runDialog('updateSuccess');
// });
//
// const commit = updateVersion.then(() => {
//     utils.runDialog('initializeGit', [message]);
//
//     // todo: add manual paths with flags, more git support
//     return utils.handleAnswer(
//         utils.handleQuestion(questions.confirmAction),
//         enums.answers.confirm,
//         () => utils.commitVersionIncrease(
//             version,
//             message,
//             [pathToPackage],
//             shouldForceGit,
//         ).then(() => utils.runDialog(enums.statuses.committed) || enums.statuses.committed),
//         () => enums.statuses.skipped
//     );
// });
//
//
// // todo: withStatusCheck
// const pushCommit = commit.then((status) => {
//     if (status === 'committed') {
//         log.warning('I want to push this commit.', 1);
//
//         log.line();
//
//         const question = log.danger('Is that okay? [y/n] ', 1, true);
//
//         const answer = readlineSync.question(question).toLowerCase();
//
//         log.line();
//
//         if (answer === 'y') {
//             return utils.pushCommit()
//                 .then(() => {
//                     log.success('Commit Pushed!', 1);
//                     log.line();
//
//                     return 'pushed'
//                 });
//         } else {
//             log.warning('Commit Skipped!', 1);
//
//             return 'skipped';
//         }
//     }
//
//     return 'skipped';
// });
//
// const tag = pushCommit.then((status) => {
//     if (status === 'pushed') {
//         log.warning(`I want to add a tag:`, 1);
//         log.notice(`"${commitTag}"`, 2)
//
//         log.line();
//
//         const question = log.danger(`Is that ok? [y/n] `, 1, true);
//
//         const answer = readlineSync.question(question).toLowerCase();
//
//         log.line();
//
//         if (answer === 'y') {
//             return utils.tagBranch(commitTag)
//                 .then(() => {
//                     log.success(`Branch Tagged!`, 1);
//                     log.line();
//
//                     return 'tagged';
//                 });
//         } else {
//             log.info('Tagging skipped', 1);
//             log.line()
//
//             return 'skipped';
//         }
//     }
//
//     return 'skipped';
// });
//
// const pushTag = tag.then((status) => {
//     if (status === 'tagged') {
//         const question = log.danger(`Do you want me to push this tag? [y/n] `, 1, true);
//
//         const answer = readlineSync.question(question).toLowerCase();
//
//         log.line();
//
//         if (answer === 'y') {
//             return utils.pushTag()
//                 .then(() => {
//                     log.success('Tag pushed!', 1);
//
//                     return 'pushed';
//                 });
//         } else {
//             log.warning('Pushing tag skipped', 1);
//             log.line();
//
//             return 'skipped';
//         }
//     }
//
//     return 'skipped';
// });

// pushTag.then(() => {
//     utils.formattedLog(`You're all done!`, enums.logOptions.success, true, false);
// }).catch(e => {
//     utils.formattedLog(e, enums.logOptions.danger);
// });

run();
