# Những gì đã sửa ở bản này

Bản sửa LocalStorage ngày 27/09 đã được tích hợp sẵn. Bản này bổ sung phần Firebase:

1. **Đưa dữ liệu hiện có lên Firebase bằng nút bấm.** Thêm bảng chọn nguồn dùng được cả lúc khởi tạo lần đầu lẫn lúc lớp đã có trên Firebase: bản lưu của tài khoản trên máy, bản nháp đang mở, dữ liệu LocalStorage bản cũ, **dữ liệu mẫu 54 học sinh lớp 7C8**, lớp trống, hoặc file JSON. Mỗi nguồn hiện sẵn sĩ số, số tháng và tên lớp trước khi bấm.
2. **Ghi đè an toàn.** `uploadCloud()` ghi trong transaction, tự đọc `revision` hiện tại rồi tăng đúng 1 nên luôn hợp lệ với rules. Trước khi ghi đè, hộp thoại hiện mô tả bản đang có trên Firebase và nút tải sao lưu JSON.
3. **Rules chặt hơn và có chú thích tiếng Việt.** Khoá `ownerUid` không đổi được khi cập nhật, bắt buộc `schemaVersion == 1`, `payload` khác rỗng và có giới hạn độ dài, chặn `list`, chặn `delete`, chặn mọi collection con và mọi đường dẫn khác.
4. **Đăng nhập Google không còn chết khi popup bị chặn.** Tự chuyển sang `signInWithRedirect` và thu kết quả khi quay lại trang (quan trọng với iPad, máy chiếu, webview).
5. **Thông báo lỗi Firebase tiếng Việt đầy đủ hơn**: `unauthenticated`, `not-found`, `failed-precondition`, `deadline-exceeded`, `aborted`, `invalid-argument`, `auth/too-many-requests`, `auth/web-storage-unsupported`…
6. **Thanh trạng thái hiện số bản** (`bản #12`) để đối chiếu giữa các thiết bị.
7. **Dọn vòng đời phiên**: đặt namespace localStorage theo UID bằng `useMemo` thay vì gọi phụ trong `useState`, tránh chạy lặp ở StrictMode.
8. **Thêm kiểm thử.** `npm test` chạy thêm `tests/cloud.data.test.cjs` (9 kiểm tra, không cần emulator). `npm run test:rules` bổ sung các trường hợp: revision lùi, đổi `ownerUid`, sai `schemaVersion`, payload rỗng/không phải chuỗi, ghi vào collection con, và toàn bộ luồng upload.

Xem `HUONG_DAN_FIREBASE.md` để cấu hình Authentication, Firestore và triển khai.
