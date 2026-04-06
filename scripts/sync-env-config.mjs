import fs from 'node:fs/promises';
import path from 'node:path';

const appJsonPath = path.resolve('app.json');

const must = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env var: ${key}`);
  }
  return value;
};

const main = async () => {
  const packageName = must('ANDROID_PACKAGE_NAME');
  const easProjectId = must('EAS_PROJECT_ID');
  const iosBundleIdentifier = process.env.IOS_BUNDLE_IDENTIFIER || packageName;

  const raw = await fs.readFile(appJsonPath, 'utf8');
  const data = JSON.parse(raw);

  data.expo ??= {};
  data.expo.android ??= {};
  data.expo.ios ??= {};
  data.expo.extra ??= {};
  data.expo.extra.eas ??= {};

  data.expo.android.package = packageName;
  data.expo.ios.bundleIdentifier = iosBundleIdentifier;
  data.expo.extra.eas.projectId = easProjectId;

  await fs.writeFile(appJsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log('Synced app.json from environment variables.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
