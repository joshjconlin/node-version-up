# Install
```npm install node-version-up --save --dev```

# Node/React version upper
Increase `major`, `minor` or `patch` part of the version in your app in package.json with one command.

With this script you can:
- Increase `major`, `minor` or `patch` part in the version.
- Make a git commit with version changes.
- Make a git tag with new version.

## Usage
**1. Make sure you have defined the version and script**
```json
{
  "name": "your-project-name",
  "version": "1.0.0",
  "scripts": {
    "version-up:major": "node ./node_modules/node-version-up/index.js --major",
    "version-up:minor": "node ./node_modules/node-version-up/index.js --minor",
    "version-up:patch": "node ./node_modules/node-version-up/index.js --patch"
  }
}
```

**2. Run version up.**
```
> npm run version-up:{major | minor | patch} -- --{flag} {value}
```

## Examples

##### Basic Usage
```bash
> npm run version-up:patch

I'm going to increase the version in:
  - package.json (/Users/user/development/node-version-up/package.json);

The version will be changed:
  - from: 1.0.0
  - to:   1.0.1

You are currently on branch master. 

Do you want to use this branch? [y/n] y

Use "1.0.1" as the next version? [y/n] y

Updating versions
  Updating version in package.json...
    Version in package.json changed.

I'm ready to cooperate with git!
  I want to make a commit with message:
    "Release 1.0.1: increase version."
  
Do you want me to do this? [y/n] y
  
Committed!

  I want to push this commit. Is this okay? [y/n] y

Commit Pushed!

  I want to add a tag:

  "v1.0.1"

Do you allow me to do this? [y/n] y

Branch Tagged!

Do you want me to push this tag? [y/n] y

Tag pushed!

You're all done!
```

##### Custom Commit Message and Tag
```bash
> npm run version-up:patch -- --m "Bump version to 1.0.1" --t "Version:1.0.1"

I'm going to increase the version in:
  - package.json (/Users/user/development/node-version-up/package.json);

The version will be changed:
  - from: 1.0.0
  - to:   1.0.1

You are currently on branch master. 

Do you want to use this branch? [y/n] y

Use "1.0.1" as the next version? [y/n] y

Updating versions
  Updating version in package.json...
    Version in package.json changed.

I'm ready to cooperate with git!
  I want to make a commit with message:
    "Bump version to 1.0.1"
  
Do you want me to do this? [y/n] y
  
Committed!

  I want to push this commit. Is this okay? [y/n] y

Commit Pushed!

  I want to add a tag:

  "Version:1.0.1"

Do you allow me to do this? [y/n] y

Branch Tagged!


Do you want me to push this tag? [y/n] y

Tag pushed!

You're all done!
```

## Decision Pathway

## Options
You can pass option name and value with following syntax (remember to put `--` before options):
```
npm run version-up:{major | minor | patch} -- --flag value
```

| **Option** | **Type** | **Default value** | **Description** |
|------------|----------|-------------------|-----------------|
| **`--major` or `--mj`** | `flag` | | Increase `major` version:<br/>**0**.0.0 -> **1**.0.0 |
| **`--minor` or `--mn`** | `flag` | | Increase `minor` version:<br/>0.**0**.0 -> 0.**1**.0 |
| **`--patch` or `--p`** | `flag` | | Increase `patch` version:<br/>0.0.**0** -> 0.0.**1** |
| **`--message` or `--m`** | `string` | `"release ${version}: increase versions and build numbers"` | Custom commit message. |
| **`--tag` or `--t`** | `string` | `v{major}.{minor}.{patch}` | Custom git tag |
| **`--pathToPackage './path'`** | `string` | `./package.json` | Path to `package.json` file in your project. |
| **`--force` or `--f` | `flag` | false | Disable clean branch check and add all files to commit (git add .) |
