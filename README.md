# HSK Learning iOS

Workspace mobile riêng cho iOS/iPadOS theo hướng:

- backend web hiện tại giữ nguyên
- app mobile gọi qua các API JSON mobile
- dùng Expo + React Navigation

## 1. Cài dependency

```bash
npm install
```

## 2. Sửa URL backend

Mở [src/config.ts](./src/config.ts) và đổi:

```ts
export const API_BASE_URL = "http://192.168.1.10:3000";
```

thành địa chỉ backend thật của bạn.

Ví dụ:

- local cùng mạng Wi-Fi: `http://192.168.x.x:3000`
- server deploy: `https://your-domain.com`

## 3. Chạy app

```bash
npm run start
```

Sau đó:

- nhấn `i` để mở iOS simulator
- hoặc quét bằng Expo Go nếu chỉ test nhanh

## 4. API backend cần có

Workspace web `hsk-learning-fullstack` đã được thêm các route:

- `POST /api/mobile/auth/login`
- `POST /api/mobile/auth/register`
- `GET /api/mobile/auth/me`
- `GET /api/mobile/lessons`
- `GET /api/mobile/lessons/:lessonId`
- `GET /api/mobile/roadmap`
- `GET /api/mobile/roadmap/:roadmapId`

## 5. Ghi chú

- `Roadmap` cần đăng nhập bằng token mobile.
- `Lessons` hiện đang đọc dữ liệu trực tiếp từ backend hiện tại.
- Chưa có chat AI mobile, luyện nói native hay push notification. Đây là nền tảng app iOS riêng để phát triển tiếp.
