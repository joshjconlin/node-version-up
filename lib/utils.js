'use strict';

const fs = require('fs');
const readlineSync = require('readline-sync');
const exec = require('child_process').exec;
const log = require('./log');
const contants = require('./constants');

const { messages: { errors, dialog } }  = contants;

const noOp = () => {
  //
};

module.exports = {

    chainDialog(keys) {
        keys.forEach(key => {
            this.runDialog(key);
        });
    },

    changeVersionInPackage(pathToFile, version) {
        // let packageContent = fs.readFileSync(pathToFile, 'utf8');
        // packageContent = packageContent.replace(/("version":\s*")([\d\.]+)(")/g, `$1${version}$3`);
        // fs.writeFileSync(pathToFile, packageContent, 'utf8');
    },

    commitVersionIncrease(version, message, pathsToAdd = [], force) {
        const paths = force ? '.' : pathsToAdd.join(' ');
        return new Promise((resolve, reject) => {
            return resolve();
            // exec(`git add ${paths} && git commit -m '${message}'`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
            //   if (error) {
            //     return reject(error);
            //   }
            //
            //   return resolve();
            // });
        });
    },

    checkoutBranch(branchName) {
        return this.executeCommand(`git checkout ${branchName}`);
    },

    confirmBranch(branch) {
        return new Promise((resolve, reject) => {
            log.warning(`You are currently on branch "${branch.replace('\n', '')}".`);
            log.line();

            const question = log.danger(`Do you want to use this branch? [y/n] `, 1, true);

            const answer = readlineSync.question(question).toLowerCase();

            log.line();

            if (answer === 'y') {
                return resolve();
            } else {
                const changeBranch = log.danger(`Would you like to use another branch? [y/n] `, 1, true);

                const changeAnswer = readlineSync.question(changeBranch).toLowerCase();

                if (changeAnswer === 'y') {
                    log.line();
                    // todo: ask if want to commit and push first, if changes

                    const newBranchQuestion = log.danger('Please enter the name of the branch you want to check out, or "n" to cancel: ', 1, true);

                    const newBranch = readlineSync.question(newBranchQuestion, 0, true);

                    log.line();

                    if (newBranch === 'n' || newBranch === 'N') {
                        return reject('Process cancelled.');
                    }

                    return resolve(this.checkoutBranch(newBranch));

                } else {
                    return reject('Process cancelled.');
                }
            }
        });
    },

    ensureGitBranchClean(ignoreNeedsCleanBranch) {
        return new Promise((resolve, reject) => {
            if (ignoreNeedsCleanBranch) {
                return resolve();
            }

            return this.executeCommand('git status')
                .then((branchStatus) => {
                    const cleanTest = 'nothing to commit, working tree clean';

                    if (branchStatus.includes(cleanTest)) {
                        return resolve();
                    }

                    return reject(`Working branch has uncommitted files. Please commit them and then try again.`);
                })
                .catch(reject);
        });
    },

    error(key) {
      throw Error(errors[key]);
    },

    executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, {stdio: ['pipe', 'pipe', 'ignore']}, (error, data) => {
                if (error) {
                    return reject(error);
                }

                return resolve(data);
            });
        });
    },

    withActionStatusCheck(status, success, onSuccess, onError) {
        return status === success ? onSuccess() : onError();
    },

    formattedLog(text, type, topSpace = true, bottomSpace = false, level = 0) {
        const execute = log[type];

        if (topSpace) {
            log.line();
        }

        execute(text, level);

        if (bottomSpace) {
            log.line();
        }
    },

    getGitBranch() {
        return new Promise((resolve, reject) => {
            return this.executeCommand('git rev-parse --abbrev-ref HEAD')
                .then(resolve)
                .catch(reject);
        });
    },

    getPackageInfo(pathToFile) {
        return JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
    },

    handleAnswer(answer = '', confirmedText = 'y', resolve = noOp, reject = noOp, rejectError = 'Process Cancelled.') {
      if (answer === confirmedText) {
          return resolve();
      }

      return reject(rejectError);
    },

    handleQuestion(message, level = 1, asString = true) {
        const question = log.danger(message, level, asString);

        const answer = readlineSync.question(question).toLowerCase();

        log.line();

        return answer;
    },

    incrementVersion(versionString, shouldIncrement, precedingChanged = false, key = 'default') {
        if (precedingChanged) {
            return 0;
        }

        const parsed = parseInt(versionString);
        const versionValue = parsed >= 0 ? parsed : 0;

        return shouldIncrement ? versionValue + 1 : versionValue;
    },

    isVersionCorrectFormat(version, formatLength = 3, reject = noOp, rejectError = 'Process Cancelled.') {
        if (versions.length !== formatLength) {
            log.warning(`I can\'t understand format of the version "${versionCurrent}". Process Failed`);

            return reject(rejectError) // todo: error codes/messages
        }
    },

    pushCommit() {
        return new Promise((resolve, reject) => {
            return resolve();
            // return this.executeCommand('git push')
            //     .then(resolve)
            //     .catch(reject);
        });
    },

    pushTag() {
        return new Promise((resolve, reject) => {
            return resolve();
            // return this.executeCommand('git push --tags')
            //     .then(resolve)
            //     .catch(reject);
        });
    },

    runDialog(key) {
        dialog[key]();
    },

    tagBranch(commitTag) {
        return new Promise((resolve, reject) => {
            return resolve();
            // return this.executeCommand(`git tag ${commitTag}`)
            //     .then(resolve)
            //     .catch(reject);
        });
    },

    versions(raw) {
        return typeof raw === 'string'
            ? raw.split('.') : [];
    },

};
