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
    /^(?:Người\s*kiểm\s*tra|Người\s*xây\s*dựng|Ký\s*duyệt)/i.test(clean)
  );
};

// Helper: Kiểm tra chính xác một dòng có phải là dòng tích hợp cần bôi đỏ (RED) hay không
export const isIntegrationLine = (text: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Tuyệt đối không bôi đỏ các tiêu đề mục, bước, bài tập, lời giải, hay hướng dẫn về nhà
  if (/^[\*\-\+•\s#]*(?:Phần|Chương|Bài\s*\d+|[I|V|X]+\.|\d+\.\s*(?:Mục\s*tiêu|Năng\s*lực|Phẩm\s*chất|Thiết\s*bị|Tiến\s*trình|Hoạt\s*động|Giáo\s*viên|Học\s*sinh|Ôn\s*tập|Bài\s*tập|Chuẩn\s*bị)|Hoạt\s*động\s*\d+|Hướng\s*dẫn\s*(?:về\s*nhà|tự\s*học)|Bước\s*[1-4]|HĐ\s*\d+|Ví\s*dụ|Luyện\s*tập|Vận\s*dụng|Bài\s*\d+|Câu\s*\d+|Quy\s*tắc|Kết\s*luận|Nhận\s*xét|Chú\s*ý|[a-d]\)\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Tổ\s*chức))/i.test(trimmed)) {
    return false;
  }

  // Phải khớp các từ khóa tích hợp chuẩn hoặc mã chỉ báo
  const hasIntegrationKeyword = (
    /^[\*\-\+•\s]*(?:Tích\s*hợp\s+(?:năng\s*lực\s*số|năng\s*lực\s*ai|ai|stem|gdqp|an\s*ninh\s*quốc\s*phòng|giáo\s*dục\s*hòa\s*nhập|bảo\s*vệ\s*môi\s*trường)|HS\s*khuyết\s*tật|Học\s*sinh\s*khuyết\s*tật|Lựa\s*chọn\s*và\s*sử\s*dụng\s*công\s*nghệ\s*số|Sử\s*dụng\s*công\s*nghệ\s*số|Ứng\s*dụng\s*(?:công\s*nghệ\s*số|cntt|ai))/i.test(trimmed) ||
    /(?:tích\s*hợp\s+(?:năng\s*lực\s*số|năng\s*lực\s*ai|ai|stem|gdqp|giáo\s*dục\s*hòa\s*nhập)|học\s*sinh\s*khuyết\s*tật)/i.test(trimmed)
  );

  const hasIndicatorCode = (
    /\(\s*(?:Mã\s*chỉ\s*báo\s*:?\s*[\w\.\s]+|\d+\.\d+\.(?:TC|NC)\s*\w+|NLS_[^)]+|AI_[^)]+|GDQP_[^)]+)\s*\)/i.test(trimmed) ||
    /Mã\s*chỉ\s*báo\s*:\s*[\w\.\s]+/i.test(trimmed)
  );

  return hasIntegrationKeyword || hasIndicatorCode;
};

/**
 * Parses and converts an activity block into a standard 2-column table.
 * Accurately sorts teacher/student actions into Column 1, and products/exercises/solutions/images into Column 2.
 */
export const convertActivityBlockToTable = (activityBlock: string): string => {
  if (!activityBlock.trim()) return activityBlock;

  const lines = activityBlock.split(/\r?\n/);
  if (lines.length === 0) return activityBlock;

  // Header line of the activity
  let headerLine = lines[0].trim();
  if (!headerLine.startsWith('**') && !headerLine.startsWith('#')) {
    headerLine = `**${headerLine.replace(/^[\*#\s]+/, '').replace(/[\*#\s]+$/, '')}**`;
  }

  const restLines = lines.slice(1);

  let mucTieu: string[] = [];
  let noiDung: string[] = [];
  let sanPhamPre: string[] = [];
  let tochucRawLines: string[] = [];

  type SectionState = 'pre' | 'muctieu' | 'noidung' | 'sanpham' | 'tochuc';
  let state: SectionState = 'pre';

  for (let i = 0; i < restLines.length; i++) {
    const raw = restLines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;

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
        let rest = (stepMatch[2] || '').trim();
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
    if (/^(?:\*\*|\*|_)?(?:HĐ\s*\d+|Ví\s*dụ\s*\d*|Luyện\s*tập\s*\d*|Vận\s*dụng\s*\d*|Bài\s*(?:tập\s*)?\d+(?:\.\d+)?|Câu\s*\d+|Quy\s*tắc|Kết\s*luận|Hộp\s*kiến\s*thức|Khung\s*kiến\s*thức|Nhận\s*xét|Chú\s*ý|Lời\s*giải|Đáp\s*án|Dự\s*đoán)\b/i.test(line)) {
      currentTargetCol = 2;
      let cleanItem = line.replace(/^[\*\-\+•\s_]+/, '').replace(/[\*\s_]+$/, '').trim();
      const itemMatch = cleanItem.match(/^(HĐ\s*\d+|Ví\s*dụ\s*\d*|Luyện\s*tập\s*\d*|Vận\s*dụng\s*\d*|Bài\s*(?:tập\s*)?\d+(?:\.\d+)?|Câu\s*\d+|Quy\s*tắc|Kết\s*luận|Hộp\s*kiến\s*thức|Khung\s*kiến\s*thức|Nhận\s*xét|Chú\s*ý|Lời\s*giải|Đáp\s*án|Dự\s*đoán)[:\s]*(.*)$/i);
      if (itemMatch) {
        let label = itemMatch[1].trim();
        if (!label.endsWith(':')) label += ':';
        let rest = (itemMatch[2] || '').trim();
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

  const col1Text = formatCellText(col1Items);
  const col2Text = formatCellText(col2Items);

  // Format section a, b, c
  const mucTieuText = mucTieu.length > 0
    ? mucTieu.join('\n')
    : '**a) Mục tiêu:** Đạt được yêu cầu cần đạt của hoạt động.';
  const noiDungText = noiDung.length > 0
    ? noiDung.join('\n')
    : '**b) Nội dung:** Học sinh thực hiện các nhiệm vụ theo hướng dẫn của giáo viên.';
  
  let cSanPhamText = sanPhamPre.length > 0
    ? sanPhamPre.join('\n')
    : (isLuyenTap
        ? '**c) Sản phẩm:** Đáp án, lời giải chi tiết các bài tập luyện tập của học sinh.'
        : (isVanDung
            ? '**c) Sản phẩm:** Kết quả giải quyết bài toán/vấn đề thực tế hoặc sản phẩm học tập của học sinh.'
            : '**c) Sản phẩm:** Câu trả lời, sản phẩm học tập hoặc kết quả thực hiện nhiệm vụ của học sinh.'
          )
      );

  return `${headerLine}\n${mucTieuText}\n${noiDungText}\n${cSanPhamText}\n**d) Tổ chức thực hiện:**\n\n| Hoạt động của giáo viên và học sinh | Kết quả hoạt động |\n| :--- | :--- |\n| ${col1Text} | ${col2Text} |`;
};

/**
 * Scans the entire lesson plan text and ensures every activity in Section III
 * is rendered in a clean 2-column table.
 */
export const ensureAllActivitiesInTwoColumnTable = (text: string): string => {
  if (!text) return text;

  const lines = text.split(/\r?\n/);
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
