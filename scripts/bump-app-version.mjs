import fs from 'node:fs/promises';
import path from 'node:path';

const appJsonPath = path.resolve('app.json');

const parseVersion = (value) => {
  const parts = String(value || '1.0.0').split('.').map((p) => Number(p));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    throw new Error(`Invalid version format: ${value}`);
  }

  return {
    major: parts[0],
    minor: parts[1],
    patch: Number.isNaN(parts[2]) ? 0 : parts[2],
  };
};

const main = async () => {
  const raw = await fs.readFile(appJsonPath, 'utf8');
  const data = JSON.parse(raw);

  data.expo ??= {};

  const current = parseVersion(data.expo.version || '1.0.0');
  const nextVersion = `${current.major}.${current.minor + 1}.0`;

  data.expo.version = nextVersion;

  await fs.writeFile(appJsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Bumped app version: ${current.major}.${current.minor}.${current.patch} -> ${nextVersion}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
