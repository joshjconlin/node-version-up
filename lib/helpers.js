'use strict';

const fs = require('fs');
const readlineSync = require('readline-sync');
const exec = require('child_process').exec;
const log = require('./log');

module.exports = {
  versions(raw) {
    return typeof raw === 'string'
      ? raw.split('.') : [];
  },

  version(raw, flag, reset = false, key= 'default') {
    if (reset) {
      return 0;
    }

    const parsed = parseInt(raw);
    const value = parsed >= 0 ? parsed : 0;
    return flag ? value + 1 : value;
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

          return resolve(new Promise((resolve1, reject1) => {
            exec(`git checkout ${newBranch}`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
              if (error) {
                return reject1(error);
              }

              log.success(`Now on branch ${newBranch}. Continuing.`, 1);

              return resolve1();
            });
          }));

        } else {
          return reject('Process cancelled.');
        }
      }
    });
  },

  getGitBranch() {
    return new Promise((resolve, reject) => {
      exec(`git rev-parse --abbrev-ref HEAD`, { stdio: ['pipe', 'pipe', 'ignore']}, (error, value) => {
        if (error) {
          return reject(error);
        }

        return resolve(value);
      })
    });
  },

  ensureGitBranchClean(force) {
    return new Promise((resolve, reject) => {
      if (force) {
        return resolve();
      }

      exec(`git status`, { stdio: ['pipe', 'pipe', 'ignore']}, (error, data) => {
        if (error) {
          return reject(error);
        }

        const cleanTest = 'nothing to commit, working tree clean';

        if (data.includes(cleanTest)) {
          return resolve();
        }

        return reject(`Working branch has uncommitted files. Please commit them and then try again.`);
      });
    });
  },

  getPackageInfo(pathToFile) {
    return JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
  },

  changeVersionInPackage(pathToFile, version) {
    // let packageContent = fs.readFileSync(pathToFile, 'utf8');
    // packageContent = packageContent.replace(/("version":\s*")([\d\.]+)(")/g, `$1${version}$3`);
    // fs.writeFileSync(pathToFile, packageContent, 'utf8');
  },

  tag(commitTag) {
    return new Promise((resolve, reject) => {
        return resolve();
      // exec(`git tag ${commitTag}`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
      //   if (error) {
      //     return reject(error);
      //   }
      //
      //   return resolve();
      // });
    });
  },

  pushCommit() {
    return new Promise((resolve, reject) => {
        return resolve();
      // exec(`git push`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
      //   if (error) {
      //     return reject(error);
      //   }
      //
      //   return resolve();
      // });
    });
  },

  pushTag() {
    return new Promise((resolve, reject) => {
        return resolve();
      // exec(`git push --tags`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
      //   if (error) {
      //     return reject(error);
      //   }
      //
      //   return resolve();
      // });
    });
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
  }
};
