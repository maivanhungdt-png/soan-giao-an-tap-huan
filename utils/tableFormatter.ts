/**
 * Utility to ensure all activities in a lesson plan are formatted into 
 * standard 2-column Markdown tables (| Hoạt động của giáo viên và học sinh | Kết quả hoạt động |).
 * Guarantees all activities (Khởi động, Hình thành kiến thức (các HĐ 2.1, 2.2...), Luyện tập, Vận dụng)
 * have proper a) Mục tiêu, b) Nội dung, c) Sản phẩm, and d) Tổ chức thực hiện (Bảng 2 cột).
 */

// Helper to check if a line is an Activity header
export const isActivityHeader = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) return false;
  if (trimmed === '*' || trimmed === '$*$' || trimmed === '$* $' || trimmed === '**') return false;
  const clean = trimmed
    .replace(/^[\*#\s\-\+•_]+/, '')
    .replace(/[\*#\s_]+$/, '')
    .trim();

  // Exclude subject/metadata, table headers, steps, sections, textbook exercises (HĐ1, HĐ2)
  if (/^(?:Môn\s*học\/)?Hoạt\s*động\s*giáo\s*dục/i.test(clean)) return false;
  if (/^Hoạt\s*động\s*của\s*(?:giáo\s*viên|gv)/i.test(clean)) return false;
  if (/^Hoạt\s*động\s*(?:nhóm|cá\s*nhân|cặp\s*đôi)\b/i.test(clean)) return false;
  if (/^Kết\s*quả\s*hoạt\s*động/i.test(clean)) return false;
  if (/^Tổ\s*chức\s*thực\s*hiện/i.test(clean)) return false;
  if (/^[a-e]\)\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Tổ\s*chức|Yêu\s*cầu)/i.test(clean)) return false;
  if (/^(?:Bước\s*[1-4]|\*?Tích\s*hợp|HS\s*khuyết\s*tật)/i.test(clean)) return false;
  if (/^(?:I|II|III|IV|V|VI)\.\s*(?:Mục\s*tiêu|Thiết\s*bị|Tiến\s*trình|Hướng\s*dẫn)/i.test(clean)) return false;
  if (/^[1-3]\.\s*(?:Kiến\s*thức|Năng\s*lực|Phẩm\s*chất|Giáo\s*viên|Học\s*sinh|Thiết\s*bị|Học\s*liệu)/i.test(clean)) return false;
  if (/^(?:HĐ|HD)\s*\d+/i.test(clean)) return false; // HĐ1, HĐ2 in SGK belong to Col 2

  return (
    /^(?:\d+[\.\)]\s*)?Hoạt\s*động\s*(?:\d+(?:\.\d+)?|[1-4]|Khởi\s*động|Hình\s*thành|Luyện\s*tập|Vận\s*dụng|Mở\s*đầu)\b/i.test(clean) ||
    /^(?:\d+[\.\)]\s*)?(?:Khởi\s*động|Luyện\s*tập|Vận\s*dụng)\s*[:\-\.]/i.test(clean) ||
    /^[1-4]\.\s*(?:Khởi\s*động|Hình\s*thành\s*kiến\s*thức|Luyện\s*tập|Vận\s*dụng)\b/i.test(clean)
  );
};

// Helper: Check if a line is a Parent Container Header (e.g., "2. Hoạt động 2: Hình thành kiến thức mới")
export const isParentActivityHeader = (line: string): boolean => {
  const clean = line.replace(/^[\*#\s\-\+•_]+/, '').replace(/[\*#\s_]+$/, '').trim();
  return /^(?:\d+[\.\)]\s*)?(?:Hoạt\s*động\s*2\s*:?\s*)?Hình\s*thành\s*kiến\s*thức(?:\s*mới)?\s*:?$/i.test(clean) ||
         /^(?:\d+[\.\)]\s*)?Hoạt\s*động\s*2\s*:?\s*$/i.test(clean);
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
    /^(?:IV|V|VI)\s*[\.\)]\s*(?:HƯỚNG|Hướng|DẶN|Dặn|PHỤ|Phụ|ĐÁNH|Đánh)/i.test(clean) ||
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
 * ĐẶC BIỆT: Bảo vệ tuyệt đối 100% các dòng bảng markdown (| ... |), không chèn \n vào dòng bảng.
 */
export const splitAllMergedHeadings = (text: string): string => {
  if (!text) return "";

  // Tách văn bản thành từng dòng để bảo vệ tuyệt đối các dòng bảng
  const rawLines = text.split(/\r?\n/);
  const processedLines: string[] = [];

  for (let idx = 0; idx < rawLines.length; idx++) {
    const rawLine = rawLines[idx];
    const trimmed = rawLine.trim();

    // Dọn sạch dòng rác $*$, $* $, *, | *
    if (trimmed === '*' || trimmed === '$*$' || trimmed === '$* $' || trimmed === '* |' || trimmed === '| *') {
      continue;
    }

    // Nếu là dòng bảng Markdown (| ... |) hoặc đường phân cách bảng (:--- | :---), BẢO TỒN NGUYÊN VẸN 100%
    if (trimmed.startsWith('|') || trimmed.endsWith('|') || /^:?-+:?$/.test(trimmed) || /^\|\s*:?---+\s*\|\s*:?---+\s*\|?$/.test(trimmed)) {
      processedLines.push(rawLine);
      continue;
    }

    let s = rawLine;

    // Dọn sạch ký tự hoa thị rác
    s = s.replace(/\$\s*\*\s*\$/g, '');
    s = s.replace(/\$\s*\*\s+/g, '');

    // QUAN TRỌNG: Tách các cụm in đậm dính sát nhau **A****B** thành các dòng độc lập, KHÔNG xóa thành rỗng làm dính chữ
    s = s.replace(/\*\*\s*\*\*/g, '\n\n');
    s = s.replace(/\*\*\s*[:\-]?\s*\*\*/g, ':\n\n');

    // 1. Tách các tiêu đề lớn La Mã (I. Mục tiêu, II. Thiết bị dạy học và học liệu, III. Tiến trình dạy học)
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?((?:I|1)\.\s*(?:MỤC\s*TIÊU|Mục\s*tiêu)\s*:?)(?:\*\*)?/gmi, '\n\n**I. Mục tiêu**\n\n');
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?((?:II|2)\.\s*(?:THIẾT\s*BỊ\s*DẠY\s*HỌC\s*VÀ\s*HỌC\s*LIỆU|Thiết\s*bị\s*dạy\s*học\s*và\s*học\s*liệu|THIẾT\s*BỊ\s*DẠY\s*HỌC|Thiết\s*bị\s*dạy\s*học)\s*:?)(?:\*\*)?/gmi, '\n\n**II. Thiết bị dạy học và học liệu**\n\n');
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?((?:III|3|[B-C])\.\s*(?:TIẾN\s*TRÌNH\s*DẠY\s*HỌC|Tiến\s*trình\s*dạy\s*học|CÁC\s*HOẠT\s*ĐỘNG\s*DẠY\s*HỌC|Các\s*hoạt\s*động\s*dạy\s*học|TIẾN\s*TRÌNH|Tiến\s*trình)\s*:?)(?:\*\*)?/gmi, '\n\n**III. Tiến trình dạy học**\n\n');

    // 2. Tách Hoạt động 2: Hình thành kiến thức mới
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(\*?(?:\d+[\.\)]\s*)?Hoạt\s*động\s*2\s*:\s*Hình\s*thành\s*kiến\s*thức\s*mới\s*:?)(?:\*\*)?/gmi, '\n\n**2. Hoạt động 2: Hình thành kiến thức mới**\n\n');

    // 3. Tách các Hoạt động (1. Hoạt động 1: Khởi động..., Hoạt động 2.1: ..., Hoạt động 2.2: ..., 3. Hoạt động 3: Luyện tập, 4. Hoạt động 4: Vận dụng)
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?((?:\d+[\.\)]\s*)?Hoạt\s*động\s*(?:\d+(?:\.\d+)?|[1-4]|Khởi\s*động|Hình\s*thành|Luyện\s*tập|Vận\s*dụng)\b[^\n]*?)(?=(?:\*\*)?\s*[a-e]\)\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Yêu\s*cầu|Tổ\s*chức)|$)/gmi, (_m, p1) => {
      let c = p1.replace(/\*/g, '').replace(/^#+\s*/, '').replace(/^[\-\+•\s]+/, '').trim();
      if (c.startsWith('**') && c.endsWith('**')) c = c.slice(2, -2).trim();
      return `\n\n**${c}**\n\n`;
    });

    // 4. Tách 1. Kiến thức:, 2. Năng lực:, 3. Phẩm chất: nếu dính liền
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(1\.\s*(?:Kiến\s*thức|KIẾN\s*THỨC)\s*:?)(?:\*\*)?/gmi, '\n\n**1. Kiến thức:**\n');
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(2\.\s*(?:Năng\s*lực|NĂNG\s*LỰC)\s*:?)(?:\*\*)?/gmi, '\n\n**2. Năng lực:**\n');
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(3\.\s*(?:Phẩm\s*chất|PHẨM\s*CHẤT)\s*:?)(?:\*\*)?/gmi, '\n\n**3. Phẩm chất:**\n');

    // 5. Tách các tiểu mục Năng lực: a) Năng lực đặc thù..., b) Năng lực chung:, c) Năng lực số:, d) Năng lực AI:
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?([a-e]\)\s*Năng\s*lực(?::\s*|\s*:\s*|\s+)[^\n*:]*:?)(?:\*\*)?/gmi, (_m, p1) => {
      let c = p1.replace(/\*/g, '').replace(/^[:\-\s\+•]+|[:\-\s]+$/g, '').trim();
      c = c.replace(/^Năng\s*lực:\s*/i, 'Năng lực ');
      if (!c.endsWith(':')) c += ':';
      return `\n**${c}**\n`;
    });

    // 6. Tách 1. Giáo viên:, 2. Học sinh: nếu dính liền
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(1\.\s*(?:Giáo\s*viên|Thiết\s*bị)\b\s*:?)(?:\*\*)?/gmi, '\n**1. Giáo viên:**\n');
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(2\.\s*(?:Học\s*sinh|Học\s*liệu)\b\s*:?)(?:\*\*)?/gmi, '\n**2. Học sinh:**\n');

    // 7. Tách a) Mục tiêu:, b) Nội dung:, c) Sản phẩm:, d) Tổ chức thực hiện:
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(a\)\s*(?:Mục\s*tiêu|Yêu\s*cầu)\b\s*:?)\s*(?:\*\*)?\s*/gmi, '\n\n**a) Mục tiêu:** ');
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(b\)\s*(?:Nội\s*dung)\b\s*:?)\s*(?:\*\*)?\s*/gmi, '\n\n**b) Nội dung:** ');
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(c\)\s*(?:Sản\s*phẩm|Kết\s*quả)\b\s*:?)\s*(?:\*\*)?\s*/gmi, '\n\n**c) Sản phẩm:** ');
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(d\)\s*(?:Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình)\b\s*:?)\s*(?:\*\*)?\s*/gmi, '\n\n**d) Tổ chức thực hiện:**\n');

    // 8. Tách các bước trong d) Tổ chức thực hiện (ngoài bảng) nếu bị dính dòng
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(Bước\s*[1-4]\s*:\s*(?:Chuyển\s*giao\s*nhiệm\s*vụ|Thực\s*hiện\s*nhiệm\s*vụ|Báo\s*cáo[,\s]+thảo\s*luận|Kết\s*luận[,\s]+nhận\s*định)|Bước\s*[1-4]\s*:)\s*(?:\*\*)?\s*/gmi, (_m, p1) => {
      let c = p1.replace(/\*/g, '').replace(/^[\-\+•\s]+/, '').trim();
      if (!c.endsWith(':')) c += ':';
      return `\n**${c}** `;
    });

    // 9. Tách * Hướng dẫn về nhà:, + Ôn tập kiến thức:, + Bài tập về nhà:, + Chuẩn bị bài mới:
    s = s.replace(/(?:^|[^\n])\s*(?:[\-\+•\*]\s*)?(?:\*\*)?(\*?\s*Hướng\s*dẫn\s*(?:về\s*nhà|học\s*ở\s*nhà|tự\s*học)\s*:?)(?:\*\*)?/gmi, '\n\n* Hướng dẫn về nhà:\n');
    s = s.replace(/(?:^|[^\n])\s*(?:\*\*)?([\+\-\*•]\s*Ôn\s*tập\s*kiến\s*thức\b\s*:?)(?:\*\*)?/gmi, '\n$1');
    s = s.replace(/(?:^|[^\n])\s*(?:\*\*)?([\+\-\*•]\s*Bài\s*tập\s*về\s*nhà\b\s*:?)(?:\*\*)?/gmi, '\n$1');
    s = s.replace(/(?:^|[^\n])\s*(?:\*\*)?([\+\-\*•]\s*Chuẩn\s*bị\s*bài\s*mới\b\s*:?)(?:\*\*)?/gmi, '\n$1');

    // 10. Tách *Tích hợp giáo dục hòa nhập: nếu dính dòng
    s = s.replace(/(?:^|[^\n])\s*(\*?Tích\s*hợp\s*giáo\s*dục\s*hòa\s*nhập\s*:?)/gmi, '\n$1\n');

    processedLines.push(s);
  }

  let result = processedLines.join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result;
};

// Helper: Smart split for markdown tables that ignores pipes inside math formulas ($...$)
export const smartSplitTableLine = (line: string): string[] => {
  const cells: string[] = [];
  let currentCell = '';
  let inMath = false;
  let inDoubleMath = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '\\' && nextChar === '|') {
      currentCell += '|';
      i++; // skip next |
    } else if (char === '$' && nextChar === '$') {
      inDoubleMath = !inDoubleMath;
      currentCell += '$$';
      i++; // skip next $
    } else if (char === '$' && !inDoubleMath) {
      inMath = !inMath;
      currentCell += '$';
    } else if (char === '|' && !inMath && !inDoubleMath) {
      cells.push(currentCell);
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  cells.push(currentCell);
  return cells;
};

// Helper: Chuyển đổi một nhóm các dòng bảng dữ liệu nhiều cột thành HTML Table an toàn
const convertMarkdownSubTableToHtml = (tableLines: string[]): string => {
  if (tableLines.length === 0) return '';
  const parsedRows: string[][] = [];

  for (const line of tableLines) {
    if (/^\|\s*:?---+\s*\|\s*:?---+\s*\|?$/.test(line.trim()) || /^:?-+:?$/.test(line.trim())) {
      continue;
    }
    const parts = smartSplitTableLine(line).map(p => p.trim());
    if (line.trim().startsWith('|') && parts.length > 0 && parts[0] === '') parts.shift();
    if (line.trim().endsWith('|') && parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
    if (parts.length > 0) {
      parsedRows.push(parts);
    }
  }

  if (parsedRows.length === 0) return '';

  const maxCols = Math.max(...parsedRows.map(r => r.length), 1);
  const colPercent = Math.max(Math.floor(100 / maxCols), 15);

  let html = `<table border="1" style="width: 100%; border-collapse: collapse; font-size: 11pt; margin: 8px 0;">`;
  parsedRows.forEach((row, rIdx) => {
    html += `<tr>`;
    row.forEach(cell => {
      const tag = rIdx === 0 ? 'th' : 'td';
      const bg = rIdx === 0 ? 'background-color: #f1f5f9; font-weight: bold;' : '';
      html += `<${tag} style="border: 1px solid black; padding: 6px 8px; text-align: center; width: ${colPercent}%; ${bg}">${cell}</${tag}>`;
    });
    html += `</tr>`;
  });
  html += `</table>`;
  return html;
};

/**
 * Parses and converts an activity block into a standard 2-column table.
 * Accurately sorts teacher/student actions into Column 1, and products/exercises/solutions/images into Column 2.
 */
export const convertActivityBlockToTable = (activityBlock: string): string => {
  if (!activityBlock.trim()) return activityBlock;

  // Split any merged headings first
  const normalizedBlock = splitAllMergedHeadings(activityBlock);
  const rawLines = normalizedBlock.split(/\r?\n/).map(l => l.trim()).filter(l => {
    return l !== '' && l !== '*' && l !== '$*$' && l !== '$* $' && l !== '* |' && l !== '| *';
  });
  if (rawLines.length === 0) return activityBlock;

  // Find the true activity header line
  let headerIndex = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (isActivityHeader(rawLines[i])) {
      headerIndex = i;
      break;
    }
  }

  let rawHeader = headerIndex >= 0 ? rawLines[headerIndex] : rawLines[0];
  let restLines = headerIndex >= 0 ? [...rawLines.slice(0, headerIndex), ...rawLines.slice(headerIndex + 1)] : rawLines.slice(1);

  // If header line has concatenated activity header + a) Mục tiêu / b) Nội dung, extract it
  const headerSplit = rawHeader.match(/^([\s\S]*?(?:\d+[\.\)]\s*)?Hoạt\s*động\s*(?:\d+(?:\.\d+)?|[1-4]|Khởi\s*động|Hình\s*thành|Luyện\s*tập|Vận\s*dụng)[\s\S]*?)(?=(?:\*\*)?\s*[a-e]\)\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Yêu\s*cầu|Tổ\s*chức)|$)([\s\S]*)$/i);
  if (headerSplit && headerSplit[2] && headerSplit[2].trim()) {
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

    // Ignore standalone markdown 2-column table header / separator lines in outer parse
    if (/^\|\s*:?---+\s*\|\s*:?---+\s*\|?$/.test(trimmed)) {
      state = 'tochuc';
      continue;
    }
    if (/^\|\s*Hoạt\s*động\s*của\s*(?:giáo\s*viên|gv)[^|]*\|\s*(?:Kết\s*quả|Sản\s*phẩm)[^|]*\|?$/i.test(trimmed)) {
      state = 'tochuc';
      continue;
    }

    // Strip leaked activity headers from subsections
    if (isActivityHeader(trimmed)) {
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
    if (!line || line === '*' || line === '$*$' || line === '$* $' || line === '* |' || line === '| *') continue;

    // Kiểm tra nếu là nhóm các dòng bảng markdown (| ... |)
    if (line.startsWith('|') && line.endsWith('|') && !line.includes('Hoạt động của giáo viên')) {
      const subTableLines: string[] = [line];
      while (i + 1 < tochucRawLines.length && tochucRawLines[i + 1].trim().startsWith('|') && tochucRawLines[i + 1].trim().endsWith('|')) {
        i++;
        subTableLines.push(tochucRawLines[i].trim());
      }

      // Kiểm tra xem bảng này có chứa các bước sư phạm (Bước 1-4, GV, HS, Nhiệm vụ, Tích hợp) hay không
      const hasPedagogicalContent = subTableLines.some(st => /Bước\s*[1-4]|(?:GV|HS|Giáo\s*viên|Học\s*sinh)\b|\*?Tích\s*hợp/i.test(st));

      if (hasPedagogicalContent) {
        // Đây là bảng hoạt động dạy học của GV và HS -> tách các bước sang Cột 1 và bài tập/lời giải sang Cột 2
        subTableLines.forEach(stLine => {
          if (/^\|\s*:?---+\s*\|\s*:?---+\s*\|?$/.test(stLine) || /^:?-+:?$/.test(stLine)) return;
          const cells = smartSplitTableLine(stLine).map(p => p.trim());
          if (stLine.trim().startsWith('|') && cells.length > 0 && cells[0] === '') cells.shift();
          if (stLine.trim().endsWith('|') && cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
          if (cells.length === 0) return;

          if (cells.length === 2) {
            const left = cells[0].replace(/^[:\-\s]+$/, '').trim();
            const right = cells[1].replace(/^[:\-\s]+$/, '').trim();
            if (left && !left.startsWith(':---')) col1Items.push(left);
            if (right && !right.startsWith(':---')) col2Items.push(right);
          } else if (cells.length > 2) {
            const leftParts: string[] = [];
            const rightParts: string[] = [];
            cells.forEach(c => {
              const trimmedC = c.replace(/^[:\-\s]+$/, '').trim();
              if (!trimmedC || trimmedC.startsWith(':---')) return;
              if (/^(?:\*\*|\*|_)?(?:Bước\s*[1-4]|GV|HS|Giáo\s*viên|Học\s*sinh|Nhiệm\s*vụ|\*?Tích\s*hợp)/i.test(trimmedC)) {
                leftParts.push(trimmedC);
              } else {
                rightParts.push(trimmedC);
              }
            });
            if (leftParts.length > 0) col1Items.push(leftParts.join('<br>'));
            if (rightParts.length > 0) col2Items.push(rightParts.join('<br>'));
          } else if (cells.length === 1) {
            const single = cells[0].trim();
            if (/^(?:\*\*|\*|_)?(?:Bước\s*[1-4]|GV|HS|Giáo\s*viên|Học\s*sinh|Nhiệm\s*vụ|\*?Tích\s*hợp)/i.test(single)) {
              col1Items.push(single);
            } else {
              col2Items.push(single);
            }
          }
        });
      } else {
        // Đây là bảng số liệu toán học thực tế (ví dụ: bảng giá trị x, y, bảng tần số)
        const htmlTable = convertMarkdownSubTableToHtml(subTableLines);
        if (htmlTable) {
          col2Items.push(htmlTable);
        }
      }
      continue;
    }

    // Clean stray leading/trailing pipes
    line = line.replace(/^[\\|:\-\s]+/, '').replace(/[\\|:\-\s]+$/, '').trim();
    if (!line || line === '*' || line === '$*$' || line === '$* $') continue;

    // Image tags ALWAYS go to Col 2 (Sản phẩm / Kết quả)
    if (/\[[\s\S]*?(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|IMG|IMAGE|HÌNH_ẢNH|HÌNH_VẼ|HÌNH|HINH|ẢNH_GỐC|ẢNH)[\s_:.\-0-9a-zA-ZÀ-ỹ*]*\]/i.test(line) ||
      (line.startsWith('![') && line.includes(')'))) {
      col2Items.push(line);
      continue;
    }

    // Check indicators for Col 2:
    // (Bài toán mở đầu, Tình huống mở đầu, HĐ1, Ví dụ, Luyện tập, Vận dụng, Bài 1.x, Quy tắc, Kết luận, Khung kiến thức...)
    if (/^(?:\*\*|\*|_)?(?:\*?\s*\d+\.\s*[A-ZÀ-Ỹ]|Bài\s*toán\s*mở\s*đầu|Tình\s*huống\s*mở\s*đầu|Bài\s*toán\s*khởi\s*động|Mở\s*đầu|HĐ\s*\d+|Hoạt\s*động\s*\d+|Khám\s*phá|Ví\s*dụ\s*(?:\d+|về\s*[^\n:]+)?|Luyện\s*tập\s*[\d\*]*|Thực\s*hành\s*[\d\*]*|Vận\s*dụng\s*\d*|Thử\s*thách\s*(?:nhỏ)?|Bài\s*(?:tập\s*)?\d+(?:\.\d+)?|Câu\s*(?:hỏi\s*(?:phụ\s*)?)?\d*|Quy\s*tắc|Kết\s*luận|Hộp\s*kiến\s*thức|Khung\s*kiến\s*thức|Nhận\s*xét|Chú\s*ý|Tranh\s*luận|\?:|ĐS|Đ\/s|Đáp\s*số|Đáp\s*án|Lời\s*giải|Dự\s*đoán|[a-e]\)\s*[A-ZÀ-Ỹ]|Đa\s*thức|Khái\s*niệm|Tổng\s*hai|Hiệu\s*hai|Nhân\s*hai|Nhân\s*đơn)\b/i.test(line)) {
      currentTargetCol = 2;
      let cleanItem = line.replace(/^[\*\-\+•\s_]+/, '').replace(/[\*\s_]+$/, '').trim();
      const itemMatch = cleanItem.match(/^(\*?\s*\d+\.\s*[^:\n]+|Bài\s*toán\s*mở\s*đầu|Tình\s*huống\s*mở\s*đầu|Bài\s*toán\s*khởi\s*động|Mở\s*đầu|HĐ\s*\d+|Hoạt\s*động\s*\d+|Khám\s*phá|Ví\s*dụ\s*(?:\d+|về\s*[^\n:]+)?|Luyện\s*tập\s*[\d\*]*|Thực\s*hành\s*[\d\*]*|Vận\s*dụng\s*\d*|Thử\s*thách\s*(?:nhỏ)?|Bài\s*(?:tập\s*)?\d+(?:\.\d+)?|Câu\s*(?:hỏi\s*(?:phụ\s*)?)?\d*|Quy\s*tắc|Kết\s*luận|Hộp\s*kiến\s*thức|Khung\s*kiến\s*thức|Nhận\s*xét|Chú\s*ý|Tranh\s*luận|\?:|ĐS|Đ\/s|Đáp\s*số|Đáp\s*án|Lời\s*giải|Dự\s*đoán|[a-e]\)\s*[^:\n]+)[:\s]*(.*)$/i);
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

    // Mathematical equations or formulas belong to Col 2
    if (/^\$?[A-Za-z0-9_]+\s*(?::|=)/.test(line) || /^\$[^\$]+\$$/.test(line) || /^[a-e]\)\s*[\$0-9A-Za-z]/.test(line) || /^=\s*[\$\d]/.test(line)) {
      currentTargetCol = 2;
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
    if (/^(?:GV|Giáo\s*viên|HS|Học\s*sinh|Nhiệm\s*vụ\s*\d+|HĐ\s*cá\s*nhân|HĐ\s*cặp\s*đôi|HĐ\s*nhóm|Đại\s*diện|Cả\s*lớp)\b/i.test(line)) {
      currentTargetCol = 1;
      col1Items.push(line);
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

  // Chuẩn hóa và bổ sung nội dung nếu các bước bị rỗng tiêu đề
  const enrichedCol1Items: string[] = [];
  for (let idx = 0; idx < col1Items.length; idx++) {
    let item = col1Items[idx].trim();
    if (!item) continue;

    // Bước 1
    if (/^\*\*(?:-\s*)?Bước\s*1\s*:[^\*]*\*\*[:\s]*$/i.test(item) || (/^\*\*(?:-\s*)?Bước\s*1\b/i.test(item) && item.length < 38)) {
      const next = col1Items[idx + 1] ? col1Items[idx + 1].trim() : '';
      if (!next || /^(?:\*\*|\*|_)?(?:-\s*)?Bước\s*[2-4]\s*:/i.test(next) || /^\*Tích\s*hợp/i.test(next)) {
        item = isLuyenTap
          ? "**Bước 1: Chuyển giao nhiệm vụ:** GV giao các bài tập luyện tập trong SGK / phiếu học tập cho HS; yêu cầu HS làm việc cá nhân kết hợp thảo luận cặp đôi."
          : (isVanDung
            ? "**Bước 1: Chuyển giao nhiệm vụ:** GV giao bài toán thực tiễn / nhiệm vụ tình huống cho HS thực hiện."
            : "**Bước 1: Chuyển giao nhiệm vụ:** GV phổ biến nhiệm vụ học tập rõ ràng, cụ thể cho học sinh; yêu cầu HS quan sát, suy nghĩ cá nhân.");
      }
    }

    // Bước 2
    if (/^\*\*(?:-\s*)?Bước\s*2\s*:[^\*]*\*\*[:\s]*$/i.test(item) || (/^\*\*(?:-\s*)?Bước\s*2\b/i.test(item) && item.length < 38)) {
      const next = col1Items[idx + 1] ? col1Items[idx + 1].trim() : '';
      if (!next || /^(?:\*\*|\*|_)?(?:-\s*)?Bước\s*[3-4]\s*:/i.test(next) || /^\*Tích\s*hợp/i.test(next)) {
        item = isLuyenTap
          ? "**Bước 2: Thực hiện nhiệm vụ:** HS làm bài tập vào vở ghi; GV quan sát, bao quát lớp, kịp thời hỗ trợ HS khó khăn."
          : (isVanDung
            ? "**Bước 2: Thực hiện nhiệm vụ:** HS vận dụng kiến thức bài học để nghiên cứu, trao đổi nhóm hoặc hoàn thiện nhiệm vụ."
            : "**Bước 2: Thực hiện nhiệm vụ:** HS tích cực làm việc cá nhân / nhóm dưới sự hướng dẫn, quan sát của GV.");
      }
    }

    // Bước 3
    if (/^\*\*(?:-\s*)?Bước\s*3\s*:[^\*]*\*\*[:\s]*$/i.test(item) || (/^\*\*(?:-\s*)?Bước\s*3\b/i.test(item) && item.length < 38)) {
      const next = col1Items[idx + 1] ? col1Items[idx + 1].trim() : '';
      if (!next || /^(?:\*\*|\*|_)?(?:-\s*)?Bước\s*4\s*:/i.test(next) || /^\*Tích\s*hợp/i.test(next)) {
        item = isLuyenTap
          ? "**Bước 3: Báo cáo, thảo luận:** Đại diện HS lên bảng chữa bài / báo cáo kết quả; các HS khác theo dõi, nhận xét, đối chiếu và bổ sung."
          : (isVanDung
            ? "**Bước 3: Báo cáo, thảo luận:** HS nộp sản phẩm / đại diện trình bày phương án giải quyết; cả lớp cùng nhận xét, phản biện."
            : "**Bước 3: Báo cáo, thảo luận:** Đại diện HS trình bày kết quả, các nhóm thảo luận, nhận xét và phản hồi ý kiến.");
      }
    }

    // Bước 4
    if (/^\*\*(?:-\s*)?Bước\s*4\s*:[^\*]*\*\*[:\s]*$/i.test(item) || (/^\*\*(?:-\s*)?Bước\s*4\b/i.test(item) && item.length < 38)) {
      const next = col1Items[idx + 1] ? col1Items[idx + 1].trim() : '';
      if (!next || /^\*Tích\s*hợp/i.test(next)) {
        item = isLuyenTap
          ? "**Bước 4: Kết luận, nhận định:** GV nhận xét, đánh giá kết quả, chuẩn hóa lời giải chi tiết và chốt phương pháp giải."
          : (isVanDung
            ? "**Bước 4: Kết luận, nhận định:** GV nhận xét, đánh giá tinh thần tự học, khả năng vận dụng sáng tạo của học sinh."
            : "**Bước 4: Kết luận, nhận định:** GV tổng kết, đánh giá quá trình học tập, chính xác hóa câu trả lời và chốt kiến thức.");
      }
    }

    enrichedCol1Items.push(item);
  }

  // If col1 is missing 4 steps, generate standard pedagogical 4 steps
  const hasStep1 = enrichedCol1Items.some(l => /Bước\s*1/i.test(l));
  const hasStep2 = enrichedCol1Items.some(l => /Bước\s*2/i.test(l));
  const hasStep3 = enrichedCol1Items.some(l => /Bước\s*3/i.test(l));
  const hasStep4 = enrichedCol1Items.some(l => /Bước\s*4/i.test(l));

  if (!hasStep1 || !hasStep2 || !hasStep3 || !hasStep4) {
    if (isLuyenTap) {
      if (!hasStep1) enrichedCol1Items.unshift("**Bước 1: Chuyển giao nhiệm vụ:** GV giao các bài tập luyện tập trong SGK / phiếu học tập cho HS; yêu cầu HS làm việc cá nhân kết hợp thảo luận cặp đôi.");
      if (!hasStep2) enrichedCol1Items.splice(1, 0, "**Bước 2: Thực hiện nhiệm vụ:** HS làm bài tập vào vở ghi; GV quan sát, bao quát lớp, kịp thời hỗ trợ HS khó khăn.");
      if (!hasStep3) enrichedCol1Items.push("**Bước 3: Báo cáo, thảo luận:** Đại diện HS lên bảng chữa bài / báo cáo kết quả; các HS khác theo dõi, nhận xét, đối chiếu.");
      if (!hasStep4) enrichedCol1Items.push("**Bước 4: Kết luận, nhận định:** GV nhận xét, đánh giá kết quả, chuẩn hóa lời giải chi tiết và chốt phương pháp giải.");
    } else if (isVanDung) {
      if (!hasStep1) enrichedCol1Items.unshift("**Bước 1: Chuyển giao nhiệm vụ:** GV giao bài toán thực tiễn / nhiệm vụ tình huống cho HS thực hiện.");
      if (!hasStep2) enrichedCol1Items.splice(1, 0, "**Bước 2: Thực hiện nhiệm vụ:** HS vận dụng kiến thức bài học để nghiên cứu, trao đổi nhóm hoặc hoàn thiện nhiệm vụ.");
      if (!hasStep3) enrichedCol1Items.push("**Bước 3: Báo cáo, thảo luận:** HS nộp sản phẩm / đại diện trình bày phương án giải quyết; cả lớp cùng nhận xét, phản biện.");
      if (!hasStep4) enrichedCol1Items.push("**Bước 4: Kết luận, nhận định:** GV nhận xét, đánh giá tinh thần tự học, khả năng vận dụng sáng tạo của học sinh.");
    } else {
      if (!hasStep1) enrichedCol1Items.unshift("**Bước 1: Chuyển giao nhiệm vụ:** GV phổ biến nhiệm vụ học tập rõ ràng, cụ thể cho học sinh.");
      if (!hasStep2) enrichedCol1Items.splice(1, 0, "**Bước 2: Thực hiện nhiệm vụ:** HS tích cực làm việc cá nhân / nhóm dưới sự hướng dẫn, quan sát của GV.");
      if (!hasStep3) enrichedCol1Items.push("**Bước 3: Báo cáo, thảo luận:** Đại diện HS trình bày kết quả, các nhóm thảo luận, nhận xét và phản hồi.");
      if (!hasStep4) enrichedCol1Items.push("**Bước 4: Kết luận, nhận định:** GV tổng kết, đánh giá quá trình học tập và chính xác hóa kiến thức.");
    }
  }

  col1Items.length = 0;
  col1Items.push(...enrichedCol1Items);

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
      .filter(l => Boolean(l) && l !== '*' && l !== '$*$' && l !== '$* $' && l !== '* |' && l !== '| *')
      .join('<br>')
      .replace(/\r?\n/g, '<br>')
      .replace(/(?<!<[^>]*)\|(?![^<]*>)/g, ' '); // Thay | thành space nếu không nằm trong thẻ HTML
  };

  // Helper to format section a, b, c with guaranteed clean bold prefix
  const formatSectionText = (prefix: string, linesArr: string[], defaultText: string): string => {
    if (linesArr.length === 0) return defaultText;
    let combined = linesArr.join('\n');
    // Strip all occurrences of prefix, including repeated "a) Mục tiêu: a) Mục tiêu: **", "**a) Mục tiêu:**", etc.
    combined = combined.replace(/^(?:[\s\*\-#•]*[a-e]\s*[\)\.:\-]?\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Yêu\s*cầu|Tổ\s*chức\s*thực\s*hiện)\s*[:\*\-]*\s*)+/gmi, '').trim();
    // Strip any leaked activity headers inside section text
    combined = combined.replace(/^(?:\d+[\.\)]\s*)?Hoạt\s*động\s*(?:\d+(?:\.\d+)?|[1-4]|Khởi\s*động|Hình\s*thành|Luyện\s*tập|Vận\s*dụng)[^\n:]*:?\s*/gmi, '').trim();
    combined = combined.replace(/^[:\*\-\s]+/, '').replace(/[\*\s]+$/, '').trim();
    combined = combined.replace(/\*\*+$/, '').trim();

    // Check if combined text has multiple lines or bullet points
    const subLines = combined.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (subLines.length > 1) {
      const formattedSubLines = subLines.map(l => {
        let cleanL = l.replace(/^[\*\s]+|[\*\s]+$/g, '').trim();
        if (!cleanL.startsWith('-') && !cleanL.startsWith('+') && !cleanL.startsWith('*')) {
          cleanL = `- ${cleanL}`;
        }
        return cleanL;
      });
      return `**${prefix}**\n${formattedSubLines.join('\n')}`;
    }

    // Single line: strip bullet dash if present to match standard inline format
    let cleanSingle = combined.replace(/^[\-\+•\s]+/, '').trim();
    return cleanSingle ? `**${prefix}** ${cleanSingle}` : `**${prefix}**`;
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

  const tableMd = `${headerLine}\n\n${mucTieuText}\n\n${noiDungText}\n\n${cSanPhamText}\n\n**d) Tổ chức thực hiện:**\n\n| Hoạt động của giáo viên và học sinh | Kết quả hoạt động |\n| :--- | :--- |\n| ${col1Text} | ${col2Text} |`;
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

  // Check if document contains sub-activities like Hoạt động 2.1
  const hasSubActivities = lines.some(l => /Hoạt\s*động\s*2\.\d+/i.test(l));

  const flushActivity = () => {
    if (currentActivityLines.length > 0) {
      const block = currentActivityLines.join('\n');
      const firstLine = currentActivityLines[0].trim();
      
      // If it's the parent container "2. Hoạt động 2: Hình thành kiến thức mới" and we have sub-activities (2.1, 2.2...)
      if (hasSubActivities && isParentActivityHeader(firstLine)) {
        const cleanParent = firstLine.replace(/^[\*#\s]+/, '').replace(/[\*#\s]+$/, '').trim();
        resultLines.push(`**${cleanParent}**`);
      } else {
        const converted = convertActivityBlockToTable(block);
        resultLines.push(converted);
      }
      currentActivityLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip garbage lines
    if (trimmed === '*' || trimmed === '$*$' || trimmed === '$* $' || trimmed === '* |' || trimmed === '| *') {
      continue;
    }

    // Check if Section III starts
    if (/^(?:#+\s*)?(?:[\s\-\+•\*]*)(?:\*\*)?(?:III|3|[B-C])[\.\)]\s*(?:TIẾN\s*TRÌNH|Tiến\s*trình|CÁC\s*HOẠT\s*ĐỘNG|Các\s*hoạt\s*động)/i.test(trimmed)) {
      flushActivity();
      inSectionIII = true;
      const cleanSec3 = trimmed.replace(/^[\*#\s\-\+•_]+/, '').replace(/[\*#\s_]+$/, '').trim();
      resultLines.push(`**${cleanSec3}**`);
      continue;
    }

    // Do NOT collect or convert activities outside Section III (protect Section I and Section II)
    if (!inSectionIII) {
      resultLines.push(line);
      continue;
    }

    // Check if an activity starts
    if (isActivityHeader(trimmed)) {
      flushActivity();
      
      // If this is the parent header "2. Hoạt động 2: Hình thành kiến thức mới" and sub-activities exist
      if (hasSubActivities && isParentActivityHeader(trimmed)) {
        const cleanParent = trimmed.replace(/^[\*#\s\-\+•_]+/, '').replace(/[\*#\s_]+$/, '').trim();
        resultLines.push(`**${cleanParent}**`);
        isCollectingActivity = false;
        continue;
      }

      isCollectingActivity = true;
      currentActivityLines.push(line);
      continue;
    }

    // Check if homework / conclusion or next Roman numeral starts
    if (isSectionEnd(trimmed) || (/^(?:#+\s*)?(?:\*\*)?(?:IV|V|VI)\s*[\.\)]/i.test(trimmed) && inSectionIII)) {
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
