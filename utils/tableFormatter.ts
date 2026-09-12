/**
 * Utility to ensure all activities in a lesson plan are formatted into 
 * standard 2-column Markdown tables (| Hoạt động của giáo viên và học sinh | Kết quả hoạt động |).
 * Specifically guarantees Hoạt động 3 (Luyện tập) and Hoạt động 4 (Vận dụng) 
 * are never left outside the table and preserves c) Sản phẩm and d) Tổ chức thực hiện.
 */

// Helper to check if a line is an Activity header
export const isActivityHeader = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const clean = trimmed
    .replace(/^#+\s*/, '')
    .replace(/^\*\*|\*\*$/g, '')
    .trim();
  return /^(?:\d+[\.\)]\s*)?Hoạt\s*động\s*(?:\d+|[1-4]|[A-Za-z]|Khởi\s*động|Hình\s*thành|Luyện\s*tập|Vận\s*dụng|Mở\s*đầu)/i.test(clean);
};

// Helper to check if a line is the start of Section IV or Homework section
export const isSectionEnd = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const clean = trimmed
    .replace(/^#+\s*/, '')
    .replace(/^\*\*|\*\*$/g, '')
    .trim();
  return (
    /^\*?\s*Hướng\s*dẫn\s*(?:về\s*nhà|học\s*ở\s*nhà|tự\s*học)/i.test(clean) ||
    /^(?:IV|4)\s*[\.\)]\s*(?:HƯỚNG|Hướng|DẶN|Dặn|PHỤ|Phụ)/i.test(clean) ||
    /^(?:Dặn\s*dò|Giao\s*bài\s*về\s*nhà)/i.test(clean)
  );
};

// Helper to detect if an activity block already has a 2-column activity table
export const hasActivityTable = (block: string): boolean => {
  return /\|[^\n]*(?:hoạt\s*động\s*của\s*(?:giáo\s*viên|gv)|tổ\s*chức\s*thực\s*hiện)[^\n]*\|[^\n]*(?:kết\s*quả\s*hoạt\s*động|kết\s*quả|sản\s*phẩm)[^\n]*\|/i.test(block);
};

/**
 * Converts an activity block that is outside the table into a standard 2-column table.
 */
export const convertActivityBlockToTable = (activityBlock: string): string => {
  if (hasActivityTable(activityBlock)) {
    return activityBlock;
  }

  const lines = activityBlock.split('\n');
  if (lines.length === 0) return activityBlock;

  const headerLine = lines[0].trim();
  const restLines = lines.slice(1);

  let mucTieu: string[] = [];
  let noiDung: string[] = [];
  let toChuc: string[] = [];
  let sanPham: string[] = [];

  // State machine to parse a, b, c, d
  type SectionType = 'pre' | 'muctieu' | 'noidung' | 'tochuc' | 'sanpham';
  let currentSection: SectionType = 'pre';

  for (let i = 0; i < restLines.length; i++) {
    const raw = restLines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Check section transitions
    if (/^(?:\*\*|\*|_)?a\s*[\)\.:\-]\s*(?:Mục\s*tiêu|Yêu\s*cầu)/i.test(trimmed)) {
      currentSection = 'muctieu';
      mucTieu.push(trimmed);
      continue;
    }
    if (/^(?:\*\*|\*|_)?b\s*[\)\.:\-]\s*(?:Nội\s*dung)/i.test(trimmed)) {
      currentSection = 'noidung';
      noiDung.push(trimmed);
      continue;
    }
    if (/^(?:\*\*|\*|_)?(?:c|d)\s*[\)\.:\-]\s*(?:Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình)/i.test(trimmed) ||
        /^(?:\*\*|\*|_)?Tổ\s*chức\s*thực\s*hiện\s*:?/i.test(trimmed)) {
      currentSection = 'tochuc';
      continue;
    }
    if (/^(?:\*\*|\*|_)?(?:c|d)\s*[\)\.:\-]\s*(?:Sản\s*phẩm|Kết\s*quả)/i.test(trimmed) ||
        /^(?:\*\*|\*|_)?Sản\s*phẩm\s*(?:học\s*tập)?\s*:?/i.test(trimmed)) {
      currentSection = 'sanpham';
      continue;
    }

    // Step indicators (Bước 1..4)
    if (/^(?:\*\*|\*|_)?(?:-\s*)?Bước\s*[1-4]\s*:/i.test(trimmed)) {
      currentSection = 'tochuc';
      toChuc.push(trimmed);
      continue;
    }

    // Explicit exercises / solutions indicators when in tochuc
    if (currentSection === 'tochuc' && /^(?:\*\*|\*|_)?(?:Lời\s*giải|Đáp\s*án|Bài\s*tập\s*\d+|Bài\s*\d+|Câu\s*\d+)\s*:/i.test(trimmed)) {
      currentSection = 'sanpham';
      sanPham.push(trimmed);
      continue;
    }

    // Append to current active section
    switch (currentSection) {
      case 'muctieu':
        mucTieu.push(trimmed);
        break;
      case 'noidung':
        noiDung.push(trimmed);
        break;
      case 'tochuc':
        toChuc.push(trimmed);
        break;
      case 'sanpham':
        sanPham.push(trimmed);
        break;
      default:
        // Before section a: could be general note or mục tiêu
        if (/mục\s*tiêu/i.test(trimmed)) {
          mucTieu.push(trimmed);
          currentSection = 'muctieu';
        } else {
          noiDung.push(trimmed);
        }
        break;
    }
  }

  const isLuyenTap = /Luyện\s*tập/i.test(headerLine);
  const isVanDung = /Vận\s*dụng/i.test(headerLine);

  // If toChuc is missing 4 steps, generate pedagogical 4 steps
  const hasStep1 = toChuc.some(l => /Bước\s*1/i.test(l));
  const hasStep2 = toChuc.some(l => /Bước\s*2/i.test(l));
  const hasStep3 = toChuc.some(l => /Bước\s*3/i.test(l));
  const hasStep4 = toChuc.some(l => /Bước\s*4/i.test(l));

  if (!hasStep1 || !hasStep2 || !hasStep3 || !hasStep4) {
    if (isLuyenTap) {
      toChuc = [
        "**Bước 1: Chuyển giao nhiệm vụ:** GV giao các bài tập luyện tập trong SGK / phiếu học tập cho HS; yêu cầu HS làm việc cá nhân kết hợp thảo luận cặp đôi.",
        "**Bước 2: Thực hiện nhiệm vụ:** HS làm bài tập vào vở ghi; GV quan sát, bao quát lớp, kịp thời phát hiện khó khăn để hỗ trợ, hướng dẫn HS.",
        "**Bước 3: Báo cáo, thảo luận:** Đại diện HS lên bảng chữa bài / báo cáo kết quả; các HS khác theo dõi, nhận xét, đối chiếu bài làm.",
        "**Bước 4: Kết luận, nhận định:** GV nhận xét thái độ làm việc, đánh giá kết quả, chuẩn hóa lời giải chi tiết và chốt phương pháp giải."
      ];
    } else if (isVanDung) {
      toChuc = [
        "**Bước 1: Chuyển giao nhiệm vụ:** GV giao bài toán thực tiễn / nhiệm vụ tình huống / thử thách kiến thức cho HS thực hiện.",
        "**Bước 2: Thực hiện nhiệm vụ:** HS vận dụng kiến thức bài học để nghiên cứu, trao đổi nhóm hoặc hoàn thiện nhiệm vụ ở lớp / tại nhà.",
        "**Bước 3: Báo cáo, thảo luận:** HS nộp sản phẩm / đại diện trình bày phương án giải quyết vào tiết học tiếp theo; cả lớp cùng nhận xét, phản biện.",
        "**Bước 4: Kết luận, nhận định:** GV nhận xét, đánh giá tinh thần tự học, khả năng vận dụng sáng tạo và tuyên dương các sản phẩm tốt."
      ];
    } else {
      toChuc = [
        "**Bước 1: Chuyển giao nhiệm vụ:** GV phổ biến nhiệm vụ học tập rõ ràng, cụ thể cho học sinh.",
        "**Bước 2: Thực hiện nhiệm vụ:** HS tích cực làm việc cá nhân / nhóm dưới sự hướng dẫn, quan sát của GV.",
        "**Bước 3: Báo cáo, thảo luận:** Đại diện HS trình bày kết quả, các nhóm thảo luận, nhận xét và phản hồi.",
        "**Bước 4: Kết luận, nhận định:** GV tổng kết, đánh giá quá trình học tập và chính xác hóa kiến thức."
      ];
    }
  }

  // If sanPham is empty, generate appropriate content based on type
  if (sanPham.length === 0) {
    if (isLuyenTap) {
      sanPham = [
        "- Học sinh hoàn thành các bài tập luyện tập theo yêu cầu của giáo viên.",
        "- Đáp án và lời giải chi tiết, chuẩn xác của các bài tập trong SGK / phiếu bài tập."
      ];
    } else if (isVanDung) {
      sanPham = [
        "- Học sinh hoàn thành bài toán thực tế / bài tập vận dụng được giao.",
        "- Báo cáo kết quả giải quyết vấn đề hoặc sản phẩm sáng tạo của học sinh."
      ];
    } else {
      sanPham = [
        "- Câu trả lời, sản phẩm học tập hoặc kết quả thực hiện nhiệm vụ của học sinh."
      ];
    }
  }

  // Helper to format text lines inside a single table cell (convert line breaks to <br>)
  const formatCellText = (arr: string[]): string => {
    return arr
      .map(line => line.trim())
      .filter(Boolean)
      .join('<br>')
      .replace(/\|/g, '\\|'); // escape pipe inside markdown cells
  };

  const toChucCell = formatCellText(toChuc);
  const sanPhamCell = formatCellText(sanPham);

  // Format mục tiêu, nội dung, sản phẩm, tổ chức thực hiện
  const mucTieuText = mucTieu.length > 0 
    ? mucTieu.join('\n') 
    : '**a) Mục tiêu:** Đạt được yêu cầu cần đạt của hoạt động.';
  const noiDungText = noiDung.length > 0 
    ? noiDung.join('\n') 
    : '**b) Nội dung:** Học sinh thực hiện các nhiệm vụ theo hướng dẫn của giáo viên.';
  
  let cSanPhamHeader = '';
  if (isLuyenTap) {
    cSanPhamHeader = '**c) Sản phẩm:** Đáp án, lời giải chi tiết các bài tập luyện tập của học sinh.';
  } else if (isVanDung) {
    cSanPhamHeader = '**c) Sản phẩm:** Kết quả giải quyết bài toán/vấn đề thực tế hoặc sản phẩm học tập của học sinh.';
  } else {
    cSanPhamHeader = '**c) Sản phẩm:** Câu trả lời, sản phẩm học tập hoặc kết quả thực hiện nhiệm vụ của học sinh.';
  }

  return `${headerLine}\n${mucTieuText}\n${noiDungText}\n${cSanPhamHeader}\n**d) Tổ chức thực hiện:**\n\n| Hoạt động của giáo viên và học sinh | Kết quả hoạt động |\n| :--- | :--- |\n| ${toChucCell} | ${sanPhamCell} |`;
};

/**
 * Scans the entire lesson plan text and ensures every activity in Section III
 * is rendered in a 2-column table.
 */
export const ensureAllActivitiesInTwoColumnTable = (text: string): string => {
  if (!text) return text;

  const lines = text.split('\n');
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

    // Check if an activity starts (prioritize before checking section end)
    if (isActivityHeader(trimmed)) {
      flushActivity();
      inSectionIII = true;
      isCollectingActivity = true;
      currentActivityLines.push(line);
      continue;
    }

    // Check if homework/conclusion or next Roman numeral starts
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
