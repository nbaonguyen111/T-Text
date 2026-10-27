# Roadmap TeacherText

## Đã hoàn thành (MVP Phase 1-4)

- [x] Đặc tả ngôn ngữ TeacherText (`docs/TEACHERTEXT_SPEC.md`)
- [x] AST với discriminated unions
- [x] Tokenizer (hiệu mã ký tự thành token)
- [x] Parser (xây dựng AST từ token)
- [x] Validator (kiểm tra cú pháp, phát hiện lỗi)
- [x] HTML Renderer (render an toàn, chống XSS)
- [x] Unit tests cho tokenizer, parser, validator
- [x] Giao diện soạn thảo với xem trước theo thời gian thực
- [x] Chế độ giáo viên / học sinh (ẩn đáp án, lời giải)
- [x] Quản lý tài liệu: tạo, lưu, mở, sửa, xóa (localStorage)
- [x] Tự động lưu nháp sau 2 giây
- [x] Thông báo lỗi cú pháp kèm vị trí dòng/cột

## Tương lai (Future Work - chưa triển khai trong MVP)

- [ ] Xuất PDF
- [ ] Xuất DOCX
- [ ] Tạo giáo án bằng AI
- [ ] Tạo đề thi bằng AI
- [ ] Cộng tác thời gian thực
- [ ] Chia sẻ tài liệu công khai
- [ ] Phân quyền nhiều cấp
- [ ] Hệ thống template phức tạp
- [ ] Lịch sử phiên bản nâng cao
- [ ] Hệ thống plugin cho TeacherText
- [ ] Hỗ trợ công thức toán học KaTeX
- [ ] Tìm kiếm tài liệu
- [ ] Xuất định dạng bài giảng in ấn

## Kiến trúc

```
TeacherText → Tokenizer → Parser → AST → Validator → HTML Renderer
```

Parser là module độc lập, không phụ thuộc giao diện hoặc cơ sở dữ liệu.