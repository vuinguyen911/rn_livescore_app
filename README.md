# UVI LiveScore

Ứng dụng React Native (Expo) theo dõi live score 5 giải bóng đá hàng đầu:
- Premier League
- LaLiga
- Bundesliga
- Serie A
- Ligue 1

Nguồn dữ liệu: ESPN public scoreboard API (không cần API key).

## Chạy app
```bash
npm install
npm start
```

## Build Android APK
```bash
npm run release:apk
```

## Build Android production + submit
```bash
npm run release:production
```

## Build iOS (iPhone)
```bash
npm run release:ios
```

## Lưu ý cấu hình
- Cập nhật `.env` với `EAS_PROJECT_ID` mới của project `rn_livescore`.
- Nếu dùng publish store, cập nhật credentials riêng cho app mới.
# rn_livescore_app
