import { GoogleGenAI } from "@google/genai";
import { LessonInfo, ProcessingOptions } from "../types";
import { SYSTEM_INSTRUCTION, NLS_FRAMEWORK_DATA, GDQPAN_DATA, DISABILITY_PEDAGOGICAL_GUIDELINES } from "../constants";
import { masterDataCsv } from "../masterData";
import { ensureAllActivitiesInTwoColumnTable, splitAllMergedHeadings } from "../utils/tableFormatter";
import { imageCache } from "./imageCache";

export interface GeminiModelOption {
  id: string;
  name: string;
  desc: string;
  badge?: string;
}

export const cleanApiKey = (raw: string): string => {
  if (!raw) return '';
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^(?:GEMINI_API_KEY|API_KEY|APIKEY|KEY|VITE_GEMINI_API_KEY)\s*[:=]\s*/i, '');
  cleaned = cleaned.replace(/^Bearer\s+/i, '');
  cleaned = cleaned.replace(/[\\`"';,]/g, '');
  return cleaned.trim();
};

export const AVAILABLE_GEMINI_MODELS: GeminiModelOption[] = [
  { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", desc: "⚡ Thế hệ mới nhất, phản hồi siêu tốc, chuẩn GDPT 2018", badge: "Khuyên dùng - Nhanh nhất" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", desc: "✨ Mô hình thông minh thế hệ mới tối ưu sư phạm", badge: "Thế hệ mới" },
  { id: "gemini-flash-latest", name: "Gemini Flash Latest", desc: "🚀 Bản phát hành mới nhất của Google AI Studio", badge: "Mới nhất" },
  { id: "gemini-flash-lite-latest", name: "Gemini Flash-Lite Latest", desc: "🪶 Siêu nhẹ, phản hồi tức thì và tiết kiệm hạn mức", badge: "Siêu nhẹ" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", desc: "🛡️ Mô hình đa nhiệm ổn định", badge: "Ổn định" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", desc: "📚 Tương thích với các mã khóa truyền thống", badge: "Cơ bản" }
];

// Lưu model OCR thành công để tái sử dụng ngay lập tức cho các ảnh tiếp theo
let cachedWorkingOcrModel: string = "gemini-3.6-flash";

/**
 * Chuyển đổi các hình ảnh công thức toán học / phân số trong tài liệu sang mã LaTeX chuẩn $...$ bằng Gemini Vision
 */
export const transcribeMathImagesToLatex = async (
  content: string,
  apiKey: string,
  onProgress?: (text: string) => void
): Promise<string> => {
  if (!content || !apiKey) return content;

  // Tìm tất cả các mã chốt ảnh trong văn bản: [HINHANHGOC_1], [IMG1], [HINH_ANH_GOC_1]...
  const imgRegex = /\[\s*(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|IMG|IMAGE|HÌNH_ẢNH|HÌNH_VẼ|HÌNH|HINH)[_\s#\-]*(\d+)\s*\]/gi;
  const matches: { full: string; num: string }[] = [];
  let m;
  while ((m = imgRegex.exec(content)) !== null) {
    matches.push({ full: m[0], num: m[1] });
  }

  if (matches.length === 0) return content;

  // Lọc ra các ảnh có khả năng cao là công thức toán:
  // - BẮT BUỘC có cờ isMathFormula và chiều cao nhỏ (<= 45px - đặc trưng của công thức nội dòng / phân số)
  // - TUYỆT ĐỐI KHÔNG động vào các hình vẽ hình học, đồ thị, sơ đồ, thí nghiệm minh họa (chiều cao > 50px hoặc chiều rộng > 250px)
  const candidateImages: { tag: string; num: string; dataUrl: string; cleanId: string }[] = [];

  for (const match of matches) {
    const cleanId = `HINHANHGOC_${match.num}`;
    const cached = imageCache[cleanId] || imageCache[`IMG${match.num}`] || imageCache[match.num];
    if (!cached || !cached.dataUrl || typeof cached.dataUrl !== 'string') continue;

    // Không xử lý ảnh svg tạo bởi hệ thống
    if (cached.dataUrl.startsWith('data:image/svg+xml')) continue;

    const h = cached.originalHeight || cached.height || 180;
    const w = cached.originalWidth || cached.width || 250;

    // Nếu kích thước lớn (chiều cao > 50px hoặc chiều rộng > 280px), đây là hình vẽ/sơ đồ giáo dục thật -> GIỮ NGUYÊN 100%
    if (h > 50 || w > 280) continue;

    const isFlagged = Boolean(cached.isMathFormula) && h <= 45;
    const isTinyFormula = h <= 35 && w <= 220;

    if (isFlagged || isTinyFormula) {
      candidateImages.push({
        tag: match.full,
        num: match.num,
        dataUrl: cached.dataUrl,
        cleanId
      });
    }
  }

  if (candidateImages.length === 0) return content;

  if (onProgress) {
    onProgress(`Đang chuyển đổi ${candidateImages.length} công thức toán từ dạng hình ảnh sang chuẩn LaTeX...`);
  }

  const ai = new GoogleGenAI({ apiKey });
  let updatedContent = content;

  // Danh sách model OCR tốc độ cao chuẩn xác
  const baseOcrModels = [
    cachedWorkingOcrModel,
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash"
  ];
  const ocrCandidateModels = Array.from(new Set(baseOcrModels));

  const promptText = `Bạn là chuyên gia số hoá công thức toán học và phân số. Hãy đọc chính xác công thức toán hoặc phân số trong ảnh và chuyển đổi sang cú pháp LaTeX chuẩn tương thích MathType đặt trong cặp dấu $...$ (nội dòng) hoặc $$...$$ (độc lập).
QUY TẮC BẮT BUỘC:
1. Phân số: bắt buộc dùng \\frac{tử}{mẫu} (ví dụ: $-\\frac{5}{7}$, $\\frac{8}{21}$, $\\frac{25}{100}$, $\\frac{17}{12}$).
2. Dấu trừ trước phân số: viết dấu trừ liền trước lệnh \\frac (ví dụ: $-\\frac{7}{8}$, $-\\frac{21}{24}$).
3. Hỗn số: viết số nguyên liền trước phân số (ví dụ: $1\\frac{5}{12}$, $2\\frac{1}{3}$).
4. Chuỗi phép tính: Nếu ảnh chứa phép tính nhiều bước hoặc chuỗi dấu bằng liên tiếp, viết TOÀN BỘ trong CÙNG MỘT CẶP DẤU $...$ (ví dụ: $-\\frac{5}{7} - \\frac{8}{21} = -\\frac{15}{21} - \\frac{8}{21} = -\\frac{23}{21}$).
5. CHỈ TRẢ VỀ mã LaTeX đặt trong $...$, KHÔNG có bất kỳ lời giải thích nào, KHÔNG markdown bọc ngoài ngoài $.
6. Nếu ảnh hoàn toàn KHÔNG PHẢI công thức toán học (mà là hình học trực quan, sơ đồ, ảnh chụp thực tế), chỉ trả về đúng chữ: NOT_MATH.`;

  // Hàm xử lý OCR cho 1 ảnh đơn lẻ với timeout tối ưu
  const processSingleImage = async (item: typeof candidateImages[0]): Promise<{ item: typeof candidateImages[0]; latex: string; success: boolean } | null> => {
    try {
      const mimeType = item.dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";
      const b64 = item.dataUrl.includes(",") ? item.dataUrl.split(",")[1] : item.dataUrl;

      for (const ocrModel of ocrCandidateModels) {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4500));
          const generatePromise = ai.models.generateContent({
            model: ocrModel,
            contents: [
              { text: promptText },
              { inlineData: { data: b64, mimeType } }
            ]
          });

          const res: any = await Promise.race([generatePromise, timeoutPromise]);
          const resText = (res && res.text) ? res.text.trim() : "";
          if (resText) {
            cachedWorkingOcrModel = ocrModel; // Ghi nhớ model đã chạy thành công
            if (!resText.includes("NOT_MATH") && resText.includes("$")) {
              const latexMatch = resText.match(/\$\$[\s\S]*?\$\$|\$[^\$\n\r]+?\$/);
              const finalLatex = latexMatch ? latexMatch[0] : (resText.startsWith("$") ? resText : `$${resText}$`);
              return { item, latex: finalLatex, success: true };
            }
            return null;
          }
        } catch {
          // Thử model tiếp theo
        }
      }
    } catch (err) {
      console.warn(`Lỗi nhận diện ảnh công thức ${item.cleanId}:`, err);
    }
    return null;
  };

  // Xử lý song song từng nhóm 4 ảnh để đạt tốc độ tối đa mà không bị nghẽn mạng
  const batchSize = 4;
  const items = candidateImages.slice(0, 12);
  const results: { item: typeof candidateImages[0]; latex: string; success: boolean }[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(it => processSingleImage(it)));
    for (const r of chunkResults) {
      if (r && r.success && r.latex) {
        results.push(r);
      }
    }
  }

  for (const res of results) {
    if (res.success && res.latex) {
      // Thay thế tag ảnh trong text bằng mã LaTeX
      updatedContent = updatedContent.replaceAll(res.item.tag, ` ${res.latex} `);
      console.log(`[Math OCR] Đã chuyển đổi thành công ảnh ${res.item.cleanId} thành LaTeX: ${res.latex}`);
    }
  }

  return updatedContent;
};

export const generateNLSLessonPlan = async (
  info: LessonInfo,
  options: ProcessingOptions,
  onProgress?: (text: string) => void
): Promise<string> => {
  
  // Priority 1: User's custom key, Priority 2: env key
  const rawKey = (options.customApiKey && options.customApiKey.trim()) 
    ? options.customApiKey 
    : (process.env.API_KEY || process.env.GEMINI_API_KEY || "");

  const activeApiKey = cleanApiKey(rawKey);

  if (!activeApiKey) {
    throw new Error("Chưa có khóa API Google Gemini. Vui lòng nhấn nút 'Khóa API' ở góc trên bên phải để nhập mã API Key miễn phí từ Google AI Studio.");
  }

  // 0. Tự động OCR chuyển đổi tất cả hình ảnh công thức toán (MathType / Phân số) sang chuẩn LaTeX
  try {
    info.content = await transcribeMathImagesToLatex(info.content, activeApiKey, onProgress);
    if (info.distributionContent) {
      info.distributionContent = await transcribeMathImagesToLatex(info.distributionContent, activeApiKey, onProgress);
    }
  } catch (ocrErr) {
    console.warn("Math formula image transcription error:", ocrErr);
  }

  const ai = new GoogleGenAI({ apiKey: activeApiKey });

  // Tiền xử lý để loại bỏ HTML dư thừa, chuyển bảng thành dạng text ngắn gọn
  const optimizeTextForTokenSaving = (html: string): string => {
    if (!html) return "";
    let text = html;
    
    // Đơn giản hóa bảng để giữ cấu trúc cột
    text = text.replace(/<table[^>]*>/gi, '\n--- BẮT ĐẦU BẢNG ---\n');
    text = text.replace(/<\/table>/gi, '\n--- KẾT THÚC BẢNG ---\n');
    text = text.replace(/<tr[^>]*>/gi, '\n');
    text = text.replace(/<td[^>]*>|<th[^>]*>/gi, ' | ');
    text = text.replace(/<\/td>|<\/th>/gi, '');
    text = text.replace(/<\/tr>/gi, '');
    text = text.replace(/<p[^>]*>/gi, ' ');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    
    // Loại bỏ toàn bộ thẻ HTML còn lại
    text = text.replace(/<[^>]+>/g, '');
    
    // Giải mã HTML entities cơ bản
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&amp;/g, '&')
               .replace(/&quot;/g, '"');
               
    // Chuẩn hóa và nhận diện các placeholder MathType OLE / EMBED Equation từ file Word
    text = text.replace(/\bEMBED\s+Equation(?:\.DSMT4|\.3|\.2|\b[^\s<"]*)/gi, '[CÔNG_THỨC_TOÁN: MathType]');
    text = text.replace(/\bEquation\.DSMT4\b/gi, '[CÔNG_THỨC_TOÁN: MathType]');

    // Xóa các dòng trống liên tiếp (3 dòng trở lên thành 2 dòng)
    text = text.replace(/\n{3,}/g, '\n\n');
    // Xóa khoảng trắng dư thừa liên tiếp (từ 3 khoảng trắng trở lên thành 1)
    text = text.replace(/ {3,}/g, ' ');
    // Rút gọn các dòng chứa quá nhiều dấu chấm, gạch dưới (thường là phần điền chỗ trống)
    text = text.replace(/(?:[._…]\s*){10,}/g, '...');
    
    return text.trim();
  };

  const cleanContent = optimizeTextForTokenSaving(info.content);
  let cleanDistribution = optimizeTextForTokenSaving(info.distributionContent || "");

  // Cấu hình danh sách Model Google Gemini chuẩn với cơ chế tự động fallback thông minh
  // Ưu tiên các model phản hồi nhanh nhất và ổn định nhất cho mọi thế hệ API key
  const models = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro"
  ];
  
  let distributionContext = "";
  if ((options.integrateNLS || options.integrateAI) && info.distributionContent && info.distributionContent.trim().length > 0) {
      distributionContext = `
      =========================================================
      🚨 QUY TẮC TÍCH HỢP TỪ PHÂN PHỐI CHƯƠNG TRÌNH / PHỤ LỤC 1 / PHỤ LỤC 3 (CV 5512):
      Người dùng ĐÃ CUNG CẤP nội dung Phân phối chương trình (PPCT) / Phụ lục 1 / Phụ lục 3.
      Đây là văn bản kế hoạch pháp quy, bạn phải tuân thủ TUYỆT ĐỐI các yêu cầu sau:
      1. Đọc tên bài học trong "NỘI DUNG GIÁO ÁN GỐC".
      2. Căn cứ vào các cột có trong bảng PPCT / Phụ lục 1 / Phụ lục 3 của bài học đó, hãy sử dụng NGUYÊN VĂN, CHÍNH XÁC:
         - Yêu cầu cần đạt (YCCĐ) theo chương trình.
         - Nội dung cột "Năng lực số" (hoặc YCCĐ năng lực số, Các chỉ báo NLS) nếu có.
         - Nội dung cột "Năng lực AI" (hoặc YCCĐ năng lực AI) nếu có.
         - Nội dung cột "Hoạt động AI lồng ghép" (Mục tiêu tích hợp) nếu có.
         - Nội dung cột "Mã 2422" (hoặc YCCĐ theo khung 2422) nếu có.
      3. Đưa toàn bộ nội dung đó vào phần Mục tiêu và các Hoạt động dạy học tương ứng trong giáo án một cách hài hòa, chuẩn xác.
      
      ⛔️ CÁC ĐIỀU CẤM:
      - CẤM TUYỆT ĐỐI việc tự ý bịa thêm bất kỳ năng lực số, hoạt động AI hay mã 2422 nào mâu thuẫn với Phụ lục 1 / Phụ lục 3 / PPCT đã nạp.
      - CẤM tự ý nâng cao hay thay đổi cấp độ nếu tài liệu không yêu cầu.
      - Nếu các cột NLS/AI trong bảng để trống, thực hiện tích hợp bổ sung phù hợp theo chuẩn Bộ GD&ĐT.
      Đánh dấu mục tiêu/hoạt động này bằng dòng chữ: "(Nội dung tích hợp từ PPCT / Phụ lục)".

      NỘI DUNG PHÂN PHỐI CHƯƠNG TRÌNH / PHỤ LỤC 1 / PHỤ LỤC 3 (DỮ LIỆU CUNG CẤP):
      ${cleanDistribution}
      =========================================================
      `;
  }


  let aiTableContext = "";
  if (options.integrateAI) {
      let filteredMasterData = masterDataCsv;
      if (info.grade) {
          const targetLop = `,Lớp ${info.grade},`;
          const lines = masterDataCsv.split("\n");
          if (lines.length > 0) {
              const header = lines[0];
              const filteredLines = lines.slice(1).filter(line => line.includes(targetLop));
              if (filteredLines.length > 0) {
                  filteredMasterData = [header, ...filteredLines].join("\n");
              }
          }
      }

      if (info.manualAI && info.manualAI.length > 0) {
          aiTableContext = `
      =========================================================
      🤖 YÊU CẦU TÍCH HỢP NĂNG LỰC AI CỤ THỂ TỪ NGƯỜI DÙNG:
      Người dùng đã chỉ định cụ thể các Yêu cầu cần đạt AI sau đây:
      ${info.manualAI.map((m, i) => `${i + 1}. [${m.code}] ${m.name}: ${m.description}`).join('\n      ')}

      Yêu cầu BẮT BUỘC:
      1. TRONG PHẦN I. MỤC TIÊU:
         - Dưới mục "d) Năng lực AI (hoặc Năng lực số AI):" (hoặc mục Năng lực AI tương ứng trong phần 2. Năng lực), ĐÃ CÓ TIÊU ĐỀ MỤC NÊN TUYỆT ĐỐI KHÔNG LẶP LẠI chữ "Tích hợp năng lực AI:".
         - Ghi trực tiếp mã và nội dung YCCĐ: *[${info.manualAI[0]?.code || 'Mã YCCĐ'}] ${info.manualAI.map(m => `[${m.code}] ${m.description}`).join('; ')}
      2. TRONG PHẦN II. TIẾN TRÌNH DẠY HỌC:
         - Tự sáng tạo 1 hoạt động hoặc điều chỉnh nội dung 1 hoạt động trong tiến trình dạy học (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) để lồng ghép YCCĐ AI đó vào, BẮT BUỘC bắt đầu bằng * ở đầu câu và GHI RÕ MÃ CHỈ BÁO: *Tích hợp năng lực AI: [Nhiệm vụ lồng ghép AI cụ thể] (Mã chỉ báo: [Mã YCCĐ])
      =========================================================
          `;
      } else {
          aiTableContext = `
      =========================================================
      🤖 YÊU CẦU TÍCH HỢP NĂNG LỰC AI (TỰ ĐỘNG PHÂN TÍCH):
      Người dùng yêu cầu Tích hợp năng lực AI nhưng KHÔNG chỉ định cụ thể YCCĐ.
      Bạn BẮT BUỘC phải dựa vào file DỮ LIỆU CHUẨN dưới đây để tự tìm Yêu cầu cần đạt (YCCĐ) AI phù hợp nhất với bài học này.

      1. Đọc tên bài học, môn học, lớp học trong "NỘI DUNG GIÁO ÁN GỐC".
      2. Tra cứu trong DỮ LIỆU CHUẨN AI bên dưới (lọc theo Cấp học/Lớp).
      3. Chọn 1-2 YCCĐ AI (Yêu cầu cần đạt) PHÙ HỢP NHẤT với nội dung của bài học hiện tại. Ưu tiên các nội dung "Cốt lõi". TUYỆT ĐỐI KHÔNG TỰ BỊA CHỈ BÁO NĂNG LỰC AI.
      4. TRONG PHẦN I. MỤC TIÊU:
         - Dưới mục "d) Năng lực AI (hoặc Năng lực số AI):" (hoặc mục Năng lực AI tương ứng trong phần 2. Năng lực), ĐÃ CÓ TIÊU ĐỀ MỤC NÊN TUYỆT ĐỐI KHÔNG LẶP LẠI chữ "Tích hợp năng lực AI:". Ghi trực tiếp: *[Mã YCCĐ] [Nội dung YCCĐ cụ thể]
      5. TRONG PHẦN II. TIẾN TRÌNH DẠY HỌC:
         - Tự sáng tạo 1 hoạt động hoặc điều chỉnh nội dung 1 hoạt động trong tiến trình dạy học (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) để lồng ghép YCCĐ AI đó vào: *Tích hợp năng lực AI: [Nhiệm vụ lồng ghép AI cụ thể]
      
      DỮ LIỆU CHUẨN AI (Dùng để tra cứu mã năng lực và YCCĐ):
      ${filteredMasterData}
      =========================================================
          `;
      }
  }

  // Format manual entries
  let manualContext = "";
  if (options.integrateNLS && info.manualNLS && info.manualNLS.length > 0) {
      const manualItems = info.manualNLS.map(item => `- Năng lực [${item.code} - ${item.name}]:\n  Nội dung yêu cầu: ${item.description}`).join("\n\n");
      manualContext = `
      =========================================================
      🎯 YÊU CẦU CỤ THỂ TỪ GIÁO VIÊN VỀ TÍCH HỢP NLS (MANUAL INPUT - ƯU TIÊN CAO NHẤT):
      Người dùng đã chỉ định cụ thể các năng lực và nội dung yêu cầu NLS cần tích hợp. 
      Bạn BẮT BUỘC phải đưa các nội dung này vào giáo án, ngay cả khi PPCT không đề cập.
      
      Danh sách yêu cầu:
      ${manualItems}
      
      NHIỆM VỤ QUAN TRỌNG:
      1. TRONG PHẦN I. MỤC TIÊU:
         - Dưới mục "c) Năng lực số (NLS):" (hoặc "c) Năng lực số:"), ĐÃ CÓ TIÊU ĐỀ NÊN TUYỆT ĐỐI KHÔNG LẶP LẠI chữ "Tích hợp năng lực số:".
         - Ghi trực tiếp nội dung chỉ báo: *[Nội dung chỉ báo & yêu cầu cần đạt] (Mã chỉ báo: ${info.manualNLS.map(n => n.code).join(', ')}). TUYỆT ĐỐI KHÔNG GẠCH CHÂN.
      2. TRONG PHẦN II. TIẾN TRÌNH DẠY HỌC:
         - Tự động PHÂN TÍCH và XÁC ĐỊNH hoạt động phù hợp nhất trong tiến trình dạy học để đưa nhiệm vụ NLS vào.
         - Bắt đầu bằng * ở đầu câu, KHÔNG có gạch đầu dòng: *Tích hợp năng lực số: [Nội dung chỉ báo & hành động] (Mã chỉ báo). TUYỆT ĐỐI KHÔNG GẠCH CHÂN.
      =========================================================
      `;
  }

  let disabilityContext = "";
  if (options.integrateDisability && info.selectedDisabilities && info.selectedDisabilities.length > 0) {
      const selectedDisabilitiesStr = info.selectedDisabilities.join(", ");
      
      const detailedDisabilityGuidelines = info.selectedDisabilities.map((dis, idx) => {
          const guide = DISABILITY_PEDAGOGICAL_GUIDELINES[dis] || {
              name: `Học sinh khuyết tật ${dis}`,
              shortDesc: `Dạng khuyết tật ${dis}`,
              targetHint: "Điều chỉnh giảm tải mục tiêu kiến thức và kỹ năng phù hợp với khả năng tiếp thu của học sinh.",
              activityAdjustment: "Giáo viên hỗ trợ cá nhân hóa, hướng dẫn 1 kèm 1, tạo điều kiện thuận lợi nhất cho học sinh tham gia học tập cùng bạn bè."
          };
          return `
      ${idx + 1}. DẠNG KHUYẾT TẬT: ${dis.toUpperCase()} (${guide.name})
         - Đặc điểm: ${guide.shortDesc}
         - Yêu cầu điều chỉnh Mục tiêu: ${guide.targetHint}
         - Yêu cầu điều chỉnh Hoạt động (Tiến trình dạy học): ${guide.activityAdjustment}
         - Cú pháp dòng: *${guide.name}: [Nội dung điều chỉnh riêng biệt]`;
      }).join("\n");

      disabilityContext = `
      =========================================================
      🧑‍🦽 QUY TẮC BẮT BUỘC TÍCH HỢP GIÁO DỤC HÒA NHẬP (CHUẨN HÓA CẤU TRÚC 1 TIÊU ĐỀ + XUỐNG DÒNG TỪNG LOẠI):
      Người dùng đã tích chọn ${info.selectedDisabilities.length} dạng khuyết tật: ${selectedDisabilitiesStr}
      
      🚨 ĐẶC BIỆT LƯU Ý VỀ CẤU TRÚC TRÌNH BÀY (TUYỆT ĐỐI TUÂN THỦ):
      Chữ "*Tích hợp giáo dục hòa nhập:" chỉ xuất hiện ĐÚNG 1 LẦN ở dòng tiêu đề đầu câu, sau đó xuống dòng liệt kê từng dạng khuyết tật đã tích chọn với tiền tố "*", KHÔNG CÓ GẠCH ĐẦU DÒNG:

      ${detailedDisabilityGuidelines}

      1. TRONG PHẦN I. MỤC TIÊU:
         - 🚨 VỊ TRÍ BẮT BUỘC: Đặt ở CUỐI CÙNG của mục "3. Phẩm chất:" (sau khi đã liệt kê xong tất cả các phẩm chất Chăm chỉ, Trung thực, Trách nhiệm... ở mục 3; TUYỆT ĐỐI KHÔNG ĐƯỢC đặt ở mục 2. Năng lực hay trước mục 3. Phẩm chất).
         - Trình bày CHÍNH XÁC theo mẫu sau (TUYỆT ĐỐI KHÔNG LẶP LẠI cụm từ "Tích hợp giáo dục hòa nhập" trên từng dòng):
         *Tích hợp giáo dục hòa nhập:
${info.selectedDisabilities.map(d => `*${DISABILITY_PEDAGOGICAL_GUIDELINES[d]?.name || `HS khuyết tật ${d}`}: [Mục tiêu cụ thể đã giảm tải/điều chỉnh riêng cho dạng này]`).join('\n')}

      2. TRONG PHẦN II. TIẾN TRÌNH DẠY HỌC (CÁC HOẠT ĐỘNG):
         - Trong các Hoạt động dạy học (trong Cột 1 hoặc Cột 2 của bảng 2 cột), khi có điều chỉnh giáo dục hòa nhập, BẮT BUỘC dùng thẻ <br> để xuống dòng bên trong ô bảng (TUYỆT ĐỐI KHÔNG DÙNG PHÍM ENTER / DẤU XUỐNG DÒNG THẬT VÌ SẼ LÀM GÃY BẢNG):
         *Tích hợp giáo dục hòa nhập:<br>${info.selectedDisabilities.map(d => `*${DISABILITY_PEDAGOGICAL_GUIDELINES[d]?.name || `HS khuyết tật ${d}`}: [Biện pháp hỗ trợ/nhiệm vụ học tập điều chỉnh riêng]`).join('<br>')}
         - TUYỆT ĐỐI KHÔNG GẠCH CHÂN.
      =========================================================
      `;
  }

  let gdqpanContext = "";
  if (options.integrateGDQPAN) {
      gdqpanContext = `
      =========================================================
      🇻🇳 YÊU CẦU TÍCH HỢP GIÁO DỤC QUỐC PHÒNG VÀ AN NINH (GDQPAN):
      Người dùng yêu cầu Tích hợp GDQPAN theo Thông tư của Bộ GD&ĐT.
      Bạn BẮT BUỘC phải tham chiếu "DỮ LIỆU TÍCH HỢP GIÁO DỤC QUỐC PHÒNG VÀ AN NINH (GDQPAN) THEO THÔNG TƯ" (nếu được cung cấp trong khối dữ liệu dưới) để lồng ghép.
      
      NHIỆM VỤ QUAN TRỌNG:
      1. Xác định Cấp học/Lớp học hiện tại.
      2. Đối chiếu Nội dung Chủ đề GDQPAN chung và Chủ đề GDQPAN cụ thể của lớp đó.
      3. Chọn ra 1-2 nội dung giáo dục liên quan hoặc dễ tích hợp nhất vào bài học này (chủ đề lịch sử, đoàn kết, chủ quyền biển đảo, an ninh mạng, v.v.).
      4. Bổ sung vào phần Mục tiêu và lồng ghép vào hoạt động dạy học tương ứng.
      5. Bắt đầu bằng * ở đầu câu: *Tích hợp Lồng ghép GDQP-AN: [Nội dung lồng ghép cụ thể]. TUYỆT ĐỐI KHÔNG DÙNG GẠCH ĐẦU DÒNG HAY GẠCH CHÂN.
      =========================================================
      `;
  }

  let stemContext = "";
  if (options.integrateSTEM) {
      const stemLabel = options.stemType === 'topic' ? "Chủ đề STEM" : "Tích hợp STEM";
      stemContext = `
      =========================================================
      🔬 YÊU CẦU TÍCH HỢP BÀI HỌC STEM / CHỦ ĐỀ STEM (THEO QUY ĐỊNH BỘ GD&ĐT):
      1. TÊN BÀI HỌC: Vẫn ghi tên bài dạy chuẩn nhưng mở ngoặc: (${stemLabel})
         Ví dụ: # BÀI 5: ĐỊNH DẠNG VĂN BẢN VÀ BẢNG BIỂU (${stemLabel})
      2. HOẠT ĐỘNG STEM TRONG TIẾN TRÌNH:
         - Toàn bộ nội dung hướng dẫn hoạt động STEM (Thiết kế chế tạo sản phẩm, ứng dụng giải quyết vấn đề thực tế, quy trình kỹ thuật/khoa học/công nghệ/toán) BẮT BUỘC ĐƯỢC GHÉP VÀO CỘT 2 CỦA HOẠT ĐỘNG VẬN DỤNG.
         - Trong Hoạt động Vận dụng, nêu rõ: *Tích hợp STEM: [Thử thách/Nhiệm vụ thiết kế sản phẩm của HS, Tiêu chí đánh giá sản phẩm].
      =========================================================
      `;
  }

  const isEnglishPrompt = info.isEnglish 
    ? "- Yêu cầu đặc biệt: BẮT BUỘC TRẢ VỀ GIÁO ÁN BẰNG NGÔN NGỮ TIẾNG ANH (ENGLISH). Toàn bộ nội dung, tiêu đề, các bước, hoạt động đều phải được dịch và trình bày bằng tiếng Anh." 
    : "";

  let nlsFrameworkContext = "";
  if (options.integrateNLS) {
      nlsFrameworkContext = `
  DỮ LIỆU THAM CHIẾU KHUNG NĂNG LỰC SỐ (Chỉ sử dụng khi KHÔNG CÓ file PPCT hoặc để hiểu rõ mã năng lực trong PPCT):
  ${NLS_FRAMEWORK_DATA}
  `;
  }

  const activeIntegrations: string[] = [];
  if (options.integrateNLS) activeIntegrations.push("Năng lực số (NLS)");
  if (options.integrateAI) activeIntegrations.push("Năng lực Trí tuệ nhân tạo (AI)");
  if (options.integrateDisability) activeIntegrations.push("Giáo dục hòa nhập (HS khuyết tật)");
  if (options.integrateGDQPAN) activeIntegrations.push("Giáo dục quốc phòng và an ninh (GDQP-AN)");
  if (options.integrateSTEM) activeIntegrations.push(options.stemType === 'topic' ? "Chủ đề STEM" : "Tích hợp STEM");

  const activeListStr = activeIntegrations.length > 0 ? activeIntegrations.join(", ") : "KHÔNG TÍCH HỢP LOẠI NÀO (Chỉ chuẩn hóa kế hoạch bài dạy theo Phụ lục 4)";

  let userPromptText = `
  ${nlsFrameworkContext}
    THÔNG TIN BÀI HỌC (CHỈ ĐỂ THAM KHẢO, NẾU LỆCH VỚI GIÁO ÁN GỐC THÌ PHẢI THEO GIÁO ÁN GỐC):
    ${info.subject ? `- Môn học: ${info.subject}` : '- Môn học: (Tính toán tự động)'}
    ${info.grade ? `- Khối lớp: ${info.grade}` : '- Khối lớp: (Tính toán tự động)'}
    ${info.lessonTitle ? `- Tên bài dạy: ${info.lessonTitle}` : ''}
    ${info.duration ? `- Số tiết: ${info.duration}` : ''}
    ... (Các thông tin này chỉ là thông tin người dùng điền ngắn gọn, GIÁO ÁN GỐC (nếu có) luôn luôn là ưu tiên tối đa).
    ${isEnglishPrompt}
    
    =========================================================
    🚨 YÊU CẦU QUAN TRỌNG VỀ GIỮ NGUYÊN THÔNG TIN GỐC, BẢO TOÀN HÌNH VẼ & CẤU TRÚC PHÁP QUY:
    - BẠN BẮT BUỘC PHẢI DỰA VÀO "NỘI DUNG GIÁO ÁN GỐC" BÊN DƯỚI ĐỂ LÀM KHUNG CHUẨN KHI CHỈNH SỬA.
    - BẮT BUỘC GIỮ NGUYÊN TÊN BÀI HỌC, ĐỀ TÀI, MÔN HỌC, LỚP HỌC của "NỘI DUNG GIÁO ÁN GỐC".
    - TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ SUY DIỄN, tự sáng tác hoặc lấy tên bài học từ Dữ liệu bổ sung (PPCT / Bảng AI) để thay thế bài học gốc.
    - 🚨 BẢO TOÀN 100% HÌNH VẼ, HÌNH ẢNH, SƠ ĐỒ GỐC (BẮT BUỘC TUYỆT ĐỐI):
      * Tất cả các hình vẽ, hình ảnh, sơ đồ trong giáo án gốc có mã [HINHANHGOC_1], [HINHANHGOC_2]... hoặc [HINH_ANH_GOC_1], [IMG1]... BẮT BUỘC PHẢI GIỮ NGUYÊN 100% VỊ TRÍ VÀ NGUYÊN MÃ ĐỊNH DANH ĐÓ trong CỘT 2: "KẾT QUẢ HOẠT ĐỘNG" (CỘT SẢN PHẨM) của bảng 2 cột.
      * TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA BỎ, KHÔNG ĐƯỢC THAY ĐỔI MÃ, KHÔNG ĐƯỢC ĐẶT Ở CỘT 1 "Hoạt động của giáo viên và học sinh".
      * 🚨 VỊ TRÍ ĐẶT HÌNH ẢNH BẮT BUỘC: ĐẶT TẠI CỘT 2 (KẾT QUẢ HOẠT ĐỘNG / SẢN PHẨM). Cú pháp: <br>[HINHANHGOC_1]<br>.
    - KẾ HOẠCH BÀI DẠY (PHỤ LỤC 4) XÂY DỰNG THEO BÀI HỌC HOÀN CHỈNH. TUYỆT ĐỐI KHÔNG GHI NGÀY SOẠN, NGÀY GIẢNG. Thứ tự tiết ghi theo Phụ lục 3, sau hoạt động đầu tiên của mỗi tiết.
    - PHẦN TIÊU ĐỀ ĐẦU BÀI DẠY (BẮT BUỘC TRÌNH BÀY ĐÚNG 3 DÒNG CĂN GIỮA):
      <center>

      **Bài [Số]: [TÊN BÀI HỌC IN HOA]**
      Môn học/Hoạt động giáo dục: [Tên môn]; lớp: [Các lớp học]
      Thời gian thực hiện: [Số tiết] tiết; Tiết PPCT: [Các tiết PPCT]

      </center>

    - PHẦN MỤC TIÊU (CHUẨN CÔNG VĂN 5512 - GDPT 2018):
      **I. Mục tiêu**
      **1. Kiến thức:**
      - [Nêu cụ thể các yêu cầu cần đạt về kiến thức của bài học]
      **2. Năng lực:**
      **a) Năng lực đặc thù:**
      (Đối với môn Toán, nêu rõ các năng lực đặc thù Toán học hình thành qua bài học):
      - Năng lực tư duy và lập luận toán học: [Mô tả cụ thể gắn với nội dung bài học]
      - Năng lực giải quyết vấn đề toán học: [Mô tả cụ thể gắn với nội dung bài học]
      - Năng lực giao tiếp toán học: [Mô tả cụ thể gắn với nội dung bài học]
      - Năng lực mô hình hóa toán học (nếu có): [Mô tả cụ thể gắn với bài học]
      - Năng lực sử dụng công cụ, phương tiện học toán: [Sử dụng thước, máy tính cầm tay, phần mềm GeoGebra/Excel...]
      **b) Năng lực chung:**
      - Năng lực tự chủ và tự học: [Mô tả cụ thể phát triển qua bài học]
      - Năng lực giao tiếp và hợp tác: [Mô tả cụ thể khi thảo luận nhóm, cặp đôi]
      - Năng lực giải quyết vấn đề và sáng tạo: [Mô tả cụ thể khi giải bài tập, tình huống]
      ${options.integrateNLS ? '**c) Năng lực số:**\n      *[Nội dung chỉ báo & yêu cầu cần đạt NLS] (Mã chỉ báo: ...)' : ''}
      ${options.integrateAI ? `**${options.integrateNLS ? 'd)' : 'c)'} Năng lực AI:**\n      *[Mã YCCĐ] [Nội dung YCCĐ AI cụ thể]` : ''}
      ${options.integrateSTEM ? `**${options.integrateNLS && options.integrateAI ? 'e)' : (options.integrateNLS || options.integrateAI ? 'd)' : 'c)')} Giáo dục Stem:**\n      *Tích hợp STEM: [Nội dung mục tiêu STEM]` : ''}
      **3. Phẩm chất:**
      - Chăm chỉ: [Mô tả cụ thể]
      - Trung thực: [Mô tả cụ thể]
      - Trách nhiệm: [Mô tả cụ thể]
      ${options.integrateDisability ? `* 🚨 VỊ TRÍ GIÁO DỤC HÒA NHẬP: Đặt ở CUỐI CÙNG của mục "3. Phẩm chất:" (sau khi đã liệt kê xong các phẩm chất):\n*Tích hợp giáo dục hòa nhập:\n${info.selectedDisabilities?.map(d => `*${DISABILITY_PEDAGOGICAL_GUIDELINES[d]?.name || `HS khuyết tật ${d}`}: [Mục tiêu điều chỉnh riêng]`).join('\n') || '*HS khuyết tật: [Mục tiêu điều chỉnh]'}` : ''}
    - PHẦN THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU: Phải giống với Phụ lục 1 và 3 theo danh mục Thông tư 38 của Bộ GD&ĐT, chỉ thêm Ti vi (hoặc máy chiếu) vào Phụ lục 4. Trình bày theo 2 mục: 1. Giáo viên (Thiết bị theo TT 38, Ti vi, bài giảng...) và 2. Học sinh (SGK, đồ dùng học tập...) hoặc 1. Thiết bị dạy học; 2. Học liệu.
    - CẤU TRÚC TIẾN TRÌNH HOẠT ĐỘNG (CHUẨN PHỤ LỤC IV THEO CV 5512):
      ${options.layoutFormat === 'no_table' ? `* KHÔNG CẦN KẺ BẢNG -> ĐỂ ĐỦ 4 PHẦN: a) Mục tiêu; b) Nội dung; c) Sản phẩm; d) Tổ chức thực hiện (gồm 4 bước: Chuyển giao nhiệm vụ, Thực hiện nhiệm vụ, Báo cáo thảo luận, Kết luận nhận định).` : `* CÓ KẺ BẢNG -> 🚨 BẮT BUỘC 100% TẤT CẢ CÁC HOẠT ĐỘNG ĐỀU PHẢI CÓ ĐỦ 4 MỤC a, b, c, d VÀ KẺ BẢNG 2 CỘT Ở MỤC d:
        Cấu trúc chuẩn tuyệt đối:
        **III. Tiến trình dạy học**

        **1. Hoạt động 1: Khởi động (Tiết PPCT: Tiết ...)**
        **a) Mục tiêu:** [Nội dung mục tiêu, chỉ in đậm nhãn]
        **b) Nội dung:** [Nội dung học tập, chỉ in đậm nhãn]
        **c) Sản phẩm:** [Sản phẩm dự kiến, chỉ in đậm nhãn]
        **d) Tổ chức thực hiện:**
        | Hoạt động của giáo viên và học sinh | Kết quả hoạt động |
        | :--- | :--- |
        | (Cột 1: Bước 1: Chuyển giao nhiệm vụ; Bước 2: Thực hiện nhiệm vụ; Bước 3: Báo cáo, thảo luận; Bước 4: Kết luận, nhận định) | (Cột 2: Sản phẩm/câu trả lời/kết quả dự đoán) |

        **2. Hoạt động 2: Hình thành kiến thức mới**
        (Chỉ là tiêu đề mục cha in đậm, KHÔNG kẻ bảng trống ở đây, mà kẻ bảng trong từng Hoạt động con 2.1, 2.2 bên dưới)

        **Hoạt động 2.1: [Tên mục kiến thức 1] (Tiết PPCT: Tiết ...)**
        **a) Mục tiêu:** ...
        **b) Nội dung:** ...
        **c) Sản phẩm:** ...
        **d) Tổ chức thực hiện:**
        | Hoạt động của giáo viên và học sinh | Kết quả hoạt động |
        | :--- | :--- |
        | (Cột 1: Bước 1, Bước 2, Bước 3, Bước 4) | (Cột 2: Khung kiến thức, Ví dụ, Luyện tập, Hình ảnh [HINHANHGOC_1]) |

        **Hoạt động 2.2: [Tên mục kiến thức 2] (Tiết PPCT: Tiết ...)**
        **a) Mục tiêu:** ...
        **b) Nội dung:** ...
        **c) Sản phẩm:** ...
        **d) Tổ chức thực hiện:**
        | Hoạt động của giáo viên và học sinh | Kết quả hoạt động |
        | :--- | :--- |
        | (Cột 1: Bước 1, Bước 2, Bước 3, Bước 4) | (Cột 2: Khung kiến thức, Ví dụ, Luyện tập, Hình ảnh) |

        **3. Hoạt động 3: Luyện tập**
        **a) Mục tiêu:** ...
        **b) Nội dung:** ...
        **c) Sản phẩm:** ...
        **d) Tổ chức thực hiện:**
        | Hoạt động của giáo viên và học sinh | Kết quả hoạt động |
        | :--- | :--- |
        | (Cột 1: Bước 1, Bước 2, Bước 3, Bước 4) | (Cột 2: Toàn bộ bài tập luyện tập trong SGK và LỜI GIẢI CHI TIẾT) |

        **4. Hoạt động 4: Vận dụng**
        **a) Mục tiêu:** ...
        **b) Nội dung:** ...
        **c) Sản phẩm:** ...
        **d) Tổ chức thực hiện:**
        | Hoạt động của giáo viên và học sinh | Kết quả hoạt động |
        | :--- | :--- |
        | (Cột 1: Bước 1, Bước 2, Bước 3, Bước 4) | (Cột 2: Bài toán thực tế/vận dụng và lời giải chi tiết) |`}
    - PHẦN DẶN DÒ / HƯỚNG DẪN HỌC Ở NHÀ Ở CUỐI BÀI (ĐẶT HOÀN TOÀN NGOÀI BẢNG):
      * BẮT BUỘC dùng tiêu đề dạng: * Hướng dẫn về nhà: (TUYỆT ĐỐI KHÔNG DÙNG "IV. HƯỚNG DẪN TỰ HỌC VÀ DẶN DÒ VỀ NHÀ" HAY "IV. ...", VÀ PHẢI ĐẶT NGOÀI BẢNG).
      * Trình bày gồm 3 gạch đầu dòng chuẩn theo mẫu:
        - Ôn tập kiến thức: (Ghi nhớ nội dung kiến thức cốt lõi của bài học)
        - Bài tập về nhà: (Hoàn thành các bài tập còn lại trong SBT/SGK)
        - Chuẩn bị bài mới: (Đọc trước và chuẩn bị nội dung bài tiếp theo)
    =========================================================
    `;
    
    if (!info.isAutoGenerate && cleanContent) {
        userPromptText += `
    ------------- ĐÂY LÀ TÀI LIỆU CỐT LÕI MANG TÍNH QUYẾT ĐỊNH -------------
    NỘI DUNG GIÁO ÁN GỐC CẦN SỬA:
    ${cleanContent}
    --------------------------------------------------------------------------
        `;
    }

    userPromptText += `
    CÁC DỮ LIỆU BỔ SUNG ĐỂ TÍCH HỢP:
    ${distributionContext}

    ${aiTableContext}

    ${manualContext}
    
    ${disabilityContext}
    
    ${gdqpanContext}

    ${stemContext}
    `;

    let filteredGDQPAN = GDQPAN_DATA;
    if (options.integrateGDQPAN && info.grade) {
        const gradeNum = Number(info.grade);
        const gradeStr = `Lớp ${info.grade}`;
        const lines = GDQPAN_DATA.split('\n');
        const matchedLine = lines.find(l => l.startsWith(`- ${gradeStr}:`));
        let capHoc = "";
        if (gradeNum <= 5) capHoc = "Chủ đề chung (Lớp 1-5):";
        else if (gradeNum <= 9) capHoc = "Chủ đề chung (Lớp 6-9):";
        else capHoc = "Chủ đề chung (Lớp 10-12):";
        const chungLine = lines.find(l => l.includes(capHoc));
        if (matchedLine || chungLine) {
            filteredGDQPAN = `[DỮ LIỆU TÍCH HỢP GDQPAN CHO ${gradeStr}]\n${chungLine ? chungLine : ''}\n${matchedLine ? matchedLine : ''}`;
        }
    }

    if (options.integrateGDQPAN) {
       userPromptText += `\n${filteredGDQPAN}\n`;
    }

    const isNoTableLayout = options.layoutFormat === 'no_table';

    userPromptText += `
    [QUY CHUẨN KẾ HOẠCH BÀI DẠY (PHỤ LỤC 4) & TIẾN TRÌNH HOẠT ĐỘNG]
    - Tuân thủ chuẩn sư phạm, CHỈ TÍCH HỢP ĐÚNG CÁC LOẠI ĐÃ ĐƯỢC CHỌN: ${activeListStr}. TUYỆT ĐỐI KHÔNG TÍCH HỢP LAN MAN BẤT KỲ LOẠI NÀO NGOÀI DANH SÁCH NÀY.
    - Cấu trúc tiến trình dạy học:
    ${isNoTableLayout ? `
      * HÌNH THỨC KHÔNG KẺ BẢNG (4 PHẦN CHO MỖI HOẠT ĐỘNG):
        a) Mục tiêu: ...
        b) Nội dung: ...
        c) Sản phẩm: ...
        d) Tổ chức thực hiện:
           - Bước 1: Chuyển giao nhiệm vụ
           - Bước 2: Thực hiện nhiệm vụ
           - Bước 3: Báo cáo, thảo luận
           - Bước 4: Kết luận, nhận định
    ` : `
      * HÌNH THỨC KẺ BẢNG 2 CỘT (CHUẨN 100% PHỤ LỤC 4):
      🚨 BẮT BUỘC 100% CẢ 4 HOẠT ĐỘNG (Hoạt động 1: Khởi động, Hoạt động 2: Hình thành kiến thức mới, Hoạt động 3: Luyện tập, Hoạt động 4: Vận dụng) ĐỀU PHẢI CÓ ĐỦ 4 MỤC a, b, c, d VÀ KẺ BẢNG 2 CỘT Ở MỤC d:
      🚨 TUYỆT ĐỐI KHÔNG ĐƯỢC BỎ 2 MỤC "c) Sản phẩm" VÀ "d) Tổ chức thực hiện".
      🚨 ĐẶC BIỆT LƯU Ý VỚI HOẠT ĐỘNG 3 (LUYỆN TẬP) VÀ HOẠT ĐỘNG 4 (VẬN DỤNG):
      Tuyệt đối cấm không được để Hoạt động 3 (Luyện tập) và Hoạt động 4 (Vận dụng) ở ngoài bảng dù giáo án gốc để ở ngoài bảng hay gạch đầu dòng. Bắt buộc chuyển toàn bộ 4 bước tổ chức và lời giải chi tiết/bài tập vào bảng 2 cột:
      Mỗi hoạt động gồm các phần:
      **a) Mục tiêu:** ...
      **b) Nội dung:** ...
      **c) Sản phẩm:** ...
      **d) Tổ chức thực hiện:**
      | Hoạt động của giáo viên và học sinh | Kết quả hoạt động |
      | :--- | :--- |
      | Gồm 4 bước: **Bước 1: Chuyển giao nhiệm vụ:** [Nhiệm vụ GV giao, giao các bài tập cụ thể]<br>**Bước 2: Thực hiện nhiệm vụ:** [HS thực hiện, GV quan sát hỗ trợ]<br>**Bước 3: Báo cáo, thảo luận:** [HS trình bày, nhận xét]<br>**Bước 4: Kết luận, nhận định:** [GV chốt kiến thức và phương pháp] | Toàn bộ sản phẩm, lời giải chi tiết các bài tập, câu trả lời đầy đủ của HS |
    `}
    - VỊ TRÍ TÍCH HỢP: Sử dụng lúc nào trong bài học thì ghi trực tiếp vào chỗ đó trong tiến trình mỗi hoạt động, BẮT BUỘC bắt đầu bằng dấu * ở đầu câu (ví dụ: *Tích hợp năng lực số: ..., *Tích hợp năng lực AI: ..., *HS khuyết tật: ...).
    - KHÔNG chia thời lượng từng hoạt động.
    - 🚨 CHỐNG IN ĐẬM TÙY TIỆN: Chỉ in đậm đúng tên tiêu đề/nhãn, TUYỆT ĐỐI KHÔNG in đậm nội dung sau nhãn hoặc các câu diễn giải của GV/HS:
      + ✅ ĐÚNG: **Bước 1: Chuyển giao nhiệm vụ:** GV yêu cầu HS thảo luận...
      + ✅ ĐÚNG: **Kết luận:** Đơn thức là biểu thức đại số...
      + ✅ ĐÚNG: **HĐ1:** Biểu thức $x^2 - 2x$ không phải là đơn thức...
      + ✅ ĐÚNG: **Ví dụ 1:** Các biểu thức sau là đơn thức...
      + ✅ ĐÚNG: **Luyện tập 1:** Trong các biểu thức sau...
      + ✅ ĐÚNG: **Tranh luận:** Bạn Tròn đúng vì...
      + ✅ ĐÚNG: **Nhận xét:** Hai đơn thức đồng dạng...
      + ✅ ĐÚNG: **a)** Cả ba đơn thức $A$, $B$, $C$...
      + ❌ CẤM IN ĐẬM CẢ CÂU HOẶC HÀNH ĐỘNG CỦA GV/HS: Cấm ghi "**GV yêu cầu HS...**", "**GV dẫn dắt...**", "**HS thảo luận...**", "**Biểu thức x^2 - 2x...**", "**- Nhóm 1...**", "**Kết luận: Đơn thức là biểu thức...**".
    - BẢNG CON / BẢNG SỐ LIỆU NẰM TRONG CỘT: Bắt buộc dùng HTML \`<table><tr><td>...</td></tr></table>\` với \`style="font-size: 10pt; width: 100%;"\`. TUYỆT ĐỐI KHÔNG dùng ký tự markdown | | | bên trong bảng 2 cột vì sẽ làm biến dạng cấu trúc 2 cột.
    - BẢNG ĐỘC LẬP: Bắt buộc dùng Markdown Table.
    - CÔNG THỨC TOÁN HỌC & KHOA HỌC (CHUẨN LATEX 100% TƯƠNG THÍCH MATHTYPE & OMML):
      + BẮT BUỘC 100% tất cả các công thức toán, biểu thức, biến số ($x$, $y$, $z$, $a$, $b$, $c$), đơn thức ($2x^2y$, $-5x^2y$, $17z^4$, $3x^3y$, $12x^5$), đa thức ($x^2 - 2x$, $x^3 - \frac{1}{2}x$, $-2x + 7y$, $x + 2y - z$), điểm ($A$, $B$, $C$, $\\Delta ABC$), phân số ($\\frac{a}{b}$, $\\frac{1}{2}$, $-\\frac{5}{9}$), căn bậc hai ($\\sqrt{x}$, $\\sqrt{2}$), số mũ ($x^2$, $x^2y^3$, $x^3y^2$), chỉ số dưới ($x_0$, $y_0$, $x_1$, $x_2$), hệ phương trình ($\\begin{cases} ax+by=c \\\\ a'x+b'y=c' \\end{cases}$), đẳng thức và chuỗi tính toán liên hoàn ($A + B = 2x^2y + (-5x^2y) = -3x^2y$, $M + P = 2,5x^2y^3 + 8,5x^2y^3 = 11x^2y^3$, $S = -x^3y + 4x^3y - 2x^3y = x^3y$, $(-1 + 4 - 2) = 1$, $B = 5x^2y^3z$), góc ($\\widehat{ABC}$, $\\widehat{A}$), độ ($^\\circ$), véc-tơ ($\\vec{u}$, $\\overrightarrow{AB}$), ký hiệu hình học ($\\parallel$, $\\perp$), suy ra ($\\Rightarrow$, $\\Leftrightarrow$), tập hợp ($\\in$, $\\notin$, $\\subset$, $\\cap$, $\\cup$, $\\emptyset$, $\\mathbb{R}$, $\\mathbb{N}$), quan hệ so sánh ($\\le$, $\\ge$, $\\neq$, $\\approx$), phép toán ($\\times$, $\\cdot$, $\\div$, $\\pm$) PHẢI viết bằng cú pháp LaTeX chuẩn đặt trong cặp dấu $...$ (nội dòng) hoặc $$...$$ (độc lập) để giáo viên có thể chuyển đổi trực tiếp sang MathType / OMML trong Word bằng 1 phím tắt Alt+\\ hoặc Alt+= mà không bao giờ bị lỗi.
      + 🚨 CHỐNG DÍNH CHỮ CÔNG THỨC TOÁN: Luôn có khoảng cách (dấu cách) giữa công thức toán $...$ và các từ tiếng Việt xung quanh (ví dụ: "Biểu thức $x^2 - 2x$ không phải", "cho $2x^2y$ và $-5x^2y$... là những đơn thức"). TUYỆT ĐỐI KHÔNG ĐỂ CÔNG THỨC TOÁN SÁT DÍNH VÀO TỪ BÊN CẠNH.
      + 🚨 CẤM TUYỆT ĐỐI VIẾT PHÂN SỐ VÀ BẤT ĐẲNG THỨC BẰNG TEXT THÔ:
        * CẤM viết phân số bằng dấu gạch chéo thô (như 2024/1000, 24/1000, -2022/2023, 1/2). BẮT BUỘC dùng phân số LaTeX trong $...$: ví dụ $\\frac{2024}{1000} = 2 + \\frac{24}{1000} > 1,9$ hoặc $-\\frac{2022}{2023} = -1 + \\frac{1}{2023} > -1,1$ hoặc $\\frac{1}{2}$.
        * CẤM viết bất đẳng thức hoặc so sánh bằng Unicode thô (như a≤50, b≤50, x≥0, x≠3). BẮT BUỘC dùng cú pháp LaTeX trong $...$: ví dụ $a \\le 50$, $b \\le 50$, $x \\ge 0$, $x \\neq 3$.
      + 🚨 PHỤC HỒI CÔNG THỨC MATHTYPE BỊ LỖI: Khi thấy "[CÔNG_THỨC_TOÁN: MathType]", "EMBED Equation.DSMT4", "Equation.DSMT4", "Equation.3" hoặc công thức bị mất từ file Word cũ, AI BẮT BUỘC dựa vào ngữ cảnh bài dạy để PHỤC HỒI LẠI TOÀN BỘ CÔNG THỨC TOÁN CHUẨN LATEX (ví dụ: bài Hệ hai phương trình bậc nhất hai ẩn thì phục hồi $\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}$, $(x_0; y_0)$, $ax+by=c$,...). TUYỆT ĐỐI KHÔNG ĐƯỢC để lại chuỗi "EMBED Equation" hay "DSMT4" trong kết quả trả về!
      + 🚨 QUY TẮC LATEX CHO MATHTYPE & OMML: BẮT BUỘC có đầy đủ cả dấu $ mở đầu và dấu $ kết thúc (ví dụ: $x^m \cdot x^n = x^{m+n}$, $(x^m)^n = x^{m \cdot n}$); Ký tự gạch đầu dòng (- hoặc +) BẮT BUỘC nằm bên ngoài cặp dấu $ (ghi "- $x^m \cdot x^n = x^{m+n}$", không viết "$- x^m...$"); TUYỆT ĐỐI KHÔNG dùng \mathbf{...} hay \textbf{...} bao bọc dấu hai chấm (:), phép chia, hoặc cả biểu thức toán (như $\mathbf{x^m : }$), mọi phép tính phải viết thuần LaTeX: $x^m : x^n = x^{m-n} \quad (x \neq 0, m \ge n)$; Không để khoảng trắng sát dấu $ (dùng $x + y = 1$, KHÔNG dùng $ x + y = 1 $); Hệ phương trình dùng $\begin{cases} ... \end{cases}$; TUYỆT ĐỐI KHÔNG chèn thẻ HTML hoặc dấu markdown bên trong $...$.
      + 🚨 TUYỆT ĐỐI KHÔNG ĐỂ CÔNG THỨC TOÁN / PHÂN SỐ THÀNH ẢNH: Tất cả phân số, biểu thức đại số, phép tính toán học (kể cả chuỗi phép tính nhiều bước liên tiếp, ví dụ: $-\\frac{5}{7} - \\frac{8}{21} = -\\frac{15}{21} - \\frac{8}{21} = -\\frac{23}{21}$) BẮT BUỘC PHẢI VIẾT BẰNG MÃ LATEX ĐẶT TRONG $...$, TUYỆT ĐỐI CẤM tạo mã [HINHANHGOC_...] hay chèn ảnh cho công thức toán!
      + 🚨 BẢO TOÀN 100% HÌNH VẼ MINH HỌA, SƠ ĐỒ HÌNH HỌC VÀ TRANH ẢNH SGK:
        * BẮT BUỘC giữ nguyên và đặt đầy đủ các mã hình vẽ minh họa [HINHANHGOC_1], [HINHANHGOC_2]... từ giáo án gốc hoặc trang SGK vào đúng hoạt động tương ứng (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng).
        * TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA BỎ các hình vẽ minh họa thực tế, sơ đồ hình học (tam giác, góc, đường tròn...), biểu đồ!
        * Chỉ cấm tạo ảnh cho công thức/phân số (công thức/phân số bắt buộc viết bằng LaTeX $...$). Còn TẤT CẢ hình vẽ, sơ đồ minh họa bài học BẮT BUỘC PHẢI GIỮ LẠI [HINHANHGOC_...]!
    
    [ĐÁNH DẤU TÍCH HỢP - CHỈ TÍCH HỢP ĐÚNG CÁC LOẠI ĐÃ ĐƯỢC CHỌN: ${activeListStr}]
    🚨 QUY TẮC BẮT BUỘC: BẠN CHỈ ĐƯỢC TÍCH HỢP CÁC LOẠI ĐÃ TÍCH CHỌN DƯỚI ĐÂY. TUYỆT ĐỐI CẤM KHÔNG ĐƯỢC TỰ Ý TÍCH HỢP LAN MAN BẤT KỲ LOẠI NÀO KHÁC NGOÀI DANH SÁCH:
    ${options.integrateNLS ? '- NLS: *Tích hợp năng lực số: [Nội dung & hành động] (Mã chỉ báo: NLS_...)' : '- NLS: KHÔNG TÍCH HỢP (TUYỆT ĐỐI CẤM đưa nội dung, mục tiêu hoặc chỉ báo NLS vào giáo án)'}
    ${options.integrateAI ? '- AI: *Tích hợp năng lực AI: [Nhiệm vụ lồng ghép AI] (Mã chỉ báo: AI_...)' : '- AI: KHÔNG TÍCH HỢP (TUYỆT ĐỐI CẤM đưa nội dung, mục tiêu hoặc nhiệm vụ AI vào giáo án)'}
    ${options.integrateGDQPAN ? '- GDQPAN: *Tích hợp Lồng ghép GDQP-AN: [Nội dung GDQPAN] (Chủ đề: ...)' : '- GDQPAN: KHÔNG TÍCH HỢP (TUYỆT ĐỐI CẤM đưa nội dung GDQPAN vào giáo án)'}
    ${options.integrateDisability ? '- HSKT: *Tích hợp giáo dục hòa nhập (HS khuyết tật [Tên dạng khuyết tật]): [Nội dung điều chỉnh riêng biệt]' : '- HSKT: KHÔNG TÍCH HỢP (TUYỆT ĐỐI CẤM đưa Giáo dục hòa nhập vào giáo án)'}
    ${options.integrateSTEM ? '- STEM: *Tích hợp STEM: [Thử thách/Nhiệm vụ thiết kế]' : '- STEM: KHÔNG TÍCH HỢP (TUYỆT ĐỐI CẤM đưa nội dung STEM vào giáo án)'}
    - TIỀN TỐ TÍCH HỢP BẮT BUỘC BẮT ĐẦU BẰNG DẤU * Ở ĐẦU CÂU, TUYỆT ĐỐI KHÔNG CÓ GẠCH ĐẦU DÒNG (- ) TRƯỚC DẤU *.
    - TUYỆT ĐỐI KHÔNG GẠCH CHÂN (KHÔNG DÙNG THẺ <u>).
    - TUYỆT ĐỐI KHÔNG DÙNG DẤU THĂNG (#####, ####, ###) CHO CÁC MỤC a), b), c)... (Dùng in đậm **a) Mục tiêu:**, **b) Nội dung:**...).
    - TUYỆT ĐỐI KHÔNG IN NGHIÊNG TÙY TIỆN VĂN BẢN TRONG GIÁO ÁN.
    - CÔNG THỨC TOÁN HỌC PHẢI CÓ DẤU CÁCH VỚI TỪ BÊN CẠNH, KHÔNG ĐỂ SÁT DÍNH VÀO CHỮ.
    
    [ĐẦU RA - QUY CÁCH THÔNG TƯ 30]
    - Định dạng Markdown chuẩn, chuyên nghiệp, không rác định dạng.
    - KHÔNG có lời dẫn.
${info.isAutoGenerate ? `    - Bắt đầu bằng Heading 1: # TÊN BÀI HỌC ${options.integrateSTEM ? `(${options.stemType === 'topic' ? 'Chủ đề STEM' : 'Tích hợp STEM'})` : ''}\n    - Dòng 2: <center>Môn học: ${info.subject} - Khối: ${info.grade} - Thời lượng: ${info.duration || 'Theo PPCT'}</center>` : `    - Bắt đầu ngay bằng Tên bài học GỐC ${options.integrateSTEM ? `(${options.stemType === 'topic' ? 'Chủ đề STEM' : 'Tích hợp STEM'})` : ''}.`}`;
    
    userPromptText += `
    YÊU CẦU QUAN TRỌNG VỀ LÀM SẠCH KẾT QUẢ CẦN TUÂN THỦ TÍCH CỰC:
    - TUYỆT ĐỐI KHÔNG DÙNG DẤU THĂNG (như #####, ####) ở đầu các tiểu mục.
    - TUYỆT ĐỐI KHÔNG được thêm các thông tin không phải bài giảng vào Tên bài học hoặc đầu trang.
    - TUYỆT ĐỐI KHÔNG ghi tên Nhóm tác giả, Tên người soạn giáo án (ví dụ như SP Tin, Anh Nguyet, Pham Huy, Giáo viên, Tổ chuyên môn...) vào phần đầu hoặc cuối kết quả trả về. Hãy CẮT BỎ hoàn toàn những thông tin rác rưởi này nêú trích xuất từ dữ liệu đầu vào.
    - TUYỆT ĐỐI KHÔNG sinh ra các dòng chỉ chứa toàn dấu chấm (....................) hoặc khoảng trắng kéo dài vô tận. Nếu giáo án gốc có các dòng điền chỗ trống dài (như phần Rút kinh nghiệm), hãy thu gọn chúng lại thành một dòng ngắn hoặc chỉ để lại "...".
    - KHÔNG được đảo vị trí các nội dung nếu không cần thiết.
    `;

  let filteredImages = info.sgkImagesBase64 || [];

  if (info.isAutoGenerate && filteredImages.length > 20 && info.lessonTitle) {
    if (onProgress) onProgress("Agent 1: Đang đọc Mục lục bằng AI để trích xuất vị trí bài học...");
    try {
      const first5 = filteredImages.slice(0, 5);
      const last5 = filteredImages.slice(-5);
      const tocImages = [...first5, ...last5];

      const tocPrompt = `BẠN LÀ TRỢ LÝ ĐỌC MỤC LỤC SÁCH GIÁO KHOA.
Tên bài học cần tìm: "${info.lessonTitle}"

Dưới đây là hình ảnh các trang đầu và trang cuối của cuốn sách (nơi thường chứa Mục lục).
Hãy tìm bài học trên trong Mục lục, sau đó trả về SỐ TRANG in trên sách (startPage) và trang bắt đầu của bài học tiếp theo (endPage). Nếu là bài cuối, endPage lớn hơn startPage khoảng 5-10 trang.

TRẢ VỀ CHUỖI JSON HỢP LỆ, KHÔNG BỌC TRONG THẺ \`\`\`json, KHÔNG GIẢI THÍCH:
{
  "found": true/false,
  "startPage": số nguyên,
  "endPage": số nguyên
}`;

      let tocParts: any[] = [{ text: tocPrompt }];
      tocImages.forEach((b64) => {
          const mimeType = b64.startsWith("data:image/png") ? "image/png" : "image/jpeg";
          const data = b64.includes(",") ? b64.split(",")[1] : b64;
          tocParts.push({ inlineData: { data, mimeType } });
      });

      const tocResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: tocParts
      });

      if (tocResponse && tocResponse.text) {
        const textResp = tocResponse.text.trim().replace(/```json/gi, '').replace(/```/g, '');
        const jsonResult = JSON.parse(textResp);
        
        if (jsonResult.found && typeof jsonResult.startPage === 'number') {
           const startP = jsonResult.startPage;
           const endP = typeof jsonResult.endPage === 'number' && jsonResult.endPage > startP 
                          ? jsonResult.endPage 
                          : startP + 5;
           
           // Giả định offset (sai số giữa số trang và index mảng) tối đa +- 15
           const startIndex = Math.max(0, startP - 15);
           const endIndex = Math.min(filteredImages.length, endP + 10);
           
           filteredImages = filteredImages.slice(startIndex, endIndex);
           if (onProgress) onProgress(`Agent 1: Đã lọc ra ${filteredImages.length} trang sách có liên quan để tiết kiệm Token.`);
           console.log(`[Agent 1 ToC] start: ${startP}, end: ${endP}, startIndex: ${startIndex}, endIndex: ${endIndex}`);
        }
      }
    } catch (e) {
      console.warn("TOC extraction failed", e);
    }
  }

  const combinedPromptText = `[QUY TẮC PHÁP QUY & CHUYÊN GIA SƯ PHẠM]:
${SYSTEM_INSTRUCTION}

=========================================================
[YÊU CẦU SOẠN THẢO KẾ HOẠCH BÀI DẠY]:
${userPromptText}`;

  let parts: any[] = [{ text: combinedPromptText }];
  
  if (info.isAutoGenerate && filteredImages.length > 0) {
    filteredImages.forEach((base64Str) => {
      const mimeType = base64Str.startsWith("data:image/png") ? "image/png" : "image/jpeg"; 
      const data = base64Str.includes(",") ? base64Str.split(",")[1] : base64Str;
      parts.push({
        inlineData: {
          data: data,
          mimeType: mimeType
        }
      });
    });
  }

  const callModel = async (modelId: string): Promise<string> => {
    const requestConfig: any = {
       temperature: 0.2
    };

    let text = "";

    const isModelNotFound = (err: any): boolean => {
      const msg = (err?.message || (typeof err === 'string' ? err : JSON.stringify(err || ''))).toLowerCase();
      return msg.includes('404') || msg.includes('not_found') || msg.includes('not found') || msg.includes('unsupported') || msg.includes('is not found');
    };

    // 1. Thử gọi qua streaming trước để có preview mượt mà
    try {
      const responseStream = await ai.models.generateContentStream({
        model: modelId,
        config: requestConfig,
        contents: parts,
      });
      
      for await (const chunk of responseStream) {
          if (chunk.text) {
              text += chunk.text;
              if (onProgress) {
                  let previewText = text.replace(/^[ \t]*-[ \t]+([a-zA-Z]+\.|[0-9]+\.|[a-zA-Z]+\))/gmi, '$1');
                  onProgress(previewText);
              }
          }
      }
    } catch (streamError) {
      if (isModelNotFound(streamError)) {
        throw streamError;
      }
      console.warn(`[Stream] Model ${modelId} stream thất bại, tự động chuyển sang chế độ gọi trực tiếp...`, streamError);
      
      // 2. Fallback sang gọi thường (non-streaming)
      try {
        const directResp = await ai.models.generateContent({
          model: modelId,
          config: requestConfig,
          contents: parts,
        });
        text = directResp.text || "";
      } catch (directError) {
        if (isModelNotFound(directError)) {
          throw directError;
        }
        console.warn(`[Direct SDK] Model ${modelId} thất bại, thử nghiệm kết nối qua REST API...`, directError);
        
        // 3. Fallback cuối cùng: Gọi REST API chuẩn của Google Generative Language
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${activeApiKey}`;
        const restResponse = await fetch(restUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: combinedPromptText }] }],
            generationConfig: { temperature: 0.2 }
          })
        });

        if (restResponse.ok) {
          const restData = await restResponse.json();
          text = restData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          const errData = await restResponse.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${restResponse.status} ${restResponse.statusText}`);
        }
      }
    }

    if (!text || text.trim().length === 0) {
      throw new Error(`Model ${modelId} trả về phản hồi rỗng.`);
    }

    text = text.replace(/^[ \t]*-[ \t]+([a-zA-Z]+\.|[0-9]+\.|[a-zA-Z]+\))/gmi, '$1');
    
    // Rút gọn các dòng chứa quá nhiều dấu chấm, gạch dưới (hạn chế AI sinh hàng trăm trang)
    text = text.replace(/(?:[._…]\s*){15,}/g, '...');

    // Dọn sạch các lỗi $DoS hoặc $ DoS
    text = text.replace(/\$DoS\s*([^$]+?)\$\$/gi, '**ĐS:** $$1$');
    text = text.replace(/\$DoS\s*([^$]+?)\$/gi, '**ĐS:** $$1$');
    text = text.replace(/\bDoS\s*[:\-]?\s*/gi, '**ĐS:** ');

    // Tách tất cả các đề mục bị dính liền trên 1 dòng
    text = splitAllMergedHeadings(text);

    // 1. CHỐNG DÍNH CHỮ CÔNG THỨC TOÁN (Sử dụng hàm callback để tránh lỗi $1 $2)
    text = text.replace(/([^\s\$\(\[\{<|])\$([^\$\n\r]+?)\$/g, (_m, p1, p2) => `${p1} $${p2}$`);
    text = text.replace(/\$([^\$\n\r]+?)\$([^\s\$\)\],.:;!?%><|])/g, (_m, p1, p2) => `$${p1}$ ${p2}`);
    text = text.replace(/\$\s+([^$\n\r]+?)\s+\$/g, (_m, p1) => `$${p1.trim()}$`);

    // 2. CHUẨN HÓA CÁC ĐOẠN TÍCH HỢP: ĐỨNG ĐẦU CÂU, KHÔNG CÓ GẠCH ĐẦU DÒNG
    text = text.replace(/^[ \t]*[-+•*][ \t]+\*?(Tích\s*hợp)/gmi, '*$1');
    text = text.replace(/^[ \t]*[-+•][ \t]+(HS\s*khuyết\s*tật)/gmi, '*$1');
    text = text.replace(/^[ \t]*(Tích\s*hợp)/gmi, '*$1');
    text = text.replace(/^[ \t]*(HS\s*khuyết\s*tật)/gmi, '*$1');

    // Xóa bỏ tất cả thẻ span / font HTML thô rác sinh ra bởi AI
    text = text.replace(/<\/?(?:span|font)[^>]*>/gi, '');

    // 3. Đảm bảo tất cả các hoạt động đều nằm trong bảng 2 cột
    if (options.layoutFormat !== 'no_table') {
      text = ensureAllActivitiesInTwoColumnTable(text);
    }

    return text.trim();
  };

  try {
    let lastError: any = null;
    
    for (const modelId of models) {
        try {
            console.log(`Đang xử lý với model: ${modelId}`);
            let text = await callModel(modelId);
            if (text && text.trim().length > 0) {
              return text;
            }
        } catch (error: any) {
            console.warn(`Model ${modelId} gặp sự cố hoặc không khả dụng:`, error);
            lastError = error;
        }
    }

    // Format human-friendly error from lastError
    const parseError = (err: any): string => {
      const msg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err || ''));
      const errStr = msg.toLowerCase();

      if (errStr.includes("denied access") || errStr.includes("has been denied") || errStr.includes("permission_denied") || errStr.includes("403")) {
        return "Dự án Google Cloud của khóa API này đã bị Google từ chối truy cập hoặc tạm ngưng ('Your project has been denied access'). Vui lòng truy cập Google AI Studio (aistudio.google.com), nhấn 'Create API key' và chọn 'Create API key in new project' để lấy mã khóa từ một dự án mới hoàn toàn miễn phí.";
      }
      if (errStr.includes("api_key_invalid") || errStr.includes("api key not valid") || errStr.includes("invalid api key") || errStr.includes("api_key_missing") || errStr.includes("unauthenticated")) {
        return "Khóa API không hợp lệ hoặc đã bị xóa. Vui lòng nhấn nút 'Khóa API' ở góc trên để cập nhật lại mã khóa mới từ Google AI Studio.";
      }
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted")) {
        return "Khóa API đã hết hạn mức sử dụng (Google giới hạn 15 lượt gọi/phút cho tài khoản Free). Vui lòng đợi 30-60 giây rồi thử lại, hoặc nhấn 'Khóa API' để đổi khóa khác.";
      }
      if (errStr.includes("404") || errStr.includes("not_found") || errStr.includes("not found")) {
        return `Mô hình AI chưa sẵn sàng hoặc mã khóa chưa kích hoạt dịch vụ (${msg}). Vui lòng tạo API Key mới tại Google AI Studio (aistudio.google.com).`;
      }
      return `Lỗi kết nối Gemini API (${msg}). Vui lòng nhấn nút 'Khóa API' để kiểm tra lại mã khóa.`;
    };

    throw new Error(parseError(lastError));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const msg = error?.message || "";
    const errStr = msg.toLowerCase();
    if (errStr.includes("denied access") || errStr.includes("has been denied") || errStr.includes("permission_denied") || errStr.includes("403")) {
      throw new Error("Dự án Google Cloud của khóa API này đã bị Google từ chối truy cập ('Your project has been denied access'). Vui lòng vào Google AI Studio (aistudio.google.com), nhấn 'Create API key' rồi chọn 'Create API key in new project' để tạo khóa mới.");
    } else if (errStr.includes("api_key_invalid") || errStr.includes("api key not valid") || errStr.includes("invalid_argument")) {
      throw new Error("Khóa API không hợp lệ hoặc đã bị vô hiệu hóa. Vui lòng nhấn nút 'Khóa API' ở góc trên để nhập mã khóa mới.");
    } else if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted")) {
      throw new Error("Hạn mức API đã đạt giới hạn (Quota / 429). Vui lòng đợi 30-60 giây rồi thử lại, hoặc nhấn nút 'Khóa API' để đổi khóa API mới.");
    }
    throw new Error(error.message || "Không thể gọi Gemini API. Vui lòng thử lại hoặc kiểm tra lại Khóa API.");
  }
};