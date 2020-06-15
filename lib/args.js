'use strict'
// todo: update yargs
const argv = require('yargs').argv;

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

const cliArguments = {
    commitTag,
    helpers: args,
    major,
    message,
    minor,
    patch,
    shouldForceGit,
    version,
    versionCurrent: currentVersion,
    versions,
    pathToPackage,
    noChange,
};

export default cliArguments;

