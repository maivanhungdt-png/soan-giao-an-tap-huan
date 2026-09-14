/**
 * Educational Diagram & Geometric Drawing Generator
 * Generates crisp SVG diagrams and renders high-res illustrations for math, science, and technology lesson plans.
 */

export interface DiagramConfig {
  type: string;
  title: string;
  caption?: string;
  labels?: string[];
  dimensions?: { width: number; height: number };
}

/**
 * Detect the most suitable diagram type based on surrounding context text
 */
export function detectDiagramType(contextText: string, altText: string = ''): string {
  const fullText = `${contextText} ${altText}`.toLowerCase();

  // 1. Cắt gấp hình vuông từ hình chữ nhật (Paper folding / cutting square from rectangle)
  if (
    (fullText.includes('gấp') || fullText.includes('cắt') || fullText.includes('tờ giấy') || fullText.includes('đường chéo')) &&
    (fullText.includes('hình vuông') || fullText.includes('hình chữ nhật'))
  ) {
    return 'fold_square_from_rect';
  }

  // 2. Hình thoi
  if (fullText.includes('hình thoi') || fullText.includes('đường chéo vuông góc') || fullText.includes('rhombus')) {
    return 'rhombus';
  }

  // 3. Hình bình hành
  if (fullText.includes('hình bình hành') || fullText.includes('parallelogram')) {
    return 'parallelogram';
  }

  // 4. Hình thang / hình thang cân / hình thang vuông
  if (fullText.includes('hình thang') || fullText.includes('thang cân') || fullText.includes('trapezoid')) {
    return 'trapezoid';
  }

  // 5. Hình vuông
  if (fullText.includes('hình vuông') || fullText.includes('square')) {
    return 'square';
  }

  // 6. Hình chữ nhật
  if (fullText.includes('hình chữ nhật') || fullText.includes('rectangle')) {
    return 'rectangle';
  }

  // 7. Tam giác vuông / Định lý Pythagore
  if (fullText.includes('tam giác vuông') || fullText.includes('pythagore') || fullText.includes('pitago') || fullText.includes('huyền') || fullText.includes('góc vuông')) {
    return 'right_triangle';
  }

  // 8. Tam giác đều / cân / thường
  if (fullText.includes('tam giác đều') || fullText.includes('tam giác cân') || fullText.includes('tam giác') || fullText.includes('triangle')) {
    return 'triangle';
  }

  // 9. Đường tròn / Hình quạt / Góc ở tâm
  if (fullText.includes('đường tròn') || fullText.includes('hình tròn') || fullText.includes('bán kính') || fullText.includes('đường kính') || fullText.includes('tâm o') || fullText.includes('quạt tròn')) {
    return 'circle';
  }

  // 10. Trục toạ độ Oxy / Trục số
  if (fullText.includes('hệ trục') || fullText.includes('toạ độ') || fullText.includes('tọa độ') || fullText.includes('oxy') || fullText.includes('trục số') || fullText.includes('đồ thị')) {
    return 'coordinate';
  }

  // 11. Hình học không gian 3D (Hình lập phương, hình hộp chữ nhật)
  if (fullText.includes('lập phương') || fullText.includes('hộp chữ nhật') || fullText.includes('khối hộp') || fullText.includes('3d')) {
    return 'cube_3d';
  }

  // 12. Hình lăng trụ đứng / Hình chóp
  if (fullText.includes('lăng trụ') || fullText.includes('hình chóp') || fullText.includes('chóp tam giác') || fullText.includes('chóp tứ giác')) {
    return 'pyramid_3d';
  }

  // 13. Hình nón / Hình trụ / Hình cầu
  if (fullText.includes('hình nón') || fullText.includes('hình trụ') || fullText.includes('hình cầu')) {
    return 'cylinder_cone';
  }

  // 14. Mạch điện (Vật lý / KHTN / Công nghệ)
  if (fullText.includes('mạch điện') || fullText.includes('nguồn điện') || fullText.includes('pin') || fullText.includes('bóng đèn') || fullText.includes('công tắc') || fullText.includes('ampe') || fullText.includes('vôn')) {
    return 'circuit';
  }

  // 15. Sơ đồ khối thuật toán (Tin học)
  if (fullText.includes('sơ đồ khối') || fullText.includes('thuật toán') || fullText.includes('bắt đầu') || fullText.includes('lưu đồ') || fullText.includes('flowchart')) {
    return 'flowchart';
  }

  // 16. Thí nghiệm KHTN / Hóa học
  if (fullText.includes('thí nghiệm') || fullText.includes('ống nghiệm') || fullText.includes('cốc thủy tinh') || fullText.includes('đèn cồn') || fullText.includes('hóa chất') || fullText.includes('dung dịch')) {
    return 'experiment';
  }

  // 17. Sơ đồ tư duy / Chuỗi thức ăn
  if (fullText.includes('sơ đồ tư duy') || fullText.includes('mindmap') || fullText.includes('chuỗi thức ăn') || fullText.includes('sinh vật')) {
    return 'mindmap';
  }

  // 18. Biểu đồ thống kê
  if (fullText.includes('biểu đồ') || fullText.includes('cột') || fullText.includes('hình quạt') || fullText.includes('thống kê')) {
    return 'chart';
  }

  return 'generic_geometry';
}

/**
 * Generate high quality SVG code for a given diagram type
 */
export function generateEducationalDiagramSvg(type: string, titleNumber = '1', customCaption?: string): string {
  const width = 480;
  const height = 300;

  let contentSvg = '';
  let defaultCaption = `Hình ${titleNumber}: Sơ đồ hình học minh họa`;

  switch (type) {
    case 'fold_square_from_rect':
      defaultCaption = `Hình ${titleNumber}: Thao tác gấp góc tờ giấy hình chữ nhật theo đường chéo để tạo hình vuông`;
      contentSvg = `
        <!-- Background Sheet (Original Rectangle) -->
        <rect x="50" y="45" width="380" height="200" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="2" stroke-dasharray="6 4" />
        
        <!-- Folded Square Region (Highlighted) -->
        <polygon points="50,45 250,45 250,245 50,245" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5" />
        
        <!-- Diagonal Fold Line -->
        <line x1="50" y1="245" x2="250" y2="45" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="5 3" />
        
        <!-- Excess Part (To be cut off) -->
        <rect x="250" y="45" width="180" height="200" fill="#fef2f2" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="4 3" />
        
        <!-- Fold Arrow Indicator -->
        <path d="M 120,70 Q 150,140 180,180" fill="none" stroke="#dc2626" stroke-width="2" marker-end="url(#arrow-red)" />
        <text x="140" y="110" font-size="12" font-weight="bold" fill="#dc2626" font-family="sans-serif">Nếp gấp</text>
        
        <!-- Scissors / Cut Line -->
        <line x1="250" y1="35" x2="250" y2="255" stroke="#475569" stroke-width="2" stroke-dasharray="4 4" />
        <g transform="translate(240, 135)">
          <text font-size="18" fill="#e11d48">✂️</text>
          <text x="24" y="14" font-size="11" font-weight="bold" fill="#e11d48" font-family="sans-serif">Cắt bỏ phần thừa</text>
        </g>

        <!-- Right Angle Symbols -->
        <rect x="50" y="45" width="14" height="14" fill="none" stroke="#2563eb" stroke-width="1.5" />
        <circle cx="57" cy="52" r="1.5" fill="#2563eb" />
        <rect x="50" y="231" width="14" height="14" fill="none" stroke="#2563eb" stroke-width="1.5" />
        <circle cx="57" cy="238" r="1.5" fill="#2563eb" />
        <rect x="236" y="45" width="14" height="14" fill="none" stroke="#2563eb" stroke-width="1.5" />
        <circle cx="243" cy="52" r="1.5" fill="#2563eb" />
        <rect x="236" y="231" width="14" height="14" fill="none" stroke="#2563eb" stroke-width="1.5" />
        <circle cx="243" cy="238" r="1.5" fill="#2563eb" />

        <!-- Dimension Labels -->
        <text x="150" y="35" font-size="13" font-weight="bold" fill="#1e3a8a" text-anchor="middle" font-family="sans-serif">Cạnh a (Hình vuông)</text>
        <text x="35" y="150" font-size="13" font-weight="bold" fill="#1e3a8a" text-anchor="middle" font-family="sans-serif" transform="rotate(-90 35,150)">Cạnh a</text>
        <text x="340" y="35" font-size="11" font-style="italic" fill="#94a3b8" text-anchor="middle" font-family="sans-serif">Phần thừa</text>

        <!-- Vertex Labels -->
        <text x="42" y="40" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="254" y="40" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="254" y="260" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="42" y="260" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">D</text>
        <text x="435" y="40" font-size="14" font-weight="bold" fill="#64748b" font-family="sans-serif">M</text>
        <text x="435" y="260" font-size="14" font-weight="bold" fill="#64748b" font-family="sans-serif">N</text>
      `;
      break;

    case 'square':
      defaultCaption = `Hình ${titleNumber}: Hình vuông ABCD (4 cạnh bằng nhau, 4 góc vuông)`;
      contentSvg = `
        <polygon points="140,50 340,50 340,250 140,250" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2.5" />
        <!-- Diagonals -->
        <line x1="140" y1="50" x2="340" y2="250" stroke="#93c5fd" stroke-width="1.5" stroke-dasharray="4 3" />
        <line x1="340" y1="50" x2="140" y2="250" stroke="#93c5fd" stroke-width="1.5" stroke-dasharray="4 3" />
        <!-- Center O -->
        <circle cx="240" cy="150" r="3" fill="#1e3a8a" />
        <text x="248" y="146" font-size="12" font-weight="bold" fill="#1e3a8a" font-family="sans-serif">O</text>
        <!-- Equal Side Hash Marks -->
        <line x1="237" y1="46" x2="243" y2="54" stroke="#1d4ed8" stroke-width="2" />
        <line x1="237" y1="246" x2="243" y2="254" stroke="#1d4ed8" stroke-width="2" />
        <line x1="136" y1="147" x2="144" y2="153" stroke="#1d4ed8" stroke-width="2" />
        <line x1="336" y1="147" x2="344" y2="153" stroke="#1d4ed8" stroke-width="2" />
        <!-- Corner Right Angles -->
        <rect x="140" y="50" width="14" height="14" fill="none" stroke="#1d4ed8" stroke-width="1.5" />
        <circle cx="147" cy="57" r="1.5" fill="#1d4ed8" />
        <rect x="326" y="50" width="14" height="14" fill="none" stroke="#1d4ed8" stroke-width="1.5" />
        <circle cx="333" cy="57" r="1.5" fill="#1d4ed8" />
        <rect x="326" y="236" width="14" height="14" fill="none" stroke="#1d4ed8" stroke-width="1.5" />
        <circle cx="333" cy="243" r="1.5" fill="#1d4ed8" />
        <rect x="140" y="236" width="14" height="14" fill="none" stroke="#1d4ed8" stroke-width="1.5" />
        <circle cx="147" cy="243" r="1.5" fill="#1d4ed8" />
        <!-- Vertices -->
        <text x="126" y="46" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="346" y="46" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="346" y="264" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="126" y="264" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">D</text>
        <!-- Side label a -->
        <text x="240" y="38" font-size="14" font-style="italic" font-weight="bold" fill="#1e3a8a" text-anchor="middle" font-family="serif">a</text>
        <text x="122" y="155" font-size="14" font-style="italic" font-weight="bold" fill="#1e3a8a" text-anchor="middle" font-family="serif">a</text>
      `;
      break;

    case 'rectangle':
      defaultCaption = `Hình ${titleNumber}: Hình chữ nhật ABCD (chiều dài a, chiều rộng b)`;
      contentSvg = `
        <polygon points="90,70 390,70 390,230 90,230" fill="#f0fdf4" stroke="#16a34a" stroke-width="2.5" />
        <!-- Diagonals -->
        <line x1="90" y1="70" x2="390" y2="230" stroke="#86efac" stroke-width="1.5" stroke-dasharray="4 3" />
        <line x1="390" y1="70" x2="90" y2="230" stroke="#86efac" stroke-width="1.5" stroke-dasharray="4 3" />
        <!-- Center O -->
        <circle cx="240" cy="150" r="3" fill="#14532d" />
        <text x="246" y="144" font-size="12" font-weight="bold" fill="#14532d" font-family="sans-serif">O</text>
        <!-- Corner Right Angles -->
        <rect x="90" y="70" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="1.5" />
        <circle cx="97" cy="77" r="1.5" fill="#16a34a" />
        <rect x="376" y="70" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="1.5" />
        <circle cx="383" cy="77" r="1.5" fill="#16a34a" />
        <rect x="376" y="216" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="1.5" />
        <circle cx="383" cy="223" r="1.5" fill="#16a34a" />
        <rect x="90" y="216" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="1.5" />
        <circle cx="97" cy="223" r="1.5" fill="#16a34a" />
        <!-- Vertices -->
        <text x="76" y="66" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="396" y="66" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="396" y="244" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="76" y="244" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">D</text>
        <!-- Labels -->
        <text x="240" y="58" font-size="14" font-style="italic" font-weight="bold" fill="#15803d" text-anchor="middle" font-family="serif">a (chiều dài)</text>
        <text x="72" y="155" font-size="14" font-style="italic" font-weight="bold" fill="#15803d" text-anchor="middle" font-family="serif" transform="rotate(-90 72,155)">b (chiều rộng)</text>
      `;
      break;

    case 'parallelogram':
      defaultCaption = `Hình ${titleNumber}: Hình bình hành ABCD (các cạnh đối song song và bằng nhau)`;
      contentSvg = `
        <polygon points="140,70 410,70 340,230 70,230" fill="#faf5ff" stroke="#9333ea" stroke-width="2.5" />
        <!-- Height line AH -->
        <line x1="140" y1="70" x2="140" y2="230" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 3" />
        <!-- Right angle at H -->
        <rect x="140" y="216" width="14" height="14" fill="none" stroke="#dc2626" stroke-width="1.5" />
        <circle cx="147" cy="223" r="1.5" fill="#dc2626" />
        <!-- Vertices -->
        <text x="134" y="62" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="416" y="66" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="346" y="246" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="54" y="244" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">D</text>
        <text x="134" y="246" font-size="14" font-weight="bold" fill="#dc2626" font-family="sans-serif">H</text>
        <!-- Labels -->
        <text x="205" y="250" font-size="14" font-style="italic" font-weight="bold" fill="#7e22ce" text-anchor="middle" font-family="serif">a (đáy)</text>
        <text x="126" y="155" font-size="14" font-style="italic" font-weight="bold" fill="#dc2626" text-anchor="middle" font-family="serif">h</text>
      `;
      break;

    case 'rhombus':
      defaultCaption = `Hình ${titleNumber}: Hình thoi ABCD (4 cạnh bằng nhau, 2 đường chéo vuông góc)`;
      contentSvg = `
        <polygon points="240,40 390,150 240,260 90,150" fill="#fffbeb" stroke="#d97706" stroke-width="2.5" />
        <!-- Diagonals AC and BD -->
        <line x1="240" y1="40" x2="240" y2="260" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 3" />
        <line x1="90" y1="150" x2="390" y2="150" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 3" />
        <!-- Center O -->
        <circle cx="240" cy="150" r="3" fill="#1e3a8a" />
        <text x="246" y="142" font-size="12" font-weight="bold" fill="#1e3a8a" font-family="sans-serif">O</text>
        <!-- Perpendicular square marker at O -->
        <rect x="240" y="136" width="14" height="14" fill="none" stroke="#2563eb" stroke-width="1.5" />
        <circle cx="247" cy="143" r="1.5" fill="#2563eb" />
        <!-- Vertices -->
        <text x="234" y="32" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="398" y="154" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="234" y="278" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="74" y="154" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">D</text>
        <!-- Diagonal labels -->
        <text x="254" y="90" font-size="13" font-style="italic" font-weight="bold" fill="#2563eb" font-family="serif">d₁</text>
        <text x="320" y="142" font-size="13" font-style="italic" font-weight="bold" fill="#2563eb" font-family="serif">d₂</text>
        <text x="325" y="85" font-size="13" font-style="italic" font-weight="bold" fill="#b45309" font-family="serif">a</text>
      `;
      break;

    case 'trapezoid':
      defaultCaption = `Hình ${titleNumber}: Hình thang cân ABCD (đáy nhỏ a, đáy lớn b, chiều cao h)`;
      contentSvg = `
        <polygon points="160,70 320,70 390,230 90,230" fill="#fdf4ff" stroke="#c026d3" stroke-width="2.5" />
        <!-- Heights AH and BK -->
        <line x1="160" y1="70" x2="160" y2="230" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 3" />
        <line x1="320" y1="70" x2="320" y2="230" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3" />
        <!-- Right angle at H -->
        <rect x="160" y="216" width="14" height="14" fill="none" stroke="#dc2626" stroke-width="1.5" />
        <circle cx="167" cy="223" r="1.5" fill="#dc2626" />
        <!-- Vertices -->
        <text x="154" y="62" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="324" y="62" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="396" y="244" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="74" y="244" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">D</text>
        <text x="154" y="246" font-size="14" font-weight="bold" fill="#dc2626" font-family="sans-serif">H</text>
        <text x="314" y="246" font-size="14" font-weight="bold" fill="#dc2626" font-family="sans-serif">K</text>
        <!-- Labels -->
        <text x="240" y="60" font-size="14" font-style="italic" font-weight="bold" fill="#a21caf" text-anchor="middle" font-family="serif">a (đáy nhỏ)</text>
        <text x="240" y="250" font-size="14" font-style="italic" font-weight="bold" fill="#a21caf" text-anchor="middle" font-family="serif">b (đáy lớn)</text>
        <text x="146" y="155" font-size="14" font-style="italic" font-weight="bold" fill="#dc2626" text-anchor="middle" font-family="serif">h</text>
      `;
      break;

    case 'right_triangle':
      defaultCaption = `Hình ${titleNumber}: Tam giác vuông ABC vuông tại A (Định lý Pythagore: BC² = AB² + AC²)`;
      contentSvg = `
        <polygon points="100,230 380,230 100,70" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5" />
        <!-- Right angle at A -->
        <rect x="100" y="216" width="14" height="14" fill="none" stroke="#2563eb" stroke-width="1.5" />
        <circle cx="107" cy="223" r="1.5" fill="#2563eb" />
        <!-- Height AH to hypotenuse -->
        <line x1="100" y1="230" x2="228" y2="156" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3" />
        <!-- Vertices -->
        <text x="82" y="244" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="390" y="244" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="88" y="64" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="234" y="150" font-size="14" font-weight="bold" fill="#dc2626" font-family="sans-serif">H</text>
        <!-- Side labels -->
        <text x="240" y="248" font-size="14" font-style="italic" font-weight="bold" fill="#1d4ed8" text-anchor="middle" font-family="serif">c (cạnh góc vuông)</text>
        <text x="76" y="155" font-size="14" font-style="italic" font-weight="bold" fill="#1d4ed8" text-anchor="middle" font-family="serif" transform="rotate(-90 76,155)">b</text>
        <text x="250" y="100" font-size="14" font-style="italic" font-weight="bold" fill="#dc2626" text-anchor="middle" font-family="serif">a (cạnh huyền)</text>
      `;
      break;

    case 'triangle':
      defaultCaption = `Hình ${titleNumber}: Tam giác ABC và đường cao AH`;
      contentSvg = `
        <polygon points="240,60 390,230 90,230" fill="#f0fdfa" stroke="#0d9488" stroke-width="2.5" />
        <!-- Height AH -->
        <line x1="240" y1="60" x2="240" y2="230" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 3" />
        <rect x="240" y="216" width="14" height="14" fill="none" stroke="#dc2626" stroke-width="1.5" />
        <circle cx="247" cy="223" r="1.5" fill="#dc2626" />
        <!-- Vertices -->
        <text x="234" y="50" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="398" y="244" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="74" y="244" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="234" y="248" font-size="14" font-weight="bold" fill="#dc2626" font-family="sans-serif">H</text>
        <!-- Labels -->
        <text x="240" y="250" font-size="14" font-style="italic" font-weight="bold" fill="#0f766e" text-anchor="middle" font-family="serif">a (đáy BC)</text>
        <text x="226" y="150" font-size="14" font-style="italic" font-weight="bold" fill="#dc2626" font-family="serif">h</text>
      `;
      break;

    case 'circle':
      defaultCaption = `Hình ${titleNumber}: Đường tròn tâm O, bán kính R và đường kính AB`;
      contentSvg = `
        <circle cx="240" cy="150" r="95" fill="#f8fafc" stroke="#2563eb" stroke-width="2.5" />
        <!-- Diameter AB -->
        <line x1="145" y1="150" x2="335" y2="150" stroke="#0f172a" stroke-width="2" />
        <!-- Radius OC -->
        <line x1="240" y1="150" x2="307" y2="83" stroke="#dc2626" stroke-width="2" />
        <!-- Center O -->
        <circle cx="240" cy="150" r="3.5" fill="#dc2626" />
        <circle cx="307" cy="83" r="3" fill="#2563eb" />
        <!-- Vertices -->
        <text x="234" y="170" font-size="14" font-weight="bold" fill="#dc2626" font-family="sans-serif">O</text>
        <text x="128" y="154" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="344" y="154" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="314" y="78" font-size="14" font-weight="bold" fill="#2563eb" font-family="sans-serif">C</text>
        <!-- Labels -->
        <text x="282" y="110" font-size="14" font-style="italic" font-weight="bold" fill="#dc2626" font-family="serif">R</text>
        <text x="190" y="142" font-size="13" font-style="italic" fill="#64748b" font-family="serif">d = 2R</text>
      `;
      break;

    case 'coordinate':
      defaultCaption = `Hình ${titleNumber}: Hệ trục toạ độ Oxy và đồ thị hàm số`;
      contentSvg = `
        <!-- Grid lines -->
        <g stroke="#e2e8f0" stroke-width="1">
          <line x1="80" y1="70" x2="400" y2="70" />
          <line x1="80" y1="110" x2="400" y2="110" />
          <line x1="80" y1="150" x2="400" y2="150" />
          <line x1="80" y1="190" x2="400" y2="190" />
          <line x1="80" y1="230" x2="400" y2="230" />
          <line x1="120" y1="40" x2="120" y2="260" />
          <line x1="160" y1="40" x2="160" y2="260" />
          <line x1="200" y1="40" x2="200" y2="260" />
          <line x1="240" y1="40" x2="240" y2="260" />
          <line x1="280" y1="40" x2="280" y2="260" />
          <line x1="320" y1="40" x2="320" y2="260" />
          <line x1="360" y1="40" x2="360" y2="260" />
        </g>
        <!-- Main Axes Ox and Oy -->
        <line x1="60" y1="150" x2="420" y2="150" stroke="#0f172a" stroke-width="2.5" marker-end="url(#arrow-black)" />
        <line x1="240" y1="270" x2="240" y2="30" stroke="#0f172a" stroke-width="2.5" marker-end="url(#arrow-black)" />
        <!-- Axis labels -->
        <text x="424" y="154" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">x</text>
        <text x="234" y="24" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">y</text>
        <text x="226" y="166" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">O</text>
        <!-- Linear graph line y = ax + b -->
        <line x1="100" y1="220" x2="380" y2="80" stroke="#2563eb" stroke-width="2.5" />
        <circle cx="320" cy="110" r="4" fill="#dc2626" />
        <text x="328" y="106" font-size="13" font-weight="bold" fill="#dc2626" font-family="sans-serif">M(x₀, y₀)</text>
      `;
      break;

    case 'cube_3d':
      defaultCaption = `Hình ${titleNumber}: Hình hộp chữ nhật / Hình lập phương ABCD.A'B'C'D'`;
      contentSvg = `
        <!-- Front Face -->
        <polygon points="120,110 280,110 280,240 120,240" fill="#eff6ff" fill-opacity="0.7" stroke="#2563eb" stroke-width="2" />
        <!-- Top Face -->
        <polygon points="120,110 190,50 350,50 280,110" fill="#dbeafe" fill-opacity="0.7" stroke="#2563eb" stroke-width="2" />
        <!-- Right Face -->
        <polygon points="280,110 350,50 350,180 280,240" fill="#bfdbfe" fill-opacity="0.7" stroke="#2563eb" stroke-width="2" />
        <!-- Hidden/Dashed Edges -->
        <line x1="120" y1="240" x2="190" y2="180" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 3" />
        <line x1="190" y1="180" x2="350" y2="180" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 3" />
        <line x1="190" y1="180" x2="190" y2="50" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 3" />
        <!-- Vertex Labels -->
        <text x="180" y="44" font-size="13" font-weight="bold" fill="#0f172a" font-family="sans-serif">A'</text>
        <text x="358" y="48" font-size="13" font-weight="bold" fill="#0f172a" font-family="sans-serif">B'</text>
        <text x="358" y="184" font-size="13" font-weight="bold" fill="#0f172a" font-family="sans-serif">C'</text>
        <text x="194" y="176" font-size="13" font-weight="bold" fill="#64748b" font-family="sans-serif">D'</text>
        <text x="104" y="108" font-size="13" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="274" y="104" font-size="13" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="286" y="254" font-size="13" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="104" y="254" font-size="13" font-weight="bold" fill="#0f172a" font-family="sans-serif">D</text>
      `;
      break;

    case 'circuit':
      defaultCaption = `Hình ${titleNumber}: Sơ đồ mạch điện đơn giản (Nguồn pin, Công tắc K, Bóng đèn Đ, Ampe kế A)`;
      contentSvg = `
        <!-- Main Wire Loop -->
        <rect x="80" y="70" width="320" height="160" fill="none" stroke="#0f172a" stroke-width="2.5" />
        <!-- Battery / Source (Top center) -->
        <rect x="210" y="60" width="60" height="20" fill="#ffffff" />
        <line x1="230" y1="58" x2="230" y2="82" stroke="#0f172a" stroke-width="3" />
        <line x1="245" y1="64" x2="245" y2="76" stroke="#0f172a" stroke-width="4" />
        <text x="222" y="52" font-size="14" font-weight="bold" fill="#dc2626" font-family="sans-serif">+</text>
        <text x="250" y="52" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">-</text>
        <!-- Switch K (Right wire) -->
        <rect x="390" y="130" width="20" height="40" fill="#ffffff" />
        <circle cx="400" cy="135" r="3.5" fill="#0f172a" />
        <circle cx="400" cy="165" r="3.5" fill="#0f172a" />
        <line x1="400" y1="165" x2="415" y2="140" stroke="#dc2626" stroke-width="2.5" />
        <text x="424" y="152" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">K</text>
        <!-- Light Bulb (Bottom center) -->
        <rect x="215" y="220" width="50" height="20" fill="#ffffff" />
        <circle cx="240" cy="230" r="16" fill="#fef08a" stroke="#0f172a" stroke-width="2" />
        <line x1="229" y1="219" x2="251" y2="241" stroke="#0f172a" stroke-width="2" />
        <line x1="251" y1="219" x2="229" y2="241" stroke="#0f172a" stroke-width="2" />
        <text x="235" y="266" font-size="13" font-weight="bold" fill="#0f172a" font-family="sans-serif">Đ</text>
        <!-- Ammeter A (Left wire) -->
        <rect x="70" y="130" width="20" height="40" fill="#ffffff" />
        <circle cx="80" cy="150" r="16" fill="#eff6ff" stroke="#0f172a" stroke-width="2" />
        <text x="74" y="156" font-size="14" font-weight="bold" fill="#2563eb" font-family="sans-serif">A</text>
      `;
      break;

    case 'flowchart':
      defaultCaption = `Hình ${titleNumber}: Sơ đồ khối thuật toán (Bắt đầu -> Nhập dữ liệu -> Xử lý / Kiểm tra -> Kết quả)`;
      contentSvg = `
        <!-- Start Block (Oval) -->
        <rect x="180" y="30" width="120" height="36" rx="18" fill="#dbeafe" stroke="#2563eb" stroke-width="2" />
        <text x="240" y="53" font-size="13" font-weight="bold" fill="#1e3a8a" text-anchor="middle" font-family="sans-serif">Bắt đầu</text>
        <line x1="240" y1="66" x2="240" y2="90" stroke="#0f172a" stroke-width="2" marker-end="url(#arrow-black)" />
        
        <!-- Input Block (Parallelogram) -->
        <polygon points="175,90 315,90 295,126 155,126" fill="#fef3c7" stroke="#d97706" stroke-width="2" />
        <text x="235" y="113" font-size="12" font-weight="bold" fill="#92400e" text-anchor="middle" font-family="sans-serif">Nhập dữ liệu (a, b)</text>
        <line x1="235" y1="126" x2="235" y2="150" stroke="#0f172a" stroke-width="2" marker-end="url(#arrow-black)" />

        <!-- Decision Block (Diamond) -->
        <polygon points="235,150 315,185 235,220 155,185" fill="#fce7f3" stroke="#db2777" stroke-width="2" />
        <text x="235" y="189" font-size="12" font-weight="bold" fill="#9d174d" text-anchor="middle" font-family="sans-serif">a &gt; b ?</text>
        
        <!-- Output & End -->
        <line x1="315" y1="185" x2="380" y2="185" stroke="#0f172a" stroke-width="2" />
        <line x1="380" y1="185" x2="380" y2="240" stroke="#0f172a" stroke-width="2" marker-end="url(#arrow-black)" />
        <text x="335" y="178" font-size="11" font-weight="bold" fill="#16a34a" font-family="sans-serif">Đúng</text>

        <rect x="330" y="240" width="100" height="34" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="2" />
        <text x="380" y="262" font-size="11" font-weight="bold" fill="#14532d" text-anchor="middle" font-family="sans-serif">In Max = a</text>

        <line x1="235" y1="220" x2="235" y2="245" stroke="#0f172a" stroke-width="2" marker-end="url(#arrow-black)" />
        <text x="245" y="235" font-size="11" font-weight="bold" fill="#dc2626" font-family="sans-serif">Sai</text>
        <rect x="180" y="245" width="110" height="34" rx="17" fill="#f1f5f9" stroke="#64748b" stroke-width="2" />
        <text x="235" y="267" font-size="12" font-weight="bold" fill="#334155" text-anchor="middle" font-family="sans-serif">Kết thúc</text>
      `;
      break;

    default:
      defaultCaption = `Hình ${titleNumber}: Sơ đồ hình học minh họa trực quan`;
      contentSvg = `
        <!-- Generic Math & Geometry Grid Base -->
        <rect x="60" y="40" width="360" height="210" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
        <polygon points="100,210 240,70 380,210" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5" />
        <circle cx="240" cy="150" r="50" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 3" />
        <line x1="100" y1="210" x2="380" y2="210" stroke="#0f172a" stroke-width="2" />
        <text x="234" y="60" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">A</text>
        <text x="390" y="214" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">B</text>
        <text x="84" y="214" font-size="14" font-weight="bold" fill="#0f172a" font-family="sans-serif">C</text>
        <text x="240" y="154" font-size="13" font-weight="bold" fill="#dc2626" text-anchor="middle" font-family="sans-serif">O</text>
      `;
      break;
  }

  const finalCaption = customCaption || defaultCaption;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" style="max-width: 500px; display: block; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
      <defs>
        <!-- Reusable Markers -->
        <marker id="arrow-black" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
        </marker>
      </defs>

      <!-- Background Card -->
      <rect width="${width}" height="${height}" fill="#ffffff" rx="12" />

      <!-- Diagram Content -->
      ${contentSvg}

      <!-- Bottom Caption Bar -->
      <rect x="0" y="272" width="${width}" height="28" fill="#f1f5f9" rx="0" />
      <text x="${width / 2}" y="290" font-size="11.5" font-weight="600" font-style="italic" fill="#475569" text-anchor="middle" font-family="sans-serif">
        ${finalCaption}
      </text>
    </svg>
  `.trim();
}

/**
 * Convert SVG string to PNG Data URL using an offscreen canvas
 */
export async function convertSvgToPngDataUrl(svgString: string, width = 500, height = 320): Promise<string> {
  return new Promise((resolve) => {
    try {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const urlApi = window.URL || window.webkitURL;
      const blobURL = urlApi.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width * 2; // 2x scale for high crisp DPI in Word
          canvas.height = height * 2;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            const pngData = canvas.toDataURL('image/png');
            urlApi.revokeObjectURL(blobURL);
            resolve(pngData);
            return;
          }
        } catch (canvasErr) {
          console.warn("Canvas conversion failed, fallback to SVG URL:", canvasErr);
        }
        urlApi.revokeObjectURL(blobURL);
        resolve(`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`);
      };

      image.onerror = () => {
        urlApi.revokeObjectURL(blobURL);
        resolve(`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`);
      };

      image.src = blobURL;
    } catch (err) {
      console.warn("SVG to PNG conversion error:", err);
      resolve(`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`);
    }
  });
}
