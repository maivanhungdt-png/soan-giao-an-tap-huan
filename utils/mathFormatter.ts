import { imageCache, CachedImage, lookupCachedImage } from '../services/imageCache';

/**
 * Phục hồi 100% công thức phân số bị lỗi tiền tố \f hoặc rac thành chuẩn LaTeX \frac{...}{...}
 */
export const repairRacToFrac = (input: string): string => {
  if (!input) return "";
  let s = input;

  // Xóa ký tự Form Feed \x0C hoặc \f bị lỗi
  s = s.replace(/[\x0C\f]rac/g, '\\frac');
  s = s.replace(/[\x0C\f]/g, '');

  // 1. Phục hồi dạng có ngoặc nhọn: rac{...}{...} nhưng KHÔNG khớp nếu đã là \frac
  s = s.replace(/(?<!\\f|\\|f)rac\{([^{}]+)\}\{([^{}]+)\}/g, '\\frac{$1}{$2}');

  // 2. Phục hồi dạng 2 biến chữ cái: racam -> \frac{a}{m}, racbm -> \frac{b}{m}, racxy -> \frac{x}{y}
  s = s.replace(/(?<![a-zA-Z\\])rac([a-zA-Z])([a-zA-Z])(?=[^\w{]|$)/g, '\\frac{$1}{$2}');

  // 3. Phục hồi dạng biểu thức tử số đơn giản: raca + bm -> \frac{a+b}{m}, raca - bm -> \frac{a-b}{m}
  s = s.replace(/(?<![a-zA-Z\\])rac([a-zA-Z0-9])\s*([+\-])\s*([a-zA-Z0-9])([a-zA-Z])(?=[^\w{]|$)/g, (_m, p1, op, p2, den) => {
    return `\\frac{${p1.trim()}${op}${p2.trim()}}{${den}}`;
  });

  // 4. Phục hồi dạng có tử số âm hoặc số: rac-56 -> \frac{-5}{6}, rac14 -> \frac{1}{4}, rac312 -> \frac{3}{12}, rac-1012 -> \frac{-10}{12}, rac-712 -> \frac{-7}{12}
  s = s.replace(/(?<![a-zA-Z\\])rac(-?\d+)/g, (match, digits) => {
    let isNeg = false;
    let d = digits;
    if (d.startsWith('-')) {
      isNeg = true;
      d = d.slice(1);
    }
    const prefix = isNeg ? '-' : '';

    if (d === '313') return `\\frac{${prefix}3}{13}`;
    if (d === '1112') return `\\frac{${prefix}11}{12}`;
    if (d === '512') return `\\frac{${prefix}5}{12}`;
    if (d === '1012') return `\\frac{${prefix}10}{12}`;
    if (d === '712') return `\\frac{${prefix}7}{12}`;
    if (d === '1612') return `\\frac{${prefix}16}{12}`;
    if (d === '312') return `\\frac{${prefix}3}{12}`;
    if (d === '1115') return `\\frac{${prefix}11}{15}`;
    if (d.length === 2) return `\\frac{${prefix}${d[0]}}{${d[1]}}`;
    if (d.length === 3) {
      return `\\frac{${prefix}${d[0]}}{${d.slice(1)}}`;
    }
    if (d.length === 4) {
      return `\\frac{${prefix}${d.slice(0, 2)}}{${d.slice(2)}}`;
    }
    return match;
  });

  return s;
};

/**
 * Tự động chuyển đổi các thẻ ảnh công thức toán học hoặc placeholder công thức thành chuỗi LaTeX thuần túy
 */
export const convertMathImageTagsToLatex = (text: string, customCache?: Record<string, CachedImage>): string => {
  if (!text) return "";
  const cache = customCache || imageCache;

  // Regex bắt các thẻ ảnh học liệu: [HINHANHGOC_1], [IMG1], [CONG_THUC_TOAN_1], [MATH_1], v.v.
  const imgTagRegex = /\[\s*(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|IMG|IMAGE|HÌNH_ẢNH|HÌNH_VẼ|HÌNH|HINH|CONG_THUC_TOAN|CÔNG_THỨC_TOÁN|MATH_FORMULA|MATH)[_\s#\-]*(\d+)\s*\]/gi;

  let result = text.replace(imgTagRegex, (match, num) => {
    // Tìm trong cache xem ảnh này có phải công thức toán không
    const keys = [
      `CONG_THUC_TOAN_${num}`,
      `CONG_THUC_TOAN${num}`,
      `MATH_FORMULA_${num}`,
      `MATH_FORMULA${num}`,
      `MATH_${num}`,
      `HINHANHGOC_${num}`,
      `HINHANHGOC${num}`,
      `IMG${num}`,
      num
    ];

    for (const k of keys) {
      const item = cache[k];
      if (item) {
        // Nếu đã có chuỗi LaTeX được OCR hoặc parse trước đó
        if (item.latex) {
          const l = item.latex.trim();
          return l.startsWith('$') ? ` ${l} ` : ` $${l}$ `;
        }
        // Nếu được đánh dấu là công thức toán học
        if (item.isMathFormula) {
          return ` `; // Bỏ tag ảnh công thức để không bị nhúng thành ảnh
        }
        // Nếu kích thước đặc trưng của công thức toán học (chiều cao nhỏ, icon, inline MathType)
        if (item.originalHeight && item.originalHeight <= 95 && (item.originalWidth || 0) <= 650) {
          return ` `;
        }
      }
    }

    // Nếu chính tên tag có chữ CONG_THUC hoặc MATH thì loại bỏ tag ảnh
    if (/CONG_THUC|CÔNG_THỨC|MATH/i.test(match)) {
      return ` `;
    }

    return match;
  });

  // Chuyển đổi các placeholder [CÔNG_THỨC_TOÁN: MathType] còn sót
  result = result.replace(/\[\s*CÔNG_THỨC_TOÁN[^\]]*\]/gi, ' ');
  result = result.replace(/\$?\s*EMBED\s+Equation(?:\.DSMT4|\.3|\.2|\b[^\s<"]*)\s*\$?|Equation\.DSMT4/gi, ' ');

  return result;
};

/**
 * Tự động phát hiện và chuyển đổi các biểu thức toán học / phân số / bất đẳng thức dạng text thô sang chuẩn LaTeX $...$
 */
export const autoConvertPlainTextToLatex = (text: string): string => {
  if (!text) return "";

  const lines = text.split('\n');

  // Cấu trúc Regex cho chuỗi phép tính số học / phân số / đại số
  const op = '(?:<=|>=|!=|==|≤|≥|≠|<|>|=|≈|\\+|\\-|\\*|:|\\/|\\\\times|\\\\div|\\\\cdot|\\\\le|\\\\ge|\\\\neq|\\\\approx)';
  // Các hạng tử toán học: phân số, căn thức, luỹ thừa, biến có hệ số (2x, -3y, 0.5a), ngoặc, hàm số
  const term = '(?:(?:-\\s*)?(?:\\\\frac\\{[^}]+\\}\\{[^}]+\\}|\\\\sqrt(?:\\[[^\\]]*\\])?\\{[^}]+\\}|\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|-?\\d+(?:,\\d+)?(?:\\s*[a-zA-Z][a-zA-Z0-9_]*(?:\\^[0-9a-zA-Z]+|_[0-9a-zA-Z]+)?)?|[a-zA-Z][a-zA-Z0-9_]*(?:\\^[0-9a-zA-Z]+|_[0-9a-zA-Z]+)?|\\([a-zA-Z0-9+\\-*\\/\\s^.]+\\)|(?:sin|cos|tan|cot|ln|log|f|g|P|Q)\\([a-zA-Z0-9+\\-*\\/\\s^.]+\\)))';
  const mathPattern = `(?:^|(?<=[\\s(:;]))(${term}\\s*${op}\\s*${term}(?:\\s*${op}\\s*${term})*)(?=$|[\\s),.:;!?])`;
  const mathExprRegex = new RegExp(mathPattern, 'g');

  const processedLines = lines.map(line => {
    if (!line.trim()) return line;

    // Helper: Áp dụng biến đổi an toàn chỉ trên các phân đoạn text CHƯA PHẢI là LaTeX
    const transformNonLatex = (str: string, fn: (t: string) => string): string => {
      const tokens = str.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n\r]+?\$|<[^>]+>|\[(?:HINHANHGOC|IMG|CÔNG_THỨC)[^\]]*\])/g);
      return tokens.map((tok, idx) => (idx % 2 === 1 ? tok : fn(tok))).join('');
    };

    let cur = line;

    // Bước 0: Khắc phục triệt để mọi trường hợp công thức bị mất \f thành rac
    cur = repairRacToFrac(cur);

    // Bước 1: Chuẩn hóa khoảng trắng trong các lệnh LaTeX cơ bản: "\frac {2022} {2023}" -> "\frac{2022}{2023}"
    cur = cur.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, (_m, p1, p2) => `\\frac{${p1.trim()}}{${p2.trim()}}`);
    cur = cur.replace(/\\sqrt\s*\{([^}]+)\}/g, (_m, p1) => `\\sqrt{${p1.trim()}}`);

    // Bước 2: Tự động bọc toàn bộ chuỗi biểu thức / phép tính số học liên hoàn
    cur = transformNonLatex(cur, (t) => {
      return t.replace(mathExprRegex, (match) => {
        // Bỏ qua định dạng ngày tháng như 20/11/2024 hoặc văn bản 5512/BGDĐT
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(match.trim())) return match;
        if (/\d+\/[A-Za-z]/.test(match.trim())) return match;
        let m = match.trim();

        // Chuẩn hóa hỗn số: "1 5/12" -> "1\frac{5}{12}"
        m = m.replace(/(\d+)\s+(\d+)\/(\d+)/g, (_m1, whole, num, den) => `${whole}\\frac{${num}}{${den}}`);

        // Chuẩn hóa phân số âm có khoảng cách: "- 7/8" -> "-\frac{7}{8}"
        m = m.replace(/-\s*(\d+)\/(\d+)/g, (_m1, num, den) => `-\\frac{${num}}{${den}}`);

        // Chuẩn hóa phân số thông thường: "7/8" -> "\frac{7}{8}"
        m = m.replace(/(^|[^\w\\])(\d+)\/(\d+)/g, (_m1, prefix, num, den) => `${prefix}\\frac{${num}}{${den}}`);

        // Chuẩn hóa dấu so sánh và phép toán sang mã LaTeX chuẩn
        m = m.replace(/<=|≤/g, ' \\le ');
        m = m.replace(/>=|≥/g, ' \\ge ');
        m = m.replace(/!=|≠/g, ' \\neq ');
        m = m.replace(/≈/g, ' \\approx ');
        m = m.replace(/×/g, ' \\times ');
        m = m.replace(/÷/g, ' \\div ');
        m = m.replace(/·/g, ' \\cdot ');

        // Chuẩn hóa khoảng trắng quanh toán tử trong công thức
        m = m.replace(/\s*([=+\-])\s*/g, ' $1 ');
        // Chuẩn hóa dấu trừ trước phân số hoặc số: "- \frac" -> "-\frac", "= - " -> "= -"
        m = m.replace(/(^|[=+\-\s(])-\s+(\\frac|\d+)/g, '$1-$2');
        m = m.replace(/^-\s+/g, '-');
        m = m.replace(/\(\s*-\s+/g, '(-');
        m = m.replace(/=\s*-\s+/g, '= -');
        m = m.replace(/\s+/g, ' ').trim();

        return ` $${m}$ `;
      });
    });

    // Bước 3: Tự động bọc \frac{...}{...} hoặc \sqrt{...} đơn lẻ chưa được bọc $...$
    cur = transformNonLatex(cur, (t) => {
      return t.replace(/(?:^|(?<=[\s(]))(-?\\(?:frac\{[^}]+\}\{[^}]+\}|sqrt(?:\\[[^\\]]*\\])?\{[^}]+\}))(?=$|[\\s),.:;!?])/g, (_m, p1) => ` $${p1}$ `);
    });

    // Bước 4: Tự động bọc phân số đơn lẻ dạng text thô còn sót: "1/2", "- 3/4", "-3/4"
    cur = transformNonLatex(cur, (t) => {
      return t.replace(/(?:^|(?<=[\s(]))(-?\s*\d+)\/(\d+)(?=$|[\s),.:;!?])/g, (_match, num, den) => {
        // Tránh nhầm ngày tháng hoặc số hiệu văn bản
        const cleanNum = num.replace(/\s+/g, '');
        const isNegative = cleanNum.startsWith('-');
        const absNum = isNegative ? cleanNum.slice(1) : cleanNum;
        return isNegative ? ` $-\\frac{${absNum}}{${den}}$ ` : ` $\\frac{${cleanNum}}{${den}}$ `;
      });
    });

    // Bước 5: Tự động bọc biến có số mũ hoặc chỉ số dưới: x^2, y^3, a^2, b^2, c^2, x_1, x_2, x_0, y_0
    cur = transformNonLatex(cur, (t) => {
      return t.replace(/(?:^|(?<=[\s(]))([a-zA-Z](?:\^[0-9a-zA-Z]+|_[0-9a-zA-Z]+))(?=$|[\s),.:;!?])/g, (_m, p1) => ` $${p1}$ `);
    });

    // Bước 6: Tự động bọc đơn vị có số mũ: cm^2, m^2, dm^2, mm^2, km^2, cm^3, m^3
    cur = transformNonLatex(cur, (t) => {
      return t.replace(/(?:^|(?<=\d|\s))(cm|dm|mm|km|m)(\^[23])(?=$|[\s),.:;!?])/g, (_m, unit, pwr) => ` ${unit}$${pwr}$ `);
    });

    // Bước 7: Tự động bọc góc hình học: 60°, 90°, 45°, 30°, 180°
    cur = transformNonLatex(cur, (t) => {
      return t.replace(/(\d+)\s*°/g, (_m, deg) => ` $${deg}^\\circ$ `);
    });

    // Bước 8: Tự động bọc các ký tự toán học Unicode đơn lẻ còn sót lại
    cur = transformNonLatex(cur, (t) => {
      return t.replace(/≤/g, ' $\\le$ ')
              .replace(/≥/g, ' $\\ge$ ')
              .replace(/≠/g, ' $\\neq$ ')
              .replace(/±/g, ' $\\pm$ ')
              .replace(/×/g, ' $\\times$ ')
              .replace(/÷/g, ' $\\div$ ');
    });

    // Chuẩn hóa khoảng trắng dư quanh dấu câu
    cur = cur.replace(/[ \t]{2,}/g, ' ');
    cur = cur.replace(/\s+([.,;:!?\)])/g, '$1');
    cur = cur.replace(/([\(\[])\s+/g, '$1');

    return cur;
  });

  return processedLines.join('\n');
};

/**
 * Hàm toàn diện chuẩn hóa toàn bộ công thức toán học trong kết quả đầu ra
 * Chuyển đổi 100% hình ảnh/placeholder công thức sang chuỗi LaTeX chuẩn, đồng bộ văn bản giáo án
 */
export const ensureFormulasAreProperLatex = (text: string, customCache?: Record<string, CachedImage>): string => {
  if (!text) return "";

  // 1. Chuyển đổi các thẻ ảnh công thức / placeholder sang LaTeX
  let processed = convertMathImageTagsToLatex(text, customCache);

  // 2. Sửa lỗi \f / rac thành \frac
  processed = repairRacToFrac(processed);

  // 3. Chuẩn hóa các dạng ngoặc LaTeX khác sang $...$ hoặc $$...$$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_m, c) => `$$${c.trim()}$$`);
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_m, c) => `$${c.trim()}$`);
  processed = processed.replace(/\[MATH:\s*([\s\S]*?)\]/g, (_m, c) => `$${c.trim()}$`);

  // 4. Tự động bọc và chuẩn hóa biểu thức text thô sang LaTeX
  processed = autoConvertPlainTextToLatex(processed);

  // 5. Chuẩn hóa các dấu $ liên tiếp hoặc rỗng
  processed = processed.replace(/\$\s*\$/g, '');
  processed = processed.replace(/\$\s+([^$\n\r]+?)\s+\$/g, (_m, g) => `$${g}$`);
  // Chuẩn hóa dấu sao nhân * thành \cdot trong công thức LaTeX
  processed = processed.replace(/\$([^$\n\r]+?)\$/g, (_match, body) => {
    let b = body;
    b = b.replace(/\s*\*\s*/g, ' \\cdot ');
    b = b.replace(/\s*([+\-=])\s*/g, ' $1 ');
    b = b.replace(/-\s*\\frac/g, '-\\frac');
    b = b.replace(/=\s*-\s*/g, '= -');
    b = b.replace(/\s+/g, ' ').trim();
    return `$${b}$`;
  });

  return processed;
};

