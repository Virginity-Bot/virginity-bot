import * as fs from 'fs';
import simpleGit, { SimpleGitOptions } from 'simple-git';

// Increments the specified version based on the release type
function incrementVersion(version: string, release: string): string {
  const parts = version.split('.').map((part) => parseInt(part, 10));

  if (release[0] === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (release[0] === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else if (release[0] === 'patch') {
    parts[2]++;
  } else {
    parts[2]++;
  }

  return parts.join('.');
}

// Reads the current version from the package.json file
function readPackageJson(): any {
  const packageJson = fs.readFileSync('package.json', { encoding: 'utf-8' });
  return JSON.parse(packageJson);
}

// Writes the new version to the package.json file
function writePackageJson(packageJson: any): void {
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2), {
    encoding: 'utf-8',
  });
}

// Bumps the version in the package.json file
export default async function bump(): Promise<void> {
  const options: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  };

  const git = simpleGit(options);
  const release: string = process.argv.slice(2) as unknown as string;
  const packageJson = readPackageJson();
  const currentVersion = packageJson.version;
  const newVersion = incrementVersion(currentVersion, release);
  const branchSummary = await git.branch();
  const branchName = branchSummary.current;
  packageJson.version = newVersion;
  writePackageJson(packageJson);
  let repo;

  console.log(`Bumped version from ${currentVersion} to ${newVersion}`);

  git.getRemotes(true, (err, remote) => {
    if (err) {
      console.log('Error:', err);
      return;
    }

    repo = remote.find((remote) => remote.name === 'origin')!.refs.fetch;

    console.log('Remote repository URL:', repo);
  });

  git
    .add(`./`)
    .commit(`🚀🔖 release v${newVersion}`)
    .addRemote(`${branchName}`, `${repo}`);

  // Commit the changes with a message
}

bump();
