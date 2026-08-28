# Kỹ thuật xử lý hình ảnh tối ưu dành cho AI (Word to AI to Word)

Tài liệu này ghi chú lại luồng xử lý hình ảnh khi đọc từ file Word (.docx), gửi qua AI và xuất trở lại file Word nhằm mục đích tiết kiệm context/token cho AI nhưng vẫn bảo toàn được hình ảnh cuối cùng. Kỹ thuật này phù hợp cho các dự án tích hợp LLM (Gemini, OpenAI, Claude,...) cần xử lý văn bản có chứa ảnh.

## Vấn đề gặp phải
1. Khi convert từ file `.docx` sang HTML bằng Mammoth, các hình ảnh sẽ bị mã hóa dưới dạng `base64`.
2. Một chuỗi `base64` của hình ảnh có thể rất lớn (vài nghìn đến vài triệu ký tự). Truyền trực tiếp chuỗi này dưới dạng text vào prompt LLM sẽ dẫn đến:
   - Quá tải giới hạn Context Length (Vượt qua Token Limit).
   - Tăng chi phí API phi mã vì LLM tính tiền dựa trên lượng Token đầu vào.
   - LLM có thể bị "rối" và sinh ra phản hồi chậm/lỗi.
3. Nếu loại bỏ ảnh hoàn toàn, file đầu ra sẽ bị mất nội dung quan trọng mà người dùng đã thiết kế ban đầu (VD: Cấu trúc ảnh minh họa bài giảng).

## Giải pháp: Image Caching & Tách rời dữ liệu (Tokenization Hình ảnh)

Quy trình giải quyết dựa trên việc tách chuỗi ảnh base64 ra khỏi text trước khi gửi cho AI và lắp ghép lại sau khi AI trả về kết quả.

### Bước 1: Đọc và gỡ (Extract & Replace) hình ảnh trước khi gửi AI
- Đọc file Word (sử dụng thư viện phổ biến như `mammoth`). Kết quả trả về là một chuỗi HTML.
- Dùng Regex để tóm toàn bộ các thẻ `<img src="data:image/...">`.
- Tạo một đối tượng `imageCache` dạng Key-Value trong bộ nhớ (VD: RAM/Context cục bộ của React hoặc Redux).
- Lần lượt thay thế từng chuỗi `<img ...>` bằng một mã placeholder ngắn gọn (VD: `[HINHANH_timestamp_1]`).
- Lưu dữ liệu thực của ảnh (chuỗi base64, chiều dài/rộng) vào `imageCache` với key là mã placeholder.

```typescript
// Ví dụ tham khảo
let counter = 0;
html = html.replace(/<img[^>]*src="(data:image\/[^;]+;base64,[^"]+)"[^>]*>/g, (match, dataUrl) => {
    const id = `HINHANH${Date.now()}${++counter}`;
    // Tính toán lại kích thước nếu cần chuẩn hóa
    imageCache[id] = { id, dataUrl, width: 250, height: 250 }; 
    return ` [${id}] `;
});
```

### Bước 2: Chuẩn hóa kích thước hình ảnh (Tùy chọn)
- Hình ảnh base64 được parse vào một in-memory `Image` object của browser (hoặc qua Canvas) để đo kích thước `naturalWidth` và `naturalHeight`.
- Theo chuẩn hiển thị, hình ảnh có thể tự động thu phóng (resize logical layout) về tỷ lệ chuẩn (VD: độ rộng cố định khoảng 250px, tức 2/5 trang giấy Word) nhằm đảm bảo hiển thị đẹp và tránh vỡ layout khi tạo bảng.

### Bước 3: Gửi text đã tối ưu cho LLM
- Gửi HTML (hoặc markdown) có chứa các đoạn chữ `[HINHANH...]` cho AI. 
- **Cực kỳ quan trọng**: Trong Prompt hệ thống cấp cho AI, luôn phải có chỉ thị nhắc AI không được phép xóa hay sửa đổi các chuỗi mang định dạng `[HINHANH...]`.

### Bước 4: Khôi phục ảnh (Re-hydrate) từ AI Result
- Kết quả của LLM trả về là text thuần túy có xen kẽ các chốt `[HINHANH...]`.
- **Hiển thị trên Web (Preview):** Dùng Regex dò lại các mã `[HINHANH...]` -> Lấy chuỗi base64 tương ứng từ Cacher -> Render thành thẻ `<img />`.
- **Xuất ra Word (Export):** Trích xuất mã Base64 -> chuyển về dạng `Buffer`/`ArrayBuffer` -> Render thành lớp ảnh của thư viện Word (VD: `ImageRun` của thư viện `docx`).

```typescript
// Trích xuất buffer từ Base64 để nhúng lại vào Word
const base64DataURLToArrayBuffer = (dataURL) => {
    const base64 = dataURL.split(',')[1];
    const binary_string = window.atob(base64);
    const bytes = new Uint8Array(binary_string.length);
    for (let i = 0; i < binary_string.length; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};
```

## Kết quả đạt được
1. **Tiết kiệm Token & Chi phí**: AI chỉ xử lý phần chữ, chuỗi Text gửi cho AI chỉ mất vài token để biểu thị placeholder thay vì hàng trăm nghìn Token bị lãng phí.
2. **Nhanh nhẹn**: Do size payload nhỏ đi rất nhiều, Request/Response với LLM diễn ra siêu tốc.
3. **Chính xác layout**: Bảo toàn được cấu trúc của tài liệu gốc, đặc biệt là các hình ảnh mô tả.
