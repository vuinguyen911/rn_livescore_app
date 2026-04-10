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

## Build Local Android (APK + AAB, không qua EAS)
```bash
npm run build:local:android
```

Lệnh này sẽ tự động tăng `versionCode` và đồng bộ `versionName` trước khi build.
Lệnh này cũng bắt buộc ký `release` bằng upload keystore từ `.android-keystore.env`.

Artifact output:
- `apk/local/app-release-<timestamp>.apk`
- `apk/local/app-release-<timestamp>.aab`

Nếu chưa có keystore:
```bash
npm run android:keygen
```

Tuỳ chọn kiểm tra đúng SHA1 trước khi build:
```bash
export ANDROID_EXPECTED_SHA1="B1:B7:03:59:EC:62:F0:24:79:3A:50:AA:1E:50:BB:34:AD:B8:63:7C"
npm run build:local:android
```

### Troubleshooting build local

Lỗi `CXX1101 ... ndk/... did not have a source.properties file`:
- Nguyên nhân: NDK bị tải lỗi hoặc thư mục NDK bị hỏng.
- Script `build-local-android.sh` đã tự động:
1. Xóa NDK hỏng `27.1.12297006`
2. Cài lại `platforms;android-35`, `build-tools;35.0.0`, `ndk;27.1.12297006`

Chạy lại:
```bash
npm run build:local:android
```

Nếu vẫn lỗi, chạy tay:
```bash
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
yes | "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$ANDROID_SDK_ROOT" --licenses
rm -rf "$ANDROID_SDK_ROOT/ndk/27.1.12297006"
"$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$ANDROID_SDK_ROOT" \
  "platforms;android-35" "build-tools;35.0.0" "ndk;27.1.12297006"
```

Lỗi `Autolinking is not set up ...` hoặc `Could not get unknown property 'projectRoot' for extension 'expoGradle'`:
- Nguyên nhân phổ biến: package Expo bị lệch SDK (ví dụ `expo@53` nhưng `expo-constants`/`expo-device`/`expo-notifications` ở nhánh `55`).
- Fix:
```bash
npx expo install expo-constants expo-device expo-notifications
npm run build:local:android
```

Lỗi `Could not find org.asyncstorage.shared_storage:storage-android:1.0.0`:
- Nguyên nhân: `@react-native-async-storage/async-storage` lệch phiên bản với Expo SDK.
- Fix:
```bash
npx expo install @react-native-async-storage/async-storage
npm run build:local:android
```

## Build Android production + submit
```bash
npm run release:production
```

## Generate Hình Ảnh Store

Generate toàn bộ ảnh (EN + VI, gồm ảnh chính và extras):
```bash
npm run store:images:all
```

Tạo ảnh store mặc định (EN):
```bash
node scripts/gen-extra-store-images.cjs
```

Tạo ảnh store tiếng Việt (VI):
```bash
node scripts/gen-extra-store-images-vi.cjs
```

Output:
- `store-assets/android/en-US/images/extras`
- `store-assets/android/vi-VN/images/extras`

## Build iOS (iPhone)
```bash
npm run release:ios
```

## Lưu ý cấu hình
- Cập nhật `.env` với `EAS_PROJECT_ID` mới của project `rn_livescore`.
- Nếu dùng publish store, cập nhật credentials riêng cho app mới.
# rn_livescore_app
