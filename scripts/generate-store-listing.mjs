import fs from 'node:fs/promises';
import path from 'node:path';

const language = process.env.GOOGLE_PLAY_LANGUAGE || 'en-US';
const LISTING_DIR = path.resolve('store-assets/android', language);
const RELEASE_DIR = path.resolve('store-assets/android', language, 'changelogs');

const writeFile = async (filePath, content) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${content.trim()}\n`, 'utf8');
};

const isVietnamese = language.toLowerCase().startsWith('vi');

const title = isVietnamese ? 'Trực tiếp kết quả bóng đá' : 'Live Football Results';
const shortDescription = isVietnamese
  ? 'Theo dõi tỉ số trực tiếp, lịch đấu và chi tiết trận bóng đá.'
  : 'Live scores, fixtures and detailed football match information.';

const fullDescription = isVietnamese
  ? `
Ứng dụng Trực tiếp kết quả bóng đá giúp bạn theo dõi các trận đấu theo thời gian thực với giao diện gọn và dễ nhìn.

Tính năng nổi bật:
- Live score cho các trận đấu đang diễn ra.
- Theo dõi nhiều giải đấu lớn như Ngoại hạng Anh, LaLiga, Bundesliga, Serie A, C1, C2.
- Xem lịch đấu, kết quả và trạng thái trận đấu.
- Mở chi tiết trận để xem thông tin đầy đủ.
- Theo dõi đội yêu thích và nhận nhắc lịch trước trận.
- Kéo để làm mới nhanh ngay trên màn hình chính.

Ứng dụng phù hợp cho fan bóng đá muốn cập nhật tỉ số và diễn biến trận đấu nhanh chóng mỗi ngày.
`
  : `
Live Football Results helps you follow matches in real time with a clean and easy-to-use interface.

Key features:
- Live scores for ongoing matches.
- Follow top leagues like Premier League, LaLiga, Bundesliga, Serie A, UCL, and UEL.
- View fixtures, results, and match status.
- Open match details for deeper insights.
- Follow favorite teams and receive match reminders.
- Pull to refresh quickly from the home screen.
`;

const releaseNotes = isVietnamese
  ? `
Bản phát hành mới:
- Tối ưu độ ổn định để tránh crash khi mở ứng dụng.
- Đồng bộ icon và tên app với Store Listing.
- Cải thiện giao diện theo dõi trận đấu trên điện thoại và tablet.
`
  : `
What's new:
- Improved startup stability and crash prevention.
- Synced app icon and name with Store Listing.
- Enhanced match tracking UI on phone and tablet.
`;

const main = async () => {
  await writeFile(path.join(LISTING_DIR, 'title.txt'), title);
  await writeFile(path.join(LISTING_DIR, 'short_description.txt'), shortDescription);
  await writeFile(path.join(LISTING_DIR, 'full_description.txt'), fullDescription);
  await writeFile(path.join(RELEASE_DIR, 'default.txt'), releaseNotes);

  console.log(`Generated listing metadata in store-assets/android/${language}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
