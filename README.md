# ⚽ Lịch Thi Đấu World Cup 2026

> 🏆 **FIFA World Cup 2026™** — Ứng dụng xem lịch thi đấu toàn diện, theo dõi trực tiếp, miễn phí, offline-ready.

![World Cup 2026](og-image.png)

## 🌟 Giới Thiệu

Ứng dụng PWA (Progressive Web App) cung cấp lịch thi đấu đầy đủ **104 trận** của FIFA World Cup 2026 diễn ra tại **Mỹ, Mexico & Canada** từ ngày **11/06 – 19/07/2026**.

- 🆓 **Hoàn toàn miễn phí** — không quảng cáo, không thu phí
- 📱 **Cài được trên điện thoại** — như app native, không cần App Store
- 📶 **Hoạt động offline** — xem lịch mọi lúc, không cần mạng
- 🔴 **Live Score** — cập nhật tỷ số tự động theo thời gian thực
- ⚡ **Hiệu năng cao** — Lighthouse Performance ≥ 90, Critical CSS inline
- ♿ **Accessible** — WCAG AA, keyboard navigation, screen reader ready
- 🖨️ **In được** — Print stylesheet A4-friendly cho lịch thi đấu
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

### 📊 Bảng Xếp Hạng (Live Auto-update)
- Xem thứ hạng đầy đủ: ST, T, H, B, BT, BB, HS, Điểm
- Highlight đội vào vòng 32 (xanh) và đội có thể vào (vàng)
- Toggle qua lại giữa danh sách đội ↔ bảng xếp hạng
- **🆕 Tự động tính điểm và xếp hạng lại khi có bàn thắng**
- **🆕 Hiển thị ▲/▼ khi đội thăng/tụt hạng trong thời gian thực**

### 📅 Thêm Vào Calendar
- Download file `.ics` cho từng trận
- Import vào Google Calendar, Apple Calendar, Outlook
- Nhắc nhở 30 phút trước trận đấu
- Xuất toàn bộ trận của đội yêu thích

### 🔗 Chia Sẻ Trận Đấu
- Share trực tiếp qua Zalo, Messenger, Telegram (mobile)
- Copy thông tin trận đấu ra clipboard (desktop)
- Format đẹp: "🇧🇷 Brazil 🆚 Argentina | 10/06 01:00 (VN) | MetLife Stadium"

### 🔍 Tìm Kiếm & Lọc Nhanh
- Tìm kiếm tức thì (Realtime) đội bóng, sân vận động bằng công nghệ Fuse.js
- Trả về kết quả phân nhóm trực quan ngay khi gõ

### 👤 Thông Tin Đội Tuyển
- Bấm vào tên đội bóng để xem lịch sử, HLV, thành tích
- Danh sách tất cả các trận đấu của đội đó tại giải
- Đánh dấu yêu thích trực tiếp trên trang cá nhân đội bóng

### ⚔️ Lịch Sử Đối Đầu (H2H)
- So sánh thành tích lịch sử giữa 2 đội trong cùng trận
- Biểu đồ tròn trực quan Thắng/Hòa/Thua
- Danh sách các trận đối đầu lịch sử

### ⏱️ Đếm Ngược Trực Tiếp
- Banner thông minh hiển thị chính xác trận đấu tiếp theo
- Đếm ngược từng giây đến giờ bóng lăn
- Trạng thái "ĐANG DIỄN RA" khi trận đấu bắt đầu

### 📅 Lịch Dạng Tháng
- Xem lịch thi đấu dưới dạng lưới tháng 6 & 7 trực quan
- Đánh dấu số trận mỗi ngày
- Bấm vào ngày để xem chi tiết các trận trong ngày đó

### 🏆 Sơ Đồ Vòng Loại Trực Tiếp (Bracket)
- Sơ đồ dạng cây từ Vòng 32 → Chung kết
- Hiển thị trực quan đường đi đến ngôi vô địch
- Bấm vào trận để xem chi tiết & thống kê

### 🔴 Live Score & Thông Báo Bàn Thắng (Mới — Phase 4)
- **Auto-refresh tỷ số**: Polling API mỗi 60 giây, cập nhật trực tiếp lên giao diện
- **Badge LIVE nhấp nháy**: Trận đang đá sẽ có badge 🔴 LIVE đỏ nhấp nháy nổi bật
- **Goal Notification**: Banner thông báo "⚽ VÀOOO!" trượt ra kèm âm thanh cổ vũ
- **Tỷ số vàng rực rỡ**: Text tỷ số đổi sang màu vàng Gold + pulse animation

### 📊 Chi Tiết Trận Đấu & Thống Kê (Mới — Phase 4)
- **Match Details Modal**: Bấm vào bất kỳ trận nào để xem chi tiết đầy đủ
- **Timeline dọc**: Hiển thị bàn thắng ⚽, thẻ vàng 🟨, thẻ đỏ 🟥, thay người 🔄 theo từng phút
- **Bar Chart thống kê**: Kiểm soát bóng, số cú sút, sút trúng đích, phạt góc, phạm lỗi (CSS thuần, không thư viện)
- **Tabs chuyển đổi mượt mà**: Dòng thời gian ↔ Thống kê

### 📶 Offline Mode (Nâng cấp — Phase 5)
- Service Worker với **chiến lược cache thông minh**: stale-while-revalidate cho static, network-first cho API
- Cache toàn bộ app + 48 lá cờ quốc gia
- **Offline Guard**: API polling tự động skip khi mất mạng — không lỗi console
- **API fallback**: Trả về JSON rỗng an toàn khi chưa có cache offline
- Thanh trạng thái offline với pulse animation
- **Thông báo cập nhật**: Banner "🆕 Có phiên bản mới!" khi SW detect version mới
- User-controlled update — bấm "🔄 Cập nhật ngay" để kích hoạt

### ⚡ Hiệu Năng Cao (Mới — Phase 5)
- **Critical CSS inline**: ~2KB CSS trọng yếu nhúng trực tiếp trong `<head>` → FCP tức thì
- **Deferred stylesheet**: `style.css` load async qua `<link rel="preload">`
- **Font optimization**: Giảm từ 12 weights → 6 weights, preload + font-display:swap
- **Icon compression**: icon-192 giảm 88% (386KB → 45KB), icon-512 giảm 28%
- **Preconnect**: 3 origins (fonts.googleapis, fonts.gstatic, flagcdn.com)
- **Lazy loading**: Tất cả cờ quốc gia dùng `loading="lazy"`
- **Fetch timeout**: AbortController 10s cho API calls

### ♿ Accessibility — WCAG AA (Mới — Phase 5)
- **Skip-to-content**: Link ẩn cho keyboard users — nhấn Tab đầu tiên
- **ARIA Tablist**: `role="tablist"` / `role="tab"` / `role="tabpanel"` + `aria-selected`
- **ARIA Modals**: `role="dialog"` + `aria-modal` + `aria-label` cho 3 modals
- **Focus Trap**: Tab cycling bị giữ trong modal khi đang mở
- **Focus Restoration**: Đóng modal → focus quay về element trigger
- **Keyboard Navigation**: ← → ↑ ↓ di chuyển tabs, Esc đóng modal
- **Focus-visible**: Viền vàng Gold 2px cho keyboard, ẩn khi click chuột
- **Reduced Motion**: `prefers-reduced-motion` tắt toàn bộ animation
- **Decorative hidden**: `aria-hidden="true"` cho emoji trang trí

### 🖨️ In Lịch Thi Đấu — A4 (Mới — Phase 5)
- Nút "🖨️ In" trong filter bar
- In ra tất cả tab content: Bảng đấu + Lịch + Vòng KO + Sân
- Nền trắng, chữ đen, font 10pt, compact layout
- Groups grid 2 cột, page-break-inside: avoid
- Print header/footer chỉ hiện khi in
- Ẩn buttons, modals, animations, search bar

### 🎯 Cộng Đồng & Tương Tác (Mới — Phase 6)
- **Dark/Light Theme Toggle**: Nút chuyển đổi giao diện Sáng/Tối mượt mà, lưu vào LocalStorage, tự động nhận diện `prefers-color-scheme`.
- **Top Scorers Leaderboard**: Bảng xếp hạng Vua phá lưới và Kiến tạo (Top 3 được gắn huy chương 🥇🥈🥉), xem trực tiếp trong tab Bảng đấu.
- **Bracket Prediction Game**: Game dự đoán nhánh đấu Knockout. Click chọn người chiến thắng để tự động đưa đội đi tiếp, có thanh tiến trình và tính năng xoá (Reset).
- **World Cup Trivia Quiz**: Mini-game trắc nghiệm 10 câu hỏi về lịch sử và thông tin World Cup 2026. Hiển thị giải thích chi tiết, chấm điểm và lưu kỷ lục vào thiết bị. Hỗ trợ tính năng chia sẻ (Web Share API).

## 🛠️ Công Nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | HTML5, Vanilla CSS, JavaScript (ES6+) |
| PWA | Service Worker, Web App Manifest |
| Backend API | Vercel Serverless Functions (API Proxy) |
| Live Data | Football-Data.org Free Tier (10 req/phút) |
| Hosting | Vercel (production) + GitHub Pages (fallback) |
| Search | Fuse.js (client-side, 3KB) |
| Icons | Flagcdn.com (cờ quốc gia) |
| Font | Google Fonts (Outfit, Inter) |
| SEO | Open Graph, Twitter Cards, JSON-LD |

> 💰 **Chi phí: $0** — Toàn bộ stack sử dụng dịch vụ miễn phí.

## 📂 Cấu Trúc Dự Án

```
WorldCup2026/
├── index.html          # Trang chính (SPA) — Critical CSS inline
├── style.css           # Toàn bộ styling (~1570 dòng, incl. print)
├── app.js              # Logic ứng dụng (~1570 dòng, incl. a11y)
├── matches.json        # Dữ liệu 104 trận đấu
├── teams.json          # Dữ liệu 48 đội tuyển
├── venues.json         # Dữ liệu 16 sân vận động
├── scorers.json        # Dữ liệu Vua phá lưới (Mock)
├── quiz.json           # Dữ liệu câu hỏi Trắc nghiệm
├── api/
│   └── live.js         # Vercel Serverless: API proxy cho live scores
├── vercel.json         # Cấu hình Vercel deployment
├── sw.js               # Service Worker (v3 — network-first API)
├── manifest.json       # PWA manifest
├── og-image.png        # Ảnh preview khi share lên MXH
├── icon-192.png        # App icon 192x192 (optimized: 45KB)
├── icon-512.png        # App icon 512x512 (optimized: 278KB)
├── robots.txt          # SEO configuration
├── sitemap.xml         # SEO sitemap
└── README.md           # File này
```

## 🚀 Cài Đặt & Chạy

### Xem trực tiếp
👉 **[https://world-cup2026.vercel.app](https://world-cup2026.vercel.app)** (Production — Vercel)
👉 **[https://haicover.github.io/WorldCup2026/](https://haicover.github.io/WorldCup2026/)** (Fallback — GitHub Pages)

### Chạy local
```bash
# Clone repo
git clone https://github.com/haicover/WorldCup2026.git
cd WorldCup2026

# Chạy với Vercel CLI (khuyến nghị — hỗ trợ API routes)
npx vercel dev

# Hoặc chạy static server (không có live API)
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
- [x] **Phase 3** — Serverless Backend + H2H + Bracket trực quan (Sprint 3) ✅
- [x] **Phase 4** — Live Match Experience: Tỷ số trực tiếp, Thông báo bàn thắng, Timeline & Stats, Bảng xếp hạng tự cập nhật (Sprint 4) ✅
- [x] **Phase 5** — Performance & PWA: Critical CSS, icon compression, SW v3 network-first, WCAG AA accessibility, print stylesheet A4 (Sprint 5) ✅
- [x] **Phase 6** — Cộng đồng + Dự đoán: Dark/Light toggle, Top Scorers, Bracket Prediction, Trivia Quiz (Sprint 6) ✅

## 📄 License

MIT License — Tự do sử dụng, chỉnh sửa, phân phối.

> ⚠️ **Disclaimer**: Ứng dụng này không liên kết chính thức với FIFA. Dữ liệu lịch thi đấu được tổng hợp từ các nguồn công khai. FIFA World Cup™ là nhãn hiệu đã đăng ký của FIFA.

---

<p align="center">
  Made with ❤️ for Vietnamese football fans 🇻🇳
</p>

