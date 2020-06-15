'use strict'
const { pathToPackage, message, version, versionCurrent } = require('./args');

module.exports = {
    supportedFormatLengths: ['3'],
    currentFormat: 3,
    enums: {
        statuses: {
            tagged: 'TAGGED',
            skipped: 'SKIPPED',
            committed: 'COMMITTED',
            pushed: 'PUSHED',
        },
        answers: {
            confirm: 'y',
            deny: 'f',
        },
        logOptions: {
            danger: 'danger',
            info: 'info',
            line: 'line',
            notice: 'notice',
            success: 'success',
            warning: 'warning',
        },
        dialogOptions: {

        },
        errorOptions: {

        },
    },
    messages: {
        questions: {
            confirmAction: 'Is that ok? [y/n] ',
            useVersion: `Use "${version}" as the next version? [y/n] `
        },
        errors: {
            cancelled: 'Process Cancelled',
            noChange: 'Nothing to change in the version. Canceled.',
        },
        dialog: {
            welcome: () => {
                utils.formattedLog('Welcome to Node Version Up!', enums.logOptions.success);
            },
            committed: () => {
                utils.formattedLog('Committed', enums.logOptions.success, true, true, 1);
            },
            displayVersionInfo: () => {
                log.warning('I\'m going to increase the application version in:');
                log.notice(`- package.json (${pathToPackage});`, 1);

                log.warning(`\nThe version will be changed:`);
                log.notice(`- from: ${versionCurrent}`, 1);
                log.notice(`- to:   ${version}`, 1);
                log.line();
            },
            initializeGit: () => {
              utils.formattedLog(`I'm ready to cooperate with git!`, enums.logOptions.success, false);

                log.warning('I want to make a commit with message:', 1);

                log.notice(`"${message}"`, 2);
            },
            updateInProcess: () => {
                log.notice('Updating version in package.json...', 0);
                log.line();
            },
            updateSuccess: () => {
                log.success(`Version in package.json changed successfully!`, 1);
                log.line();
            },
        },
    },
};
