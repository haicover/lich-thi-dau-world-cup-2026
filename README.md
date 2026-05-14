# ⚽ Lịch Thi Đấu World Cup 2026

> 🏆 **FIFA World Cup 2026™** — Ứng dụng xem lịch thi đấu toàn diện, miễn phí, offline-ready.

![World Cup 2026](og-image.png)

## 🌟 Giới Thiệu

Ứng dụng PWA (Progressive Web App) cung cấp lịch thi đấu đầy đủ **104 trận** của FIFA World Cup 2026 diễn ra tại **Mỹ, Mexico & Canada** từ ngày **11/06 – 19/07/2026**.

- 🆓 **Hoàn toàn miễn phí** — không quảng cáo, không thu phí
- 📱 **Cài được trên điện thoại** — như app native, không cần App Store
- 📶 **Hoạt động offline** — xem lịch mọi lúc, không cần mạng
- 🇻🇳 **Giờ Việt Nam** — tất cả giờ thi đấu đã chuyển sang GMT+7

## ✨ Tính Năng

### 📋 Xem Lịch Đầy Đủ
- **48 đội tuyển** chia thành 12 bảng (A → L)
- **104 trận đấu** từ vòng bảng đến chung kết
- **16 sân vận động** tại 3 quốc gia
- Bộ lọc theo: Vòng đấu, Bảng, Đội tuyển

### ⭐ Đội Yêu Thích
- Đánh dấu tối đa **5 đội** yêu thích
- Lọc nhanh chỉ các trận của đội mình
- Highlight vàng nổi bật trong bảng đấu
- Lưu vĩnh viễn trên thiết bị (localStorage)

### 📊 Bảng Xếp Hạng
- Xem thứ hạng đầy đủ: ST, T, H, B, BT, BB, HS, Điểm
- Highlight đội vào vòng 32 (xanh) và đội có thể vào (vàng)
- Toggle qua lại giữa danh sách đội ↔ bảng xếp hạng

### 📅 Thêm Vào Calendar
- Download file `.ics` cho từng trận
- Import vào Google Calendar, Apple Calendar, Outlook
- Nhắc nhở 30 phút trước trận đấu
- Xuất toàn bộ trận của đội yêu thích

### 🔗 Chia Sẻ Trận Đấu
- Share trực tiếp qua Zalo, Messenger, Telegram (mobile)
- Copy thông tin trận đấu ra clipboard (desktop)
- Format đẹp: "🇧🇷 Brazil 🆚 Argentina | 10/06 01:00 (VN) | MetLife Stadium"

### 🔍 Tìm Kiếm & Lọc Nhanh (Mới)
- Tìm kiếm tức thì (Realtime) đội bóng, sân vận động bằng công nghệ Fuse.js
- Trả về kết quả phân nhóm trực quan ngay khi gõ

### 👤 Thông Tin Đội Tuyển (Mới)
- Bấm vào tên đội bóng để xem lịch sử, HLV, thành tích
- Danh sách tất cả các trận đấu của đội đó tại giải
- Đánh dấu yêu thích trực tiếp trên trang cá nhân đội bóng

### ⏱️ Đếm Ngược Trực Tiếp (Mới)
- Banner thông minh hiển thị chính xác trận đấu tiếp theo
- Đếm ngược từng giây đến giờ bóng lăn
- Trạng thái "ĐANG DIỄN RA" khi trận đấu bắt đầu

### 📅 Lịch Dạng Tháng (Mới)
- Xem lịch thi đấu dưới dạng lưới tháng 6 & 7 trực quan
- Đánh dấu số trận mỗi ngày
- Bấm vào ngày để xem chi tiết các trận trong ngày đó

### 📶 Offline Mode
- Service Worker cache toàn bộ app + 48 lá cờ quốc gia
- Xem lịch thi đấu khi không có mạng
- Tự đồng bộ khi có kết nối lại

## 🛠️ Công Nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | HTML5, Vanilla CSS, JavaScript (ES6+) |
| PWA | Service Worker, Web App Manifest |
| Hosting | GitHub Pages (miễn phí) |
| Icons | Flagcdn.com (cờ quốc gia) |
| Font | Google Fonts (Outfit, Inter) |
| SEO | Open Graph, Twitter Cards, JSON-LD |

> 💰 **Chi phí: $0** — Toàn bộ stack sử dụng dịch vụ miễn phí.

## 📂 Cấu Trúc Dự Án

```
WorldCup2026/
├── index.html          # Trang chính (SPA)
├── style.css           # Toàn bộ styling
├── app.js              # Logic ứng dụng
├── matches.json        # Dữ liệu 104 trận đấu
├── teams.json          # Dữ liệu 48 đội tuyển
├── venues.json         # Dữ liệu 16 sân vận động
├── sw.js               # Service Worker (offline cache)
├── manifest.json       # PWA manifest
├── og-image.png        # Ảnh preview khi share lên MXH
├── icon-192.png        # App icon 192x192
├── icon-512.png        # App icon 512x512
├── robots.txt          # SEO configuration
├── sitemap.xml         # SEO sitemap
└── README.md           # File này
```

## 🚀 Cài Đặt & Chạy

### Xem trực tiếp
👉 **[https://haicover.github.io/WorldCup2026/](https://haicover.github.io/WorldCup2026/)**

### Chạy local
```bash
# Clone repo
git clone https://github.com/haicover/WorldCup2026.git
cd WorldCup2026

# Chạy server (cần Node.js)
npx serve .

# Hoặc dùng Python
python -m http.server 3000

# Mở http://localhost:3000
```

### Cài trên điện thoại
1. Mở link trên Chrome (Android) hoặc Safari (iOS)
2. Nhấn **"Thêm vào màn hình chính"** / **"Add to Home Screen"**
3. App sẽ xuất hiện trên màn hình như app bình thường!

## 📋 Thông Tin Giải Đấu

| Thông tin | Chi tiết |
|---|---|
| 🗓️ Thời gian | 11/06 – 19/07/2026 (39 ngày) |
| 🏟️ Sân vận động | 16 sân tại 16 thành phố |
| 🌎 Quốc gia | 🇺🇸 Mỹ, 🇲🇽 Mexico, 🇨🇦 Canada |
| 👥 Số đội | 48 đội (12 bảng × 4 đội) |
| ⚽ Số trận | 104 trận |
| 🏆 Chung kết | 19/07/2026 — MetLife Stadium, New Jersey |

## 🗺️ Roadmap

- [x] **Phase 1** — PWA + Cá nhân hóa (Sprint 1) ✅
- [x] **Phase 2** — Dữ liệu thời gian thực + Tìm kiếm, Lịch, Profile (Sprint 2) ✅
- [ ] **Phase 3** — Serverless Backend + H2H + Bracket trực quan (Sprint 3)
- [ ] **Phase 4** — Live Scores (Cập nhật tỷ số tự động)
- [ ] **Phase 5** — Đa ngôn ngữ + Cộng đồng

## 📄 License

MIT License — Tự do sử dụng, chỉnh sửa, phân phối.

> ⚠️ **Disclaimer**: Ứng dụng này không liên kết chính thức với FIFA. Dữ liệu lịch thi đấu được tổng hợp từ các nguồn công khai. FIFA World Cup™ là nhãn hiệu đã đăng ký của FIFA.

---

<p align="center">
  Made with ❤️ for Vietnamese football fans 🇻🇳
</p>
