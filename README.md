# Inkline Studio - Tattoo Booking Demo

Website demo theo mo ta trong `De_cuong_de_tai_Tattoo_Studio_Booking.docx`.

## Cach chay

Mo truc tiep `index.html` trong trinh duyet, hoac chay server tinh:

```bash
python -m http.server 5173
```

Sau do vao `http://localhost:5173`.

## Chuc nang da co

- Trang chu, gioi thieu studio, artist, tattoo styles, portfolio, services, blog, contact.
- Form booking theo artist/dich vu/ngay gio/vi tri/kich thuoc/ghi chu.
- Tu dong an buoc chon artist neu chi con 1 artist dang hien thi.
- Admin demo voi dang nhap `admin` / `admin123`.
- Dashboard booking, cap nhat trang thai Pending / Confirmed / Completed / Cancelled.
- Them artist, dich vu, bai blog va an/hien artist.
- Luu du lieu demo bang `localStorage`.

## Huong nang cap dung voi do an

- Chuyen giao dien sang Next.js/React components.
- Tao API routes cho Artist, Styles, Portfolio, Services, Bookings, Blog, Settings.
- Ket noi MSSQL theo cac bang trong tai lieu.
- Them authentication that bang session hoac JWT.
- Tach role Admin, Artist va khach hang.
