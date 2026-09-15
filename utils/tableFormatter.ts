/**
 * Utility to ensure all activities in a lesson plan are formatted into 
 * standard 2-column Markdown tables (| Hoạt động của giáo viên và học sinh | Kết quả hoạt động |).
 * Guarantees all activities (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng)
 * have proper a) Mục tiêu, b) Nội dung, c) Sản phẩm, and d) Tổ chức thực hiện (Bảng 2 cột).
 */

// Helper to check if a line is an Activity header
export const isActivityHeader = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const clean = trimmed
    .replace(/^[\*#\s\-\+•_]+/, '')
    .replace(/[\*#\s_]+$/, '')
    .trim();
  return /^(?:\d+[\.\)]\s*)?Hoạt\s*động\s*(?:\d+(?:\.\d+)?|[1-4]|[A-Za-z]|Khởi\s*động|Hình\s*thành|Luyện\s*tập|Vận\s*dụng|Mở\s*đầu)/i.test(clean);
};

// Helper to check if a line is the start of Section IV or Homework section
export const isSectionEnd = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const clean = trimmed
    .replace(/^[\*#\s\-\+•_]+/, '')
    .replace(/[\*#\s_]+$/, '')
    .trim();
  return (
    /^\*?\s*Hướng\s*dẫn\s*(?:về\s*nhà|học\s*ở\s*nhà|tự\s*học)/i.test(clean) ||
    /^(?:IV|V|VI|4|5|6)\s*[\.\)]\s*(?:HƯỚNG|Hướng|DẶN|Dặn|PHỤ|Phụ|ĐÁNH|Đánh)/i.test(clean) ||
    /^(?:Dặn\s*dò|Giao\s*bài\s*về\s*nhà)/i.test(clean) ||
    /^(?:Ôn\s*tập\s*kiến\s*thức|Bài\s*tập\s*về\s*nhà|Chuẩn\s*bị\s*bài\s*mới)/i.test(clean) ||
    /^(?:Người\s*kiểm\s*tra|Người\s*xây\s*dựng|Ký\s*duyệt)/i.test(clean)
  );
};

// Helper: Kiểm tra chính xác một dòng có phải là dòng tích hợp cần bôi đỏ (RED) hay không
export const isIntegrationLine = (text: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Tuyệt đối không bôi đỏ các tiêu đề mục lớn, bước, bài tập, lời giải, hay hướng dẫn về nhà
  if (/^[\*\-\+•\s#]*(?:Phần|Chương|Bài\s*\d+|[I|V|X]+\.|\d+\.\s*(?:Kiến\s*thức|Năng\s*lực|Phẩm\s*chất|Thiết\s*bị|Tiến\s*trình|Hoạt\s*động|Giáo\s*viên|Học\s*sinh|Ôn\s*tập|Bài\s*tập|Chuẩn\s*bị)|Hoạt\s*động\s*\d+|Hướng\s*dẫn\s*(?:về\s*nhà|tự\s*học)|Bước\s*[1-4]|HĐ\s*\d+|Ví\s*dụ|Luyện\s*tập|Vận\s*dụng|Bài\s*\d+|Câu\s*\d+|Quy\s*tắc|Kết\s*luận|Nhận\s*xét|Chú\s*ý|[a-b]\)\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Tổ\s*chức)|[a-b]\)\s*Năng\s*lực\s*(?:đặc\s*thù|chung))/i.test(trimmed)) {
    return false;
  }

  // Khớp các mục tích hợp chuẩn ở phần Mục tiêu hoặc trong Bảng:
  // 1. c) Năng lực số / d) Năng lực AI / e) STEM / e) GDQP
  if (/^[ \t]*[\*\-\+•]*(?:[c-e]\)\s*)?(?:Năng\s*lực\s*số|Năng\s*lực\s*AI|Năng\s*lực\s*trí\s*tuệ\s*nhân\s*tạo|Giáo\s*dục\s*STEM|GDQP|Lồng\s*ghép\s*GDQP)/i.test(trimmed)) {
    return true;
  }

  // 2. *Tích hợp... hoặc Tích hợp...
  if (/^[ \t]*[\*\-\+•]*Tích\s*hợp\s+(?:năng\s*lực\s*số|năng\s*lực\s*AI|AI|STEM|GDQP|an\s*ninh\s*quốc\s*phòng|giáo\s*dục\s*hòa\s*nhập|bảo\s*vệ\s*môi\s*trường)/i.test(trimmed)) {
    return true;
  }

  // 3. Học sinh khuyết tật / HS khuyết tật (vận động, trí tuệ, nghe, nhìn, tự kỷ, chung...)
  if (/^[ \t]*[\*\-\+•]*(?:HS|Học\s*sinh)\s*khuyết\s*tật/i.test(trimmed) || /^\*Tích\s*hợp\s*giáo\s*dục\s*hòa\s*nhập/i.test(trimmed)) {
    return true;
  }

  // 4. Dòng nội dung hướng dẫn sử dụng công cụ số / AI / phần mềm tích hợp
  if (/^[ \t]*[\*\-\+•]*(?:GV\s*(?:hướng\s*dẫn|giới\s*thiệu|yêu\s*cầu)|HS\s*(?:sử\s*dụng|thực\s*hành|thao\s*tác)).*?(?:Google\s*Sheets|Excel|GeoGebra|ChatGPT|Copilot|AI|công\s*cụ\s*số|phần\s*mềm)/i.test(trimmed)) {
    return true;
  }

  return false;
};

/**
 * Tách triệt để tất cả các tiêu đề, đề mục, phân mục và bước bị dính liền trên cùng 1 dòng
 */
export const splitAllMergedHeadings = (text: string): string => {
  if (!text) return "";
  let s = text;

  // 0. Dọn sạch ký tự hoa thị rác
  s = s.replace(/\*\*\s*\*\*/g, '');
  s = s.replace(/\*\*\s*[:\-]?\s*\*\*/g, '**');

  // 1. Tách các tiêu đề lớn La Mã (I. Mục tiêu, II. Thiết bị dạy học và học liệu, III. Tiến trình dạy học)
  s = s.replace(/(?:^|\n|[ \t]*)(?:\*\*)?((?:I|1)\.\s*(?:MỤC\s*TIÊU|Mục\s*tiêu)\s*:?)(?:\*\*)?/gmi, '\n\n**I. Mục tiêu**\n\n');
  s = s.replace(/(?:^|\n|[ \t]*)(?:\*\*)?((?:II|2)\.\s*(?:THIẾT\s*BỊ\s*DẠY\s*HỌC\s*VÀ\s*HỌC\s*LIỆU|Thiết\s*bị\s*dạy\s*học\s*và\s*học\s*liệu|THIẾT\s*BỊ\s*DẠY\s*HỌC|Thiết\s*bị\s*dạy\s*học)\s*:?)(?:\*\*)?/gmi, '\n\n**II. Thiết bị dạy học và học liệu**\n\n');
  s = s.replace(/(?:^|\n|[ \t]*)(?:\*\*)?((?:III|3|[B-C])\.\s*(?:TIẾN\s*TRÌNH\s*DẠY\s*HỌC|Tiến\s*trình\s*dạy\s*học|CÁC\s*HOẠT\s*ĐỘNG\s*DẠY\s*HỌC|Các\s*hoạt\s*động\s*dạy\s*học|TIẾN\s*TRÌNH|Tiến\s*trình)\s*:?)(?:\*\*)?/gmi, '\n\n**III. Tiến trình dạy học**\n\n');

  // 2. Tách Hoạt động 2: Hình thành kiến thức mới
  s = s.replace(/(?:^|\n|[ \t]*)(?:\*\*)?(\*?(?:\d+[\.\)]\s*)?Hoạt\s*động\s*2\s*:\s*Hình\s*thành\s*kiến\s*thức\s*mới\s*:?)(?:\*\*)?/gmi, '\n\n**2. Hoạt động 2: Hình thành kiến thức mới**\n\n');

  // 3. Tách các Hoạt động (1. Hoạt động 1, Hoạt động 2.1, 3. Hoạt động 3, 4. Hoạt động 4) nếu bị dính dòng
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(\*?(?:\d+[\.\)]\s*)?Hoạt\s*động\s*(?:\d+(?:\.\d+)?|[1-4]|Khởi\s*động|Hình\s*thành|Luyện\s*tập|Vận\s*dụng)\b[^\n*:]*:?)/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').trim();
    return `\n\n**${c}**\n`;
  });

  // 4. Tách 1. Kiến thức:, 2. Năng lực:, 3. Phẩm chất: nếu không đứng đầu dòng
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(1\.\s*(?:Kiến\s*thức|KIẾN\s*THỨC)\s*:?)/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n\n**${c}**\n`;
  });

  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(2\.\s*(?:Năng\s*lực|NĂNG\s*LỰC)\s*:?)/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n\n**${c}**\n`;
  });

  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(3\.\s*(?:Phẩm\s*chất|PHẨM\s*CHẤT)\s*:?)/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n\n**${c}**\n`;
  });

  // 5. Tách các tiểu mục Năng lực: a) Năng lực đặc thù môn..., b) Năng lực chung:, c) Năng lực số:, d) Năng lực AI:
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?([a-e]\)\s*Năng\s*lực(?::\s*|\s*:\s*|\s+)[^\n*:]*:?)/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    c = c.replace(/^Năng\s*lực:\s*/i, 'Năng lực ');
    if (!c.endsWith(':')) c += ':';
    return `\n**${c}**\n`;
  });

  // 6. Tách 1. Giáo viên:, 2. Học sinh: nếu không đứng đầu dòng
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(1\.\s*(?:Giáo\s*viên|Thiết\s*bị)\b\s*:?)/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n**${c}** `;
  });

  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(2\.\s*(?:Học\s*sinh|Học\s*liệu)\b\s*:?)/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n**${c}** `;
  });

  // 7. Tách a) Mục tiêu:, b) Nội dung:, c) Sản phẩm:, d) Tổ chức thực hiện: nếu không đứng đầu dòng
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(a\)\s*(?:Mục\s*tiêu|Yêu\s*cầu)\b\s*:?)\s*(?:\*\*)?\s*/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n**${c}** `;
  });

  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(b\)\s*(?:Nội\s*dung)\b\s*:?)\s*(?:\*\*)?\s*/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n**${c}** `;
  });

  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(c\)\s*(?:Sản\s*phẩm|Kết\s*quả)\b\s*:?)\s*(?:\*\*)?\s*/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n**${c}** `;
  });

  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(d\)\s*(?:Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình)\b\s*:?)\s*(?:\*\*)?\s*/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n**${c}** `;
  });

  // 8. Tách các bước trong d) Tổ chức thực hiện nếu bị dính dòng
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(Bước\s*[1-4]\s*:\s*(?:Chuyển\s*giao\s*nhiệm\s*vụ|Thực\s*hiện\s*nhiệm\s*vụ|Báo\s*cáo[,\s]+thảo\s*luận|Kết\s*luận[,\s]+nhận\s*định)|Bước\s*[1-4]\s*:)/gmi, (_m, p1) => {
    let c = p1.replace(/\*/g, '').trim();
    if (!c.endsWith(':')) c += ':';
    return `\n**${c}** `;
  });

  // 9. Tách * Hướng dẫn về nhà:, + Ôn tập kiến thức:, + Bài tập về nhà:, + Chuẩn bị bài mới:
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?(\*?\s*Hướng\s*dẫn\s*(?:về\s*nhà|học\s*ở\s*nhà|tự\s*học)\s*:?)/gmi, '\n\n* Hướng dẫn về nhà:\n');
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?([\+\-\*•]\s*Ôn\s*tập\s*kiến\s*thức\b\s*:?)/gmi, '\n$1');
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?([\+\-\*•]\s*Bài\s*tập\s*về\s*nhà\b\s*:?)/gmi, '\n$1');
  s = s.replace(/(?<=[^\n])\s*(?:\*\*)?([\+\-\*•]\s*Chuẩn\s*bị\s*bài\s*mới\b\s*:?)/gmi, '\n$1');

  // 10. Tách *Tích hợp giáo dục hòa nhập: nếu dính dòng
  s = s.replace(/(?<=[^\n])\s*(\*?Tích\s*hợp\s*giáo\s*dục\s*hòa\s*nhập\s*:?)/gmi, '\n$1\n');

  // 11. Dọn dẹp khoảng trắng dòng trống dư thừa
  s = s.replace(/\n{3,}/g, '\n\n');

  return s;
};

/**
 * Parses and converts an activity block into a standard 2-column table.
 * Accurately sorts teacher/student actions into Column 1, and products/exercises/solutions/images into Column 2.
 */
export const convertActivityBlockToTable = (activityBlock: string): string => {
  if (!activityBlock.trim()) return activityBlock;

  // Split any merged headings first
  const normalizedBlock = splitAllMergedHeadings(activityBlock);
  const lines = normalizedBlock.split(/\r?\n/);
  if (lines.length === 0) return activityBlock;

  // Header line of the activity
  let rawHeader = lines[0].trim();
  let restLines = lines.slice(1);

  // If lines[0] has concatenated activity header + a) Mục tiêu / b) Nội dung, extract it
  const headerSplit = rawHeader.match(/^([\s\S]*?(?:Hoạt\s*động\s*[\d\.]*(?:\s*:[^\n*a-e\)]*)?))(?:\*\*)?[ \t]*(?:\*\*)?([a-e]\)\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Yêu\s*cầu|Tổ\s*chức)[\s\S]*)$/i);
  if (headerSplit) {
    rawHeader = headerSplit[1].trim();
    const remainingAfterHeader = headerSplit[2].trim();
    if (remainingAfterHeader) {
      restLines.unshift(remainingAfterHeader);
    }
  }

  let headerLine = rawHeader.replace(/^[\*#\s]+/, '').replace(/[\*#\s]+$/, '').trim();
  headerLine = `**${headerLine}**`;

  let mucTieu: string[] = [];
  let noiDung: string[] = [];
  let sanPhamPre: string[] = [];
  let tochucRawLines: string[] = [];
  let homeworkLines: string[] = [];

  type SectionState = 'pre' | 'muctieu' | 'noidung' | 'sanpham' | 'tochuc';
  let state: SectionState = 'pre';

  for (let i = 0; i < restLines.length; i++) {
    const raw = restLines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Check if line belongs to Homework section -> exclude from activity table
    if (isSectionEnd(trimmed)) {
      homeworkLines.push(...restLines.slice(i));
      break;
    }

    // Ignore standalone markdown table header / separator lines in outer parse
    if (/^\|\s*:?---+\s*\|\s*:?---+\s*\|?$/.test(trimmed)) {
      state = 'tochuc';
      continue;
    }
    if (/^\|\s*Hoạt\s*động\s*của\s*(?:giáo\s*viên|gv)[^|]*\|\s*(?:Kết\s*quả|Sản\s*phẩm)[^|]*\|?$/i.test(trimmed)) {
      state = 'tochuc';
      continue;
    }

    // Section transitions
    if (/^(?:\*\*|\*|_)?a\s*[\)\.:\-]\s*(?:Mục\s*tiêu|Yêu\s*cầu)/i.test(trimmed)) {
      state = 'muctieu';
      mucTieu.push(trimmed);
      continue;
    }
    if (/^(?:\*\*|\*|_)?b\s*[\)\.:\-]\s*(?:Nội\s*dung)/i.test(trimmed)) {
      state = 'noidung';
      noiDung.push(trimmed);
      continue;
    }
    if (/^(?:\*\*|\*|_)?c\s*[\)\.:\-]\s*(?:Sản\s*phẩm|Kết\s*quả)/i.test(trimmed)) {
      state = 'sanpham';
      sanPhamPre.push(trimmed);
      continue;
    }
    if (/^(?:\*\*|\*|_)?(?:c|d)\s*[\)\.:\-]\s*(?:Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình)/i.test(trimmed) ||
      /^(?:\*\*|\*|_)?Tổ\s*chức\s*thực\s*hiện\s*:?/i.test(trimmed)) {
      state = 'tochuc';
      continue;
    }

    // Step indicators indicate transition to tochuc
    if (/^(?:\*\*|\*|_)?(?:-\s*)?Bước\s*[1-4]\s*:/i.test(trimmed) || trimmed.startsWith('|')) {
      state = 'tochuc';
    }

    switch (state) {
      case 'muctieu':
        mucTieu.push(trimmed);
        break;
      case 'noidung':
        noiDung.push(trimmed);
        break;
      case 'sanpham':
        sanPhamPre.push(trimmed);
        break;
      case 'tochuc':
        tochucRawLines.push(trimmed);
        break;
      default:
        if (/mục\s*tiêu/i.test(trimmed)) {
          mucTieu.push(trimmed);
          state = 'muctieu';
        } else {
          noiDung.push(trimmed);
          state = 'noidung';
        }
        break;
    }
  }

  // Nếu là tiêu đề cha (ví dụ: "2. Hoạt động 2: Hình thành kiến thức mới") không có nội dung riêng, chỉ trả về tiêu đề
  if (tochucRawLines.length === 0 && mucTieu.length === 0 && noiDung.length === 0 && sanPhamPre.length === 0) {
    return homeworkLines.length > 0 ? `${headerLine}\n\n${homeworkLines.join('\n')}` : headerLine;
  }

  // Parse tochucRawLines into Col 1 (Teacher/Student) and Col 2 (Products/Math solutions/Images)
  const col1Items: string[] = [];
  const col2Items: string[] = [];

  let currentTargetCol: 1 | 2 = 1;

  for (let i = 0; i < tochucRawLines.length; i++) {
    let line = tochucRawLines[i].trim();
    if (!line) continue;

    // Check if line contains a markdown table pipe separator
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Left is col1, right is col2
        const left = parts[0].replace(/^[:\-\s]+$/, '').trim();
        const right = parts.slice(1).join(' ').replace(/^[:\-\s]+$/, '').trim();
        if (left && !left.startsWith(':---')) col1Items.push(left);
        if (right && !right.startsWith(':---')) col2Items.push(right);
        continue;
      } else if (parts.length === 1) {
        line = parts[0];
      }
    }

    // Clean stray leading/trailing pipes
    line = line.replace(/^[\\|:\-\s]+/, '').replace(/[\\|:\-\s]+$/, '').trim();
    if (!line) continue;

    // Image tags ALWAYS go to Col 2 (Sản phẩm / Kết quả)
    if (/\[[\s\S]*?(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|IMG|IMAGE|HÌNH_ẢNH|HÌNH_VẼ|HÌNH|HINH|ẢNH_GỐC|ẢNH)[\s_:.\-0-9a-zA-ZÀ-ỹ*]*\]/i.test(line) ||
      (line.startsWith('![') && line.includes(')'))) {
      col2Items.push(line);
      continue;
    }

    // Check indicators for Col 1 (Steps, GV, HS, Integration)
    if (/^(?:\*\*|\*|_)?(?:-\s*)?Bước\s*[1-4]\s*:/i.test(line)) {
      currentTargetCol = 1;
      let cleanStep = line.replace(/^[\*\-\+•\s_]+/, '').replace(/[\*\s_]+$/, '').trim();
      const stepMatch = cleanStep.match(/^(Bước\s*[1-4]\s*:\s*(?:Chuyển\s*giao\s*nhiệm\s*vụ|Thực\s*hiện\s*nhiệm\s*vụ|Báo\s*cáo[,\s]+thảo\s*luận|Kết\s*luận[,\s]+nhận\s*định)|Bước\s*[1-4])[:\s]*(.*)$/i);
      if (stepMatch) {
        let label = stepMatch[1].trim();
        if (!label.endsWith(':')) label += ':';
        let rest = (stepMatch[2] || '').replace(/^[\*\s:]+/, '').replace(/[\*\s]+$/, '').trim();
        cleanStep = rest ? `**${label}** ${rest}` : `**${label}**`;
      } else {
        cleanStep = `**${cleanStep}**`;
      }
      col1Items.push(cleanStep);
      continue;
    }
    if (/^(?:\*\*|\*|_)?(?:Tích\s*hợp|Lựa\s*chọn\s*và\s*sử\s*dụng\s*công\s*nghệ\s*số|HS\s*khuyết\s*tật|Học\s*sinh\s*khuyết\s*tật)/i.test(line) ||
      /\(\s*(?:Mã\s*chỉ\s*báo|\d+\.\d+\.TC|\d+\.\d+\.NC|NLS_|AI_|GDQP_)/i.test(line)) {
      currentTargetCol = 1;
      let cleanInt = line.replace(/^[\-\+•\s_]+/, '').trim();
      if (!cleanInt.startsWith('*')) cleanInt = `*${cleanInt}`;
      col1Items.push(cleanInt);
      continue;
    }
    if (/^(?:GV|Giáo\s*viên|HS|Học\s*sinh|HĐ\s*cá\s*nhân|HĐ\s*cặp\s*đôi|HĐ\s*nhóm|Đại\s*diện)\b/i.test(line)) {
      currentTargetCol = 1;
      col1Items.push(line);
      continue;
    }

    // Check indicators for Col 2 (Exercises, Solutions, Knowledge Boxes, Formulas, Lesson Content Headings)
    if (/^(?:\*\*|\*|_)?(?:\*?\s*\d+\.\s*[A-ZÀ-Ỹ]|HĐ\s*\d+|Ví\s*dụ\s*(?:\d+|về\s*[^\n:]+)?|Luyện\s*tập\s*[\d\*]*|Vận\s*dụng\s*\d*|Bài\s*(?:tập\s*)?\d+(?:\.\d+)?|Câu\s*(?:hỏi\s*(?:phụ\s*)?)?\d*|Quy\s*tắc|Kết\s*luận|Hộp\s*kiến\s*thức|Khung\s*kiến\s*thức|Nhận\s*xét|Chú\s*ý|Tranh\s*luận|\?:|ĐS|Đ\/s|Đáp\s*số|Đáp\s*án|Lời\s*giải|Dự\s*đoán|[a-e]\)\s*[A-ZÀ-Ỹ]|Đa\s*thức|Khái\s*niệm|Tổng\s*hai|Hiệu\s*hai)\b/i.test(line)) {
      currentTargetCol = 2;
      let cleanItem = line.replace(/^[\*\-\+•\s_]+/, '').replace(/[\*\s_]+$/, '').trim();
      const itemMatch = cleanItem.match(/^(\*?\s*\d+\.\s*[^:\n]+|HĐ\s*\d+|Ví\s*dụ\s*(?:\d+|về\s*[^\n:]+)?|Luyện\s*tập\s*[\d\*]*|Vận\s*dụng\s*\d*|Bài\s*(?:tập\s*)?\d+(?:\.\d+)?|Câu\s*(?:hỏi\s*(?:phụ\s*)?)?\d*|Quy\s*tắc|Kết\s*luận|Hộp\s*kiến\s*thức|Khung\s*kiến\s*thức|Nhận\s*xét|Chú\s*ý|Tranh\s*luận|\?:|ĐS|Đ\/s|Đáp\s*số|Đáp\s*án|Lời\s*giải|Dự\s*đoán|[a-e]\)\s*[^:\n]+)[:\s]*(.*)$/i);
      if (itemMatch) {
        let label = itemMatch[1].trim().replace(/^\*+/, '').trim();
        if (!label.endsWith(':') && !/^\d+\./.test(label) && !/^[a-e]\)/.test(label)) label += ':';
        let rest = (itemMatch[2] || '').replace(/^[\*\s:]+/, '').replace(/[\*\s]+$/, '').trim();
        cleanItem = rest ? `**${label}** ${rest}` : `**${label}**`;
      } else {
        cleanItem = `**${cleanItem}**`;
      }
      col2Items.push(cleanItem);
      continue;
    }
    if (/^\$?[A-Za-z0-9_]+\s*(?::|=)/.test(line) || /^\$[^\$]+\$$/.test(line) || /^[a-e]\)\s*[\$0-9A-Za-z]/.test(line)) {
      currentTargetCol = 2;
      col2Items.push(line);
      continue;
    }

    // Otherwise append to current target column
    if (currentTargetCol === 1) {
      col1Items.push(line);
    } else {
      col2Items.push(line);
    }
  }

  const isLuyenTap = /Luyện\s*tập/i.test(headerLine);
  const isVanDung = /Vận\s*dụng/i.test(headerLine);

  // If col1 is missing 4 steps, generate standard pedagogical 4 steps
  const hasStep1 = col1Items.some(l => /Bước\s*1/i.test(l));
  const hasStep2 = col1Items.some(l => /Bước\s*2/i.test(l));
  const hasStep3 = col1Items.some(l => /Bước\s*3/i.test(l));
  const hasStep4 = col1Items.some(l => /Bước\s*4/i.test(l));

  if (!hasStep1 || !hasStep2 || !hasStep3 || !hasStep4) {
    if (isLuyenTap) {
      col1Items.unshift(
        "**Bước 1: Chuyển giao nhiệm vụ:** GV giao các bài tập luyện tập trong SGK / phiếu học tập cho HS; yêu cầu HS làm việc cá nhân kết hợp thảo luận cặp đôi.",
        "**Bước 2: Thực hiện nhiệm vụ:** HS làm bài tập vào vở ghi; GV quan sát, bao quát lớp, kịp thời hỗ trợ HS khó khăn.",
        "**Bước 3: Báo cáo, thảo luận:** Đại diện HS lên bảng chữa bài / báo cáo kết quả; các HS khác theo dõi, nhận xét, đối chiếu.",
        "**Bước 4: Kết luận, nhận định:** GV nhận xét, đánh giá kết quả, chuẩn hóa lời giải chi tiết và chốt phương pháp giải."
      );
    } else if (isVanDung) {
      col1Items.unshift(
        "**Bước 1: Chuyển giao nhiệm vụ:** GV giao bài toán thực tiễn / nhiệm vụ tình huống cho HS thực hiện.",
        "**Bước 2: Thực hiện nhiệm vụ:** HS vận dụng kiến thức bài học để nghiên cứu, trao đổi nhóm hoặc hoàn thiện nhiệm vụ.",
        "**Bước 3: Báo cáo, thảo luận:** HS nộp sản phẩm / đại diện trình bày phương án giải quyết; cả lớp cùng nhận xét, phản biện.",
        "**Bước 4: Kết luận, nhận định:** GV nhận xét, đánh giá tinh thần tự học, khả năng vận dụng sáng tạo của học sinh."
      );
    } else if (col1Items.length === 0) {
      col1Items.push(
        "**Bước 1: Chuyển giao nhiệm vụ:** GV phổ biến nhiệm vụ học tập rõ ràng, cụ thể cho học sinh.",
        "**Bước 2: Thực hiện nhiệm vụ:** HS tích cực làm việc cá nhân / nhóm dưới sự hướng dẫn, quan sát của GV.",
        "**Bước 3: Báo cáo, thảo luận:** Đại diện HS trình bày kết quả, các nhóm thảo luận, nhận xét và phản hồi.",
        "**Bước 4: Kết luận, nhận định:** GV tổng kết, đánh giá quá trình học tập và chính xác hóa kiến thức."
      );
    }
  }

  // If col2 is empty, generate standard result placeholder
  if (col2Items.length === 0) {
    if (isLuyenTap) {
      col2Items.push(
        "- Học sinh hoàn thành các bài tập luyện tập theo yêu cầu của giáo viên.",
        "- Đáp án và lời giải chi tiết, chuẩn xác của các bài tập trong SGK / phiếu bài tập."
      );
    } else if (isVanDung) {
      col2Items.push(
        "- Học sinh hoàn thành bài toán thực tế / bài tập vận dụng được giao.",
        "- Báo cáo kết quả giải quyết vấn đề hoặc sản phẩm học tập của học sinh."
      );
    } else {
      col2Items.push(
        "- Câu trả lời, sản phẩm học tập hoặc kết quả thực hiện nhiệm vụ của học sinh."
      );
    }
  }

  // Format cell contents by joining lines with <br>
  const formatCellText = (arr: string[]): string => {
    return arr
      .map(line => line.trim())
      .filter(Boolean)
      .join('<br>')
      .replace(/\r?\n/g, '<br>')
      .replace(/\|/g, ' ');
  };

  // Helper to format section a, b, c with guaranteed clean bold prefix
  const formatSectionText = (prefix: string, linesArr: string[], defaultText: string): string => {
    if (linesArr.length === 0) return defaultText;
    let combined = linesArr.join('\n');
    // Strip all occurrences of prefix, including repeated "a) Mục tiêu: a) Mục tiêu: **", "**a) Mục tiêu:**", etc.
    combined = combined.replace(/^(?:[\s\*\-#•]*[a-e]\s*[\)\.:\-]?\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Yêu\s*cầu|Tổ\s*chức\s*thực\s*hiện)\s*[:\*\-]*\s*)+/gmi, '').trim();
    combined = combined.replace(/^[:\*\-\s]+/, '').replace(/[\*\s]+$/, '').trim();
    combined = combined.replace(/\*\*+$/, '').trim();
    return combined ? `**${prefix}** ${combined}` : `**${prefix}**`;
  };

  const mucTieuText = formatSectionText('a) Mục tiêu:', mucTieu, '**a) Mục tiêu:** Đạt được yêu cầu cần đạt của hoạt động.');
  const noiDungText = formatSectionText('b) Nội dung:', noiDung, '**b) Nội dung:** Học sinh thực hiện các nhiệm vụ theo hướng dẫn của giáo viên.');

  let cDefault = isLuyenTap
    ? '**c) Sản phẩm:** Đáp án, lời giải chi tiết các bài tập luyện tập của học sinh.'
    : (isVanDung
      ? '**c) Sản phẩm:** Kết quả giải quyết bài toán/vấn đề thực tế hoặc sản phẩm học tập của học sinh.'
      : '**c) Sản phẩm:** Câu trả lời, sản phẩm học tập hoặc kết quả thực hiện nhiệm vụ của học sinh.'
    );
  const cSanPhamText = formatSectionText('c) Sản phẩm:', sanPhamPre, cDefault);
  const col1Text = formatCellText(col1Items);
  const col2Text = formatCellText(col2Items);

  const tableMd = `${headerLine}\n${mucTieuText}\n${noiDungText}\n${cSanPhamText}\n**d) Tổ chức thực hiện:**\n\n| Hoạt động của giáo viên và học sinh | Kết quả hoạt động |\n| :--- | :--- |\n| ${col1Text} | ${col2Text} |`;
  return homeworkLines.length > 0 ? `${tableMd}\n\n${homeworkLines.join('\n')}` : tableMd;
};

/**
 * Scans the entire lesson plan text and ensures every activity in Section III
 * is rendered in a clean 2-column table.
 */
export const ensureAllActivitiesInTwoColumnTable = (text: string): string => {
  if (!text) return text;

  // Pre-split all merged headings across the document
  const normalizedText = splitAllMergedHeadings(text);
  const lines = normalizedText.split(/\r?\n/);
  const resultLines: string[] = [];

  let inSectionIII = false;
  let currentActivityLines: string[] = [];
  let isCollectingActivity = false;

  const flushActivity = () => {
    if (currentActivityLines.length > 0) {
      const block = currentActivityLines.join('\n');
      const converted = convertActivityBlockToTable(block);
      resultLines.push(converted);
      currentActivityLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if Section III starts
    if (/^(?:#+\s*)?(?:\*\*)?(?:III|3|[B-C])[\.\)]\s*(?:TIẾN\s*TRÌNH|Tiến\s*trình|CÁC\s*HOẠT\s*ĐỘNG|Các\s*hoạt\s*động)/i.test(trimmed)) {
      flushActivity();
      inSectionIII = true;
      resultLines.push(line);
      continue;
    }

    // Check if an activity starts
    if (isActivityHeader(trimmed)) {
      flushActivity();
      inSectionIII = true;
      isCollectingActivity = true;
      currentActivityLines.push(line);
      continue;
    }

    // Check if homework / conclusion or next Roman numeral starts
    if (isSectionEnd(trimmed) || (/^(?:#+\s*)?(?:\*\*)?(?:IV|V|VI|4|5|6)\s*[\.\)]/i.test(trimmed) && inSectionIII)) {
      flushActivity();
      inSectionIII = false;
      isCollectingActivity = false;
      resultLines.push(line);
      continue;
    }

    if (isCollectingActivity) {
      currentActivityLines.push(line);
    } else {
      resultLines.push(line);
    }
  }

  // Flush any trailing activity block
  flushActivity();

  return resultLines.join('\n');
};
