import { ensureAllActivitiesInTwoColumnTable } from './utils/tableFormatter';

const sampleInput = `
**Bài 2: ĐA THỨC**
Môn học/Hoạt động giáo dục: Toán; lớp: 8C3, 8C4, 8C5
Thời gian thực hiện: 2 tiết; Tiết PPCT: 3, 4.

- I. Mục tiêu
-1. Kiến thức:
- Nhận biết các khái niệm đa thức.
-2. Năng lực:
- a) Năng lực đặc thù:
- Năng lực tư duy và lập luận toán học.
- b) Năng lực chung:
- Tự chủ và tự học.
- c) Năng lực số (NLS): Lựa chọn công cụ số.
- d) Năng lực AI: Trình bày cách sử dụng AI.
-3. Phẩm chất:
- Chăm chỉ, trung thực.
*Tích hợp giáo dục hòa nhập:
- HS khuyết tật vận động: Hỗ trợ ghi chép.
- HS khuyết tật trí tuệ: Hướng dẫn đơn giản.

- II. Thiết bị dạy học và học liệu
-1. Giáo viên:
- SGK, SGV, bài giảng điện tử, phiếu học tập, máy tính, ti vi.
-2. Học sinh:
- SGK, vở ghi, dụng cụ học tập, xem trước bài mới.

III. Tiến trình dạy học

1. Hoạt động 1: Khởi động (Tiết PPCT: Tiết 3)
a) Mục tiêu: Tạo hứng thú cho học sinh.
b) Nội dung: Quan sát hình vẽ.
c) Sản phẩm: Câu trả lời.
d) Tổ chức thực hiện:
*Bước 1: Chuyển giao nhiệm vụ:** GV giao bài toán thực tiễn.
Bước 2: Thực hiện nhiệm vụ:HS làm bài.
Bước 3: Báo cáo, thảo luận:HS phát biểu.
Bước 4: Kết luận, nhận định:GV chốt.

2. Hoạt động 2: Hình thành kiến thức mới
Hoạt động 2.1: Khái niệm đa thức
a) Mục tiêu: HS hiểu khái niệm đa thức.
b) Nội dung: HS tìm hiểu SGK.
c) Sản phẩm: Các ví dụ và bài tập.
d) Tổ chức thực hiện:
Bước 1: Chuyển giao nhiệm vụ: GV cho HS làm HĐ1.
1. Khái niệm đa thức:
HĐ1: SGK
Ví dụ 1: $x^2 + 2x + 1$.
Bước 2: Thực hiện nhiệm vụ: HS thảo luận.
Bước 3: Báo cáo, thảo luận: Trình bày.
Bước 4: Kết luận, nhận định: GV chốt.

* Hướng dẫn về nhà:
- Ôn tập kiến thức: Ghi nhớ đa thức.
- Bài tập về nhà: Làm bài trong SBT.
- Chuẩn bị bài mới: Xem bài 3.
`;

const result = ensureAllActivitiesInTwoColumnTable(sampleInput);
console.log("=== Formatted Text Result ===");
console.log(result);

// Check that Section II does NOT contain "d) Tổ chức thực hiện" or table
const sec2Part = result.split('III. Tiến trình dạy học')[0];
const hasTableInSec2 = sec2Part.includes('| Hoạt động của giáo viên và học sinh |') || sec2Part.includes('Tổ chức thực hiện');
console.log("\nTable in Section II?", hasTableInSec2 ? "❌ ERROR: Table found in Section II" : "✅ PASSED: No extra table in Section II");

// Check headings in Section I and Section II
const checkBoldHeadings = [
  "**I. Mục tiêu**",
  "**1. Kiến thức:**",
  "**2. Năng lực:**",
  "**a) Năng lực đặc thù:**",
  "**b) Năng lực chung:**",
  "**c) Năng lực số",
  "**d) Năng lực AI",
  "**3. Phẩm chất:**",
  "**II. Thiết bị dạy học và học liệu**",
  "**1. Giáo viên:**",
  "**2. Học sinh:**"
];

checkBoldHeadings.forEach(h => {
  const found = result.includes(h);
  console.log(`Checking [${h}]:`, found ? "✅ BOLD OK" : "❌ NOT BOLD");
});
