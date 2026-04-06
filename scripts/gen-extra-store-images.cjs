const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const out = path.resolve('store-assets/android/en-US/images/extras');
fs.mkdirSync(out, { recursive: true });

const items = [
  {
    name: 'feature-1024x500-a.png', w: 1024, h: 500, bg: '#0B5A9F',
    title: 'UVI LiveScore', sub: 'Live scores, fixtures and match details'
  },
  {
    name: 'feature-1024x500-b.png', w: 1024, h: 500, bg: '#1D4ED8',
    title: 'UVI LiveScore', sub: 'Top leagues updated in real time'
  },
  {
    name: 'icon-512x512-a.png', w: 512, h: 512, bg: '#0F172A',
    title: 'LIVE', sub: 'UVI'
  },
  {
    name: 'icon-512x512-b.png', w: 512, h: 512, bg: '#1E3A8A',
    title: 'SCORE', sub: 'UVI'
  },
];

const makeSvg = (it) => {
  if (it.w === 1024) {
    return `
<svg width="${it.w}" height="${it.h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${it.bg}"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="38" y="40" width="948" height="420" rx="28" fill="#F8FAFC" opacity="0.95"/>
  <text x="78" y="150" font-size="64" font-family="Arial" fill="#0F172A" font-weight="800">${it.title}</text>
  <text x="78" y="230" font-size="36" font-family="Arial" fill="#334155" font-weight="600">${it.sub}</text>
  <rect x="78" y="282" width="868" height="140" rx="20" fill="#DBEAFE"/>
  <text x="120" y="370" font-size="58" font-family="Arial" fill="#1D4ED8" font-weight="800">2 - 1   78'</text>
</svg>`;
  }

  return `
<svg width="${it.w}" height="${it.h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${it.bg}"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="256" cy="220" r="128" fill="#F8FAFC"/>
  <circle cx="256" cy="220" r="90" fill="#1D4ED8"/>
  <rect x="86" y="356" width="340" height="84" rx="24" fill="#F8FAFC"/>
  <text x="132" y="410" font-size="46" font-family="Arial" fill="#1D4ED8" font-weight="800">${it.title}</text>
  <text x="220" y="468" font-size="24" font-family="Arial" fill="#DBEAFE" font-weight="700">${it.sub}</text>
</svg>`;
};

(async () => {
  for (const item of items) {
    const svg = makeSvg(item);
    await sharp(Buffer.from(svg)).png().toFile(path.join(out, item.name));
  }
  console.log(`Generated ${items.length} images in ${out}`);
})();
