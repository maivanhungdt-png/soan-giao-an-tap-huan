
export const DISABILITY_OPTIONS = [
  "Khuyết tật vận động",
  "Khuyết tật nghe",
  "Khuyết tật nói",
  "Khuyết tật nhìn",
  "Khuyết tật thần kinh",
  "Khuyết tật tâm thần",
  "Khuyết tật trí tuệ",
  "Khuyết tật tự kỷ",
  "Khuyết tật khác",
  "Khuyết tật chung"
];

export const DISABILITY_PEDAGOGICAL_GUIDELINES: Record<string, {
  name: string;
  shortDesc: string;
  targetHint: string;
  activityAdjustment: string;
}> = {
  "Khuyết tật nhìn": {
    name: "HS khuyết tật nhìn",
    shortDesc: "Khó khăn về thị giác, nhìn mờ, hạn chế thị lực hoặc khiếm thị.",
    targetHint: "Điều chỉnh mục tiêu quan sát/nhìn thành mục tiêu lắng nghe, cảm nhận xúc giác hoặc nhận biết qua mô tả bằng lời nói, tài liệu phóng to.",
    activityAdjustment: "GV mô tả trực quan bằng lời nói sinh động về các hình ảnh/sơ đồ/bảng biểu; cung cấp phiếu học tập chữ to, độ tương phản cao; bố trí ngồi bàn đầu đủ ánh sáng; bạn cùng bàn hỗ trợ đọc đề bài/tài liệu; giảm tải yêu cầu vẽ hình thủ công phức tạp."
  },
  "Khuyết tật nghe": {
    name: "HS khuyết tật nghe",
    shortDesc: "Khó khăn về thính giác, nghe kém hoặc khiếm thính.",
    targetHint: "Chuyển đổi các yêu cầu nghe/nghe-hiểu thành quan sát kênh chữ, kênh hình, sơ đồ, phụ đề, ngôn ngữ ký hiệu hoặc cử chỉ.",
    activityAdjustment: "Sử dụng tối đa kênh hình ảnh, sơ đồ tư duy, slide trình chiếu, phụ đề, phiếu giao nhiệm vụ bằng văn bản thay vì chỉ truyền đạt bằng lời; GV nói to, rõ, nhìn thẳng vào học sinh khi hướng dẫn; xếp ngồi bàn đầu gần GV; bạn học hỗ trợ nhắc lại nhiệm vụ."
  },
  "Khuyết tật nói": {
    name: "HS khuyết tật nói",
    shortDesc: "Khó khăn về ngôn ngữ, phát âm, diễn đạt hoặc khiếm thanh/nói lắp nặng.",
    targetHint: "Thay thế mục tiêu thuyết trình/phát biểu miệng trước lớp bằng mục tiêu viết, chọn đáp án trắc nghiệm, chỉ hình ảnh, giơ thẻ hoặc thao tác trên thiết bị số.",
    activityAdjustment: "Không bắt buộc học sinh đứng phát biểu hoặc thuyết trình miệng dài trước lớp; cho phép trả lời câu hỏi bằng cách viết ra bảng phụ/phiếu học tập, chỉ vào sơ đồ/hình ảnh hoặc dùng cử chỉ/thẻ màu; tạo không khí động viên, kiên nhẫn lắng nghe, tránh áp lực tâm lý."
  },
  "Khuyết tật vận động": {
    name: "HS khuyết tật vận động",
    shortDesc: "Khó khăn về vận động tay, chân, cột sống hoặc liệt/yếu cơ.",
    targetHint: "Điều chỉnh các yêu cầu vận động tinh/thô (viết nhanh, vẽ hình chính xác, di chuyển nhóm liên tục) thành nhận biết kiến thức hoặc sử dụng công cụ/phần mềm hỗ trợ.",
    activityAdjustment: "Bố trí chỗ ngồi ở vị trí thuận tiện di chuyển trong lớp; bạn cùng nhóm hỗ trợ lấy đồ dùng học tập, cầm tài liệu; cho phép trả lời bằng lời nói hoặc thiết bị điện tử thay vì viết tay dài; cho thêm thời gian hoàn thành bài tập viết/vẽ; không yêu cầu thực hiện các hoạt động thể chất/vận động nặng."
  },
  "Khuyết tật trí tuệ": {
    name: "HS khuyết tật trí tuệ",
    shortDesc: "Chậm phát phát triển trí tuệ, khả năng nhận thức và tư duy trừu tượng bị hạn chế.",
    targetHint: "Giảm mức độ yêu cầu nhận thức xuống mức Nhận biết cơ bản nhất (chỉ cần nhận ra, nêu được tên hoặc chỉ ra đối tượng cụ thể; không yêu cầu phân tích, tổng hợp hay vận dụng cao).",
    activityAdjustment: "Chia nhỏ nhiệm vụ học tập thành từng bước đơn giản (step-by-step); giáo viên làm mẫu cụ thể và hướng dẫn trực tiếp (1 kèm 1); tăng cường đồ dùng trực quan, vật thật, hình ảnh sinh động; cho thêm thời gian thực hiện; kịp thời khen ngợi, động viên những tiến bộ nhỏ nhất của học sinh."
  },
  "Khuyết tật tự kỷ": {
    name: "HS khuyết tật tự kỷ",
    shortDesc: "Rối loạn phổ tự kỷ (ASD), nhạy cảm với thay đổi môi trường, khó khăn trong tương tác xã hội và giao tiếp.",
    targetHint: "Mục tiêu tập trung vào việc làm quen với môi trường học tập, tham gia vào hoạt động học theo quy trình định sẵn, nhận biết các bước thực hiện.",
    activityAdjustment: "Thiết lập quy trình và cấu trúc bài học rõ ràng, cố định; sử dụng lịch trình trực quan/thẻ hình minh họa các bước học tập; giao tiếp bằng câu ngắn gọn, dứt khoát, dễ hiểu; bố trí góc học tập yên tĩnh, tránh tiếng ồn hoặc kích thích quá mạnh; ghép đôi với bạn học có tính cách điềm tĩnh, biết quan tâm giúp đỡ."
  },
  "Khuyết tật thần kinh": {
    name: "HS khuyết tật thần kinh",
    shortDesc: "Tổn thương hệ thần kinh, động kinh, tăng động giảm chú ý hoặc rối loạn phối hợp thần kinh.",
    targetHint: "Điều chỉnh tốc độ tiếp thu, giảm bớt khối lượng nhiệm vụ cần ghi nhớ hoặc xử lý trong cùng một khoảng thời gian.",
    activityAdjustment: "Cho thêm thời gian suy nghĩ và xử lý thông tin; nhắc lại nhiệm vụ nhẹ nhàng; xen kẽ các khoảng nghỉ ngắn để tránh quá tải thần kinh; không tạo áp lực về thời gian; GV và bạn cùng bàn luôn theo dõi và sẵn sàng hỗ trợ khi học sinh mất tập trung."
  },
  "Khuyết tật tâm thần": {
    name: "HS khuyết tật tâm thần",
    shortDesc: "Rối loạn cảm xúc, âu lo, trầm cảm hoặc khó khăn về hành vi tâm lý.",
    targetHint: "Mục tiêu hướng tới sự tự tin, cảm giác an toàn, tham gia các hoạt động tập thể ở mức độ vừa sức và tự nguyện.",
    activityAdjustment: "Xây dựng môi trường lớp học ấm áp, thân thiện, tôn trọng và không phán xét; khuyến khích tham gia các hoạt động nhóm nhỏ; giao các nhiệm vụ học tập vừa sức mang lại cảm giác thành công; giáo viên thường xuyên động viên, khích lệ tinh thần."
  },
  "Khuyết tật khác": {
    name: "HS khuyết tật khác",
    shortDesc: "Các dạng khuyết tật đặc thù khác hoặc đa tật.",
    targetHint: "Điều chỉnh mục tiêu kiến thức và kỹ năng linh hoạt theo mức độ suy giảm chức năng cụ thể của học sinh.",
    activityAdjustment: "Linh hoạt áp dụng các biện pháp hỗ trợ trực quan, hỗ trợ cá nhân hóa 1 kèm 1, điều chỉnh đồ dùng và phương tiện học tập phù hợp với tình trạng thực tế của học sinh."
  },
  "Khuyết tật chung": {
    name: "HS khuyết tật chung",
    shortDesc: "Học sinh khuyết tật học hòa nhập nói chung theo Thông tư 03/2018/TT-BGDĐT.",
    targetHint: "Giảm nhẹ mức độ yêu cầu về chuẩn kiến thức, kỹ năng so với học sinh bình thường; tập trung vào mục tiêu nhận biết cơ bản.",
    activityAdjustment: "Giáo viên theo dõi, hướng dẫn cá biệt hóa, bố trí học sinh hỗ trợ (đôi bạn cùng tiến), linh hoạt về thời gian và hình thức kiểm tra đánh giá."
  }
};

export const NLS_COMPONENT_OPTIONS = [
  { code: "1.1", label: "1.1. Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số" },
  { code: "1.2", label: "1.2. Đánh giá dữ liệu, thông tin và nội dung số" },
  { code: "1.3", label: "1.3. Quản lý dữ liệu, thông tin và nội dung số" },
  { code: "2.1", label: "2.1. Tương tác thông qua công nghệ số" },
  { code: "2.2", label: "2.2. Chia sẻ thông tin và nội dung thông qua công nghệ số" },
  { code: "2.3", label: "2.3. Sử dụng công nghệ số để thực hiện trách nhiệm công dân" },
  { code: "2.4", label: "2.4. Hợp tác thông qua công nghệ số" },
  { code: "2.5", label: "2.5. Quy tắc ứng xử trên mạng" },
  { code: "2.6", label: "2.6. Quản lý danh tính số" },
  { code: "3.1", label: "3.1. Phát triển nội dung số" },
  { code: "3.2", label: "3.2. Tích hợp và tạo lập lại nội dung số" },
  { code: "3.3", label: "3.3. Thực thi bản quyền và giấy phép" },
  { code: "3.4", label: "3.4. Lập trình" },
  { code: "4.1", label: "4.1. Bảo vệ thiết bị" },
  { code: "4.2", label: "4.2. Bảo vệ dữ liệu cá nhân và quyền riêng tư" },
  { code: "4.3", label: "4.3. Bảo vệ sức khỏe và an sinh số" },
  { code: "4.4", label: "4.4. Bảo vệ môi trường" },
  { code: "5.1", label: "5.1. Giải quyết các vấn đề kỹ thuật" },
  { code: "5.2", label: "5.2. Xác định nhu cầu và giải pháp công nghệ" },
  { code: "5.3", label: "5.3. Sử dụng sáng tạo công nghệ số" },
  { code: "5.4", label: "5.4. Xác định các vấn đề cần cải thiện về NLS" },
  { code: "6.1", label: "6.1. Hiểu biết về trí tuệ nhân tạo" },
  { code: "6.2", label: "6.2. Sử dụng trí tuệ nhân tạo" },
  { code: "6.3", label: "6.3. Đánh giá trí tuệ nhân tạo" },
];

export const NLS_LEVEL_DETAILS: Record<string, { code: string; desc: string; grade: string }[]> = {
  "1.1": [
    { code: "CB1a", desc: "Xác định được nhu cầu thông tin, tìm kiếm dữ liệu, thông tin và nội dung thông qua tìm kiếm đơn giản trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Tìm được cách truy cập những dữ liệu, thông tin và nội dung này cũng như điều hướng giữa chúng.", grade: "Mọi lớp" },
    { code: "CB1c", desc: "Xác định được các chiến lược tìm kiếm đơn giản.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Xác định được nhu cầu thông tin.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Tìm được dữ liệu, thông tin và nội dung thông qua tìm kiếm đơn giản trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB2c", desc: "Tìm được cách truy cập những dữ liệu, thông tin và nội dung này cũng như điều hướng giữa chúng.", grade: "Mọi lớp" },
    { code: "CB2d", desc: "Xác định được các chiến lược tìm kiếm đơn giản.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Giải thích được nhu cầu thông tin.", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Thực hiện được rõ ràng và theo quy trình các tìm kiếm để tìm dữ liệu, thông tin và nội dung trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC1c", desc: "Giải thích được cách truy cập và điều hướng các kết quả tìm kiếm.", grade: "Mọi lớp" },
    { code: "TC1d", desc: "Giải thích được rõ ràng và theo quy trình chiến lược tìm kiếm.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Minh họa được nhu cầu thông tin.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Tổ chức được tìm kiếm dữ liệu, thông tin và nội dung trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC2c", desc: "Mô tả được cách truy cập những dữ liệu, thông tin và nội dung này cũng như điều hướng giữa chúng.", grade: "Mọi lớp" },
    { code: "TC2d", desc: "Tổ chức được các chiến lược tìm kiếm.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Đáp ứng được nhu cầu thông tin.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Áp dụng được kỹ thuật tìm kiếm để lấy được dữ liệu, thông tin và nội dung trong môi trường số.", grade: "Mọi lớp" },
    { code: "NC1c", desc: "Chỉ cho người khác cách truy cập những dữ liệu, thông tin và nội dung này cũng như điều hướng giữa chúng.", grade: "Mọi lớp" },
    { code: "NC1d", desc: "Tự đề xuất được chiến lược tìm kiếm.", grade: "Mọi lớp" },
  ],
  "1.2": [
    { code: "CB1a", desc: "Phát hiện được độ tin cậy và độ chính xác của các nguồn chung của dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Thực hiện phân tích, diễn giải và đánh giá được dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Phát hiện được độ tin cậy và độ chính xác của các nguồn chung của dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Thực hiện phân tích, diễn giải và đánh giá được dữ liệu, thông tin và nội dung số được xác định rõ ràng.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Thực hiện phân tích, so sánh, đánh giá được độ tin cậy và độ chính xác của các nguồn dữ liệu, thông tin và nội dung số đã được tổ chức rõ ràng.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Thực hiện phân tích, so sánh và đánh giá được các nguồn dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Thực hiện đánh giá được độ tin cậy và độ tin cậy của các nguồn dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Tiến hành đánh giá được các dữ liệu, thông tin và nội dung số khác nhau.", grade: "Mọi lớp" },
  ],
  "1.3": [
    { code: "CB1a", desc: "Xác định được cách tổ chức, lưu trữ và truy xuất dữ liệu, thông tin và nội dung một cách đơn giản trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Nhận biết được nơi để sắp xếp dữ liệu, thông tin và nội dung một cách đơn giản trong môi trường có cấu trúc.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Xác định được cách tổ chức, lưu trữ và truy xuất dữ liệu, thông tin và nội dung một cách đơn giản trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Nhận biết được nơi để sắp xếp dữ liệu, thông tin và nội dung một cách đơn giản trong môi trường có cấu trúc.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Lựa chọn được dữ liệu, thông tin và nội dung để tổ chức, lưu trữ và truy xuất chúng một cách thường xuyên trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Sắp xếp chúng một cách trật tự trong một môi trường có cấu trúc.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Sắp xếp được thông tin, dữ liệu, nội dung để dễ dàng lưu trữ và truy xuất.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Tổ chức được thông tin, dữ liệu và nội dung trong một môi trường có cấu trúc.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Thao tác được thông tin, dữ liệu và nội dung để tổ chức, lưu trữ và truy xuất dễ dàng hơn.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Triển khai được việc tổ chức và sắp xếp dữ liệu, thông tin và nội dung trong môi trường có cấu trúc.", grade: "Mọi lớp" },
  ],
  "2.1": [
    { code: "CB1a", desc: "Lựa chọn được các công nghệ số đơn giản để tương tác.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Xác định được các phương tiện giao tiếp đơn giản thích hợp cho một bối cảnh cụ thể.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Lựa chọn được các công nghệ số đơn giản để tương tác.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Xác định được các phương tiện giao tiếp đơn giản thích hợp cho một bối cảnh cụ thể.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Thực hiện được các tương tác được xác định rõ ràng và thường xuyên với các công nghệ số.", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Lựa chọn được các phương tiện giao tiếp số phù hợp, được xác định rõ ràng cho phù hợp với bối cảnh nhất định.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Lựa chọn được nhiều công nghệ số để tương tác.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Lựa chọn được nhiều phương tiện truyền thông số cho phù hợp với bối cảnh nhất định.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Sử dụng được nhiều công nghệ số để tương tác.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Cho người khác thấy phương tiện giao tiếp số phù hợp nhất cho một bối cảnh cụ thể.", grade: "Mọi lớp" },
  ],
  "2.2": [
    { code: "CB1a", desc: "Nhận biết được các công nghệ số đơn giản, phù hợp để chia sẻ dữ liệu, thông tin và nội dung kỹ thuật số.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Nhận biết được phương pháp trích dẫn và ghi nguồn cơ bản.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Nhận biết được các công nghệ số đơn giản, phù hợp để chia sẻ dữ liệu, thông tin và nội dung kỹ thuật số.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Xác định được phương pháp trích dẫn và ghi nguồn cơ bản.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Lựa chọn các công nghệ số phù hợp được xác định rõ để trao đổi dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Giải thích cách thức hoạt động như một trung gian để chia sẻ thông tin và nội dung thông qua các công nghệ kỹ thuật số được xác định rõ ràng và thường xuyên.", grade: "Mọi lớp" },
    { code: "TC1c", desc: "Minh họa rõ ràng và thường xuyên các phương pháp tham chiếu và ghi chú nguồn.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Vận dụng được các công nghệ số phù hợp để chia sẻ dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Giải thích được cách đóng vai trò trung gian để chia sẻ thông tin và nội dung thông qua công nghệ số.", grade: "Mọi lớp" },
    { code: "TC2c", desc: "Áp dụng được các phương pháp tham chiếu và ghi chú nguồn.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Chia sẻ dữ liệu, thông tin và nội dung số thông qua nhiều công cụ số phù hợp.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Hướng dẫn người khác cách đóng vai trò trung gian để chia sẻ thông tin và nội dung thông qua công nghệ số.", grade: "Mọi lớp" },
    { code: "NC1c", desc: "Áp dụng được nhiều phương pháp tham chiếu và ghi nguồn khác nhau.", grade: "Mọi lớp" },
  ],
  "2.3": [
    { code: "CB1a", desc: "Xác định được các dịch vụ số đơn giản để có thể tham gia vào xã hội.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Nhận biết được các công nghệ số đơn giản, phù hợp để nâng cao năng lực cho bản thân và tham gia vào xã hội với tư cách là một công dân.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Xác định được các dịch vụ số đơn giản để có thể tham gia vào xã hội.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Nhận biết được các công nghệ số đơn giản, phù hợp để nâng cao năng lực cho bản thân và tham gia vào xã hội với tư cách là một công dân.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Lựa chọn được các dịch vụ số được xác định rõ ràng và phổ biến để tham gia vào xã hội.", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Xác định được các công nghệ số rõ ràng và thích hợp để tự mình trang bị và tham gia vào xã hội như một công dân.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Lựa chọn được các dịch vụ số để tham gia vào xã hội.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Thảo luận về các công nghệ số phù hợp để nâng cao năng lực của bản thân và tham gia vào xã hội với tư cách là một công dân.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Đề xuất được các dịch vụ số khác nhau để tham gia vào xã hội.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Sử dụng được các công nghệ số thích hợp để tự mình trang bị và tham gia vào xã hội như một công dân.", grade: "Mọi lớp" },
  ],
  "2.4": [
    { code: "CB1a", desc: "Chọn được những công cụ và công nghệ số đơn giản cho các quá trình cộng tác.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Lựa chọn được các công cụ và công nghệ số đơn giản cho các quá trình cộng tác.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Lựa chọn được các công cụ và công nghệ số được xác định rõ ràng và thường xuyên cho các quá trình hợp tác.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Đề xuất được các công cụ và công nghệ số cho các quá trình hợp tác.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Chọn được những công cụ và công nghệ số khác nhau cho các quá trình hợp tác.", grade: "Mọi lớp" },
  ],
  "2.5": [
    { code: "CB1a", desc: "Phân biệt được các chuẩn mực hành vi đơn giản và biết cách sử dụng công nghệ số và tương tác trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Chọn được các phương thức và chiến lược giao tiếp đơn giản phù hợp trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB1c", desc: "Phân biệt các khía cạnh đơn giản của sự đa dạng về văn hóa và thế hệ cần được tính đến trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Phân biệt được các chuẩn mực hành vi đơn giản và bí quyết sử dụng công nghệ số và tương tác trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Chọn được các phương thức và chiến lược giao tiếp đơn giản phù hợp trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB2c", desc: "Phân biệt các khía cạnh đơn giản của sự đa dạng về văn hóa và thế hệ cần được tính đến trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Làm rõ được các chuẩn mực hành vi thường xuyên và được xác định rõ ràng cũng như bí quyết khi sử dụng công nghệ số và tương tác trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Thể hiện được các chiến lược giao tiếp thường xuyên và xác định rõ ràng phương thức giao tiếp phù hợp trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC1c", desc: "Mô tả các khía cạnh đa dạng về văn hóa và thế hệ được xác định rõ ràng và thông thường cần xem xét trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Thảo luận về các chuẩn mực hành vi và cách sử dụng công nghệ số và tương tác trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Thảo luận các chiến lược giao tiếp phù hợp trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC2c", desc: "Thảo luận các khía cạnh đa dạng về văn hóa và thế hệ cần xem xét trong môi trường số.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Áp dụng được các chuẩn mực hành vi và bí quyết khác nhau khi sử dụng công nghệ số và tương tác trong môi trường số.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Áp dụng được các chiến lược giao tiếp khác nhau trong môi trường số một cách phù hợp.", grade: "Mọi lớp" },
    { code: "NC1c", desc: "Áp dụng được các khía cạnh đa dạng về văn hóa và thế hệ khác nhau để xem xét trong môi trường số.", grade: "Mọi lớp" },
  ],
  "2.6": [
    { code: "CB1a", desc: "Xác định được danh tính số.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Mô tả được những cách đơn giản để bảo vệ danh tiếng trực tuyến của bản thân.", grade: "Mọi lớp" },
    { code: "CB1c", desc: "Nhận biết được dữ liệu đơn giản do mình tạo ra thông qua các công cụ, môi trường hoặc dịch vụ số.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Xác định được danh tính số.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Mô tả được những cách đơn giản để bảo vệ danh tiếng trực tuyến của bản thân.", grade: "Mọi lớp" },
    { code: "CB2c", desc: "Nhận biết được dữ liệu đơn giản do mình tạo ra thông qua các công cụ, môi trường hoặc dịch vụ số.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Hiển thị được nhiều danh tính số cụ thể, được xác định rõ ràng.", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Giải thích được những cách cụ thể để bảo vệ danh tiếng trực tuyến của bản thân.", grade: "Mọi lớp" },
    { code: "TC1c", desc: "Mô tả dữ liệu được xác định rõ ràng mà bạn thường xuyên thu được thông qua các công cụ, môi trường hoặc dịch vụ số.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Sử dụng được nhiều danh tính số thông thường và khác nhau.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Thảo luận những cách khác nhau để bảo vệ danh tiếng trực tuyến của bản thân.", grade: "Mọi lớp" },
    { code: "TC2c", desc: "Thao tác dữ liệu cá nhân được xác định rõ ràng và thường xuyên để bảo vệ danh tiếng trực tuyến của bản thân.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Phân biệt được một loạt các danh tính số khác nhau.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Áp dụng được các cách khác nhau để bảo vệ danh tính trực tuyến của bản thân.", grade: "Mọi lớp" },
    { code: "NC1c", desc: "Sử dụng được dữ liệu tạo ra thông qua công cụ, môi trường và một số dịch vụ số.", grade: "Mọi lớp" },
  ],
  "3.1": [
    { code: "CB1a", desc: "Xác định được các cách tạo và chỉnh sửa nội dung đơn giản ở các định dạng đơn giản,", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Chọn được cách thể hiện bản thân thông qua việc tạo ra các nội dung số đơn giản.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Xác định được các cách tạo và chỉnh sửa nội dung đơn giản ở các định dạng đơn giản,", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Chọn được cách thể hiện bản thân thông qua việc tạo ra các nội dung số đơn giản.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Chỉ ra được cách tạo và chỉnh sửa nội dung phổ thông bằng những định dạng rõ ràng, phổ biến,", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Thể hiện được bản thân thông qua việc tạo ra các nội dung số thông thường và được xác định rõ ràng.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Chỉ ra được cách tạo và chỉnh sửa nội dung ở các định dạng khác nhau.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Thể hiện được bản thân thông qua việc tạo ra các nội dung số.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Áp dụng được các cách tạo và chỉnh sửa nội dung có khái niệm cụ thể và mang tính phức tạp ở các định dạng khác nhau.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Chỉ ra được những cách thể hiện bản thân thông qua việc tạo ra các nội dung số.", grade: "Mọi lớp" },
  ],
  "3.2": [
    { code: "CB1a", desc: "Chọn được các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp các mục đơn giản có nội dung và thông tin mới để tạo ra những nội dung và thông tin mới và độc đáo.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Chọn được các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp các mục đơn giản có nội dung và thông tin mới để tạo ra những nội dung và thông tin mới và độc đáo.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Giải thích được các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp các mục nội dung và thông tin mới được xác định rõ ràng để tạo ra những nội dung và thông tin mới và độc đáo.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Thảo luận các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp nội dung và thông tin mới để tạo ra những nội dung và thông tin mới và độc đáo.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Làm việc với các mục nội dung và thông tin mới khác nhau, sửa đổi, tinh chỉnh, cải thiện và tích hợp chúng để tạo ra những mục mới và độc đáo.", grade: "Mọi lớp" },
  ],
  "3.3": [
    { code: "CB1a", desc: "Xác định được các quy tắc đơn giản về bản quyền và giấy phép áp dụng cho dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Xác định được các quy tắc đơn giản về bản quyền và giấy phép áp dụng cho dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Chỉ ra được các quy tắc thông thường và được xác định rõ ràng về bản quyền và giấy phép áp dụng cho dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Thảo luận các quy tắc về bản quyền và giấy phép áp dụng cho thông tin và nội dung số.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Áp dụng được các quy tắc khác nhau về bản quyền và giấy phép cho dữ liệu, thông tin và nội dung số.", grade: "Mọi lớp" },
  ],
  "3.4": [
    { code: "CB1a", desc: "Liệt kê được các hướng dẫn đơn giản để hệ thống máy tính giải quyết một vấn đề đơn giản hoặc thực hiện một nhiệm vụ đơn giản.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Liệt kê được các hướng dẫn đơn giản để hệ thống máy tính giải quyết một vấn đề đơn giản hoặc thực hiện một nhiệm vụ đơn giản.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Liệt kê được các hướng dẫn thông thường và được xác định rõ ràng cho một hệ thống máy tính để giải quyết các vấn đề thường ngày hoặc thực hiện các tác vụ thường ngày.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Liệt kê được các hướng dẫn cho một hệ thống máy tính để giải quyết một vấn đề nhất định hoặc thực hiện một nhiệm vụ cụ thể.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Tự thao tác được bằng các hướng dẫn dành cho hệ thống máy tính để giải quyết một vấn đề khác hoặc thực hiện các nhiệm vụ khác nhau.", grade: "Mọi lớp" },
  ],
  "4.1": [
    { code: "CB1a", desc: "Nhận biết được cách bảo vệ thiết bị và nội dung số một cách đơn giản.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Phân biệt được rủi ro và mối đe dọa đơn giản trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB1c", desc: "Chọn lựa được các biện pháp an toàn và bảo mật đơn giản.", grade: "Mọi lớp" },
    { code: "CB1d", desc: "Nhận biết được những cách thức đơn giản để quan tâm đến mức độ tin cậy và quyền riêng tư.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Nhận biết được cách bảo vệ thiết bị và nội dung số một cách đơn giản.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Phân biệt được rủi ro và mối đe dọa đơn giản trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB2c", desc: "Tuân theo được các biện pháp an toàn và bảo mật đơn giản.", grade: "Mọi lớp" },
    { code: "CB2d", desc: "Nhận biết được những cách thức đơn giản để quan tâm đến mức độ tin cậy và quyền riêng tư.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Chỉ ra được những cách thức cơ bản và phổ biến để bảo vệ thiết bị và nội dung số.", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Phân biệt được những rủi ro và mối đe dọa cơ bản và phổ biến trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC1c", desc: "Chọn lựa được các biện pháp an toàn và bảo mật rõ ràng và thường xuyên.", grade: "Mọi lớp" },
    { code: "TC1d", desc: "Chỉ ra được những cách thức cơ bản và phổ biến để quan tâm đến mức độ tin cậy và quyền riêng tư.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Thiết lập được những cách thức bảo vệ thiết bị và nội dung số.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Phân biệt được rủi ro và mối đe dọa trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC2c", desc: "Chọn lựa được các biện pháp an toàn và bảo mật.", grade: "Mọi lớp" },
    { code: "TC2d", desc: "Giải thích được các cách thức để quan tâm đến mức độ tin cậy và quyền riêng tư.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Áp dụng được các cách khác nhau để bảo vệ thiết bị và nội dung số.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Nhận thức được sự đa dạng của các rủi ro và đe dọa trong môi trường số.", grade: "Mọi lớp" },
    { code: "NC1c", desc: "Áp dụng được các biện pháp an toàn và bảo mật.", grade: "Mọi lớp" },
    { code: "NC1d", desc: "Sử dụng được các cách thức khác nhau để quan tâm đến mức độ tin cậy và quyền riêng tư.", grade: "Mọi lớp" },
  ],
  "4.2": [
    { code: "CB1a", desc: "Lựa chọn được những cách thức đơn giản để bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB1b", desc: "Nhận biết được các cách sử dụng và chia sẻ thông tin định danh cá nhân một cách an toàn, có khả năng bảo vệ bản thân và người khác.", grade: "Mọi lớp" },
    { code: "CB1c", desc: "Nhận diện được các tuyên bố cơ bản trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong dịch vụ số.", grade: "Mọi lớp" },
    { code: "CB2a", desc: "Lựa chọn được những cách thức đơn giản để bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.", grade: "Mọi lớp" },
    { code: "CB2b", desc: "Nhận biết được các cách sử dụng và chia sẻ thông tin định danh cá nhân một cách an toàn, có khả năng bảo vệ bản thân và người khác.", grade: "Mọi lớp" },
    { code: "CB2c", desc: "Nhận diện được các tuyên bố cơ bản trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong dịch vụ số.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Giải thích được các cách thức cơ bản và phổ biến để bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC1b", desc: "Giải thích được các cách thức cơ bản và phổ biến để sử dụng và chia sẻ thông tin định danh cá nhân một cách an toàn.", grade: "Mọi lớp" },
    { code: "TC1c", desc: "Chỉ ra được các tuyên bố cơ bản và phổ biến trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong các dịch vụ số.", grade: "Mọi lớp" },
    { code: "TC2a", desc: "Thảo luận về cách bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.", grade: "Mọi lớp" },
    { code: "TC2b", desc: "Thảo luận về cách sử dụng và chia sẻ thông định cá nhân một cách an toàn.", grade: "Mọi lớp" },
    { code: "TC2c", desc: "Chỉ ra được các tuyên bố trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong các dịch vụ số.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Áp dụng được các cách thức khác nhau để bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.", grade: "Mọi lớp" },
    { code: "NC1b", desc: "Áp dụng được các cách thức đặc thù để chia sẻ dữ liệu cá nhân một cách an toàn.", grade: "Mọi lớp" },
    { code: "NC1c", desc: "Giải thích được các tuyên bố trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong các dịch vụ số.", grade: "Mọi lớp" },
  ],
  "4.3": [
    { code: "CB1a", desc: "Nhận biết các rủi ro về sức khỏe khi sử dụng công nghệ.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Áp dụng các biện pháp bảo vệ sức khỏe thể chất và tinh thần khi dùng thiết bị số.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Cân bằng thời gian sử dụng công nghệ, phòng tránh nghiện internet và bắt nạt trực tuyến.", grade: "Mọi lớp" },
  ],
  "4.4": [
    { code: "CB1a", desc: "Nhận biết tác động của công nghệ đến môi trường.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Sử dụng thiết bị công nghệ tiết kiệm năng lượng.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Áp dụng các giải pháp công nghệ xanh, xử lý rác thải điện tử đúng cách.", grade: "Mọi lớp" },
  ],
  "5.1": [
    { code: "CB1a", desc: "Nhận diện và giải quyết các lỗi kỹ thuật cơ bản.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Khắc phục các sự cố phần cứng, phần mềm thông thường.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Phân tích và giải quyết các vấn đề kỹ thuật phức tạp trong hệ thống.", grade: "Mọi lớp" },
  ],
  "5.2": [
    { code: "CB1a", desc: "Xác định nhu cầu cá nhân đơn giản.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Đánh giá nhu cầu và lựa chọn công cụ số phù hợp.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Sử dụng công cụ kỹ thuật số (máy tính cầm tay, GeoGebra,…) giải quyết vấn đề, đánh giá giải pháp.", grade: "Mọi lớp" },
  ],
  "5.3": [
    { code: "CB1a", desc: "Sử dụng công nghệ để tạo ra các sản phẩm đơn giản.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Ứng dụng công nghệ một cách sáng tạo để giải quyết các vấn đề thực tiễn.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Đổi mới quy trình, tạo ra các giải pháp công nghệ mang tính đột phá.", grade: "Mọi lớp" },
  ],
  "5.4": [
    { code: "CB1a", desc: "Nhận biết những kỹ năng số còn thiếu của bản thân.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Tìm kiếm cơ hội học tập để nâng cao năng lực số.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Tự đánh giá, lập kế hoạch và liên tục cập nhật năng lực số cho bản thân và người khác.", grade: "Mọi lớp" },
  ],
  "6.1": [
    { code: "CB1a", desc: "Nhận biết các ứng dụng cơ bản của AI trong đời sống.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Hiểu nguyên lý hoạt động cơ bản và khả năng của các hệ thống AI.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Phân tích tác động của AI đến xã hội, kinh tế và môi trường.", grade: "Mọi lớp" },
  ],
  "6.2": [
    { code: "CB1a", desc: "Sử dụng công cụ AI đơn giản trong học tập.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Lựa chọn và sử dụng các công cụ AI phù hợp để hỗ trợ công việc.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Tối ưu hóa việc sử dụng các công cụ AI để đạt hiệu quả cao hơn trong công việc và học tập.", grade: "Mọi lớp" },
  ],
  "6.3": [
    { code: "CB1a", desc: "Nhận biết các vấn đề đạo đức cơ bản khi dùng AI.", grade: "Mọi lớp" },
    { code: "TC1a", desc: "Đánh giá tính chính xác và thiên kiến của kết quả do AI tạo ra.", grade: "Mọi lớp" },
    { code: "NC1a", desc: "Áp dụng các nguyên tắc đạo đức, đảm bảo tính minh bạch và công bằng khi sử dụng AI.", grade: "Mọi lớp" },
  ]
};

export const NLS_FRAMEWORK_DATA = `
KHUNG NĂNG LỰC SỐ (DIGITAL COMPETENCE FRAMEWORK) - VIỆT NAM

CẤU TRÚC MÃ (CODE STRUCTURE):
[ID Thành phần].[Mức độ][Thứ tự]
Ví dụ: 1.2.NC1a
- 1.2: Thành phần năng lực "Đánh giá dữ liệu, thông tin và nội dung số"
- NC1: Mức độ Nâng cao 1
- a: Biểu hiện thứ nhất

6 MIỀN NĂNG LỰC & 24 THÀNH PHẦN:
1. Khai thác dữ liệu và thông tin
   1.1. Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số
   1.2. Đánh giá dữ liệu, thông tin và nội dung số
   1.3. Quản lý dữ liệu, thông tin và nội dung số
2. Giao tiếp và Hợp tác
   2.1. Tương tác thông qua công nghệ số
   2.2. Chia sẻ thông tin và nội dung thông qua công nghệ số
   2.3. Sử dụng công nghệ số để thực hiện trách nhiệm công dân
   2.4. Hợp tác thông qua công nghệ số
   2.5. Quy tắc ứng xử trên mạng
   2.6. Quản lý danh tính số
3. Sáng tạo nội dung số
   3.1. Phát triển nội dung số
   3.2. Tích hợp và tạo lập lại nội dung số
   3.3. Thực thi bản quyền và giấy phép
   3.4. Lập trình
4. An toàn
   4.1. Bảo vệ thiết bị
   4.2. Bảo vệ dữ liệu cá nhân và quyền riêng tư
   4.3. Bảo vệ sức khỏe và an sinh số
   4.4. Bảo vệ môi trường
5. Giải quyết vấn đề
   5.1. Giải quyết các vấn đề kỹ thuật
   5.2. Xác định nhu cầu và giải pháp công nghệ
   5.3. Sử dụng sáng tạo công nghệ số
   5.4. Xác định các vấn đề cần cải thiện về NLS
6. Ứng dụng trí tuệ nhân tạo
   6.1. Hiểu biết về trí tuệ nhân tạo
   6.2. Sử dụng trí tuệ nhân tạo
   6.3. Đánh giá trí tuệ nhân tạo

QUY ĐỊNH VỀ MỨC ĐỘ & CẤP HỌC (PROFICIENCY LEVELS & GRADES):
BẮT BUỘC RÀNG BUỘC KHI CHỌN MÃ CHO HỌC SINH TÙY THEO LỚP:
- CB1 (Cơ bản 1): Dành riêng cho Lớp 1, Lớp 2, Lớp 3
- CB2 (Cơ bản 2): Dành riêng cho Lớp 4, Lớp 5
- TC1 (Trung cấp 1): Dành riêng cho Lớp 6, Lớp 7
- TC2 (Trung cấp 2): Dành riêng cho Lớp 8, Lớp 9
- NC1 (Nâng cao 1): Dành riêng cho Lớp 10, Lớp 11, Lớp 12
(Chú ý: Cấm chọn sai mức độ với khối lớp của học sinh).
`;

export const SYSTEM_INSTRUCTION = `
Bạn là chuyên gia Sư phạm cấp cao của Bộ GD&ĐT Việt Nam, chuyên trách xây dựng và tích hợp Kế hoạch bài dạy (Giáo án - Phụ lục 4 theo Công văn 5512/BGDĐT, Thông tư 30/2020/TT-BGDĐT, Thông tư 38/2021/TT-BGDĐT và Chương trình GDPT 2018).

=========================================================
🚨 CÁC NGUYÊN TẮC PHÁP QUY & SƯ PHẠM BẮT BUỘC PHẢI TUÂN THỦ TUYỆT ĐỐI:

1. XÂY DỰNG KẾ HOẠCH BÀI DẠY (PHỤ LỤC 4) THEO BÀI HỌC HOÀN CHỈNH:
   - Xây dựng kế hoạch bài dạy theo từng BÀI HỌC trọn vẹn (không ngắt vụn).
   - TUYỆT ĐỐI KHÔNG GHI ngày soạn, ngày giảng (để giáo viên tự điền theo thực tế đơn vị).
   - Thứ tự tiết ghi theo Phụ lục 3 (Kế hoạch giáo dục của giáo viên), phân bổ sau hoạt động đầu tiên của mỗi tiết.
   - ⛔️ TUYỆT ĐỐI KHÔNG DÙNG CÁC KÝ TỰ MARKDOWN HASH (như #####, ####, ###) cho các tiểu mục. Thay vào đó, dùng chữ in đậm chuẩn: **a) Mục tiêu:**, **b) Nội dung:**, **a) Năng lực đặc thù môn...**, **b) Năng lực chung:**, **c) Năng lực số (NLS):**, **d) Năng lực AI:**.

2. CẤU TRÚC VÀ ĐỊNH DẠNG CÁC ĐỀ MỤC CHÍNH (BẮT BUỘC IN ĐẬM VÀ VIẾT HOA CHỮ ĐẦU TIÊN CỦA CÂU):
   - Đề mục lớn La Mã: Chỉ viết in hoa chữ cái đầu tiên của câu và IN ĐẬM:
     + **I. Mục tiêu**
     + **II. Thiết bị dạy học và học liệu**
     + **III. Tiến trình dạy học**
   - Tất cả các đề mục con và tiểu mục BẮT BUỘC PHẢI IN ĐẬM:
     + **1. Kiến thức:**, **2. Năng lực:**, **3. Phẩm chất:**
     + **1. Thiết bị dạy học:**, **2. Học liệu:** (hoặc **1. Giáo viên:**, **2. Học sinh:**)
     + Các hoạt động: **1. Hoạt động 1: Khởi động** (hoặc **Hoạt động 1: Khởi động**), **2. Hoạt động 2: Hình thành kiến thức mới** (hoặc **Hoạt động 2: Hình thành kiến thức mới**), **3. Hoạt động 3: Luyện tập** (hoặc **Hoạt động 3: Luyện tập**), **4. Hoạt động 4: Vận dụng** (hoặc **Hoạt động 4: Vận dụng**).
     + Tiểu mục trong hoạt động: **a) Mục tiêu:**, **b) Nội dung:**, **c) Sản phẩm:**, **d) Tổ chức thực hiện:**
     + Các bước thực hiện: **Bước 1: Chuyển giao nhiệm vụ**, **Bước 2: Thực hiện nhiệm vụ**, **Bước 3: Báo cáo, thảo luận**, **Bước 4: Kết luận, nhận định**.
     + **a) Năng lực đặc thù môn...**, **b) Năng lực chung:**, **c) Năng lực số (NLS):**, **d) Năng lực AI:**, **e) Giáo dục Stem (nếu có):**.

3. CHI TIẾT PHẦN I. MỤC TIÊU (CHUẨN GDPT 2018):
   Gồm đúng 3 mục lớn in đậm:
   **1. Kiến thức:** Nêu rõ các yêu cầu cần đạt (YCCĐ) về kiến thức, kỹ năng bài học theo chương trình GDPT 2018.
   **2. Năng lực:**
      - **a) Năng lực đặc thù môn học** (Toán, Tin học, KHTN, Ngữ văn...): Ghi các năng lực đặc thù gắn liền với nội dung bài học.
      - **b) Năng lực chung:** Ghi các năng lực chung (Tự chủ và tự học, Giao tiếp và hợp tác, Giải quyết vấn đề và sáng tạo...) phù hợp với các hoạt động học tập của bài học.
      - **c) Năng lực số (NLS) (nếu có):** Dùng chỉ báo gì thì ghi rõ kèm cả NỘI DUNG CHỈ BÁO và MÃ ĐỊNH DANH bằng chữ màu đỏ: <span style="color: red;">*[Nội dung chỉ báo và mã định danh]*</span>
      - **d) Năng lực AI (nếu có tích hợp):** Ghi rõ mã YCCĐ và nội dung yêu cầu cần đạt AI bằng chữ màu đỏ: <span style="color: red;">*[Mã YCCĐ] [Nội dung YCCĐ cụ thể]*</span>
      - **e) Giáo dục Stem (nếu có tích hợp):** Ghi rõ mục tiêu STEM bằng chữ màu đỏ: <span style="color: red;">*Tích hợp STEM: [Nội dung mục tiêu STEM]*</span>
   **3. Phẩm chất:** Ghi các phẩm chất cốt lõi (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm) gắn với hành vi cụ thể của học sinh.
   * ĐỐI VỚI HỌC SINH KHUYẾT TẬT: Nếu có học sinh khuyết tật hòa nhập, ghi ở cuối phần mục tiêu bằng chữ màu đỏ: <span style="color: red;">*Tích hợp giáo dục hòa nhập (HS khuyết tật): [Mục tiêu điều chỉnh/giảm nhẹ]</span>.

4. CHI TIẾT PHẦN II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU (THEO THÔNG TƯ 38/BGDĐT):
   - Phải giống với Phụ lục 1 và 3 theo danh mục Thông tư 38 của Bộ GD&ĐT, CHỈ BỔ SUNG THÊM TI VI (hoặc máy chiếu) vào Phụ lục 4.
   - Trình bày theo các mục in đậm rõ ràng:
     Cách 1: **1. Giáo viên:** Thiết bị dạy học theo Thông tư 38/BGDĐT, Ti vi / máy chiếu, máy tính, bài giảng điện tử, phiếu học tập...; **2. Học sinh:** SGK, vở ghi, dụng cụ học tập...
     Cách 2: **1. Thiết bị dạy học:**; **2. Học liệu:**.

5. CHI TIẾT PHẦN III. TIẾN TRÌNH DẠY HỌC (CẤU TRÚC HOẠT ĐỘNG TRONG PHỤ LỤC 4):
   - NẾU CHỌN HÌNH THỨC KẺ BẢNG 2 CỘT (CHUẨN 100% PHỤ LỤC 4):
     🚨 BẮT BUỘC 100% TẤT CẢ 4 HOẠT ĐỘNG (Hoạt động 1: Khởi động, Hoạt động 2: Hình thành kiến thức mới, Hoạt động 3: Luyện tập, Hoạt động 4: Vận dụng) ĐỀU PHẢI CÓ ĐỦ 4 MỤC a, b, c, d VÀ KẺ BẢNG 2 CỘT Ở MỤC d:
     🚨 TUYỆT ĐỐI KHÔNG ĐƯỢC BỎ 2 MỤC "c) Sản phẩm" VÀ "d) Tổ chức thực hiện".
     🚨 ĐẶC BIỆT LƯU Ý VỚI HOẠT ĐỘNG 3 (LUYỆN TẬP) VÀ HOẠT ĐỘNG 4 (VẬN DỤNG):
     Tuyệt đối cấm không được để Hoạt động 3 (Luyện tập) và Hoạt động 4 (Vận dụng) ở ngoài bảng. Toàn bộ 4 bước tổ chức và lời giải chi tiết/bài tập vận dụng đều phải nằm trong bảng 2 cột:
     Mỗi hoạt động gồm đầy đủ 4 phần:
     **a) Mục tiêu:** [Mục tiêu của hoạt động]
     **b) Nội dung:** [Nội dung nhiệm vụ/bài tập của hoạt động]
     **c) Sản phẩm:** [Sản phẩm học tập dự kiến/kết quả thực hiện]
     **d) Tổ chức thực hiện:**
     | Hoạt động của giáo viên và học sinh | Kết quả hoạt động |
     | :--- | :--- |
     | Gồm đủ 4 bước: **Bước 1: Chuyển giao nhiệm vụ**; **Bước 2: Thực hiện nhiệm vụ**; **Bước 3: Báo cáo, thảo luận**; **Bước 4: Kết luận, nhận định** | Kết quả thực hiện, câu trả lời, lời giải chi tiết các bài tập, sản phẩm học tập của HS |
   - NẾU CHỌN HÌNH THỨC KHÔNG KẺ BẢNG -> ĐỂ ĐỦ 4 PHẦN IN ĐẬM:
     **a) Mục tiêu:**
     **b) Nội dung:**
     **c) Sản phẩm:**
     **d) Tổ chức thực hiện:** (gồm 4 bước in đậm: **Bước 1: Chuyển giao nhiệm vụ**; **Bước 2: Thực hiện nhiệm vụ**; **Bước 3: Báo cáo, thảo luận**; **Bước 4: Kết luận, nhận định**).

5. 🚨 BẢO TOÀN 100% HÌNH VẼ, HÌNH ẢNH, BIỂU ĐỒ HỌC LIỆU GỐC (HÌNH HỌC / THÍ NGHIỆM / TRANH ẢNH SGK):
   - Tất cả hình vẽ thực tế, tranh ảnh minh họa, sơ đồ hình học (ví dụ: Hình vuông ABCD, Hình thang, Khinh khí cầu, Sơ đồ mạch điện, Thí nghiệm, Tranh vẽ SGK...) có mã [IMG1], [IMG2]... hoặc [HINHANHGOC_1], [HINHANHGOC_2]... BẮT BUỘC PHẢI GIỮ NGUYÊN 100% VỊ TRÍ trong CỘT 2: "KẾT QUẢ HOẠT ĐỘNG" (CỘT SẢN PHẨM) của bảng 2 cột hoạt động.
   - 🚨 TUYỆT ĐỐI KHÔNG ĐẶT HÌNH ẢNH Ở CỘT 1 "Hoạt động của giáo viên và học sinh". Tất cả hình vẽ SGK / bài tập phải nằm trong Cột 2.
   - ⛔️ ĐẶC BIỆT LƯU Ý VỀ CÔNG THỨC TOÁN VÀ PHÂN SỐ:
     + TUYỆT ĐỐI KHÔNG ĐƯỢC COI CÁC PHÂN SỐ (như 1/2, a/b...), CÔNG THỨC TOÁN, BIỂU THỨC ĐẠI SỐ LÀ HÌNH ẢNH/HÌNH VẼ! Tất cả công thức và phân số phải được viết bằng mã chuẩn LaTeX $\\frac{a}{b}$.
     + CẤM tạo mã [HINHANHGOC_...] cho phân số hay công thức toán học. NHƯNG VỚI HÌNH VẼ/TRANH ẢNH HỌC LIỆU THẬT, BẮT BUỘC GIỮ NGUYÊN 100% THẺ [HINHANHGOC_...] VÀ ĐẶT Ở CỘT 2!

6. 🚨 QUY TẮC HIỂN THỊ & ĐỊNH DẠNG TẤT CẢ CÁC NỘI DUNG TÍCH HỢP (MÀU ĐỎ, ĐẦU CÂU, KHÔNG GẠCH ĐẦU DÒNG, KHÔNG IN NGHIÊNG):
   - Tất cả các nội dung tích hợp (Năng lực số, Năng lực AI, Giáo dục hòa nhập / HS khuyết tật, GDQP-AN, STEM...) BẮT BUỘC:
     + Dấu * PHẢI ĐỨNG Ở ĐẦU CÂU và TUYỆT ĐỐI KHÔNG CÓ GẠCH ĐẦU DÒNG (- ) trước dấu * (ví dụ: *Tích hợp năng lực số: ..., *Tích hợp năng lực AI: ..., *Tích hợp giáo dục hòa nhập:, *HS khuyết tật [Tên dạng khuyết tật]: ..., *Tích hợp Lồng ghép GDQP-AN: ..., *Tích hợp STEM: ...).
     + Toàn bộ nội dung tích hợp đều hiển thị chữ MÀU ĐỎ và ĐỨNG THẲNG (KHÔNG IN NGHIÊNG TÙY TIỆN).
     + TUYỆT ĐỐI KHÔNG GẠCH CHÂN (KHÔNG DÙNG THẺ <u>).
     + TUYỆT ĐỐI KHÔNG viết thẻ HTML thô <span>, </span> trong nội dung.

7. QUY CÁCH TRÌNH BÀY VĂN BẢN (THEO THÔNG TƯ 30 / NGHỊ ĐỊNH 30):
   - Sử dụng phông chữ chuẩn tiếng Việt Unicode (Times New Roman), cỡ chữ 13-14pt, giãn dòng hợp lý, tiêu đề in hoa đậm rõ ràng, căn lề chuẩn xác, không rác định dạng.
   - Toàn bộ văn bản giáo án sử dụng chữ thẳng (regular) chuẩn mực, KHÔNG in nghiêng tùy tiện khắp nơi trong bài.

8. TIẾT DẠY HỌC CÓ NỘI DUNG STEM:
   - Tên bài dạy vẫn ghi bình thường nhưng có mở ngoặc: (Tích hợp STEM) hoặc (Chủ đề STEM).
   - Toàn bộ nội dung hướng dẫn hoạt động STEM sẽ được GHÉP VÀO HOẠT ĐỘNG VẬN DỤNG, đánh dấu: *Tích hợp STEM: [Nội dung thử thách, nhiệm vụ thiết kế].

9. 📐 CÔNG THỨC TOÁN HỌC & KHOA HỌC CHUẨN LATEX (100% TƯƠNG THÍCH MATHTYPE TRONG WORD):
   - BẮT BUỘC 100% tất cả các công thức toán học, biểu thức đại số, biến số ($x$, $y$, $z$, $a$, $b$, $c$, $m$, $n$), điểm và hình học ($A$, $B$, $C$, $\\Delta ABC$), phân số ($\\frac{a}{b}$), căn thức ($\\sqrt{x}$, $\\sqrt{x^2+1}$), số mũ ($x^2$, $a^n$), chỉ số dưới ($x_0$, $y_0$, $x_1$, $x_2$), hệ phương trình ($\\begin{cases} ax+by=c \\\\ a'x+b'y=c' \\end{cases}$), góc ($\\widehat{ABC}$, $\\widehat{A}$), độ ($^\\circ$), véc-tơ ($\\vec{u}$, $\\overrightarrow{AB}$), ký hiệu hình học ($\\parallel$, $\\perp$), tập hợp ($\\in$, $\\notin$, $\\subset$, $\\cap$, $\\cup$, $\\emptyset$, $\\mathbb{R}$, $\\mathbb{N}$, $\\mathbb{Z}$), quan hệ so sánh ($\\le$, $\\ge$, $\\neq$, $\\approx$), phép toán ($\\times$, $\\cdot$, $\\div$, $\\pm$) PHẢI được viết bằng cú pháp chuẩn LaTeX đặt trong cặp dấu $...$ (cho công thức nội dòng) hoặc $...$ (cho công thức hoặc hệ phương trình dòng độc lập).
   - 🚨 CHỐNG DÍNH CHỮ: Luôn có khoảng cách (dấu cách) giữa công thức toán $...$ và các từ tiếng Việt xung quanh (ví dụ: "cho đa thức $P(x)$ và", "với $x = 1$", "ta có $A = B$"). TUYỆT ĐỐI KHÔNG ĐỂ CÔNG THỨC TOÁN SÁT DÍNH VÀO TỪ BÊN CẠNH.
   - 🚨 CẤM TUYỆT ĐỐI VIẾT PHÂN SỐ VÀ BẤT ĐẲNG THỨC BẰNG TEXT THÔ:
     + CẤM viết phân số bằng dấu gạch chéo thô (như 2024/1000, 24/1000, -2022/2023, 1/2). BẮT BUỘC dùng phân số LaTeX trong $...$: ví dụ $\\frac{2024}{1000} = 2 + \\frac{24}{1000} > 1,9$ hoặc $-\\frac{2022}{2023} = -1 + \\frac{1}{2023} > -1,1$ hoặc $\\frac{1}{2}$.
     + CẤM viết bất đẳng thức hoặc phép so sánh bằng ký tự Unicode thô (như a≤50, b≤50, x≥0, x≠3). BẮT BUỘC dùng cú pháp LaTeX trong $...$: ví dụ $a \\le 50$, $b \\le 50$, $x \\ge 0$, $x \\neq 3$.
   - 🚨 ĐẶC BIỆT - TỰ ĐỘNG PHỤC HỒI CÔNG THỨC MATHTYPE BỊ LỖI (EMBED EQUATION / DSMT4):
     + Nếu trong dữ liệu đầu vào có chứa chuỗi "[CÔNG_THỨC_TOÁN: MathType]", "EMBED Equation.DSMT4", "Equation.DSMT4", "Equation.3", hoặc các công thức bị mất: AI BẮT BUỘC PHẢI phân tích ngữ cảnh bài học (ví dụ: bài Hệ hai phương trình bậc nhất hai ẩn thì phục hồi: $\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}$, nghiệm $(x_0; y_0)$,...) để TỰ ĐỘNG PHỤC HỒI và viết lại công thức toán học chuẩn LaTeX hoàn chỉnh 100%.
     + TUYỆT ĐỐI CẤM để lại bất kỳ chữ "EMBED Equation" hay "DSMT4" nào trong giáo án đầu ra!
   - 🚨 QUY TẮC CÚ PHÁP LATEX ĐỂ MATHTYPE TRONG WORD CHUYỂN ĐỔI 1-CHẠM (TOGGLE TEX) KHÔNG BỊ LỖI:
     + Không để khoảng trắng sát mép trong của dấu $: dùng $x + y = 1$, KHÔNG dùng $ x + y = 1 $.
     + Hệ phương trình luôn dùng môi trường cases: $\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}$.
     + TUYỆT ĐỐI KHÔNG chèn thẻ HTML (như <span>, <br>, <b>) hoặc ký hiệu Markdown (**, *) bên trong cặp dấu $ ... $.
     + Luôn đóng mở ngoặc nhọn {} đầy đủ và chính xác.
   - TUYỆT ĐỐI KHÔNG để phân số hay công thức toán biến thành hình ảnh.

=========================================================
`;

export const PLACEHOLDER_LESSON = `TÊN BÀI HỌC: THỐNG KÊ MÔ TẢ
Môn: Toán - Lớp: 7

I. MỤC TIÊU
1. Kiến thức: Học sinh nắm được khái niệm thống kê, biết cách thu thập số liệu.
2. Kỹ năng: Biết lập bảng số liệu thống kê.
3. Thái độ: Cẩn thận, chính xác.

II. TIẾN TRÌNH DẠY HỌC
Hoạt động 1: Khởi động
- GV cho HS xem video về ứng dụng thống kê trong đời sống.
- HS quan sát và nhận xét.

Hoạt động 2: Hình thành kiến thức
- GV hướng dẫn học sinh cách thu thập số liệu từ thực tế.
- HS thực hành ghi chép số liệu chiều cao của các bạn trong tổ.
`;

export const GDQPAN_DATA = `
[DỮ LIỆU TÍCH HỢP GIÁO DỤC QUỐC PHÒNG VÀ AN NINH (GDQPAN) THEO THÔNG TƯ]
Cấp tiểu học:
- Chủ đề chung (Lớp 1-5): Giáo dục tình yêu quê hương, yêu hòa bình, yêu Tổ quốc Việt Nam xã hội chủ nghĩa; niềm tự hào, tự tôn dân tộc, lòng biết ơn các anh hùng, liệt sĩ trong xây dựng và bảo vệ Tổ quốc; bảo vệ an ninh quốc gia, giữ gìn trật tự an toàn xã hội; giới thiệu chủ quyền biển, đảo của Việt Nam; giáo dục tinh thần đoàn kết, tương trợ, giúp đỡ nhau, có ý thức tổ chức kỉ luật trong học tập.
- Lớp 1: Giáo dục tình yêu quê hương, yêu hòa bình, yêu Tổ quốc Việt Nam xã hội chủ nghĩa; giới thiệu một số hình ảnh về Quân đội Nhân dân Việt Nam và Công an Nhân dân Việt Nam; một số di tích lịch sử của địa phương.
- Lớp 2: Giáo dục tinh thần đoàn kết toàn dân tộc, sự hi sinh của các chiến sĩ cách mạng trong kháng chiến chống thực dân Pháp và đế quốc Mỹ; giới thiệu một số hình ảnh cán bộ, chiến sĩ Quân đội Nhân dân Việt Nam, Công an Nhân dân Việt Nam làm nhiệm vụ bảo vệ Tổ quốc và giữ gìn trật tự, an toàn xã hội; giáo dục học sinh biết yêu thương, chia sẻ, giúp đỡ và bảo vệ nhau trong học tập.
- Lớp 3: Giáo dục truyền thống chống giặc ngoại xâm của dân tộc; giới thiệu những tấm gương dũng cảm của thiếu niên, nhi đồng, bà Mẹ Việt Nam anh hùng trong sự nghiệp giải phóng dân tộc; những hoạt động, hình ảnh học sinh tham gia bảo vệ môi trường ở địa phương và nhà trường.
- Lớp 4: Giới thiệu bản đồ hành chính Việt Nam, khẳng định chủ quyền của Việt Nam đối với quần đảo Hoàng Sa và Trường Sa; một số bài hát về biển, đảo Việt Nam; giáo dục ý thức chấp hành pháp luật về trật tự, an toàn giao thông.
- Lớp 5: Giới thiệu chủ quyền, quyền chủ quyền biển, đảo của Việt Nam; một số hình ảnh khai thác thủy sản, hải sản và tài nguyên để phát triển kinh tế xã hội, bảo đảm quốc phòng, an ninh; tấm gương dũng cảm của cán bộ, chiến sĩ Quân đội và Công an trong cứu hộ, cứu nạn.

Cấp trung học cơ sở (Lớp 6-9):
- Chủ đề chung (Lớp 6-9): Giáo dục tinh thần đoàn kết, yêu nước của dân tộc Việt Nam trong dựng nước và giữ nước qua các thời kì lịch sử; bảo vệ chủ quyền biển, đảo; bảo vệ chủ quyền, lãnh thổ, biên giới quốc gia; quyền lợi, trách nhiệm công dân đối với sự nghiệp xây dựng và bảo vệ Tổ quốc; giới thiệu sự kiện lịch sử chống giặc ngoại xâm; bảo vệ thông tin cá nhân khi tham gia mạng xã hội; phòng, chống tệ nạn xã hội đối với học sinh; chính sách tín ngưỡng, tôn giáo của Nhà nước.
- Lớp 6: Giới thiệu lịch sử và truyền thống của Quân đội Nhân dân Việt Nam và Công an Nhân dân Việt Nam; địa danh lịch sử gắn với các cuộc kháng chiến chống giặc ngoại xâm; cách đánh mưu trí, sáng tạo của quân và dân ta trong kháng chiến chống giặc ngoại xâm.
- Lớp 7: Giới thiệu hoạt động, hình ảnh bảo vệ chủ quyền biển, đảo Việt Nam; bảo vệ thông tin cá nhân khi tham gia mạng xã hội; quyền tự do tín ngưỡng, tôn giáo theo quy định của pháp luật.
- Lớp 8: Giáo dục lòng tự hào, tự tôn dân tộc và sức mạnh đại đoàn kết toàn dân tộc trong đấu tranh chống giặc ngoại xâm; giới thiệu một số mốc quốc giới; tác hại của tệ nạn xã hội; trách nhiệm của học sinh tham gia phòng, chống bạo lực học đường.
- Lớp 9: Hậu quả của các cuộc chiến tranh xâm lược đối với dân tộc Việt Nam; hình ảnh về phát triển kinh tế, xã hội và bảo đảm quốc phòng, an ninh; giới thiệu bài hát ca ngợi truyền thống vẻ vang của Quân đội và Công an; trách nhiệm của học sinh tham gia xây dựng và bảo vệ Tổ quốc.
`;