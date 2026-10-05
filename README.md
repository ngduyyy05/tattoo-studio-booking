# Inkline Studio — Tattoo Booking

Website một studio, hỗ trợ từ một đến nhiều artist, đối chiếu nghiệp vụ trong `De_cuong_de_tai_Tattoo_Studio_Booking.docx`.

**Công nghệ:** Next.js 16 (App Router, React 19) · API bằng Route Handlers · Microsoft SQL Server (thư viện `mssql`) · đăng nhập bằng session cookie · Docker.

## Chạy trên máy

Cần **Node.js 24 trở lên**.

```powershell
npm.cmd install
copy .env.example .env   # rồi điền MSSQL_CONNECTION_STRING
npm.cmd run dev
```

Mở **http://localhost:3000**.

- **Có SQL Server** (Express/Developer cài trên máy, hoặc container): đặt `MSSQL_CONNECTION_STRING` trong `.env`, ví dụ
  `Server=localhost,1433;Database=InklineStudio;User Id=sa;Password=...;Encrypt=true;TrustServerCertificate=true`.
  Lần chạy đầu, ứng dụng tự tạo database (nếu tài khoản có quyền), tạo bảng theo `db/schema.sql` và nạp dữ liệu mẫu.
- **Chưa có SQL Server:** để trống biến này. Ứng dụng dùng bộ nhớ tạm để chạy thử; dữ liệu mất khi tắt máy chủ.

Lần chạy đầu, máy chủ tạo tài khoản **admin** và in mật khẩu ngẫu nhiên trong terminal. Có thể tự đặt trước bằng `ADMIN_PASSWORD` (ít nhất 10 ký tự); biến này chỉ dùng khi database chưa có tài khoản. Mật khẩu băm bằng scrypt, phiên đăng nhập 8 giờ trong cookie HttpOnly/SameSite.

Bản production: `npm.cmd run build` rồi `npm.cmd start`.

### Docker (web + SQL Server)

```powershell
copy .env.example .env   # điền MSSQL_SA_PASSWORD và ADMIN_PASSWORD
docker compose up --build
```

Website ở http://localhost:3000, SQL Server ở `localhost,1433` (đăng nhập `sa`) để xem bằng SSMS / Azure Data Studio.

## Trang và URL

| URL | Nội dung |
| --- | --- |
| `/` | Trang chủ: giới thiệu, artist, phong cách, tác phẩm nổi bật, dịch vụ, blog, liên hệ |
| `/about`, `/contact` | Giới thiệu studio, thông tin liên hệ và chính sách |
| `/artists`, `/artists/[id]` | Danh sách artist và hồ sơ riêng kèm portfolio |
| `/styles`, `/styles/[id]` | Phong cách và các artist/tác phẩm thuộc phong cách đó |
| `/portfolio?artist=&style=` | Thư viện tác phẩm có bộ lọc |
| `/services` | Dịch vụ, thời lượng, giá tham khảo |
| `/booking?artist=&service=` | Form đặt lịch, chọn sẵn artist/dịch vụ theo link |
| `/blog`, `/blog/[id]` | Bài viết |
| `/admin` | Quản trị (không lập chỉ mục) |
| `/sitemap.xml`, `/robots.txt` | SEO; đặt `SITE_URL` khi triển khai |

Mỗi trang có tiêu đề và mô tả riêng. Nội dung mới tạo trong quản trị có id dạng chữ dễ đọc (ví dụ `minh-tran-3f2a`) để URL thân thiện.

## Luồng nghiệp vụ

- Khách chọn artist, dịch vụ, ngày và giờ còn trống. Nút trong hồ sơ artist tự chọn đúng người; studio chỉ có một artist hiển thị sẽ ẩn bước chọn. Nếu không có artist hoặc dịch vụ nhận lịch, form tạm ngừng nhận yêu cầu.
- Giờ trống được tính theo giờ mở/đóng cửa, ngày mở cửa, ngày làm việc/nghỉ riêng của artist và thời lượng dịch vụ. Múi giờ Việt Nam (UTC+7). Không nhận lịch trong quá khứ hoặc vượt giờ đóng cửa.
- Yêu cầu mới ở trạng thái **Chờ xác nhận**, giữ khung giờ để tránh trùng. Máy chủ kiểm tra lại giờ trống và ghi lịch trong cùng một khóa ghi (`sp_getapplock`), nên hai khách gửi đồng thời không thể đặt trùng.
- **Chờ xác nhận → Đã xác nhận → Hoàn thành**, hoặc hủy lịch đang chờ/đã xác nhận. Chỉ hoàn thành khi đã hết giờ hẹn; trạng thái kết thúc không mở lại.
- Admin có thể đổi artist, dịch vụ, ngày/giờ của lịch đang hoạt động. Lịch sử xử lý lưu ở bảng `BookingHistory`; lịch đã có giữ thời lượng được ghi lúc đặt/đổi lịch.
- Khách nhận mã yêu cầu sau khi gửi. Admin tìm theo tên, số điện thoại, mã lịch và lọc theo ngày, artist, trạng thái.

## Quản trị nội dung

Artist, phong cách, dịch vụ, portfolio, blog và cấu hình studio: thêm/sửa/ẩn/xóa như trước. Không xóa artist/dịch vụ/phong cách đang được tham chiếu (chỉ ẩn). Ảnh: URL HTTP(S) hoặc tải PNG/JPEG/WebP tối đa 1 MB. Nội dung blog là văn bản thuần, không thực thi HTML.

## Database (MSSQL)

`db/schema.sql` định nghĩa các bảng trong mục 7 của đề cương: `Studios`, `Users`, `Artists`, `TattooStyles`, `ArtistStyles`, `PortfolioItems`, `Services`, `Bookings`, `BlogPosts`, cộng thêm `Sessions` (phiên đăng nhập) và `BookingHistory` (lịch sử xử lý). File chạy lại được nhiều lần, chỉ tạo bảng còn thiếu.

## Cấu trúc mã

- `app/`: các trang (server components) và `app/api/*/route.js` (API).
- `components/`: giao diện React; `components/admin/` là trang quản trị.
- `lib/domain.js`: quy tắc thời gian, giờ trống, trạng thái lịch hẹn.
- `lib/validate.js`: kiểm tra dữ liệu nhập.
- `lib/repo/`: lớp dữ liệu; `mssql.js` cho SQL Server, `memory.js` để chạy thử/kiểm thử.
- `lib/seed.js`: nội dung mẫu, không có thông tin khách thật.

Chưa có: tài khoản riêng cho artist, gửi email/SMS tự động, hosting thật.

## Kiểm tra

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:browser
```

Kiểm thử chạy bản build bằng bộ nhớ tạm, không đụng vào database trong `.env`. Muốn chạy với SQL Server, đặt `TEST_MSSQL_CONNECTION_STRING` tới một database **dùng riêng để test**. Kiểm thử trình duyệt dùng Chrome/Edge headless có sẵn (đặt `BROWSER_PATH` nếu ở vị trí khác); ảnh chụp lưu trong `artifacts/`.
