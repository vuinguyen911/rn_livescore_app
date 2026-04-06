import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { google } from 'googleapis';

const must = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const packageName = must('ANDROID_PACKAGE_NAME');
const serviceAccountPath = must('GOOGLE_SERVICE_ACCOUNT_JSON');
const language = process.env.GOOGLE_PLAY_LANGUAGE || 'en-US';
const commitMode = process.env.GOOGLE_PLAY_COMMIT_MODE || 'auto';

const baseDir = path.resolve('store-assets/android', language);
const listingFiles = {
  title: path.join(baseDir, 'title.txt'),
  shortDescription: path.join(baseDir, 'short_description.txt'),
  fullDescription: path.join(baseDir, 'full_description.txt'),
};

const imageDir = path.join(baseDir, 'images');
const phoneScreenshotsDir = path.join(imageDir, 'phoneScreenshots');
const sevenInchDir = path.join(imageDir, 'sevenInchScreenshots');
const tenInchDir = path.join(imageDir, 'tenInchScreenshots');
const featureGraphicPath = path.join(imageDir, 'featureGraphic.png');
const iconPath = path.join(imageDir, 'icon.png');

const readText = async (filePath) => (await fsp.readFile(filePath, 'utf8')).trim();

const getPngFiles = async (dirPath) => {
  try {
    const files = await fsp.readdir(dirPath);
    return files
      .filter((name) => name.toLowerCase().endsWith('.png'))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => path.join(dirPath, name));
  } catch {
    return [];
  }
};

const uploadImageSet = async ({ publisher, editId, imageType, filePaths, required = false }) => {
  if (!filePaths.length) {
    if (required) {
      throw new Error(`Missing required images for ${imageType}`);
    }
    return;
  }

  await publisher.edits.images.deleteall({
    packageName,
    editId,
    language,
    imageType,
  });

  for (const filePath of filePaths) {
    await publisher.edits.images.upload({
      packageName,
      editId,
      language,
      imageType,
      media: {
        mimeType: 'image/png',
        body: fs.createReadStream(filePath),
      },
    });
  }
};

const errorMessage = (error) =>
  String(
    error?.cause?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      '',
  );

const commitOnce = async ({ publisher, editId, changesNotSentForReview }) => {
  const request = { packageName, editId };
  if (typeof changesNotSentForReview === 'boolean') {
    request.changesNotSentForReview = changesNotSentForReview;
  }
  await publisher.edits.commit(request);
};

const commitEdit = async ({ publisher, editId }) => {
  if (commitMode === 'with-not-sent') {
    await commitOnce({ publisher, editId, changesNotSentForReview: true });
    return;
  }

  if (commitMode === 'without-not-sent') {
    await commitOnce({ publisher, editId });
    return;
  }

  try {
    await commitOnce({ publisher, editId });
    return;
  } catch (error) {
    const message = errorMessage(error);
    if (!message.includes('Only releases with status draft may be created on draft app')) {
      throw error;
    }
  }

  try {
    await commitOnce({ publisher, editId, changesNotSentForReview: true });
  } catch (error) {
    const message = errorMessage(error);
    if (!message.includes('changesNotSentForReview must not be set')) {
      throw error;
    }

    await commitOnce({ publisher, editId });
  }
};

const main = async () => {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account json not found: ${serviceAccountPath}`);
  }

  const [title, shortDescription, fullDescription] = await Promise.all([
    readText(listingFiles.title),
    readText(listingFiles.shortDescription),
    readText(listingFiles.fullDescription),
  ]);

  const phoneScreenshots = await getPngFiles(phoneScreenshotsDir);
  const sevenInchScreenshots = await getPngFiles(sevenInchDir);
  const tenInchScreenshots = await getPngFiles(tenInchDir);

  if (!fs.existsSync(featureGraphicPath)) {
    throw new Error(`Feature graphic not found: ${featureGraphicPath}`);
  }

  if (!fs.existsSync(iconPath)) {
    throw new Error(`Store icon not found: ${iconPath}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const publisher = google.androidpublisher({
    version: 'v3',
    auth,
  });

  const insertRes = await publisher.edits.insert({
    packageName,
    requestBody: {},
  });

  const editId = insertRes.data.id;
  if (!editId) {
    throw new Error('Cannot create Google Play edit session.');
  }

  await publisher.edits.listings.update({
    packageName,
    editId,
    language,
    requestBody: {
      language,
      title,
      shortDescription,
      fullDescription,
    },
  });

  await uploadImageSet({
    publisher,
    editId,
    imageType: 'phoneScreenshots',
    filePaths: phoneScreenshots,
    required: true,
  });

  await uploadImageSet({
    publisher,
    editId,
    imageType: 'sevenInchScreenshots',
    filePaths: sevenInchScreenshots,
  });

  await uploadImageSet({
    publisher,
    editId,
    imageType: 'tenInchScreenshots',
    filePaths: tenInchScreenshots,
  });

  await uploadImageSet({
    publisher,
    editId,
    imageType: 'featureGraphic',
    filePaths: [featureGraphicPath],
    required: true,
  });

  await uploadImageSet({
    publisher,
    editId,
    imageType: 'icon',
    filePaths: [iconPath],
    required: true,
  });

  await commitEdit({ publisher, editId });
  console.log(`Uploaded listing metadata/images for ${packageName} (${language}).`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
