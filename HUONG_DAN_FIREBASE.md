# Kết nối Firebase – Quản lý lớp học & Thi đua số

Firebase Web config đã **hardcode sẵn** trong `src/cloud/firebase.ts` cho dự án **web-quan-ly-lop-gvcn**. Không cần tạo `.env`, không cần Firebase Admin, service account hay máy chủ Node riêng.

Tổng cộng chỉ có 3 việc phải làm trên Firebase Console: bật đăng nhập Google, tạo Firestore, publish rules. Sau đó mở web lên và bấm nút đưa dữ liệu lên.

---

## 1. Bật Google Authentication

Mở https://console.firebase.google.com/project/web-quan-ly-lop-gvcn/authentication/providers

- Chưa khởi tạo Authentication thì bấm **Get started**.
- **Sign-in method → Add new provider → Google → Enable**, chọn email hỗ trợ của dự án rồi **Save**.
- Không cần bật Anonymous hoặc Email/Password.
- Vào **Authentication → Settings → Authorized domains**, thêm tên miền thực tế của web. Ghi tên miền trần, **không** kèm `https://`, đường dẫn hay cổng.
  - Ví dụ: `ten-web.vercel.app`, hoặc tên miền riêng của trường.
  - Chạy trên máy cá nhân thì thêm `localhost`; nếu mở bằng `127.0.0.1` thì thêm `127.0.0.1`.
- Tài khoản giáo viên được tạo tự động trong Authentication ngay lần đăng nhập Google đầu tiên.

Nếu trình duyệt (iPad, một số máy chiếu, chế độ nhúng iframe) chặn cửa sổ popup, ứng dụng **tự chuyển sang đăng nhập dạng chuyển trang** rồi quay lại. Không cần thao tác thêm.

Tài liệu: https://firebase.google.com/docs/auth/web/google-signin

---

## 2. Tạo Cloud Firestore và Publish rules

Mở https://console.firebase.google.com/project/web-quan-ly-lop-gvcn/firestore

- Chưa có database: **Create database** → tạo database **(default)** → Standard → chọn vị trí (nên chọn khu vực châu Á) → **Production mode**.
- Mở tab **Rules**, xoá hết nội dung cũ, chép **toàn bộ file `firestore.rules`** trong ZIP vào rồi bấm **Publish**.
- Không tự tạo collection hay document bằng tay. Dữ liệu xuất hiện sau khi đăng nhập và đưa dữ liệu lên.

Hoặc dùng CLI tại thư mục dự án:

```bash
npm install
npx firebase login
npm run deploy:rules
```

`firestore.indexes.json` tắt lập chỉ mục cho trường `payload` (trường này rất lớn và không bao giờ cần truy vấn). Nếu không dùng CLI: **Firestore → Indexes → Single field → Add exemption**, collection group `classrooms`, field `payload`, collection scope, tắt mọi index của field này.

Tài liệu: https://firebase.google.com/docs/firestore/security/rules-conditions

---

## 3. Chạy và triển khai web

Nên dùng Node.js 22.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # xuất ra thư mục dist
```

- **Vercel**: Framework Vite, Build command `npm run build`, Output directory `dist`.
- **Firebase Hosting**: `npm run deploy` (build + đẩy hosting và rules cùng lúc).
- ZIP đã kèm sẵn thư mục `dist` đã build.
- Phải chạy qua HTTP/HTTPS. **Không** mở trực tiếp `dist/index.html` bằng `file://` — đăng nhập Google sẽ không hoạt động.
- Kiểm tra tên miền vừa triển khai đã nằm trong Authorized domains (mục 1).

---

## 4. Đưa dữ liệu hiện có lên Firebase

Đây là phần thường bị vướng nhất, nên ứng dụng làm sẵn thành một bảng chọn nguồn.

### Lần đầu đăng nhập (tài khoản chưa có dữ liệu)

Sau khi Firebase xác nhận tài khoản chưa có lớp, màn hình **"Khởi tạo dữ liệu lớp trên Firebase"** hiện ra với các nguồn sau. Nguồn nào có thật trên máy mới hiện ra, kèm sĩ số và tên lớp để kiểm tra trước khi bấm:

| Nguồn | Khi nào có |
|---|---|
| Bản lưu trên máy của chính tài khoản này | Đã từng dùng Firebase trên trình duyệt này |
| Bản nháp đang mở trên màn hình | Có thay đổi chưa kịp lưu lên Firebase |
| Dữ liệu bản cũ trong trình duyệt | Đã dùng bản LocalStorage trước khi có Firebase, cùng tên miền và cùng trình duyệt |
| **Dữ liệu mẫu dựng sẵn trong ứng dụng** | Luôn có — 54 học sinh lớp 7C8, bộ nội quy, 10 tháng học |
| Lớp trống | Luôn có — tự nhập danh sách sau |
| File JSON sao lưu | Chọn file `.json` đã xuất từ ứng dụng |

Chọn một nguồn → bấm **Đưa lên Firebase**. Có thể bấm **Tải JSON nguồn đã chọn** để giữ một bản trên máy trước.

### Sau khi lớp đã có trên Firebase

Nút **"Đưa dữ liệu lên Firebase"** trên thanh xanh đậm đầu trang mở lại đúng bảng chọn đó, dùng khi:

- Đổi sang máy khác và muốn đẩy dữ liệu của máy đó lên.
- Khôi phục từ file JSON sao lưu.
- Nạp lại danh sách mẫu 54 học sinh.
- Làm lại từ đầu bằng lớp trống (rules chặn xoá document, nên ghi đè bằng lớp trống là cách làm sạch đúng).

Thao tác này **thay thế toàn bộ** lớp đang có trên Firebase, không trộn hai bản. Vì vậy hộp thoại luôn:

1. Hiện mô tả bản đang có trên Firebase và nút **Tải sao lưu JSON bản trên Firebase**.
2. Hỏi xác nhận, nêu rõ bản sắp đưa lên có bao nhiêu học sinh.

Dữ liệu được kiểm tra hợp lệ trước khi gửi: danh sách học sinh sai cấu trúc hoặc trùng mã sẽ bị từ chối ngay trên máy, không bao giờ ghi đè dữ liệu tốt bằng dữ liệu hỏng.

### Dùng trên máy thứ hai

Mở cùng địa chỉ web, đăng nhập **đúng tài khoản Google đó**. Dữ liệu tự tải về, không cần upload lại.

---

## 5. Cách lưu và xử lý xung đột

- Sau mỗi thay đổi, app gộp thao tác khoảng **1,5 giây** rồi tự lưu. Dòng trạng thái đầu trang hiện **Đã lưu lên Firebase / Đã đồng bộ Firebase** kèm số bản (`bản #12`).
- Mỗi lần lưu là một **transaction** kèm số `revision` tăng đúng 1. Hai thiết bị sửa cùng lúc sẽ được báo xung đột chứ không âm thầm ghi đè nhau.
- Khi báo xung đột: tự động lưu dừng lại. Hãy **Tải bản nháp JSON** trước, rồi chọn **Nhận bản Firebase** hoặc **Giữ bản nháp và lưu lên Firebase**.
- Mất mạng: thay đổi vẫn giữ trên máy (bản nháp theo UID). Có mạng lại thì bấm **Lưu lại**.
- Lỗi rules/mạng không tự thử lại vô hạn — phải bấm **Lưu lại** để tránh ghi đè nhầm.

---

## 6. Phạm vi tài khoản

- **Một tài khoản Google = một lớp.** Tài khoản khác có lớp khác và không đọc được lớp này.
- Các chế độ **GVCN / Ban cán sự / Trình chiếu** và mã PIN chỉ là chế độ thao tác **trên thiết bị đang đăng nhập**. Chúng không phải cơ chế phân quyền của Firestore, vì mã PIN nằm trong chính dữ liệu lớp nên không thể dùng để cấp quyền database.
- Không đưa tài khoản Google của giáo viên cho học sinh dùng. Nếu cần ban cán sự có tài khoản riêng chấm điểm trên cùng một lớp, phải dựng mô hình thành viên theo lớp (collection `members` + rules theo vai trò) — bản này chưa có.
- File HTML xuất ra từ mục Tiện ích vẫn là bản ngoại tuyến độc lập, **không** đồng bộ Firebase.

---

## 7. Rules đang bảo vệ những gì

File `firestore.rules` trong ZIP chỉ mở đúng `classrooms/{uid}` cho chính chủ tài khoản:

| Quy tắc | Tác dụng |
|---|---|
| `get` chỉ khi `request.auth.uid == uid` | Không có đọc công khai |
| `list` luôn bị chặn | Không ai dò được danh sách UID giáo viên |
| `create` bắt buộc `revision == 1` | Lớp mới luôn bắt đầu sạch |
| `update` bắt buộc `revision == cũ + 1` | Phát hiện xung đột 2 thiết bị |
| `ownerUid` phải trùng tên document và không đổi được | Không mạo danh, không chuyển chủ |
| Chỉ chấp nhận đúng 5 trường | Chặn trường lạ kiểu `admin: true` |
| `updatedAt == request.time` | Buộc dùng `serverTimestamp()`, không ghi lùi thời gian |
| `payload` là chuỗi, khác rỗng, ≤ 900.000 ký tự | Chặn ghi rác và document quá khổ |
| `delete` luôn bị chặn | Không xoá nhầm cả lớp |
| Mọi đường dẫn khác `allow read, write: if false` | Dự án đóng mặc định |

Kiểm tra lại rules bằng Firebase Emulator (cần Java):

```bash
npm run test:rules
```

---

## 8. Lỗi thường gặp

| Thông báo trên web | Cách xử lý |
|---|---|
| Tên miền này chưa được cho phép | Thêm tên miền vào Authentication → Settings → Authorized domains |
| Chưa bật đăng nhập Google | Authentication → Sign-in method → Google → Enable |
| Firestore từ chối quyền truy cập | Chưa Publish `firestore.rules`, hoặc publish nhầm dự án |
| Chưa tạo Cloud Firestore cho dự án này | Firestore → Create database → (default) |
| Firebase đã hết hạn mức | Kiểm tra Usage; tải sao lưu JSON rồi lưu lại khi có hạn mức |
| Dữ liệu lớp quá lớn cho một bản lưu | Vào Kho lưu trữ tháng, xoá bớt nhật ký tháng cũ rồi lưu lại |
| Có bản mới trên thiết bị khác | Tải bản nháp JSON rồi chọn bản muốn giữ |

Chạy thử nhanh bằng emulator trên máy (không đụng dữ liệu thật):

```bash
# .env.local
VITE_USE_FIREBASE_EMULATORS=true
```

```bash
npx firebase emulators:start --only auth,firestore
npm run dev
```
