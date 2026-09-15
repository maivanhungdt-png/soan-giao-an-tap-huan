// Test fixing unclosed bold tags
function sanitizeHeading(s: string): string {
  let line = s.trim();
  if (!line) return "";

  // 0. Remove leading bullets from major headings
  line = line.replace(/^[\s\-\+•\*]+(?=(?:[I|V|X]+\.|\d+\.\s*(?:Kiến\s*thức|Năng\s*lực|Phẩm\s*chất|Giáo\s*viên|Học\s*sinh|Thiết\s*bị|Học\s*liệu)|[a-e]\)\s*(?:Năng\s*lực|Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Tổ\s*chức)|Bước\s*[1-4]|Hoạt\s*động))/i, '');

  // 1. Roman headings
  if (/^(?:\*\*)?((?:I|II|III|IV|V|VI)\.\s*[^:\n]+)(?:\*\*)?$/i.test(line)) {
    const clean = line.replace(/^\*\*|\*\*$/g, '').trim();
    return `**${clean}**`;
  }

  // 2. Main numbered headings
  const numMatch = line.match(/^(?:\*\*)?([1-3]\.\s*(?:Kiến\s*thức|Năng\s*lực|Phẩm\s*chất)|[1-2]\.\s*(?:Giáo\s*viên|Học\s*sinh|Thiết\s*bị|Học\s*liệu))(?::|\*\*)?[ \t]*(.*)$/i);
  if (numMatch) {
    let label = numMatch[1].replace(/^\*\*|\*\*$/g, '').trim();
    if (!label.endsWith(':')) label += ':';
    let rest = (numMatch[2] || '').replace(/^\*\*+|\*\*+$/g, '').trim();
    return rest ? `**${label}** ${rest}` : `**${label}**`;
  }

  // 3. Sub-letter headings
  const subMatch = line.match(/^(?:\*\*)?([a-e]\)\s*(?:Năng\s*lực[^\n:]*|Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Tổ\s*chức\s*thực\s*hiện|Yêu\s*cầu))(?::|\*\*)?[ \t]*(.*)$/i);
  if (subMatch) {
    let label = subMatch[1].replace(/^\*\*|\*\*$/g, '').trim();
    if (!label.endsWith(':')) label += ':';
    let rest = (subMatch[2] || '').replace(/^\*\*+|\*\*+$/g, '').trim();
    return rest ? `**${label}** ${rest}` : `**${label}**`;
  }

  // 4. Step headings
  const stepMatch = line.match(/^(?:\*\*)?(Bước\s*[1-4]\s*:\s*[^:\n]+|Bước\s*[1-4])(?::|\*\*)?[ \t]*(.*)$/i);
  if (stepMatch) {
    let label = stepMatch[1].replace(/^\*\*|\*\*$/g, '').trim();
    if (!label.endsWith(':')) label += ':';
    let rest = (stepMatch[2] || '').replace(/^\*\*+|\*\*+$/g, '').trim();
    return rest ? `**${label}** ${rest}` : `**${label}**`;
  }

  return line;
}

const testLines = [
  "- II. Thiết bị dạy học và học liệu",
  "-1. Giáo viên:",
  "-2. Học sinh:",
  "- a) Năng lực đặc thù:",
  "c) Sản phẩm:Kết quả giải quyết bài toán/vấn đề thực tế hoặc sản phẩm học tập của học sinh.",
  "d) Tổ chức thực hiện:",
  "*Bước 1: Chuyển giao nhiệm vụ:** GV giao bài toán thực tiễn / nhiệm vụ tình huống cho HS thực hiện.",
  "Bước 2: Thực hiện nhiệm vụ:HS vận dụng kiến thức bài học để nghiên cứu...",
  "Bước 3: Báo cáo, thảo luận:HS nộp sản phẩm / đại diện trình bày...",
  "Bước 4: Kết luận, nhận định:GV nhận xét, đánh giá tinh thần tự học..."
];

testLines.forEach(l => {
  console.log(`Original: "${l}"`);
  console.log(`Sanitized: "${sanitizeHeading(l)}"\n`);
});
