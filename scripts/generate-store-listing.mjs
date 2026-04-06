import fs from 'node:fs/promises';
import path from 'node:path';

const language = process.env.GOOGLE_PLAY_LANGUAGE || 'en-US';
const LISTING_DIR = path.resolve('store-assets/android', language);
const RELEASE_DIR = path.resolve('store-assets/android', language, 'changelogs');

const writeFile = async (filePath, content) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${content.trim()}\n`, 'utf8');
};

const title = 'UVI LiveScore - Soccer Scores';
const shortDescription =
  'Live scores, fixtures and match details for top football leagues.';

const fullDescription = `
UVI LiveScore giúp bạn theo dõi bóng đá theo thời gian thực với giao diện gọn và dễ nhìn.

Tính năng nổi bật:
- Live score cho các trận đấu đang diễn ra.
- Theo dõi 5 giải đấu hàng đầu châu Âu.
- Xem lịch đấu, kết quả và trạng thái trận đấu.
- Mở chi tiết trận để xem thông tin đầy đủ.
- Kéo để làm mới nhanh ngay trên màn hình chính.

Ứng dụng phù hợp cho fan bóng đá muốn cập nhật tỉ số và diễn biến trận đấu nhanh chóng mỗi ngày.
`;

const releaseNotes = `
Bản phát hành mới:
- Tối ưu tốc độ tải dữ liệu live score.
- Cải thiện giao diện theo dõi trận đấu trên điện thoại và tablet.
- Cập nhật bộ ảnh Store Listing chuẩn cho app UVI LiveScore.
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
