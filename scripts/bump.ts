import * as fs from 'fs';

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
export default function bump(): void {
  const release: string = process.argv.slice(2) as unknown as string;
  const packageJson = readPackageJson();
  const currentVersion = packageJson.version;
  const newVersion = incrementVersion(currentVersion, release);
  packageJson.version = newVersion;
  writePackageJson(packageJson);
  console.log(`Bumped version from ${currentVersion} to ${newVersion}`);
}

bump();
