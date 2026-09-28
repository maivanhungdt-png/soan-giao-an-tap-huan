/**
 * Utility to ensure all activities in a lesson plan are formatted into 
 * standard 2-column Markdown tables (| Tổ chức thực hiện | Sản phẩm |).
 * Specifically guarantees Hoạt động 3 (Luyện tập) and Hoạt động 4 (Vận dụng) 
 * are formatted cleanly into 2 columns with no c) and d) headings above the table.
 */

// Regex matching image placeholders, drawings, diagrams, and illustrations
export const IMAGE_TAG_REGEX = /(?:!\[[^\]]*\]\([^)]+\)|<img[^>]*>|\*{0,2}\[\s*(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|HÌNH_ẢNH_GỐC|HÌNH_ẢNH|HÌNH_VẼ_GỐC|HÌNH_VẼ|HÌNH_MINH_HỌA|HÌNH|HINH|IMG|IMAGE|ẢNH_GỐC|ẢNH|ANH|SƠ_ĐỒ|SO_DO|TRANH_ẢNH|TRANH|Hình\s*ảnh\s*gốc|Hình\s*ảnh|Hình\s*vẽ\s*gốc|Hình\s*vẽ|Hình\s*minh\s*họa|Hình|Ảnh\s*gốc|Ảnh\s*minh\s*họa|Ảnh|Tranh\s*ảnh|Tranh\s*vẽ|Tranh|Sơ\s*đồ|Hinh\s*anh|Hinh\s*ve)[\s_:.\-0-9a-zA-ZÀ-ỹ*]*\]\*{0,2})/gi;

export const isImageTag = (str: string): boolean => {
  if (!str) return false;
  if (/MATH|CÔNG_THỨC|PHÂN_SỐ|\d+\/\d+|\$|\\frac/i.test(str)) return false;
  return /(?:!\[[^\]]*\]\([^)]+\)|<img[^>]*>|\[\s*(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|HÌNH_ẢNH_GỐC|HÌNH_ẢNH|HÌNH_VẼ_GỐC|HÌNH_VẼ|HÌNH_MINH_HỌA|HÌNH|HINH|IMG|IMAGE|ẢNH_GỐC|ẢNH|ANH|SƠ_ĐỒ|SO_DO|TRANH_ẢNH|TRANH|Hình|Ảnh|Tranh|Sơ\s*đồ|Hinh|Anh)[\s_:.\-0-9a-zA-ZÀ-ỹ*]*\])/i.test(str);
};

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

/**
 * Repairs broken markdown table lines where linebreaks inside cells caused
 * integration text or steps to fall outside the table or duplicate table headers.
 */
export const repairBrokenTableInBlock = (block: string): string => {
  const lines = block.split('\n');
  const dIndex = lines.findIndex(l => 
    /(?:\*\*|\*|_)?(?:c|d)\)\s*(?:Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình)/i.test(l) ||
    /^\|\s*(?:Hoạt\s*động\s*của|Tổ\s*chức\s*thực\s*hiện)/i.test(l.trim())
  );
  
  if (dIndex === -1) return block;

  const rawPreLines = lines.slice(0, dIndex);
  // Bỏ hoàn toàn các dòng c) Sản phẩm hoặc d) Tổ chức thực hiện trước bảng
  const cleanPreLines = rawPreLines.filter(l => 
    !/(?:\*\*|\*|_)?(?:c|d)\)\s*(?:Sản\s*phẩm|Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình)/i.test(l.trim())
  );

  const postLines = lines.slice(dIndex);

  // Collect all step / teacher / student actions (Col 1: Tổ chức thực hiện) and solutions / products (Col 2: Sản phẩm)
  const col1Items: string[] = [];
  const col2Items: string[] = [];

  // Thu hồi nội dung lời giải/sản phẩm nếu c) Sản phẩm cũ có ghi trực tiếp sau dấu hai chấm
  rawPreLines.forEach(l => {
    if (/(?:\*\*|\*|_)?(?:c|d)\)\s*(?:Sản\s*phẩm|Kết\s*quả)/i.test(l)) {
      const inlineContent = l.replace(/^(?:\*\*|\*|_)?(?:c|d)\)\s*(?:Sản\s*phẩm|Kết\s*quả)[^:]*:?\s*(?:\*\*)?/i, '').trim();
      if (inlineContent) {
        col2Items.push(inlineContent);
      }
    }
  });

  let isInsideTable = false;

  for (let i = 0; i < postLines.length; i++) {
    const raw = postLines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Check if line is a table header or separator line
    if (/^\|\s*(?:Hoạt\s*động\s*của\s*(?:giáo\s*viên|gv)|Tổ\s*chức\s*thực\s*hiện)[^|]*\|\s*(?:Kết\s*quả|Sản\s*phẩm)[^|]*\|/i.test(trimmed)) {
      isInsideTable = true;
      continue;
    }
    if (/^\|\s*:?---+\s*\|\s*:?---+\s*\|/.test(trimmed)) {
      isInsideTable = true;
      continue;
    }

    // If it's a table row with 2 columns: | col1 | col2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      const parts = trimmed.slice(1, -1).split('|');
      if (parts.length >= 2) {
        let c1 = parts[0].trim();
        let c2 = parts.slice(1).join('|').trim();

        // Trích xuất tranh ảnh, hình vẽ ra khỏi Cột 1 và chuyển sang Cột 2 (Sản phẩm)
        const extractedImgs: string[] = [];
        c1 = c1.replace(IMAGE_TAG_REGEX, (m) => {
          if (isImageTag(m)) {
            extractedImgs.push(m.trim());
            return '';
          }
          return m;
        }).replace(/(?:<br\s*\/?>\s*)+/gi, '<br>').replace(/^(?:<br\s*\/?>|\s)+|(?:<br\s*\/?>|\s)+$/gi, '').trim();

        if (extractedImgs.length > 0) {
          const imgBlock = extractedImgs.join('<br>');
          c2 = c2 ? `${imgBlock}<br>${c2}` : imgBlock;
        }

        if (c1 && !c1.startsWith(':---')) col1Items.push(c1);
        if (c2 && !c2.startsWith(':---')) col2Items.push(c2);
        continue;
      }
    }

    // Bỏ qua nếu dòng này là c) Sản phẩm hoặc d) Tổ chức thực hiện bị rơi ra
    if (/^(?:\*\*|\*|_)?(?:c|d)\)\s*(?:Sản\s*phẩm|Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình)/i.test(trimmed)) {
      const inlineContent = trimmed.replace(/^(?:\*\*|\*|_)?(?:c|d)\)\s*(?:Sản\s*phẩm|Tổ\s*chức\s*thực\s*hiện)[^:]*:?\s*(?:\*\*)?/i, '').trim();
      if (inlineContent) {
        if (/Sản\s*phẩm/i.test(trimmed)) col2Items.push(inlineContent);
        else col1Items.push(inlineContent);
      }
      continue;
    }

    // If it's loose text that fell out of table due to real newlines
    // Các bức tranh, hình vẽ học liệu [HINHANHGOC_...] chuyển sang Cột 2 (Sản phẩm)
    if (isImageTag(trimmed)) {
      col2Items.push(trimmed);
    } else if (/^(?:-\s*)?(?:HS\s*khuyết\s*tật|HSKT|Tích\s*hợp|Bước\s*[1-4]|GV|HS|Giáo\s*viên|Học\s*sinh|Nhiệm\s*vụ|Yêu\s*cầu|Bài\s*tập\s*\d+|Bài\s*\d+|Câu\s*\d+|Ví\s*dụ\s*\d+|Luyện\s*tập\s*\d+|Vận\s*dụng\s*\d+)/i.test(trimmed) || trimmed.startsWith('<span') || trimmed.endsWith('</span>')) {
      // If it explicitly says Lời giải or Đáp án, put in Col 2
      if (/^(?:Lời\s*giải|Đáp\s*án|Hướng\s*dẫn\s*giải)\s*:/i.test(trimmed)) {
        col2Items.push(trimmed);
      } else {
        col1Items.push(trimmed);
      }
    } else if (/^(?:Lời\s*giải|Đáp\s*án|Hướng\s*dẫn\s*giải|Kết\s*quả\s*bài)/i.test(trimmed)) {
      col2Items.push(trimmed);
    } else {
      col1Items.push(trimmed);
    }
  }

  // Chuyển toàn bộ tranh ảnh, hình vẽ còn sót ở Cột 1 sang Cột 2
  const looseExtractedCol1: string[] = [];
  const safeCol1Items: string[] = [];
  col1Items.forEach(item => {
    const cleaned = item.replace(IMAGE_TAG_REGEX, (m) => {
      if (isImageTag(m)) {
        looseExtractedCol1.push(m.trim());
        return '';
      }
      return m;
    }).replace(/(?:<br\s*\/?>\s*)+/gi, '<br>').trim();
    if (cleaned) safeCol1Items.push(cleaned);
  });
  if (looseExtractedCol1.length > 0) {
    col2Items.unshift(...looseExtractedCol1);
  }

  // If nothing collected in table, return original
  if (safeCol1Items.length === 0 && col2Items.length === 0) {
    return block;
  }

  // Format cell 1 and cell 2 cleanly with <br>
  const formatCell = (arr: string[]): string => {
    return arr
      .map(item => item.trim())
      .filter(Boolean)
      .join('<br>')
      .replace(/\r?\n/g, '<br>')
      .replace(/\|/g, '\\|');
  };

  const finalCol1 = formatCell(safeCol1Items) || '**Bước 1: Chuyển giao nhiệm vụ:** GV giao nhiệm vụ cho HS.<br>**Bước 2: Thực hiện nhiệm vụ:** HS làm việc cá nhân/nhóm.<br>**Bước 3: Báo cáo, thảo luận:** HS báo cáo kết quả.<br>**Bước 4: Kết luận, nhận định:** GV chuẩn hóa kiến thức.';
  const finalCol2 = formatCell(col2Items) || 'Học sinh hoàn thành câu trả lời, sản phẩm học tập hoặc bài tập theo yêu cầu của giáo viên.';

  const tableMarkdown = `| Tổ chức thực hiện | Sản phẩm |\n| :--- | :--- |\n| ${finalCol1} | ${finalCol2} |`;

  return `${cleanPreLines.join('\n').trim()}\n\n${tableMarkdown}`;
};

/**
 * Converts an activity block that is outside the table into a standard 2-column table.
 */
export const convertActivityBlockToTable = (activityBlock: string): string => {
  // If block contains broken table lines or split tables, repair and merge it
  if (/\|[^\n]*\|/i.test(activityBlock) && (/(?:\*\*|\*|_)?(?:c|d)\)\s*(?:Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình)/i.test(activityBlock) || /\|\s*(?:Hoạt\s*động\s*của|Tổ\s*chức\s*thực\s*hiện)[^|]*\|/i.test(activityBlock))) {
    return repairBrokenTableInBlock(activityBlock);
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

    // Các bức tranh, hình vẽ học liệu chuyển sang mục sản phẩm
    if (isImageTag(trimmed)) {
      sanPham.push(trimmed);
      continue;
    }

    // Only switch to sanpham if line is explicitly a student solution or answer
    if (currentSection === 'tochuc' && /^(?:\*\*|\*|_)?(?:Lời\s*giải|Đáp\s*án|Hướng\s*dẫn\s*giải|Kết\s*quả\s*dự\s*kiến)\s*:/i.test(trimmed)) {
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

  // Chuyển toàn bộ tranh ảnh, hình vẽ trong toChuc sang sanPham
  const extractedImgsFromToChuc: string[] = [];
  toChuc = toChuc.map(line => {
    return line.replace(IMAGE_TAG_REGEX, (m) => {
      if (isImageTag(m)) {
        extractedImgsFromToChuc.push(m.trim());
        return '';
      }
      return m;
    }).replace(/(?:<br\s*\/?>\s*)+/gi, '<br>').trim();
  }).filter(Boolean);

  if (extractedImgsFromToChuc.length > 0) {
    sanPham.unshift(...extractedImgsFromToChuc);
  }

  // Helper to format text lines inside a single table cell (convert line breaks to <br>)
  const formatCellText = (arr: string[]): string => {
    return arr
      .map(line => line.trim())
      .filter(Boolean)
      .join('<br>')
      .replace(/\r?\n/g, '<br>')
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
  
  return `${headerLine}\n${mucTieuText}\n${noiDungText}\n\n| Tổ chức thực hiện | Sản phẩm |\n| :--- | :--- |\n| ${toChucCell} | ${sanPhamCell} |`;
};

/**
 * Quét toàn bộ bảng 2 cột trong văn bản và chuyển tất cả các bức tranh, hình vẽ học liệu
 * từ Cột 1 (Tổ chức thực hiện / Tổ chức hoạt động) sang Cột 2 (Sản phẩm).
 */
export const moveImagesFromToChucToSanPham = (text: string): string => {
  if (!text) return text;

  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Kiểm tra hàng bảng markdown 2 cột: | col1 | col2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      // Bỏ qua dòng phân cách hoặc dòng tiêu đề
      if (/^\|\s*:?---+\s*\|\s*:?---+\s*\|/.test(trimmed) ||
          /^\|\s*(?:Hoạt\s*động|Tổ\s*chức)[^|]*\|\s*(?:Kết\s*quả|Sản\s*phẩm)[^|]*\|/i.test(trimmed)) {
        result.push(line);
        continue;
      }

      const parts = trimmed.slice(1, -1).split('|');
      if (parts.length >= 2) {
        let c1 = parts[0];
        let c2 = parts.slice(1).join('|');

        // Tìm tất cả các thẻ tranh ảnh, hình vẽ trong Cột 1 (Tổ chức thực hiện)
        const extractedImgs: string[] = [];
        c1 = c1.replace(IMAGE_TAG_REGEX, (m) => {
          if (isImageTag(m)) {
            extractedImgs.push(m.trim());
            return '';
          }
          return m;
        });

        if (extractedImgs.length > 0) {
          // Làm sạch các thẻ <br> thừa trong Cột 1
          c1 = c1.replace(/(?:<br\s*\/?>\s*)+/gi, '<br>').replace(/^(?:<br\s*\/?>|\s)+|(?:<br\s*\/?>|\s)+$/gi, '');
          const imgBlock = extractedImgs.join('<br>');
          const trimmedC2 = c2.trim();
          c2 = trimmedC2 ? ` ${imgBlock}<br>${trimmedC2} ` : ` ${imgBlock} `;
          result.push(`| ${c1.trim()} |${c2}|`);
          continue;
        }
      }
    }

    result.push(line);
  }

  return result.join('\n');
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

  return moveImagesFromToChucToSanPham(resultLines.join('\n'));
};
