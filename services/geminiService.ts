import { GoogleGenAI } from "@google/genai";
import { LessonInfo, ProcessingOptions } from "../types";
import { SYSTEM_INSTRUCTION, NLS_FRAMEWORK_DATA, GDQPAN_DATA, DISABILITY_PEDAGOGICAL_GUIDELINES } from "../constants";
import { masterDataCsv } from "../masterData";

export const generateNLSLessonPlan = async (
  info: LessonInfo,
  options: ProcessingOptions,
  onProgress?: (text: string) => void
): Promise<string> => {
  
  // Priority 1: User's custom key, Priority 2: env key
  const rawKey = (options.customApiKey && options.customApiKey.trim()) 
    ? options.customApiKey 
    : (process.env.API_KEY || process.env.GEMINI_API_KEY || "");

  const activeApiKey = rawKey.trim().replace(/[\\`"']/g, '').trim();

  if (!activeApiKey) {
    throw new Error("Chưa có khóa API Google Gemini. Vui lòng nhấn nút 'Khóa API' ở góc trên bên phải để nhập mã API Key miễn phí từ Google AI Studio (hoặc cài đặt GEMINI_API_KEY trên Vercel).");
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

  // Cấu hình danh sách Model Google Gemini chính thức có hỗ trợ rộng rãi
  const models = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash"
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
         - Dưới mục "c) Năng lực trí tuệ nhân tạo (AI):" (hoặc "Năng lực AI:"), ĐÃ CÓ TIÊU ĐỀ MỤC NÊN TUYỆT ĐỐI KHÔNG LẶP LẠI chữ "Tích hợp năng lực AI:".
         - Ghi trực tiếp mã và nội dung YCCĐ bằng chữ màu đỏ: <span style="color: red;">*[${info.manualAI[0]?.code || 'Mã YCCĐ'}] ${info.manualAI.map(m => `[${m.code}] ${m.description}`).join('; ')}*</span>
      2. TRONG PHẦN II. TIẾN TRÌNH DẠY HỌC:
         - Tự sáng tạo 1 hoạt động hoặc điều chỉnh nội dung hoạt động trong tiến trình dạy học (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) để đáp ứng các YCCĐ AI trên, định dạng chữ màu đỏ: <span style="color: red;">*Tích hợp năng lực AI: [Hành động/nhiệm vụ của GV và HS]*</span>
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
         - Dưới mục "c) Năng lực trí tuệ nhân tạo (AI):" (hoặc "Năng lực AI:"), ĐÃ CÓ TIÊU ĐỀ MỤC NÊN TUYỆT ĐỐI KHÔNG LẶP LẠI chữ "Tích hợp năng lực AI:". Ghi trực tiếp Mã và Yêu cầu cần đạt bằng chữ màu đỏ: <span style="color: red;">*[Mã YCCĐ] [Nội dung YCCĐ cụ thể]*</span>
      5. TRONG PHẦN II. TIẾN TRÌNH DẠY HỌC:
         - Tự sáng tạo 1 hoạt động hoặc điều chỉnh nội dung 1 hoạt động trong tiến trình dạy học (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) để lồng ghép YCCĐ AI đó vào, định dạng chữ màu đỏ: <span style="color: red;">*Tích hợp năng lực AI: [Nhiệm vụ lồng ghép AI cụ thể]*</span>
      
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
         - Dưới mục "b) Năng lực số (NLS):" (hoặc "b) Năng lực số:"), ĐÃ CÓ TIÊU ĐỀ NÊN TUYỆT ĐỐI KHÔNG LẶP LẠI chữ "Tích hợp năng lực số:".
         - Ghi trực tiếp nội dung chỉ báo bằng chữ màu đỏ: <span style="color: red;">*[Nội dung chỉ báo & yêu cầu cần đạt] (Mã chỉ báo: ${info.manualNLS.map(n => n.code).join(', ')})*</span>. TUYỆT ĐỐI KHÔNG GẠCH CHÂN.
      2. TRONG PHẦN II. TIẾN TRÌNH DẠY HỌC:
         - Tự động PHÂN TÍCH và XÁC ĐỊNH hoạt động phù hợp nhất trong tiến trình dạy học để đưa nhiệm vụ NLS vào.
         - Tích hợp khéo léo vào hành động GV/HS bằng chữ màu đỏ: <span style="color: red;">*Tích hợp năng lực số: [Nội dung chỉ báo & hành động] (Mã chỉ báo)*</span>. TUYỆT ĐỐI KHÔNG GẠCH CHÂN.
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
         - Cú pháp dòng: + ${guide.name}: [Nội dung điều chỉnh riêng biệt]`;
      }).join("\n");

      disabilityContext = `
      =========================================================
      🧑‍🦽 QUY TẮC BẮT BUỘC TÍCH HỢP GIÁO DỤC HÒA NHẬP (CHUẨN HÓA CẤU TRÚC 1 TIÊU ĐỀ + XUỐNG DÒNG TỪNG LOẠI):
      Người dùng đã tích chọn ${info.selectedDisabilities.length} dạng khuyết tật: ${selectedDisabilitiesStr}
      
      🚨 ĐẶC BIỆT LƯU Ý VỀ CẤU TRÚC TRÌNH BÀY (TUYỆT ĐỐI TUÂN THỦ):
      Chữ "Tích hợp giáo dục hòa nhập" chỉ xuất hiện ĐÚNG 1 LẦN ở dòng tiêu đề, sau đó xuống dòng liệt kê từng dạng khuyết tật đã tích chọn với dấu "+", dạng nào tích thì xuống dòng ở dạng đó:

      ${detailedDisabilityGuidelines}

      1. TRONG PHẦN I. MỤC TIÊU:
         - 🚨 VỊ TRÍ BẮT BUỘC: Đặt ở CUỐI CÙNG của mục "3. Phẩm chất:" (sau khi đã liệt kê xong tất cả các phẩm chất Chăm chỉ, Trung thực, Trách nhiệm... ở mục 3; TUYỆT ĐỐI KHÔNG ĐƯỢC đặt ở mục 2. Năng lực hay trước mục 3. Phẩm chất).
         - Trình bày CHÍNH XÁC theo mẫu sau (TOÀN BỘ dùng chữ màu đỏ <span style="color: red;">...</span>, TUYỆT ĐỐI KHÔNG LẶP LẠI cụm từ "Tích hợp giáo dục hòa nhập" trên từng dòng):
         <span style="color: red;">*Tích hợp giáo dục hòa nhập:
${info.selectedDisabilities.map(d => `         - ${DISABILITY_PEDAGOGICAL_GUIDELINES[d]?.name || `HS khuyết tật ${d}`}: [Mục tiêu cụ thể đã giảm tải/điều chỉnh riêng cho dạng này]`).join('\n')}*</span>

      2. TRONG PHẦN II. TIẾN TRÌNH DẠY HỌC (CÁC HOẠT ĐỘNG):
         - Trong các Hoạt động dạy học (ở phần Mục tiêu hoạt động hoặc cột Tổ chức thực hiện / Bước 1, Bước 2), khi có điều chỉnh giáo dục hòa nhập, cũng trình bày 1 tiêu đề chung và xuống dòng từng loại:
         <span style="color: red;">*Tích hợp giáo dục hòa nhập:
${info.selectedDisabilities.map(d => `         - ${DISABILITY_PEDAGOGICAL_GUIDELINES[d]?.name || `HS khuyết tật ${d}`}: [Biện pháp hỗ trợ/nhiệm vụ học tập điều chỉnh riêng]`).join('\n')}*</span>
         - Dùng chữ màu đỏ <span style="color: red;">...</span>, TUYỆT ĐỐI KHÔNG GẠCH CHÂN.
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
      5. BẮT BUỘC DÙNG CHỮ MÀU ĐỎ và tiền tố: <span style="color: red;">*Tích hợp Lồng ghép GDQP-AN: [Nội dung lồng ghép cụ thể]</span>. TUYỆT ĐỐI KHÔNG DÙNG MÀU XANH HAY GẠCH CHÂN.
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
         - Toàn bộ nội dung hướng dẫn hoạt động STEM (Thiết kế chế tạo sản phẩm, ứng dụng giải quyết vấn đề thực tế, quy trình kỹ thuật/khoa học/công nghệ/toán) BẮT BUỘC ĐƯỢC GHÉP VÀO HOẠT ĐỘNG VẬN DỤNG.
         - Trong Hoạt động Vận dụng, nêu rõ bằng chữ màu đỏ: <span style="color: red;">*Tích hợp STEM: [Thử thách/Nhiệm vụ thiết kế sản phẩm của HS, Tiêu chí đánh giá sản phẩm]</span>.
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
      * Tất cả các hình vẽ, hình ảnh, sơ đồ trong giáo án gốc có mã [HINHANHGOC_1], [HINHANHGOC_2]... hoặc [HINH_ANH_GOC_1], [IMG1]... BẮT BUỘC PHẢI GIỮ NGUYÊN 100% VỊ TRÍ VÀ NGUYÊN MÃ ĐỊNH DANH ĐÓ trong bảng hoạt động hoặc trong các bước thực hiện của giáo án mới (ưu tiên ghi dưới dạng [HINHANHGOC_1], [HINHANHGOC_2]...).
      * TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA BỎ, KHÔNG ĐƯỢC THAY ĐỔI MÃ, KHÔNG ĐƯỢC BỎ QUÊN.
      * Khi đặt thẻ hình trong bảng 2 cột, hãy đặt thẻ trên một dòng riêng biệt hoặc dùng <br>[HINHANHGOC_1]<br>.
    - KẾ HOẠCH BÀI DẠY (PHỤ LỤC 4) XÂY DỰNG THEO BÀI HỌC HOÀN CHỈNH. TUYỆT ĐỐI KHÔNG GHI NGÀY SOẠN, NGÀY GIẢNG. Thứ tự tiết ghi theo Phụ lục 3, sau hoạt động đầu tiên của mỗi tiết.
    - PHẦN MỤC TIÊU:
      1. Kiến thức: YCCĐ theo chương trình GDPT 2018.
      2. Năng lực: TUYỆT ĐỐI KHÔNG GHI NĂNG LỰC CHUNG. CHỈ CÓ:
         - a) Năng lực đặc thù (hoặc Năng lực môn học)
         - b) Năng lực số (NLS): ĐÃ CÓ TIÊU ĐỀ NÊN TUYỆT ĐỐI KHÔNG GHI LẶP LẠI chữ "Tích hợp năng lực số:". Ghi TRỰC TIẾP nội dung chỉ báo bằng chữ màu đỏ: <span style="color: red;">*[Nội dung chỉ báo & yêu cầu cần đạt] (Mã chỉ báo)*</span>.
         ${options.integrateAI ? '- c) Năng lực trí tuệ nhân tạo (AI): ĐÃ CÓ TIÊU ĐỀ NÊN TUYỆT ĐỐI KHÔNG GHI LẶP LẠI chữ "Tích hợp năng lực AI:". Ghi TRỰC TIẾP nội dung bằng chữ màu đỏ: <span style="color: red;">*[Mã YCCĐ] [Nội dung YCCĐ cụ thể]*</span>.' : ''}
      3. Phẩm chất: Các phẩm chất cốt lõi gắn liền với bài học (Chăm chỉ, Trung thực, Trách nhiệm...).
      ${options.integrateDisability ? `* 🚨 VỊ TRÍ GIÁO DỤC HÒA NHẬP: Đặt ở CUỐI CÙNG của mục "3. Phẩm chất:" (sau khi đã liệt kê xong các phẩm chất):\n<span style="color: red;">*Tích hợp giáo dục hòa nhập:\n${info.selectedDisabilities?.map(d => `         - ${DISABILITY_PEDAGOGICAL_GUIDELINES[d]?.name || `HS khuyết tật ${d}`}: [Mục tiêu điều chỉnh riêng]`).join('\n') || '         - HS khuyết tật: [Mục tiêu điều chỉnh]*'}*</span>` : ''}
    - PHẦN THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU: Phải giống với Phụ lục 1 và 3 theo danh mục Thông tư 38 của Bộ GD&ĐT, chỉ thêm Ti vi (hoặc máy chiếu) vào Phụ lục 4. Trình bày theo 2 mục: 1. Giáo viên (Thiết bị theo TT 38, Ti vi, bài giảng...) và 2. Học sinh (SGK, đồ dùng học tập...) hoặc 1. Thiết bị dạy học; 2. Học liệu.
    - CẤU TRÚC TIẾN TRÌNH HOẠT ĐỘNG:
      ${options.layoutFormat === 'no_table' ? `* KHÔNG CẦN KẺ BẢNG -> ĐỂ ĐỦ 4 PHẦN: a) Mục tiêu; b) Nội dung; c) Sản phẩm; d) Tổ chức thực hiện (gồm 4 bước: Chuyển giao nhiệm vụ, Thực hiện nhiệm vụ, Báo cáo thảo luận, Kết luận nhận định).` : `* CÓ KẺ BẢNG -> CHỈ ĐỂ MỤC a, b VÀ BẢNG GỒM 2 CỘT (TUYỆT ĐỐI KHÔNG GHI DÒNG "c) Tổ chức thực hiện" HAY BẤT KỲ DÒNG TIÊU ĐỀ NÀO Ở NGOÀI BẢNG, SAU MỤC b LÀ VÀO THẲNG BẢNG 2 CỘT LUÔN):
      | Tổ chức thực hiện | Sản phẩm |
      | :--- | :--- |
      | (Cột 1: Đặt tên chính xác là "Tổ chức thực hiện" gồm đủ 4 bước: Bước 1: Chuyển giao nhiệm vụ; Bước 2: Thực hiện nhiệm vụ; Bước 3: Báo cáo, thảo luận; Bước 4: Kết luận, nhận định) | (Cột 2: Đặt tên chính xác là "Sản phẩm" chứa sản phẩm học tập/kết quả thực hiện tương ứng) |`}
    - PHẦN DẶN DÒ / HƯỚNG DẪN HỌC Ở NHÀ Ở CUỐI BÀI:
      * BẮT BUỘC dùng tiêu đề dạng: * Hướng dẫn về nhà (TUYỆT ĐỐI KHÔNG DÙNG "IV. HƯỚNG DẪN TỰ HỌC VÀ DẶN DÒ VỀ NHÀ" HAY "IV. ...").
      * Trình bày gồm các mục:
        1. Ôn tập kiến thức: (Nội dung ôn tập kiến thức cốt lõi)
        2. Bài tập về nhà: (Bài tập cụ thể trong SGK/SBT hoặc bài tập ứng dụng)
        3. Chuẩn bị bài mới: (Nội dung bài tiếp theo cần đọc trước)
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

    if (info.isAutoGenerate) {
      userPromptText += `
      [YÊU CẦU: TỰ SOẠN MỚI THEO PHỤ LỤC 4]
      - Soạn giáo án HOÀN TOÀN MỚI dựa trên SGK/thông tin bài học.
      - Tuân thủ chuẩn sư phạm, TÍCH HỢP ĐỒNG THỜI các yêu cầu (NLS, AI, Khuyết tật, GDQPAN, STEM) vào mục tiêu và tiến trình.
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
        * HÌNH THỨC KẺ BẢNG 2 CỘT:
          a) Mục tiêu: ...
          b) Nội dung: ...
          (TUYỆT ĐỐI KHÔNG GHI DÒNG "c) Tổ chức thực hiện" HAY BẤT KỲ DÒNG TIÊU ĐỀ NÀO Ở NGOÀI BẢNG, SAU MỤC b LÀ VÀO THẲNG BẢNG 2 CỘT):
          | Tổ chức thực hiện | Sản phẩm |
          | :--- | :--- |
          | (Cột 1: "Tổ chức thực hiện" đủ 4 bước: Bước 1: Chuyển giao nhiệm vụ, Bước 2: Thực hiện nhiệm vụ, Bước 3: Báo cáo thảo luận, Bước 4: Kết luận nhận định) | (Cột 2: "Sản phẩm" - Kết quả, sản phẩm học tập của HS) |
      `}
      `;
    } else {
      userPromptText += `
      [YÊU CẦU: XỬ LÝ NỘI DUNG GIÁO ÁN PHỤ LỤC 4]
      - ${options.analyzeOnly ? "Chỉ phân tích, không sửa chi tiết." : "Chỉnh sửa chi tiết, thiết kế lại cấu trúc logic theo đúng Phụ lục 4."}
      
      [CẤU TRÚC TIẾN TRÌNH HOẠT ĐỘNG]
      ${isNoTableLayout ? `
      * HÌNH THỨC KHÔNG KẺ BẢNG:
        Mỗi hoạt động gồm 4 phần:
        a) Mục tiêu: ...
        b) Nội dung: ...
        c) Sản phẩm: ...
        d) Tổ chức thực hiện:
           - Bước 1: Chuyển giao nhiệm vụ
           - Bước 2: Thực hiện nhiệm vụ
           - Bước 3: Báo cáo, thảo luận
           - Bước 4: Kết luận, nhận định
      ` : `
      * HÌNH THỨC KẺ BẢNG 2 CỘT:
        a) Mục tiêu: ...
        b) Nội dung: ...
        (TUYỆT ĐỐI KHÔNG GHI DÒNG "c) Tổ chức thực hiện" HAY "c) ..." Ở NGOÀI BẢNG, MỤC b XONG LÀ VÀO THẲNG BẢNG 2 CỘT):
        | Tổ chức thực hiện | Sản phẩm |
        | :--- | :--- |
        | Gồm 4 bước: Bước 1: Chuyển giao nhiệm vụ; Bước 2: Thực hiện nhiệm vụ; Bước 3: Báo cáo, thảo luận; Bước 4: Kết luận, nhận định | Sản phẩm tương ứng |
      `}
      - VỊ TRÍ TÍCH HỢP: Sử dụng lúc nào trong bài học thì ghi trực tiếp vào chỗ đó trong tiến trình mỗi hoạt động (gắn liền vào hành động của GV/HS, dùng chữ màu đỏ <span style="color: red;">*Tích hợp...</span>).
      - KHÔNG chia thời lượng từng hoạt động.
      - BẢNG LỒNG NHAU: Dùng \`<table><tr><td width="20%">...</td></tr></table>\`, thêm \`style="font-size: 10pt;"\`. KHÔNG dùng Enter trong mã HTML bảng con.
      - BẢNG ĐỘC LẬP: Bắt buộc dùng Markdown Table.
      - KÝ HIỆU: Ưu tiên Unicode (->, <-, =, +). Chỉ dùng LaTeX ($, $$) cho công thức cực kỳ phức tạp.
      
      [ĐÁNH DẤU TÍCH HỢP - BẮT BUỘC ĐỂ CHỮ MÀU ĐỎ, KHÔNG GẠCH CHÂN]
      - NLS: <span style="color: red;">*Tích hợp năng lực số: [Nội dung & hành động] (Mã chỉ báo)</span>
      - AI: <span style="color: red;">*Tích hợp năng lực AI: [Nhiệm vụ lồng ghép AI]</span>
      - GDQPAN: <span style="color: red;">*Tích hợp Lồng ghép GDQP-AN: [Nội dung GDQPAN]</span>
      - HSKT: <span style="color: red;">*Tích hợp giáo dục hòa nhập (HS khuyết tật [Tên dạng khuyết tật]): [Nội dung điều chỉnh riêng biệt]</span>
      - STEM: <span style="color: red;">*Tích hợp STEM: [Thử thách/Nhiệm vụ thiết kế]</span>
      - TUYỆT ĐỐI KHÔNG GẠCH CHÂN (KHÔNG DÙNG THẺ <u>).
      - TUYỆT ĐỐI KHÔNG DÙNG DẤU THĂNG (#####, ####, ###) CHO CÁC MỤC a), b), c)... (Dùng in đậm **a) Mục tiêu:**, **b) Nội dung:**...).
      
      [ĐẦU RA - QUY CÁCH THÔNG TƯ 30]
      - Định dạng Markdown chuẩn, chuyên nghiệp, không rác định dạng.
      - KHÔNG có lời dẫn.
${info.isAutoGenerate ? `      - Bắt đầu bằng Heading 1: # TÊN BÀI HỌC ${options.integrateSTEM ? `(${options.stemType === 'topic' ? 'Chủ đề STEM' : 'Tích hợp STEM'})` : ''}\n      - Dòng 2: <center>Môn học: ${info.subject} - Khối: ${info.grade} - Thời lượng: ${info.duration || 'Theo PPCT'}</center>` : `      - Bắt đầu ngay bằng Tên bài học GỐC ${options.integrateSTEM ? `(${options.stemType === 'topic' ? 'Chủ đề STEM' : 'Tích hợp STEM'})` : ''}.`}`;
    }
    
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
        model: "gemini-3.6-flash",
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

  let parts: any[] = [{ text: userPromptText }];
  
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

  // === CƠ CHẾ CONTEXT CACHING ===
  let cachedContentName = "";

  
  const setupContextCache = async (aiInstance: GoogleGenAI, modelId: string) => {
    if (userPromptText.length > 110000 && !cachedContentName) {
      try {
        console.log(`[Cache] Phát hiện siêu văn bản (${userPromptText.length} ký tự). Đang yêu cầu cung cấp Context Caching...`);
        const cache = await aiInstance.caches.create({
          model: modelId,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            ttl: "3600s",
          },
        });
        cachedContentName = cache.name;
        console.log(`[Cache] Tạo Context Caching thành công: ${cachedContentName}.`);
      } catch (cacheErr) {
        console.warn(`[Cache] Thất bại khởi tạo Context Cache. Tự động dùng luồng xử lý thông thường...`);
      }
    }
  };

  const callModel = async (modelId: string) => {
    await setupContextCache(ai, modelId);
    
    const requestConfig: any = {
       temperature: 0.2,
       thinkingConfig: {
         thinkingBudget: 0
       }
    };
    
    if (cachedContentName) {
       requestConfig.cachedContent = cachedContentName;
    } else {
       requestConfig.systemInstruction = SYSTEM_INSTRUCTION;
    }

    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      config: requestConfig,
      contents: cachedContentName 
        ? "Xin hãy tạo giáo án phối hợp tối ưu hóa năng lực theo thông tin đã set ở Cache." 
        : parts,
    });
    
    let text = "";
    for await (const chunk of responseStream) {
        if (chunk.text) {
            text += chunk.text;
            if (onProgress) {
                // Xoá dấu "- " thừa trước các đề mục có đánh số/chữ (vd: - 1. or - a. or - III.)
                let previewText = text.replace(/^[ \t]*-[ \t]+([a-zA-Z]+\.|[0-9]+\.|[a-zA-Z]+\))/gmi, '$1');
                onProgress(previewText);
            }
        }
    }

    text = text.replace(/^[ \t]*-[ \t]+([a-zA-Z]+\.|[0-9]+\.|[a-zA-Z]+\))/gmi, '$1');
    
    // Rút gọn các dòng chứa quá nhiều dấu chấm, gạch dưới (hạn chế AI sinh hàng trăm trang)
    text = text.replace(/(?:[._…]\s*){15,}/g, '...');

    return text;
  };

  try {
    let lastError: any = null;
    
    for (const modelId of models) {
        try {
            console.log(`Đang thử xử lý với model: ${modelId}`);
            let text = await callModel(modelId);
            if (!text) throw new Error("API trả về kết quả rỗng.");
            return text;
        } catch (error: any) {
            console.warn(`Model ${modelId} gặp sự cố hoặc không khả dụng.`, error);
            lastError = error;
        }
    }

    // Format human-friendly error from lastError
    const parseError = (err: any): string => {
      const errStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err || ''));
      if (errStr.includes("API_KEY_INVALID") || errStr.includes("API key not valid") || errStr.includes("INVALID_ARGUMENT")) {
        return "Khóa API không hợp lệ hoặc đã bị vô hiệu hóa. Vui lòng nhấn nút 'Khóa API' ở góc trên để cập nhật lại API Key mới từ Google AI Studio.";
      }
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
        return "Khóa API đã hết hạn mức sử dụng (Quota / 429). Vui lòng nhấn nút 'Khóa API' để đổi khóa API khác.";
      }
      if (errStr.includes("404") || errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        return "Không tìm thấy model hoặc khóa API chưa được cấp quyền truy cập. Vui lòng nhấn nút 'Khóa API' ở góc trên để nhập khóa API cá nhân của bạn.";
      }
      if (errStr.includes("PERMISSION_DENIED") || errStr.includes("403")) {
        return "Khóa API bị từ chối quyền truy cập (Permission Denied). Vui lòng kiểm tra quyền truy cập của mã khóa trên Google AI Studio.";
      }
      return `Lỗi kết nối Gemini API (${err?.message || "Không nhận được phản hồi"}). Vui lòng nhấn nút 'Khóa API' để kiểm tra lại mã khóa.`;
    };

    throw new Error(parseError(lastError));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errStr = error?.message || "";
    if (errStr.includes("API_KEY_INVALID") || errStr.includes("API key not valid") || errStr.includes("INVALID_ARGUMENT")) {
      throw new Error("Khóa API không hợp lệ hoặc đã bị vô hiệu hóa. Vui lòng nhấn nút 'Khóa API' ở góc trên để nhập mã khóa mới.");
    } else if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Hạn mức API đã đạt giới hạn (Quota / 429). Vui lòng nhấn nút 'Khóa API' để chuyển sang dùng Khóa API cá nhân của bạn.");
    }
    throw new Error(error.message || "Không thể gọi Gemini API. Vui lòng thử lại hoặc kiểm tra lại Khóa API.");
  }
};