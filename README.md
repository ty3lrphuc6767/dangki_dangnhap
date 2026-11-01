# Supabase Authentication Checkpoint

## Chạy bài

1. Tạo project tại Supabase.
2. Trong **Project Settings → API**, chép `Project URL` và `Publishable key` (hoặc anon key) vào `supabase-config.js`.
3. Trong **Authentication → Providers**, bật **Email**. Nếu cần Google login, bật **Google** và dán Client ID/Client Secret từ Google Cloud Console.
4. Trong **Authentication → URL Configuration**, thêm URL chạy Live Server, ví dụ `http://127.0.0.1:5500` hoặc `http://localhost:5500`, vào Redirect URLs.
5. Mở `index.html` bằng Live Server.

## Không đưa vào frontend

- `service_role` key.
- Database password.
- Bất kỳ private key / service account key nào.

Project URL và Publishable/anon key là cấu hình client-side; quyền dữ liệu thực tế sau này phải được bảo vệ bằng RLS.
