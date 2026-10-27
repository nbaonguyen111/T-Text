# Đặc tả ngôn ngữ TeacherText

## 1. Tổng quan

TeacherText là ngôn ngữ đánh dấu轻 (lightweight markup language) được thiết kế cho giáo viên soạn tài liệu giảng dạy. Cú pháp lấy cảm hứng từ Wikitext nhưng được đơn giản hóa và tập trung vào các besoins của giáo dục.

Mục tiêu: dễ học, dễ đọc, dễ phân tích cú pháp (parse), có thể mở rộng.

## 2. Các cấu trúc cơ bản

### 2.1 Tiêu đề (Heading)

Sử dụng dấu `=` ở đầu dòng. Số lượng dấu `=` xác định cấp độ tiêu đề (1-6).

```
= Tiêu đề cấp 1 =
== Tiêu đề cấp 2 ===
=== Tiêu đề cấp 3 ===
==== Tiêu đề cấp 4 ====
===== Tiêu đề cấp 5 =====
====== Tiêu đề cấp 6 ======
```

### 2.2 Chữ đậm và chữ nghiêng

- Chữ đậm: bao bọc bằng `'''` (ba dấu nháy đơn)
- Chữ nghiêng: bao bọc bằng `''` (hai dấu nháy đơn)

```
'''Đây là chữ đậm'''
''Đây là chữ nghiêng'''
'''Có thể kết hợp '''chữ đậm''' và ''chữ nghiêng'''
```

### 2.3 Đoạn văn (Paragraph)

Các dòng text liền nhau không có đánh dấu đặc biệt形成 một đoạn văn. Các đoạn văn cách nhau bởi dòng trống.

### 2.4 Danh sách

#### Danh sách không thứ tự

Sử dụng `*` ở đầu dòng:

```
* Mục 1
* Mục 2
* Mục 3
```

#### Danh sách có thứ tự

Sử dụng `#` hoặc `1.` ở đầu dòng:

```
# Mục đầu tiên
# Mục thứ hai
# Mục thứ ba
```

Hoặc:

```
1. Mục đầu tiên
2. Mục thứ hai
3. Mục thứ ba
```

### 2.5 Liên kết nội bộ

Sử dụng `[[mã_trang]]` hoặc `[[mã_trang|nhãn_hiển thị]]`:

```
[[bai_toan_1]]
[[bai_toan_1|Xem bài toán 1]]
```

### 2.6 Công thức toán học

Sử dụng `$...$` cho công thức nội dòng và `$$...$$` cho công thức blocks (đang trong kế hoạch tương lai).

## 3. Các khối dành cho giáo師

### 3.1 Khối lý thuyết `<lythuyet>`

```
<lythuyet>
Nội dung lý thuyết ở đây.
</lythuyet>
```

### 3.2 Khối ví dụ `<vidu>`

```
<vidu>
Nội dung ví dụ ở đây.
</vidu>
```

### 3.3 Khối câu hỏi `<cauhoi>`

```
<cauhoi id="C1" loai="trac-nghiem">
Nội dung câu hỏi.

A. Đáp án A
B. Đáp án B

<dapan>B</dapan>
<loigiai>Giải thích tại sao B là đáp án đúng.</loigiai>
</cauhoi>
```

Thuộc tính bắt buộc:
- `id`: mã định danh câu hỏi
- `loai`: loại câu hỏi (trac-nghiem, tu-luan, ...)

Thẻ con:
- `<dapan>`: đáp án (chỉ hiển thị ở chế độ giáo viên)
- `<loigiai>`: lời giải (chỉ hiển thị ở chế độ giáo viên)

## 4. Chế độ giáo viên / học sinh

- **Chế độ giáo viên**: Hiển thị tất cả nội dung bao gồm đáp án và lời giải
- **Chế độ học sinh**: Ẩn `<dapan>` và `<loigiai>` trong `<cauhoi>`

## 5. Ví dụ hoàn chỉnh

```text
= GIÁO ÁN TOÁN LỚP 10 =

== Bài 1: Mệnh đề ==

'''I. Mục tiêu'''

* Hiểu khái niệm mệnh đề.
* Xác định tính đúng sai.

<lythuyet>
Mệnh đề là một câu khẳng định có thể xác định tính đúng hoặc sai.
</lythuyet>

<vidu>
Cho P: "2 + 3 = 5".
Kết luận: P là mệnh đề đúng.
</vidu>

<cauhoi id="C1" loai="trac-nghiem">
Câu 1: Giá trị của 2 + 2 là bao nhiêu?

A. 3
B. 4
C. 5
D. 6

<dapan>B</dapan>
<loigiai>Vì 2 + 2 = 4.</loigiai>
</cauhoi>
```

## 6. Quy tắc lỗi

- Thẻ chưa đóng: báo lỗi với vị trí dòng/cột
- Thuộc tính không hợp lệ trên `<cauhoi>` (thiếu `id`): báo lỗi
- Mức heading không hợp lệ (vượt quá 6): báo lỗi
- Token không mong đợi: báo lỗi với vị trí
- Parser có khả năng phục hồi: tiếp tục hiển thị phần hợp lệ khi gặp lỗi