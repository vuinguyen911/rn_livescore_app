import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const language = process.env.GOOGLE_PLAY_LANGUAGE || 'en-US';
const BASE_DIR = path.resolve('store-assets/android', language, 'images');
const PHONE_DIR = path.join(BASE_DIR, 'phoneScreenshots');
const SEVEN_INCH_DIR = path.join(BASE_DIR, 'sevenInchScreenshots');
const TEN_INCH_DIR = path.join(BASE_DIR, 'tenInchScreenshots');
const FEATURE_GRAPHIC_PATH = path.join(BASE_DIR, 'featureGraphic.png');
const ICON_PATH = path.join(BASE_DIR, 'icon.png');

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const ensureDirs = async () => {
  await fs.mkdir(PHONE_DIR, { recursive: true });
  await fs.mkdir(SEVEN_INCH_DIR, { recursive: true });
  await fs.mkdir(TEN_INCH_DIR, { recursive: true });
  await fs.mkdir(BASE_DIR, { recursive: true });
};

const screenSvg = ({ width, height, match, league, status, index }) => {
  const cardX = Math.round(width * 0.06);
  const cardY = Math.round(height * 0.06);
  const cardW = width - cardX * 2;
  const cardH = height - cardY * 2;

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${index}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#061229"/>
      <stop offset="100%" stop-color="#0B5A9F"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg${index})"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="36" fill="#F8FAFC"/>
  <rect x="${cardX + 40}" y="${cardY + 70}" width="${cardW - 80}" height="64" rx="16" fill="#DBEAFE"/>
  <text x="${cardX + 64}" y="${cardY + 113}" font-size="30" font-family="Arial, sans-serif" fill="#1D4ED8" font-weight="700">${escapeXml(
    league,
  )}</text>
  <text x="${cardX + 40}" y="${cardY + 225}" font-size="56" font-family="Arial, sans-serif" fill="#0F172A" font-weight="800">UVI LiveScore</text>
  <text x="${cardX + 40}" y="${cardY + 305}" font-size="40" font-family="Arial, sans-serif" fill="#0F172A" font-weight="700">${escapeXml(
    match,
  )}</text>
  <rect x="${cardX + 40}" y="${cardY + 350}" width="${cardW - 80}" height="${Math.round(cardH * 0.34)}" rx="24" fill="#E2E8F0"/>
  <text x="${cardX + 80}" y="${cardY + 450}" font-size="70" font-family="Arial, sans-serif" fill="#0F172A" font-weight="800">${escapeXml(
    status.score,
  )}</text>
  <text x="${cardX + 80}" y="${cardY + 530}" font-size="34" font-family="Arial, sans-serif" fill="#334155" font-weight="600">${escapeXml(
    status.clock,
  )}</text>
  <foreignObject x="${cardX + 40}" y="${cardY + Math.round(cardH * 0.78)}" width="${cardW - 80}" height="${Math.round(cardH * 0.16)}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color:#334155; font-size:32px; line-height:1.35;">${escapeXml(
      'Theo doi ti so truc tiep, lich thi dau va ket qua moi nhat.',
    )}</div>
  </foreignObject>
</svg>
`;
};

const featureGraphicSvg = () => `
<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#04162E"/>
      <stop offset="100%" stop-color="#0B5A9F"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#fbg)"/>
  <text x="70" y="120" font-size="62" font-family="Arial, sans-serif" fill="#FFFFFF" font-weight="800">UVI LiveScore</text>
  <foreignObject x="70" y="170" width="900" height="220">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color:#DBEAFE; font-size:42px; line-height:1.3; font-weight:600;">Top 5 leagues, live minute by minute updates, and full match details.</div>
  </foreignObject>
  <text x="70" y="450" font-size="28" font-family="Arial, sans-serif" fill="#BFDBFE">Live scores, fixtures and match insights in one place.</text>
</svg>
`;

const iconSvg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ibg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#ibg)"/>
  <circle cx="256" cy="240" r="136" fill="#F8FAFC"/>
  <circle cx="256" cy="240" r="98" fill="#1D4ED8"/>
  <circle cx="256" cy="240" r="50" fill="#F8FAFC"/>
  <rect x="106" y="370" width="300" height="72" rx="24" fill="#F8FAFC"/>
  <text x="166" y="417" font-size="36" font-family="Arial, sans-serif" fill="#1D4ED8" font-weight="800">LIVE</text>
</svg>
`;

const createScreens = async ({ dir, width, height, fixtures, prefix }) => {
  const statuses = [
    { score: '2 - 1', clock: 'LIVE 78\'' },
    { score: '1 - 1', clock: 'HALF TIME' },
    { score: '0 - 3', clock: 'FT' },
    { score: '19:30', clock: 'UPCOMING' },
  ];
  const leagues = [
    'Premier League',
    'LaLiga',
    'Serie A',
    'Bundesliga',
  ];

  await Promise.all(
    Array.from({ length: 4 }).map(async (_, idx) => {
      const match = fixtures[idx] || fixtures[0] || 'Arsenal vs Chelsea';
      const svg = screenSvg({
        width,
        height,
        match,
        league: leagues[idx],
        status: statuses[idx],
        index: idx,
      });

      const outputPath = path.join(dir, `${prefix}-${String(idx + 1).padStart(2, '0')}.png`);
      await sharp(Buffer.from(svg)).png().toFile(outputPath);
    }),
  );
};

const main = async () => {
  await ensureDirs();
  const fixtures = [
    'Arsenal vs Chelsea',
    'Barcelona vs Real Madrid',
    'Inter vs Juventus',
    'Bayern vs Dortmund',
  ];

  await createScreens({ dir: PHONE_DIR, width: 1080, height: 1920, fixtures, prefix: 'phone' });
  await createScreens({ dir: SEVEN_INCH_DIR, width: 1200, height: 1920, fixtures, prefix: 'tablet7' });
  await createScreens({ dir: TEN_INCH_DIR, width: 1600, height: 2560, fixtures, prefix: 'tablet10' });

  await sharp(Buffer.from(featureGraphicSvg())).png().toFile(FEATURE_GRAPHIC_PATH);

  await sharp(Buffer.from(iconSvg)).png().toFile(ICON_PATH);

  console.log(`Generated store graphics in store-assets/android/${language}/images`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
