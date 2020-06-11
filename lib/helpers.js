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

  version(raw, flag, reset = false) {
    if (reset) {
      return 0;
    }

    const parsed = parseInt(raw);
    const value = parsed >= 0 ? parsed : 0;
    return flag ? value + 1 : value;
  },

  confirmBranch(branch) {
    return new Promise((resolve, reject) => {
      log.info(`\nYou are currently on branch ${branch.replace('\n', '')}. \n`);

      const question = log.info(`Do you want to use this branch? [y/n]`);

      const answer = readlineSync.question(question).toLowerCase();

      if (answer === 'y') {
        return resolve();
      } else {
        const changeBranch = log.info(`Would you like to use another branch? [y/n]`);

        const changeAnswer = readlineSync.question(changeBranch).toLowerCase();

        if (changeAnswer === 'y') {
          const newBranchQuestion = 'Please enter the name of the branch you want to check out.';

          const newBranch = readlineSync.question(newBranchQuestion);

          return resolve(new Promise((resolve1, reject1) => {
            exec(`git checkout ${newBranch}`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
              if (error) {
                return reject1(error);
              }

              log.success(`Now on branch ${newBranch}. Continuing.`);

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

  ensureGitBranchClean() {
    return new Promise((resolve, reject) => {
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
    let packageContent = fs.readFileSync(pathToFile, 'utf8');
    packageContent = packageContent.replace(/("version":\s*")([\d\.]+)(")/g, `$1${version}$3`);
    fs.writeFileSync(pathToFile, packageContent, 'utf8');
  },

  tag(commitTag) {
    return new Promise((resolve, reject) => {
      exec(`git tag ${commitTag}`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
        if (error) {
          return reject(error);
        }

        return resolve();
      });
    });
  },

  pushCommit() {
    return new Promise((resolve, reject) => {
      exec(`git push`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
        if (error) {
          return reject(error);
        }

        return resolve();
      });
    });
  },

  pushTag() {
    return new Promise((resolve, reject) => {
      exec(`git push --tags`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
        if (error) {
          return reject(error);
        }

        return resolve();
      });
    });
  },

  commitVersionIncrease(version, message, pathsToAdd = []) {
    return new Promise((resolve, reject) => {
      exec(`git add ${pathsToAdd.join(' ')} && git commit -m '${message}'`, { stdio: ['pipe', 'pipe', 'ignore']}, error => {
        if (error) {
          return reject(error);
        }

        return resolve();
      });
    });
  }
};
