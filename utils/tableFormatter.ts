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

  // 5. Mã chỉ báo NLS, AI, GDQP, STEM: (Mã chỉ báo: ...), (NLS: ...), (AI: ...)
  const hasIndicatorCode = (
    /\(\s*(?:Mã\s*chỉ\s*báo\s*:?\s*[\w\.\s]+|\d+\.\d+\.(?:TC|NC|CB)\s*\w+|NLS[_:\s][^)]+|AI[_:\s][^)]+|GDQP[_:\s][^)]+|STEM[_:\s][^)]+)\s*\)/i.test(trimmed) ||
    /Mã\s*chỉ\s*báo\s*:\s*[\w\.\s]+/i.test(trimmed) ||
    /\((?:NLS|AI)\s*:\s*[\w\.\s]+\)/i.test(trimmed)
  );

  return hasIndicatorCode;
};

// Helper to split any concatenated headings merged into a single line
export const splitAllMergedHeadings = (text: string): string => {
  if (!text) return "";
  let s = text;

  // 0. Clean any raw double asterisks artifacts like "** **", "****", "** : **"
  s = s.replace(/\*\*\s*\*\*/g, '');
  s = s.replace(/(\*\*[^\*\n\r]+:\*\*)\s*\*\*/g, '$1');
  s = s.replace(/([a-zA-Z0-9À-ỹ\)]+:)\s*\*\*(?!\w)/g, '$1');
  s = s.replace(/\*\*\s*[:\-]?\s*\*\*/g, '**');

  // 1. Tách I. Mục tiêu + 1. Kiến thức: / 2. Năng lực: / II. Thiết bị...
  s = s.replace(/(?:\*\*)?((?:I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s*(?:MỤC\s*TIÊU|Mục\s*tiêu|THIẾT\s*BỊ\s*DẠY\s*HỌC[^\n*]*|Thiết\s*bị\s*dạy\s*học[^\n*]*|TIẾN\s*TRÌNH\s*DẠY\s*HỌC[^\n*]*|Tiến\s*trình\s*dạy\s*học[^\n*]*):?)(?:\*\*)?[ \t\*\:]*([1-3]\.\s*(?:Kiến\s*thức|Năng\s*lực|Phẩm\s*chất|Thiết\s*bị|Giáo\s*viên|Học\s*sinh):?)/gmi, (_m, p1, p2) => {
    const clean1 = p1.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[:\*\-\s]+/, '').replace(/[:\*\-\s]+$/, '').trim();
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[:\*\-\s]+/, '').replace(/[:\*\-\s]+$/, '').trim();
    return `**${clean1}**\n\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 2. Tách III. Tiến trình dạy học + 1. Hoạt động 1: Khởi động / Hoạt động 1...
  s = s.replace(/(?:\*\*)?((?:III|3|[B-C])\.\s*(?:TIẾN\s*TRÌNH\s*DẠY\s*HỌC|Tiến\s*trình\s*dạy\s*học|CÁC\s*HOẠT\s*ĐỘNG|Các\s*hoạt\s*động)[^\n*]*?:?)(?:\*\*)?[ \t\*\:]*(\*?(?:\d+[\.\)]\s*)?Hoạt\s*động\s*1\b[^\n*]*?:?)/gmi, (_m, p1, p2) => {
    const clean1 = p1.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[:\*\-\s]+/, '').replace(/[:\*\-\s]+$/, '').trim();
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[:\*\-\s]+/, '').replace(/[:\*\-\s]+$/, '').trim();
    return `**${clean1}**\n\n**${clean2}**`;
  });

  // 3. Tách 2. Năng lực: + a) Năng lực đặc thù... (e.g. "2. Năng lực a) Năng lực đặc thù môn Toán:")
  s = s.replace(/(?:\*\*)?(2\.\s*Năng\s*lực:?)(?:\*\*)?[ \t\*\:\-]*(?:\*\*)?([a-e]\)\s*Năng\s*lực[^\n*]*?:?)/gmi, (_m, p1, p2) => {
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[:\*\-\s]+/, '').replace(/[:\*\-\s]+$/, '').trim();
    return `**2. Năng lực:**\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 3b. Tách a) Năng lực đặc thù... + b) Năng lực chung:
  s = s.replace(/([a-e]\)\s*Năng\s*lực\s*(?:đặc\s*thù[^\n*:]*|chung[^\n*:]*):?[^\n*]*?)(?:\*\*)?[ \t\*\:]+([b-e]\)\s*Năng\s*lực[^\n*]*?:?)/gmi, (_m, p1, p2) => {
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[:\*\-\s]+/, '').replace(/[:\*\-\s]+$/, '').trim();
    return `${p1.trim()}\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 3c. Tách b) Năng lực chung:... + c) Năng lực số... / d) Năng lực AI...
  s = s.replace(/([b-e]\)\s*Năng\s*lực\s*chung:?[^\n*]*?)(?:\*\*)?[ \t\*\:]+([c-e]\)\s*Năng\s*lực[^\n*]*?:?)/gmi, (_m, p1, p2) => {
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[:\*\-\s]+/, '').replace(/[:\*\-\s]+$/, '').trim();
    return `${p1.trim()}\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 3d. Tách c) Năng lực số... + d) Năng lực AI...
  s = s.replace(/([c-e]\)\s*Năng\s*lực\s*(?:số|NLS)[^\n*:]*:?[^\n*]*?)(?:\*\*)?[ \t\*\:]+([d-e]\)\s*Năng\s*lực[^\n*]*?:?)/gmi, (_m, p1, p2) => {
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[:\*\-\s]+/, '').replace(/[:\*\-\s]+$/, '').trim();
    return `${p1.trim()}\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 3e. Tách 3. Phẩm chất: + Chăm chỉ / - Chăm chỉ / *Tích hợp giáo dục hòa nhập:
  s = s.replace(/(?:\*\*)?(3\.\s*Phẩm\s*chất:?)(?:\*\*)?[ \t\*\:]*([ \t]*[\-\+•\*]?\s*(?:Chăm\s*chỉ|Yêu\s*nước|Nhân\s*ái|Trung\s*thực|Trách\s*nhiệm|\*Tích\s*hợp))/gmi, '**$1**\n$2');

  // 3f. Tách *Tích hợp giáo dục hòa nhập: + - HS khuyết tật...
  s = s.replace(/(\*?Tích\s*hợp\s*giáo\s*dục\s*hòa\s*nhập:?)[ \t\*\:]*([ \t]*[\-\+•\*]?\s*HS\s*khuyết\s*tật[^\n]*)/gmi, '$1\n$2');

  // 4. Tách II. Thiết bị dạy học và học liệu + 1. Giáo viên:
  s = s.replace(/(?:\*\*)?(II\.\s*Thiết\s*bị\s*dạy\s*học[^\n*:]*:?)(?:\*\*)?[ \t\*\:]*(1\.\s*Giáo\s*viên:?|1\.\s*Thiết\s*bị:?)/gmi, (_m, p1, p2) => {
    const clean1 = p1.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    return `**${clean1}**\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 5. Tách 1. Giáo viên:... + 2. Học sinh:
  s = s.replace(/(?:\*\*)?(1\.\s*(?:Giáo\s*viên|Thiết\s*bị)[^\n*]*?)(?:\*\*)?[ \t\n\*\:]+(2\.\s*(?:Học\s*sinh|Học\s*liệu):?)/gmi, (_m, p1, p2) => {
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    return `${p1.trim()}\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 6. 2. Học sinh missing colon / bold:
  s = s.replace(/(?:^|\n)\s*(?:\*\*)?(2\.\s*Học\s*sinh)(?:\*\*)?[ \t]*[:\-]?\s*(?=[A-Z0-9À-Ỹ])/gmi, '\n**$1:** ');

  // 7. Tách Hoạt động 2: Hình thành kiến thức mới + Hoạt động 2.1: ...
  s = s.replace(/(?:\*\*)?((?:\d+[\.\)]\s*)?Hoạt\s*động\s*2\s*:\s*Hình\s*thành\s*kiến\s*thức\s*mới:?)(?:\*\*)?[ \t\*\:]*(Hoạt\s*động\s*2\.\d+[^\n*]*?:?)/gmi, (_m, p1, p2) => {
    const clean1 = p1.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    return `**${clean1}**\n\n**${clean2}**`;
  });

  // 7b. Tách Hoạt động 2.1... + Hoạt động 2.2... + Hoạt động 2.3...
  s = s.replace(/((?:Hoạt\s*động\s*2\.\d+[^:\n]*:[^\n]*?))[ \t\*\:]+(Hoạt\s*động\s*2\.\d+[^\n*]*?:?)/gmi, (_m, p1, p2) => {
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    return `${p1.trim()}\n\n**${clean2}**`;
  });

  // 8. Tách Hoạt động header + a) Mục tiêu: / b) Nội dung:
  // Khớp chính xác tiêu đề hoạt động với bất kỳ từ ngữ tiếng Việt nào (ví dụ: "1. Hoạt động 1: Khởi độnga) Mục tiêu:", "Hoạt động 2.1: Phân tích đa thức...a) Mục tiêu:")
  s = s.replace(/(?:\*\*)?((?:\d+[\.\)]\s*)?Hoạt\s*động\s*(?:\d+(?:\.\d+)?|[1-4]|Khởi\s*động|Hình\s*thành|Luyện\s*tập|Vận\s*dụng)[^\n*]*?)(?:\*\*)?[ \t\*\:]*([a-e]\)\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Yêu\s*cầu|Tổ\s*chức)[^\n]*)/gmi, (_m, p1, p2) => {
    const clean1 = p1.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[:\*\-\s]+/, '').replace(/[:\*\-\s]+$/, '').trim();
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    return `**${clean1}**\n**${clean2}**`;
  });

  // 9. Tách a) Mục tiêu:... + b) Nội dung: ...
  s = s.replace(/([a-e]\)\s*(?:Mục\s*tiêu|Yêu\s*cầu)[^\n*]+?)(?:\*\*)?[ \t\*\:]+([b-e]\)\s*Nội\s*dung:?)/gmi, (_m, p1, p2) => {
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    return `${p1.trim()}\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 10. Tách b) Nội dung:... + c) Sản phẩm: ...
  s = s.replace(/([b-e]\)\s*Nội\s*dung[^\n*]+?)(?:\*\*)?[ \t\*\:]+([c-e]\)\s*Sản\s*phẩm:?)/gmi, (_m, p1, p2) => {
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    return `${p1.trim()}\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 11. Tách c) Sản phẩm:... + d) Tổ chức thực hiện: ...
  s = s.replace(/([c-e]\)\s*Sản\s*phẩm[^\n*]+?)(?:\*\*)?[ \t\*\:]+([d-e]\)\s*Tổ\s*chức\s*thực\s*hiện:?)/gmi, (_m, p1, p2) => {
    const clean2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    return `${p1.trim()}\n**${clean2.endsWith(':') ? clean2 : clean2 + ':'}**`;
  });

  // 12. Tách * Hướng dẫn về nhà + - Ôn tập kiến thức / - Bài tập về nhà / - Chuẩn bị bài mới
  s = s.replace(/(\*?\s*Hướng\s*dẫn\s*(?:về\s*nhà|học\s*ở\s*nhà|tự\s*học):?)[ \t\*\:]*([ \t]*[\+\-\*•]\s*(?:Ôn\s*tập|Bài\s*tập|Chuẩn\s*bị)[^\n]*)/gmi, (_m, p1, p2) => {
    return `* Hướng dẫn về nhà:\n${p2.trim()}`;
  });
  s = s.replace(/([\+\-\*•]\s*Ôn\s*tập\s*kiến\s*thức:?[^\n*]*?)[ \t\*\:]+([\+\-\*•]\s*Bài\s*tập\s*về\s*nhà[^\n]*)/gmi, '$1\n$2');
  s = s.replace(/([\+\-\*•]\s*Bài\s*tập\s*về\s*nhà:?[^\n*]*?)[ \t\*\:]+([\+\-\*•]\s*Chuẩn\s*bị\s*bài\s*mới[^\n]*)/gmi, '$1\n$2');

  // 13. Remove any trailing ** on headings or lines
  s = s.replace(/(\*\*[^\*\n\r]+:\*\*)\s*\*\*/g, '$1');
  s = s.replace(/([a-zA-Z0-9À-ỹ\)]+:)\s*\*\*(?!\w)/g, '$1');
  s = s.replace(/([a-zA-Z0-9À-ỹ\)]+)\.\*\*/g, '$1.');

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

    // Check indicators for Col 2 (Exercises, Solutions, Knowledge Boxes, Formulas)
    if (/^(?:\*\*|\*|_)?(?:\d+\.\s*[A-ZÀ-Ỹ]|HĐ\s*\d+|Ví\s*dụ\s*(?:\d+|về\s*[^\n:]+)?|Luyện\s*tập\s*[\d\*]*|Vận\s*dụng\s*\d*|Bài\s*(?:tập\s*)?\d+(?:\.\d+)?|Câu\s*(?:hỏi\s*(?:phụ\s*)?)?\d*|Quy\s*tắc|Kết\s*luận|Hộp\s*kiến\s*thức|Khung\s*kiến\s*thức|Nhận\s*xét|Chú\s*ý|Tranh\s*luận|\?:|ĐS|Đ\/s|Đáp\s*số|Đáp\s*án|Lời\s*giải|Dự\s*đoán)\b/i.test(line)) {
      currentTargetCol = 2;
      let cleanItem = line.replace(/^[\*\-\+•\s_]+/, '').replace(/[\*\s_]+$/, '').trim();
      const itemMatch = cleanItem.match(/^(\d+\.\s*[^:\n]+|HĐ\s*\d+|Ví\s*dụ\s*(?:\d+|về\s*[^\n:]+)?|Luyện\s*tập\s*[\d\*]*|Vận\s*dụng\s*\d*|Bài\s*(?:tập\s*)?\d+(?:\.\d+)?|Câu\s*(?:hỏi\s*(?:phụ\s*)?)?\d*|Quy\s*tắc|Kết\s*luận|Hộp\s*kiến\s*thức|Khung\s*kiến\s*thức|Nhận\s*xét|Chú\s*ý|Tranh\s*luận|\?:|ĐS|Đ\/s|Đáp\s*số|Đáp\s*án|Lời\s*giải|Dự\s*đoán)[:\s]*(.*)$/i);
      if (itemMatch) {
        let label = itemMatch[1].trim();
        if (!label.endsWith(':') && !/^\d+\./.test(label)) label += ':';
        let rest = (itemMatch[2] || '').replace(/^[\*\s:]+/, '').replace(/[\*\s]+$/, '').trim();
        cleanItem = rest ? `**${label}** ${rest}` : `**${label}**`;
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
