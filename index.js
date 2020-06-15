'use strict';

const readlineSync = require('readline-sync');

const utils = require('./lib/utils');
const log = require('./lib/log');
const constants = require('./lib/constants');

const {
    commitTag,
    message,
    shouldForceGit,
    version,
    noChange,
    pathToPackage
} = require('./lib/args');

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


const initialize = new Promise((resolve, reject) => {
    utils.runDialog('welcome');

    utils
        .ensureGitBranchClean(shouldForceGit)
        .then(utils.getGitBranch)
        .then(utils.confirmBranch)
        .then(resolve)
        .catch(reject);

    if (noChange) {
        utils.error('noChange');
    }
});

const confirmVersionChange = initialize.then(() => {
    return new Promise((resolve, reject) => {
        utils.isVersionCorrectFormat(version, constants.currentFormat, reject);

        utils.runDialog('displayVersionInfo');

        return utils.handleAnswer(
            utils.handleQuestion(questions.useVersion),
            enums.answers.confirm,
            resolve,
            reject,
            errors.cancelled,
        );
    });
});

const updateVersion = confirmVersionChange.then(() => {
    utils.runDialog('updateInProcess');

    utils.changeVersionInPackage(pathToPackage, version);

    utils.runDialog('updateSuccess');
});

const commit = updateVersion.then(() => {
    utils.runDialog('initializeGit');

    // todo: add manual paths with flags, more git support
    return utils.handleAnswer(
      utils.handleQuestion(questions.confirmAction),
      enums.answers.confirm,
        () => utils.commitVersionIncrease(
            version,
            message,
            [pathToPackage],
            shouldForceGit,
        ).then(() => utils.runDialog('committed') || enums.statuses.committed),
        () => enums.statuses.skipped
    );
});


// todo: withStatusCheck
const pushCommit = commit.then((status) => {
    if (status === 'committed') {
        log.warning('I want to push this commit.', 1);

        log.line();

        const question = log.danger('Is that okay? [y/n] ', 1, true);

        const answer = readlineSync.question(question).toLowerCase();

        log.line();

        if (answer === 'y') {
            return utils.pushCommit()
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
            return utils.tagBranch(commitTag)
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
            return utils.pushTag()
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
