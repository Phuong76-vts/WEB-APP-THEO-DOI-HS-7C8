# Quản lý lớp học & Thi đua số – bản Firebase

Ứng dụng React + Vite, lưu dữ liệu lớp trên Cloud Firestore, đăng nhập bằng Google.
Firebase Web config **hardcode sẵn** trong `src/cloud/firebase.ts` (dự án `web-quan-ly-lop-gvcn`) — không cần `.env`.

**Đọc `HUONG_DAN_FIREBASE.md` trước khi chạy**: bật Google Authentication, thêm Authorized domains, tạo Firestore (default), Publish `firestore.rules`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # xuất ra dist/
npm test         # kiểm tra lưu trữ + lớp dữ liệu Firebase (không cần emulator)
npm run test:rules   # kiểm tra firestore.rules bằng emulator (cần Java)
npm run deploy       # build + deploy hosting & rules
```

## Mô hình dữ liệu

Một tài khoản Google = một lớp = **một document** `classrooms/{uid}`:

| Trường | Ý nghĩa |
|---|---|
| `ownerUid` | UID Google sở hữu, trùng tên document |
| `revision` | tăng đúng 1 mỗi lần lưu, dùng để phát hiện xung đột |
| `payload` | JSON toàn bộ lớp: `students`, `settings`, `pointLogs`, `attendance`, `rules`, `monthlyStore` |
| `updatedAt` | `serverTimestamp()` |
| `schemaVersion` | hiện tại `1` |

Gom một document để mỗi lần lưu là một transaction nguyên vẹn — chấm điểm, điểm danh và chốt tháng luôn sửa nhiều phần dữ liệu cùng lúc.

## Đưa dữ liệu hiện có lên Firebase

Nút **"Đưa dữ liệu lên Firebase"** (thanh đầu trang) và màn hình khởi tạo lần đầu cho chọn nguồn:
bản lưu của tài khoản trên máy, bản nháp đang mở, dữ liệu LocalStorage bản cũ, **dữ liệu mẫu 54 học sinh lớp 7C8**, lớp trống, hoặc file JSON sao lưu.
Mỗi nguồn hiện sẵn sĩ số và tên lớp; thao tác ghi đè luôn hỏi xác nhận và mời tải sao lưu bản cũ trước.

## Đồng bộ

Tự lưu sau 1,5 giây, có nút **Lưu lại** để thử lại khi lỗi. Mỗi lần lưu dùng transaction + `revision`;
hai thiết bị sửa song song sẽ báo xung đột và dừng tự lưu cho tới khi thầy cô chọn bản muốn giữ.
Bản nháp được giữ riêng theo UID trên máy, kể cả khi mất mạng.

## Giới hạn đã biết

- Chưa có mời tài khoản Google của ban cán sự vào chung một lớp. Vai trò GVCN/BCS/Trình chiếu và mã PIN chỉ là chế độ thao tác trên thiết bị, không phải phân quyền Firestore.
- File HTML xuất ra từ mục Tiện ích là bản ngoại tuyến độc lập, không đồng bộ Firebase.
- Một lớp phải nằm gọn dưới 1 MiB (client chặn ở 850.000 byte). Nhật ký nhiều tháng quá lớn thì xoá bớt trong Kho lưu trữ tháng.
