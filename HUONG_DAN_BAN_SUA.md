# Bản sửa lỗi lưu dữ liệu – 27/09/2026

## Cập nhật
1. Nếu ứng dụng cũ vẫn còn dữ liệu đúng, vào Cài đặt → Sao lưu JSON trước khi cập nhật. Bản cũ chưa sao lưu các tháng và nội quy; nên giữ nguyên dữ liệu trình duyệt.
2. Thay mã nguồn dự án bằng nội dung ZIP này. Không chép node_modules của bản cũ.
3. Chạy `npm install`, `npm test`, `npm run lint`, `npm run build`.
4. Thư mục `dist` trong ZIP là bản đã build. Có thể dùng để triển khai lên dịch vụ hosting tĩnh.
5. Cập nhật trên cùng địa chỉ web và dùng cùng trình duyệt để đọc dữ liệu cũ. Không xóa dữ liệu trang web/localStorage.
6. Vào Cài đặt → Sao lưu JSON để tải bản sao lưu mới đầy đủ. Thử thêm học sinh, sửa tên lớp, đổi tổ, tải lại trang để kiểm tra trên máy thực tế.

## Đã sửa
- Bỏ ép danh sách về 54 học sinh mẫu, ép tên học sinh đầu tiên, tự sửa tổ/chức vụ và cán bộ lớp.
- Giữ tên lớp và năm học người dùng nhập, kể cả LỚP 6D8 và 2025–2026.
- Giữ danh sách học sinh rỗng, nội quy rỗng và điểm khởi tạo 0.
- Hiện cảnh báo rõ khi không đọc/ghi được bộ nhớ trình duyệt. Không tự ghi đè dữ liệu gốc bị lỗi JSON hoặc danh sách/tháng sai cấu trúc.
- Khi khôi phục JSON hợp lệ, cho phép ghi lại các vùng dữ liệu liên quan đang được bảo vệ.
- Khi mở lại ứng dụng, lấy điểm/nhật ký theo tháng đang chọn; không tự đồng bộ đè lên tháng đã chốt.
- Chặn sửa điểm, sửa danh sách và xóa nhật ký trong tháng đã chốt; mở khóa tháng từ cửa sổ quản lý tháng để tiếp tục sửa.
- Sao lưu JSON v3 có danh sách, thông tin lớp, điểm danh, nhật ký, nội quy, dữ liệu toàn bộ tháng. Vẫn nhận bản sao lưu cũ; bản cũ không có dữ liệu tháng thì tạo cấu trúc tháng mặc định.
- HTML xuất ra mang theo điểm danh, nhật ký, nội quy và dữ liệu tháng. Dữ liệu này được giữ trong sao lưu; giao diện HTML vẫn là giao diện đơn giản có sẵn, không thay thế toàn bộ chức năng quản lý tháng của bản React.
- Mỗi lần xuất HTML có vùng lưu riêng. Mở lại cùng file có thể tiếp tục dữ liệu của file đó; lần xuất mới bắt đầu từ dữ liệu web tại thời điểm xuất. Nút khôi phục chỉ tác động bản HTML, không xóa toàn bộ localStorage.
- Chống nội dung chứa thẻ đóng script làm hỏng dữ liệu JSON nhúng trong HTML.

## Kiểm chứng
- `npm test`: 13 kiểm tra đạt, gồm các sĩ số 0/40/53/54/55, tên lớp/năm học, cán bộ lớp, nội quy rỗng, JSON hỏng, lỗi quota/ghi lại, sao lưu tháng, file khôi phục sai, HTML lưu/đọc lại và bảo toàn dữ liệu không liên quan.
- `npm run lint`: đạt.
- `npm run build`: đạt. Vite có cảnh báo kích thước bundle trên 500 kB; không phải lỗi build.
- Chưa kiểm thử giao diện bằng Chromium tự động: môi trường không tải được trình duyệt. Chưa kiểm tra trực tiếp website đang triển khai của người dùng.

## Phạm vi lưu dữ liệu
Ứng dụng vẫn lưu trên localStorage của trình duyệt, chưa có máy chủ hay đồng bộ giữa thiết bị. Không thể tự khôi phục dữ liệu đã bị phiên bản cũ ghi đè nếu không có bản sao lưu. Bản HTML còn dùng thư viện/font từ CDN như bản gốc nên cần mạng để tải đầy đủ giao diện. Điểm danh hiện tại vẫn là trạng thái gần nhất của mỗi học sinh, chưa có lịch sử theo từng ngày.
