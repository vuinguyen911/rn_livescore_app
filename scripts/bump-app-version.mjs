import fs from 'node:fs/promises';
import path from 'node:path';

const appJsonPath = path.resolve('app.json');
const androidGradlePath = path.resolve('android/app/build.gradle');

const parseVersion = (value) => {
  const parts = String(value || '1.0.0').split('.').map((p) => Number(p));
  if (
    parts.length < 3 ||
    Number.isNaN(parts[0]) ||
    Number.isNaN(parts[1]) ||
    Number.isNaN(parts[2])
  ) {
    throw new Error(`Invalid version format: ${value}`);
  }

  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };
};

const main = async () => {
  const raw = await fs.readFile(appJsonPath, 'utf8');
  const data = JSON.parse(raw);

  data.expo ??= {};
  data.expo.android ??= {};

  const current = parseVersion(data.expo.version || '1.0.0');
  const nextVersion = `${current.major}.${current.minor}.${current.patch + 1}`;
  const currentVersionCode = Number(data.expo.android.versionCode || 1);
  const nextVersionCode = currentVersionCode + 1;

  data.expo.version = nextVersion;
  data.expo.android.versionCode = nextVersionCode;

  await fs.writeFile(appJsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  try {
    const gradleRaw = await fs.readFile(androidGradlePath, 'utf8');
    let gradleNext = gradleRaw;

    gradleNext = gradleNext.replace(/versionCode\s+\d+/, `versionCode ${nextVersionCode}`);
    gradleNext = gradleNext.replace(/versionName\s+"[^"]+"/, `versionName "${nextVersion}"`);

    if (gradleNext !== gradleRaw) {
      await fs.writeFile(androidGradlePath, gradleNext, 'utf8');
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  console.log(
    `Bumped versionName ${current.major}.${current.minor}.${current.patch} -> ${nextVersion}`
  );
  console.log(`Bumped versionCode ${currentVersionCode} -> ${nextVersionCode}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
