# Inkline Studio — Tattoo Booking

Website một studio, hỗ trợ từ một đến nhiều artist, đối chiếu nghiệp vụ trong `De_cuong_de_tai_Tattoo_Studio_Booking.docx`.

## Chạy trên máy

Cần **Node.js 24 trở lên**. Không cần cài thư viện npm.

```powershell
npm.cmd start
```

Mở **http://localhost:5173**. Không mở trực tiếp `index.html` hoặc dùng server tĩnh Python: ứng dụng cần API.

Lần chạy đầu, máy chủ tạo tài khoản **admin** và in mật khẩu ngẫu nhiên trong terminal. Lưu mật khẩu này để đăng nhập mục **Quản trị**. Mật khẩu được băm bằng scrypt; phiên đăng nhập có thời hạn 8 giờ, lưu trong cookie HttpOnly/SameSite. Tài khoản demo `admin123` cũ không còn sử dụng.

Có thể tự đặt mật khẩu **trước lần chạy đầu**:

```powershell
$env:ADMIN_PASSWORD = 'mat-khau-rieng-it-nhat-10-ky-tu'
npm.cmd start
```

Biến này chỉ tạo tài khoản khi database chưa có người dùng; không ghi đè mật khẩu đã lưu.

## Luồng nghiệp vụ

- Khách chọn artist, dịch vụ, ngày và giờ còn trống. Nút trong hồ sơ artist tự chọn đúng người; studio chỉ có một artist hiển thị sẽ bỏ qua bước chọn. Nếu không có artist hoặc dịch vụ nhận lịch, form tạm ngừng nhận yêu cầu.
- Giờ trống được tính theo giờ mở/đóng cửa, ngày mở cửa, ngày làm việc/nghỉ riêng của artist và thời lượng dịch vụ. Múi giờ Việt Nam (UTC+7). Không nhận lịch trong quá khứ hoặc vượt giờ đóng cửa.
- Yêu cầu mới ở trạng thái **Chờ xác nhận**, giữ khung giờ để tránh trùng. Máy chủ kiểm tra lại khi ghi, kể cả hai khách gửi đồng thời. Các yêu cầu chờ không tự hết hạn; admin cần xử lý hoặc hủy để giải phóng giờ.
- **Chờ xác nhận → Đã xác nhận → Hoàn thành**, hoặc hủy lịch đang chờ/đã xác nhận. Chỉ hoàn thành khi đã hết giờ hẹn; trạng thái kết thúc không mở lại.
- Admin có thể đổi artist, dịch vụ, ngày/giờ của lịch đang hoạt động. Lịch sử xử lý được lưu; lịch đã có giữ thời lượng được ghi lúc đặt/đổi lịch ngay cả khi dịch vụ thay đổi sau đó.
- Khách nhận mã yêu cầu sau khi gửi. Admin tìm kiếm theo tên, số điện thoại, mã lịch và lọc theo ngày, artist, trạng thái; xem đầy đủ ghi chú và ảnh tham khảo.

## Quản trị nội dung

- Artist: thêm/sửa/xóa khi chưa được tham chiếu, ẩn/hiện, ảnh, mô tả, chuyên môn, nhiều phong cách, ngày làm việc và ngày nghỉ riêng.
- Phong cách: thêm/sửa/xóa; không xóa khi đang được artist hoặc tác phẩm sử dụng.
- Dịch vụ: tên, mô tả, giá tham khảo dạng chữ, thời lượng, ẩn/hiện. Dịch vụ đã có lịch hẹn chỉ được ẩn, không xóa.
- Portfolio: tên, artist, phong cách, vị trí, mô tả, ảnh, ẩn/hiện. Ẩn artist cũng ẩn portfolio của người đó trên trang khách.
- Blog: tiêu đề, chủ đề, tóm tắt, nội dung đầy đủ, ẩn/hiện. Nội dung là văn bản thuần, không thực thi HTML nhập vào.
- Cấu hình: tên, logo, địa chỉ, điện thoại, email, mạng xã hội, tiêu đề/mô tả trang chủ, giới thiệu, chính sách và lịch mở cửa. Lưu xong cập nhật ngay trang khách.
- Ảnh: URL HTTP(S) hoặc tải PNG/JPEG/WebP tối đa 1 MB. Có thể thay hoặc gỡ ảnh. Portfolio ban đầu dùng placeholder rõ ràng; tải ảnh thực của studio trong quản trị.

Thay đổi lịch làm việc không tự hủy các lịch hẹn đã có. Admin cần xem và đổi lịch nếu cần. Khi xác nhận, máy chủ kiểm tra lại lịch làm việc hiện tại.

## Dữ liệu và cấu trúc

- `server.mjs`: HTTP API, xác thực và lưu dữ liệu.
- `domain.mjs`: quy tắc thời gian, kiểm tra đặt lịch, trạng thái.
- `app.js`, `index.html`, `styles.css`: giao diện responsive, không cần build.
- `seed.mjs`: nội dung mẫu, không có thông tin khách thật.
- `data/studio.sqlite`: dữ liệu bền vững, tài khoản và phiên. Thư mục này được bỏ qua bởi Git và không được phục vụ qua HTTP.

Database hiện tại là **SQLite**, lưu nội dung studio thành một bản ghi JSON và bảng tài khoản/phiên riêng. Mô hình này phù hợp chạy một tiến trình cho đồ án/demo. Chưa chuyển sang Next.js/React hoặc schema quan hệ MSSQL trong phần công nghệ dự kiến của đề cương; chưa triển khai SEO với trang chi tiết riêng, sitemap, email/SMS tự động hoặc hosting. Vai trò hiện có là khách và admin; artist có hồ sơ/booking do admin quản lý, chưa có tài khoản artist riêng.

Dữ liệu `localStorage` của bản demo cũ không bị xóa, nhưng không tự nhập vào database mới. Các kiểm thử dùng database tạm, không thay đổi dữ liệu đang dùng. Muốn sao lưu, dừng máy chủ rồi sao chép thư mục `data`.

Tùy chọn môi trường: `PORT` (mặc định 5173), `HOST` (mặc định 127.0.0.1), `DATABASE_PATH`, `ADMIN_PASSWORD`. Khi triển khai qua HTTPS, đặt `COOKIE_SECURE=1`. Bản hiện tại mặc định chỉ lắng nghe trên máy cục bộ.

## Kiểm tra

```powershell
npm.cmd test
npm.cmd run test:browser
```

Kiểm thử trình duyệt dùng Chrome/Edge headless có sẵn, không tải dependency. Nếu trình duyệt ở vị trí khác, đặt biến `BROWSER_PATH`. Ảnh chụp được lưu trong `artifacts/` (không đưa vào Git).
