import npmVersion from 'libnpmversion';

/**
 * Bumps the version in the package.json file
 * Default to patch i.e. x.x.x+1
 */
export default async function bump(): Promise<void> {
  let arg: string = process.argv.slice(2) as unknown as string;
  const amount = process.argv.slice(3);
  if (arg === ('major' || 'minor' || 'patch')) {
    return;
  } else {
    arg = 'patch';
  }

  npmVersion(arg, {
    path: `./`, // defaults to cwd

    allowSameVersion: false, // allow tagging/etc to the current version
    preid: '', // when arg=='pre', define the prerelease string, like 'beta' etc.
    tagVersionPrefix: 'v', // tag as 'v1.2.3' when versioning to 1.2.3
    commitHooks: true, // default true, run git commit hooks, default true
    gitTagVersion: true, // default true, tag the version
    signGitCommit: false, // default false, gpg sign the git commit
    signGitTag: false, // default false, gpg sign the git tag
    force: false, // push forward recklessly if any problems happen
    ignoreScripts: false, // do not run pre/post/version lifecycle scripts
    scriptShell: '/bin/bash', // shell to run lifecycle scripts in
    message: `🚀🔖 release v%s`, // message for tag and commit, replace %s with the version
    silent: false, // passed to @npmcli/run-script to control whether it logs
  })
    .then((newVersion) => {
      console.error(`version updated! ${npmVersion.newVersion}`, newVersion);
    })
    .catch(console.log(`Directory is not clean. ${npmVersion.newVersion}`));
}

bump();
