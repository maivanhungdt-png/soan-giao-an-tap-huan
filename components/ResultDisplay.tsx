import React, { useState } from 'react';
import { Download, CheckCircle, FileText, ChevronDown, ChevronUp, Sparkles, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Document, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Packer, 
  UnderlineType, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle,
  WidthType,
  AlignmentType,
  TableLayoutType,
  LineRuleType,
  PageOrientation,
  ImportedXmlComponent,
  Footer,
  ExternalHyperlink,
  ImageRun
} from 'docx';
import FileSaver from 'file-saver';
import { imageCache, lookupCachedImage } from '../services/imageCache';
import { EducationalImageRenderer } from './EducationalImageRenderer';
import { detectDiagramType, generateEducationalDiagramSvg, convertSvgToPngDataUrl } from '../utils/diagramGenerator';
import { ensureAllActivitiesInTwoColumnTable } from '../utils/tableFormatter';

interface ResultDisplayProps {
  result: string | null;
  loading: boolean;
  onReset: () => void;
  teacherInfo?: {
    schoolName: string;
    teacherName: string;
    reviewerName?: string;
    phoneNumber: string;
    department: string;
    includeInHeader: boolean;
  };
  layoutFormat?: 'table' | 'no_table';
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, loading, onReset, teacherInfo, layoutFormat = 'table' }) => {
  const [showPreview, setShowPreview] = useState(true);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  // Helper: Phục hồi 100% công thức phân số bị lỗi tiền tố \f hoặc rac thành chuẩn LaTeX \frac{...}{...}
  const repairRacToFrac = (input: string): string => {
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

  // Helper: Đảm bảo công thức toán $...$ luôn có dấu cách với chữ / số xung quanh, không dính sát chữ
  const ensureMathFormulaSpacing = (text: string): string => {
    if (!text) return "";
    let res = text;
    // Tách $...$ khỏi từ hoặc số đứng liền kề phía trước: chữ$math$ -> chữ $math$
    res = res.replace(/([a-zA-Z0-9À-ỹ\)])(\$[^\$\n\r]+?\$)/g, (_m, p1, p2) => `${p1} ${p2}`);
    // Tách $...$ khỏi từ hoặc số đứng liền kề phía sau: $math$chữ -> $math$ chữ
    res = res.replace(/(\$[^\$\n\r]+?\$)([a-zA-Z0-9À-ỹ\(])/g, (_m, p1, p2) => `${p1} ${p2}`);
    // Xóa khoảng trắng thừa sát mép trong của dấu $: $  x  $ -> $x$
    res = res.replace(/\$\s+([^$\n\r]+?)\s+\$/g, (_m, p1) => `$${p1.trim()}$`);
    return res;
  };

  // Helper: Clean raw AI result to remove conversational filler and specific artifacts
  const cleanResultText = (text: string, format: 'table' | 'no_table' = 'table'): string => {
    if (!text) return "";
    
    // Phục hồi công thức phân số bị lỗi trước khi làm sạch
    let clean = repairRacToFrac(text);

    // Đảm bảo khoảng cách công thức toán không dính sát chữ
    clean = ensureMathFormulaSpacing(clean);

    // Xóa sạch toàn bộ thẻ HTML rác / dangling tags (</span>, <span...>, <font...>, </font>) gây lỗi thừa chữ
    clean = clean.replace(/<\/?(?:span|font|u)[^>]*>/gi, '');

    // Đảm bảo tất cả hoạt động (đặc biệt Luyện tập và Vận dụng) đều nằm trong bảng 2 cột
    if (format !== 'no_table') {
      clean = ensureAllActivitiesInTwoColumnTable(clean);
    }

    // 0. Pre-clean and normalize image tags
    clean = clean.replace(/\[\s*H(?:ÌNH|INH)[\s_*<i></i>\/\\]*(?:ẢNH|ANH|VẼ|VE)?[\s_*<i></i>\/\\]*(?:GỐC|GOC)?[\s_*<i></i>\/\\]*[:_#\-]?\s*(\d+)\s*\]/gi, '[HINHANHGOC_$1]');
    clean = clean.replace(/\[\s*IMG[\s_*#\-]*(\d+)\s*\]/gi, '[HINHANHGOC_$1]');
    clean = clean.replace(/\[\s*IMAGE[\s_*#\-]*(\d+)\s*\]/gi, '[HINHANHGOC_$1]');
    clean = clean.replace(/\[\s*(?:HÌNH|HINH|HINHANH|HINHANHGOC)[\s_*#\-]*(\d+)\s*\]/gi, '[HINHANHGOC_$1]');

    // 1. Remove markdown code blocks
    clean = clean.replace(/^```markdown\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
    
    // 2. Remove HTML Anchors (Bookmarks artifacts from Word conversion) e.g., <a id="_Hlk147258080"></a>
    clean = clean.replace(/<a\s+id="[^"]*"><\/a>/gi, "");
    
    // 3. Remove stray empty heading lines
    if (format !== 'no_table') {
      clean = clean.replace(/(?:\n|^)[ \t]*[*_#\s]*[cd]\s*[\)\.:\-]?\s*(?:Sản\s*phẩm|Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình\s*hoạt\s*động)[ \t]*:?[ \t]*(?=\n)/gi, '');
    }

    // 4. Clean all markdown hash subheadings (#####, ####, ###) into bold text to eliminate #####
    clean = clean.replace(/^(?:#{3,6})\s*(.*)$/gm, (match, p1) => {
        const trimmedP1 = p1.trim();
        if (!trimmedP1) return '';
        if (trimmedP1.startsWith('**') && trimmedP1.endsWith('**')) return trimmedP1;
        return `**${trimmedP1}**`;
    });
    clean = clean.replace(/#{3,6}/g, '');

    // 5. Chuẩn hóa các đề mục tích hợp: dấu * phải đứng ở đầu câu, KHÔNG có gạch đầu dòng, KHÔNG có dấu * bao quanh gây in nghiêng
    clean = clean.replace(/(?:\[Tích hợp GDQP-?AN\]|\[Lồng ghép GDQP-?AN\])\s*:\s*/gi, '*Tích hợp Lồng ghép GDQP-AN: ');
    clean = clean.replace(/(?:\[Dành cho HSKT(?: hòa nhập)?\]|\*\[Dành cho HSKT(?: hòa nhập)?\]\*?)\s*:\s*/gi, '*Tích hợp giáo dục hòa nhập: ');
    clean = clean.replace(/(?:\[Tích hợp NLS\]|\[Tích hợp năng lực số\])\s*:\s*/gi, '*Tích hợp năng lực số: ');
    clean = clean.replace(/(?:\[Tích hợp AI\]|\[Tích hợp năng lực AI\])\s*:\s*/gi, '*Tích hợp năng lực AI: ');

    // Loại bỏ dấu gạch đầu dòng trước *Tích hợp và *HS khuyết tật
    clean = clean.replace(/^[ \t]*[•\-\+\*]+[ \t]*(?=\*?Tích\s*hợp)/gmi, '');
    clean = clean.replace(/^[ \t]*[•\-\+\*]+[ \t]*(?=\*?HS\s*khuyết\s*tật)/gmi, '');
    clean = clean.replace(/^[ \t]*(?!\*)(Tích\s*hợp\s*[^:\n]+:)/gmi, '*$1');
    clean = clean.replace(/^[ \t]*(?!\*)(HS\s*khuyết\s*tật[^:\n]*:)/gmi, '*$1');
    clean = clean.replace(/^[ \t]*[\-\+•]+\s*\*(Tích\s*hợp|HS\s*khuyết\s*tật)/gmi, '*$1');
    
    // Loại bỏ các dấu * ở cuối câu/dòng tích hợp tránh bị in nghiêng
    clean = clean.replace(/(\*Tích\s*hợp[^\n*]+)\*+/gi, '$1');
    clean = clean.replace(/(\*HS\s*khuyết\s*tật[^\n*]+)\*+/gi, '$1');

    // 6. Under Mục tiêu: Completely remove redundant "Tích hợp năng lực số:" or "Tích hợp năng lực AI:" under their respective headings
    clean = clean.replace(/((?:[\*#\s]*(?:b\)|b\.|\-|\+|2\.)?\s*Năng\s*lực\s*số[^\n]*\n+)(?:\s*(?:[•\-\*]\s*)?\*?\s*))(?:Tích\s*hợp\s*năng\s*lực\s*số|Tích\s*hợp\s*NLS)\s*[:：]\s*/gmi, '$1');
    clean = clean.replace(/((?:[\*#\s]*(?:c\)|c\.|\-|\+|3\.)?\s*Năng\s*lực\s*(?:trí\s*tuệ\s*nhân\s*tạo|AI)[^\n]*\n+)(?:\s*(?:[•\-\*]\s*)?\*?\s*))(?:Tích\s*hợp\s*năng\s*lực\s*(?:trí\s*tuệ\s*nhân\s*tạo|AI)|Tích\s*hợp\s*AI)\s*[:：]\s*/gmi, '$1');

    // 7. Consolidate repeated "Tích hợp giáo dục hòa nhập" lines into 1 unified block cleanly with * prefix (NO bullet dashes, NO italics asterisks)
    clean = clean.replace(/(?:(?:\s*(?:[•\-\*]\s*)?\*?Tích\s*hợp\s*giáo\s*dục\s*hòa\s*nhập\s*(?:\((?:HS\s*)?khuyết\s*tật\s*([^)]+)\)|\s*:\s*(?:HS\s*|Học\s*sinh\s*)?khuyết\s*tật\s*([^:\n]+))\s*:?\s*([^<\n*]+)\*?\s*\n?))+/gmi, (match) => {
        const itemRegex = /(?:[•\-\*]\s*)?\*?Tích\s*hợp\s*giáo\s*dục\s*hòa\s*nhập\s*(?:\((?:HS\s*)?khuyết\s*tật\s*([^)]+)\)|\s*:\s*(?:HS\s*|Học\s*sinh\s*)?khuyết\s*tật\s*([^:\n]+))\s*:?\s*([^<\n*]+)/gmi;
        const items: string[] = [];
        let m;
        while ((m = itemRegex.exec(match)) !== null) {
            const rawType = (m[1] || m[2] || '').trim();
            const content = (m[3] || '').trim().replace(/\*+$/, '').trim();
            const cleanType = rawType.replace(/^(?:học\s*sinh\s*|hs\s*)/i, '').replace(/^khuyết\s*tật\s*/i, '').trim();
            const prefix = cleanType.toLowerCase() === 'chung' ? 'HS khuyết tật chung' : (cleanType.toLowerCase() === 'nghe' ? 'HS khuyết tật nghe' : (cleanType.toLowerCase() === 'vận động' || cleanType.toLowerCase() === 'van dong' ? 'HS khuyết tật vận động' : `HS khuyết tật ${cleanType}`));
            items.push(`*${prefix}: ${content}`);
        }
        if (items.length > 0) {
            return `*Tích hợp giáo dục hòa nhập:\n${items.join('\n')}\n`;
        }
        return match;
    });

    // 7d. REPOSITIONING GUARANTEE: Move any "Tích hợp giáo dục hòa nhập" in Section I (Mục tiêu) to the END of "3. Phẩm chất:"
    const phamChatRegex = /(\*\*(?:3\.\s*)?Phẩm\s*chất:?\*\*|(?:^|\n)\s*(?:3\.\s*)?Phẩm\s*chất:?)/i;
    const thietBiRegex = /(\*\*(?:II|2)\.\s*Thiết\s*bị\s*dạy\s*học[^\n]*\*\*|(?:^|\n)\s*(?:#{1,3}\s*)?(?:II|2)\.?\s*Thiết\s*bị\s*dạy\s*học)/i;
    const disBlockRegex = /(?:\s*(?:[•\-\*]\s*)?\*?Tích\s*hợp\s*giáo\s*dục\s*hòa\s*nhập[:\s][\s\S]*?(?=\n\s*(?:\*\*|#|[1-3]\.|$)))/i;

    const pcMatch = clean.match(phamChatRegex);
    const tbMatch = clean.match(thietBiRegex);
    const disMatch = clean.match(disBlockRegex);

    if (pcMatch && disMatch && pcMatch.index !== undefined && disMatch.index !== undefined) {
        if (disMatch.index < pcMatch.index) {
            const rawDisBlock = disMatch[0];
            clean = clean.replace(rawDisBlock, '');

            const rawLines = rawDisBlock.split('\n').map(l => l.trim()).filter(Boolean);
            const subItems: string[] = [];
            for (const line of rawLines) {
                if (/Tích\s*hợp\s*giáo\s*dục\s*hòa\s*nhập/i.test(line)) continue;
                let cleanLine = line.replace(/^\s*[\*\-\+•]+\s*/, '').replace(/\*+$/, '').trim();
                if (cleanLine) {
                    if (!/^HS\s*khuyết\s*tật|^Học\s*sinh\s*khuyết\s*tật/i.test(cleanLine)) {
                        cleanLine = `HS khuyết tật: ${cleanLine}`;
                    }
                    subItems.push(`*${cleanLine}`);
                }
            }

            const cleanFormattedDisBlock = subItems.length > 0
                ? `\n*Tích hợp giáo dục hòa nhập:\n${subItems.join('\n')}\n`
                : `\n*Tích hợp giáo dục hòa nhập:\n`;

            const updatedTbMatch = clean.match(thietBiRegex);
            if (updatedTbMatch && updatedTbMatch.index !== undefined) {
                clean = clean.slice(0, updatedTbMatch.index) + cleanFormattedDisBlock + '\n' + clean.slice(updatedTbMatch.index);
            } else {
                clean = clean.replace(phamChatRegex, `$1\n${cleanFormattedDisBlock}`);
            }
        }
    }

    // 8. Đảm bảo toàn bộ dòng tích hợp bắt đầu bằng dấu * đứng đầu câu và không có gạch đầu dòng
    clean = clean.replace(/^[ \t]*[•\-\+\*]*[ \t]*(Tích\s*hợp\s*(?:năng\s*lực\s*số|năng\s*lực\s*AI|giáo\s*dục\s*hòa\s*nhập|Lồng\s*ghép\s*GDQP-AN|STEM|trí\s*tuệ\s*nhân\s*tạo)[^:\n]*:)/gmi, '*$1');
    clean = clean.replace(/^[ \t]*[•\-\+\*]*[ \t]*(HS\s*khuyết\s*tật[^:\n]*:)/gmi, '*$1');

    // 9. Normalize 2-column markdown table header lines to standard "Hoạt động của giáo viên và học sinh" & "Kết quả hoạt động"
    clean = clean.replace(/\|\s*(?:Hoạt\s*động\s*của\s*GV\s*và\s*HS\s*(?:\([^)]*\))?|Hoạt\s*động\s*của\s*giáo\s*viên\s*và\s*học\s*sinh|Tổ\s*chức\s*thực\s*hiện|Tổ\s*chức\s*hoạt\s*động)\s*\|\s*(?:Sản\s*phẩm\s*dự\s*kiến|Sản\s*phẩm\s*học\s*tập|Sản\s*phẩm|Kết\s*quả\s*hoạt\s*động|Kết\s*quả)\s*\|/gi, '| Hoạt động của giáo viên và học sinh | Kết quả hoạt động |');
    // 9b. Đảm bảo 100% TRƯỚC BẢNG 2 CỘT HOẠT ĐỘNG LUÔN CÓ DÒNG **d) Tổ chức thực hiện:**
    clean = clean.replace(/((?:^|\n)[ \t]*(?:\*\*)?c\)\s*Sản\s*phẩm:?[^\n]*\n+)(?![ \t]*(?:\*\*)?d\)\s*Tổ\s*chức\s*thực\s*hiện)([ \t]*\|[ \t]*(?:Hoạt\s*động\s*của|Tổ\s*chức\s*thực\s*hiện)[^\n]*\|)/gi, '$1\n**d) Tổ chức thực hiện:**\n\n$2');
    
    // Trường hợp sau mục b hoặc bất kỳ nội dung nào nhảy thẳng vào bảng mà không có d) Tổ chức thực hiện
    clean = clean.replace(/((?:^|\n)[ \t]*(?:\*\*)?b\)\s*Nội\s*dung:?[^\n]*\n+)(?![ \t]*(?:\*\*)?[cd]\)\s*)([ \t]*\|[ \t]*(?:Hoạt\s*động\s*của|Tổ\s*chức\s*thực\s*hiện)[^\n]*\|)/gi, '$1\n**c) Sản phẩm:** Câu trả lời, sản phẩm học tập hoặc kết quả thực hiện nhiệm vụ của học sinh.\n\n**d) Tổ chức thực hiện:**\n\n$2');

    // 10. Replace "IV. HƯỚNG DẪN TỰ HỌC VÀ DẶN DÒ VỀ NHÀ" and variants with "* Hướng dẫn về nhà"
    clean = clean.replace(/(?:^|\n)\s*(?:#{1,4}\s*)?(?:(?:IV|4|IV\.|4\.)\s*)?(?:HƯỚNG\s*DẪN\s*TỰ\s*HỌC\s*VÀ\s*DẶN\s*DÒ\s*VỀ\s*NHÀ|HƯỚNG\s*DẪN\s*TỰ\s*HỌC|HƯỚNG\s*DẪN\s*VỀ\s*NHÀ|DẶN\s*DÒ\s*VỀ\s*NHÀ|HƯỚNG\s*DẪN\s*HỌC\s*Ở\s*NHÀ|Hướng\s*dẫn\s*tự\s*học\s*và\s*dặn\s*dò\s*về\s*nhà|Hướng\s*dẫn\s*tự\s*học)[^\n]*/gi, '\n\n* Hướng dẫn về nhà');

    // 11. Remove duplicate top header metadata lines that may be extracted from the old file
    clean = clean.replace(/^(?:#+\s*)?Phụ\s*lục\s*(?:IV|4)\b[^\n]*\n?/gim, "");

    // 14. Tách 2. Năng lực: và a) Năng lực đặc thù... xuống dòng riêng biệt
    clean = clean.replace(/(?:\*\*)?([1-3]\.\s*Năng\s*lực:?)(?:\*\*)?\s*(?:\*\*)?([a-e]\)\s*Năng\s*lực[^\n]*)/gmi, (_m, p1, p2) => {
        const t1 = p1.trim();
        const t2 = p2.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
        return `**${t1.endsWith(':') ? t1 : t1 + ':'}**\n**${t2.endsWith(':') ? t2 : t2 + ':'}**`;
    });

    // Auto bold main subheadings (Chỉ in đậm tiêu đề, không in đậm toàn bộ nội dung câu)
    clean = clean.replace(/^(?:\*\*)?([1-3]\.\s*Kiến\s*thức:?)(?:\*\*)?\s*(.*)$/gmi, (_m, p1, p2) => `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}** ${p2.trim()}`.trim());
    clean = clean.replace(/^(?:\*\*)?([1-3]\.\s*Năng\s*lực:?)(?:\*\*)?\s*(.*)$/gmi, (_m, p1, p2) => {
        const trimmedP2 = p2.trim();
        if (trimmedP2.startsWith('a)') || trimmedP2.startsWith('**a)')) {
            return `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}**\n${trimmedP2}`;
        }
        return `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}** ${trimmedP2}`.trim();
    });
    clean = clean.replace(/^(?:\*\*)?([1-3]\.\s*Phẩm\s*chất:?)(?:\*\*)?\s*(.*)$/gmi, (_m, p1, p2) => `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}** ${p2.trim()}`.trim());
    clean = clean.replace(/^(?:\*\*)?([1-2]\.\s*Thiết\s*bị\s*dạy\s*học:?)(?:\*\*)?\s*(.*)$/gmi, (_m, p1, p2) => `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}** ${p2.trim()}`.trim());
    clean = clean.replace(/^(?:\*\*)?([1-2]\.\s*Học\s*liệu:?)(?:\*\*)?\s*(.*)$/gmi, (_m, p1, p2) => `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}** ${p2.trim()}`.trim());
    clean = clean.replace(/^(?:\*\*)?([1-2]\.\s*Giáo\s*viên:?)(?:\*\*)?\s*(.*)$/gmi, (_m, p1, p2) => `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}** ${p2.trim()}`.trim());
    clean = clean.replace(/^(?:\*\*)?([1-2]\.\s*Học\s*sinh:?)(?:\*\*)?\s*(.*)$/gmi, (_m, p1, p2) => `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}** ${p2.trim()}`.trim());

    // 15. Auto bold activities
    clean = clean.replace(/^(?:\*\*)?((?:\d+\.\s*)?Hoạt\s*động\s*\d+\s*:[^\n]*?)(?:\*\*)?$/gmi, (m, p1) => {
        const t = p1.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
        return `**${t}**`;
    });

    // 16. Auto bold sub-steps (a) Mục tiêu:, b) Nội dung:, c) Sản phẩm:, d) Tổ chức thực hiện:) - Chỉ in đậm đúng tiêu đề
    clean = clean.replace(/(?:\*\*)?([a-d]\)\s*(?:Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Tổ\s*chức\s*thực\s*hiện):?)(?:\*\*)?/gmi, (m, p1) => `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}**`);
    clean = clean.replace(/(?:\*\*)?([a-e]\)\s*Năng\s*lực[^\n:]*:?)(?:\*\*)?/gmi, (m, p1) => `**${p1.trim().endsWith(':') ? p1.trim() : p1.trim() + ':'}**`);

    // 17. Auto bold đúng nhãn Bước 1, Bước 2, Bước 3, Bước 4 (chỉ in đậm nhãn tên bước, KHÔNG in đậm nội dung câu)
    clean = clean.replace(/(?:\*\*)?(Bước\s*[1-4]\s*:\s*(?:Chuyển\s*giao\s*nhiệm\s*vụ|Thực\s*hiện\s*nhiệm\s*vụ|Báo\s*cáo[,\s]+thảo\s*luận|Kết\s*luận[,\s]+nhận\s*định):?)(?:\*\*)?/gmi, (m, p1) => {
        const t = p1.trim();
        return `**${t.endsWith(':') ? t : t + ':'}**`;
    });
    clean = clean.replace(/(?:\*\*)?(Bước\s*[1-4]\s*:)(?!\s*(?:Chuyển\s*giao|Thực\s*hiện|Báo\s*cáo|Kết\s*luận))(?:\*\*)?/gmi, '**$1**');

    // Clean NLS brackets: e.g. [1.1.TC1a] -> 1.1.TC1a (excluding image tags)
    clean = clean.replace(/\[(?!(?:HINHANHGOC|HINH|IMG|IMAGE|HÌNH))([\d\.]+[\.A-Z0-9a-z]+)\]/gi, '$1');
    
    // Remove slash-escaped asterisks often generated by AI
    clean = clean.replace(/\\\*/g, '*');
    
    // 18. Xóa các định dạng in nghiêng tùy tiện
    clean = clean.replace(/<\/?(?:em|i)>/gi, '');
    
    // 19. Remove common AI intros
    const lines = clean.split('\n');
    if (lines.length > 0) {
        const firstLine = lines[0].trim().toLowerCase();
        const introPatterns = [
            "dưới đây là", "sau đây là", "đây là", "kết quả", 
            "here is", "sure, here", "giáo án đã được", 
            "bản giáo án", "nội dung giáo án", "chào bạn"
        ];
        
        if (firstLine.length < 100 && introPatterns.some(p => firstLine.includes(p))) {
             lines.shift(); 
             if (lines.length > 0 && lines[0].trim() === "") lines.shift(); 
        }
    }
    const joinedClean = lines.join('\n').trim();
    return autoConvertPlainTextToLatex(joinedClean);
  };

  // Helper: Tự động phát hiện và chuyển đổi các biểu thức toán học / phân số / bất đẳng thức dạng text thô sang chuẩn LaTeX $...$
  const autoConvertPlainTextToLatex = (text: string): string => {
    if (!text) return "";

    const lines = text.split('\n');

    // Cấu trúc Regex cho chuỗi phép tính số học / phân số / đại số
    const op = '(?:<=|>=|!=|==|≤|≥|≠|<|>|=|≈|\\+|-|\\*|:|\\/|\\\\times|\\\\div|\\\\cdot|\\\\le|\\\\ge|\\\\neq|\\\\approx)';
    const numTerm = '(?:(?:-\\s*)?(?:\\\\frac\\{[^}]+\\}\\{[^}]+\\}|\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|-?\\d+(?:,\\d+)?|[a-zA-Z][0-9_]*))';
    const mathPattern = `(?:^|(?<=[\\s(:;]))(${numTerm}\\s*${op}\\s*${numTerm}(?:\\s*${op}\\s*${numTerm})*)(?=$|[\\s),.:;!?])`;
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
      cur = cur.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, (match, p1, p2) => `\\frac{${p1}}{${p2}}`);
      cur = cur.replace(/\\sqrt\s*\{([^}]+)\}/g, (match, p1) => `\\sqrt{${p1}}`);

      // Bước 2: Tự động bọc toàn bộ chuỗi biểu thức / phép tính số học liên hoàn (kể cả phân số âm có dấu cách, hỗn số, số thập phân, chuỗi dấu = liên tiếp)
      cur = transformNonLatex(cur, (t) => {
        return t.replace(mathExprRegex, (match) => {
          // Bỏ qua định dạng ngày tháng như 20/11/2024
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(match.trim())) return match;
          let m = match.trim();

          // Chuẩn hóa hỗn số: "1 5/12" -> "1\frac{5}{12}"
          m = m.replace(/(\d+)\s+(\d+)\/(\d+)/g, (m1, whole, num, den) => `${whole}\\frac{${num}}{${den}}`);

          // Chuẩn hóa phân số âm có khoảng cách: "- 7/8" -> "-\frac{7}{8}"
          m = m.replace(/-\s*(\d+)\/(\d+)/g, (m1, num, den) => `-\\frac{${num}}{${den}}`);

          // Chuẩn hóa phân số thông thường: "7/8" -> "\frac{7}{8}"
          m = m.replace(/(^|[^\w\\])(\d+)\/(\d+)/g, (m1, prefix, num, den) => `${prefix}\\frac{${num}}{${den}}`);

          // Chuẩn hóa dấu so sánh và phép toán
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

          return `$${m}$`;
        });
      });

      // Bước 3: Tự động bọc \frac{...}{...} hoặc \sqrt{...} đơn lẻ chưa được bọc $...$
      cur = transformNonLatex(cur, (t) => {
        return t.replace(/(?:^|(?<=[\s(]))(-?\\(?:frac\{[^}]+\}\{[^}]+\}|sqrt\{[^}]+\}))(?=$|[\s),.:;!?])/g, (m, p1) => `$${p1}$`);
      });

      // Bước 4: Tự động bọc phân số đơn lẻ dạng text thô còn sót: "1/2", "- 3/4", "-3/4"
      cur = transformNonLatex(cur, (t) => {
        return t.replace(/(?:^|(?<=[\s(]))(-?\s*\d+)\/(\d+)(?=$|[\s),.:;!?])/g, (match, num, den) => {
          const cleanNum = num.replace(/\s+/g, '');
          const isNegative = cleanNum.startsWith('-');
          const absNum = isNegative ? cleanNum.slice(1) : cleanNum;
          return isNegative ? `$-\\frac{${absNum}}{${den}}$` : `$\\frac{${cleanNum}}{${den}}$`;
        });
      });

      // Bước 5: Tự động bọc các ký tự toán học Unicode đơn lẻ còn sót lại
      cur = transformNonLatex(cur, (t) => {
        return t.replace(/≤/g, '$\\le$')
                .replace(/≥/g, '$\\ge$')
                .replace(/≠/g, '$\\neq$')
                .replace(/±/g, '$\\pm$');
      });

      return cur;
    });

    return processedLines.join('\n');
  };

  const safeResult = result ? cleanResultText(result, layoutFormat) : null;

  // Helper: Convert base64 to buffer for docx safely
  const base64DataURLToArrayBuffer = (dataURL: string): Uint8Array => {
    try {
      if (!dataURL || typeof dataURL !== 'string') return new Uint8Array(0);
      const commaIndex = dataURL.indexOf(',');
      const base64 = commaIndex >= 0 ? dataURL.substring(commaIndex + 1) : dataURL;
      const cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, '').trim();
      if (!cleanBase64) return new Uint8Array(0);
      const binary_string = window.atob(cleanBase64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes;
    } catch (err) {
      console.error("Error decoding base64DataURLToArrayBuffer:", err);
      return new Uint8Array(0);
    }
  };

  // Helper: Format raw text segments into Docx TextRuns
  const createTextRuns = (content: string, styles: any): any[] => {
      const segRuns: any[] = [];
      const segments = content.split(/<br\s*\/?>/gi);
      segments.forEach((seg, index) => {
          if (index > 0) {
              segRuns.push(new TextRun({ text: "", break: 1 }));
          }
          if (seg) {
              // Hỗ trợ bắt tất cả các biến thể gắn thẻ ảnh [HINHANHGOC_1], [HINH_ANH_GOC_1], [IMG1], [Hình 1], ![...](...), v.v.
              const parts = seg.split(/(\[[\s\S]*?(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|HÌNH_ẢNH_GỐC|HÌNH_ẢNH|HÌNH_VẼ_GỐC|HÌNH_VẼ|HÌNH_MINH_HỌA|HÌNH|HINH|IMG|IMAGE|ẢNH_GỐC|ẢNH|ANH|SƠ_ĐỒ|SO_DO|Hình\s*ảnh\s*gốc|Hình\s*ảnh|Hình\s*vẽ\s*gốc|Hình\s*vẽ|Hình\s*minh\s*họa|Hình|Ảnh\s*gốc|Ảnh\s*minh\s*họa|Ảnh|Sơ\s*đồ|Hinh\s*anh|Hinh\s*ve|Hinh|Anh|So\s*do)[\s_:.\-0-9a-zA-ZÀ-ỹ*]*\]|!\[[^\]]*\]\([^)]+\))/gi);
              parts.forEach(part => {
                 if (!part) return;
                 
                 let isImgTag = (part.startsWith('[') && part.endsWith(']') && /(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|HÌNH_ẢNH_GỐC|HÌNH_ẢNH|HÌNH_VẼ_GỐC|HÌNH_VẼ|HÌNH_MINH_HỌA|HÌNH|HINH|IMG|IMAGE|ẢNH_GỐC|ẢNH|ANH|SƠ_ĐỒ|SO_DO|Hình|Ảnh|Sơ\s*đồ|Hinh|Anh|So\s*do)/i.test(part)) ||
                                  (part.startsWith('![') && part.includes(')'));

                 // Tuyệt đối không coi công thức toán học, phân số, MathType là thẻ ảnh
                 if (/MATH|CÔNG_THỨC|PHÂN_SỐ|\d+\/\d+|\$|\\frac/i.test(part)) {
                     isImgTag = false;
                 }

                 if (isImgTag) {
                     const cleanPart = part.replace(/^[*_~`#\s]+|[*_~`#\s:.\-]+$/g, '');
                     const rawId = cleanPart.replace(/^!\[|^\[|\]$|\)$/g, '').trim();
                     console.log("[DOCX Render] Trying to embed image tag:", rawId);
                     
                     const numMatch = cleanPart.match(/\d+/);
                     const num = numMatch ? numMatch[0] : '1';
                     const cachedImg = lookupCachedImage(cleanPart) || lookupCachedImage(`HINHANHGOC_${num}`) || lookupCachedImage(num);

                     if (cachedImg && cachedImg.dataUrl) {
                          try {
                              console.log("[DOCX Render] Success embed image:", rawId);
                              const buffer = base64DataURLToArrayBuffer(cachedImg.dataUrl);
                              if (buffer && buffer.length > 0) {
                                  const renderW = Math.round(cachedImg.width || 260);
                                  const renderH = Math.round(cachedImg.height || 180);
                                  segRuns.push(new ImageRun({
                                      data: buffer,
                                      transformation: {
                                          width: Math.min(Math.max(renderW, 80), 380),
                                          height: Math.min(Math.max(renderH, 60), 280),
                                      }
                                  }) as any);
                              } else {
                                  throw new Error("Empty image buffer");
                              }
                          } catch (e) {
                              console.error("[DOCX Render] Failed to embed image:", rawId, e);
                              segRuns.push(new TextRun({ text: `[HÌNH VẼ GỐC ${num}]`, color: "4F46E5", font: "Times New Roman", size: 28, italics: true }));
                          }
                     } else {
                         console.warn("[DOCX Render] Image NOT found in cache:", rawId);
                         segRuns.push(new TextRun({ text: `[HÌNH VẼ GỐC ${num}]`, color: "4F46E5", font: "Times New Roman", size: 28, italics: true }));
                     }
                 } else {
                     let unescapedSeg = part
                         .replace(/&amp;/g, '&')
                         .replace(/&quot;/g, '"')
                         .replace(/&#39;/g, "'");

                     unescapedSeg = unescapedSeg.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '');
                     unescapedSeg = repairRacToFrac(unescapedSeg);

                     // Use inherited color if available
                     const runOptions: any = {
                         text: unescapedSeg,
                         bold: styles.bold,
                         italics: styles.italics,
                         underline: styles.underline ? { type: UnderlineType.SINGLE } : undefined,
                         subScript: styles.subScript,
                         superScript: styles.superScript,
                         font: "Times New Roman",
                         size: styles.size || 28, // 14pt
                     };
                     
                     if (styles.color) {
                         runOptions.color = styles.color;
                     }

                     segRuns.push(new TextRun(runOptions));
                 }
              });
          }
      });
      return segRuns;
  };

  // Helper: Recursive parser to handle inline formatting without overlapping regex issues
  const parseTextWithFormatting = (text: string, inheritedStyles: any = {}): any[] => {
    const runs: any[] = [];
    // Prioritize Image tags and HTML tags OVER markdown to prevent `_` or `*` from breaking image tags or tag pairs.
    const regex = /(\[[\s\S]*?(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|IMG|IMAGE|HÌNH_ẢNH_GỐC|HÌNH_ẢNH|HÌNH_VẼ_GỐC|HÌNH_VẼ|HÌNH_MINH_HỌA|HÌNH|HINH|ẢNH_GỐC|ẢNH|ANH|SƠ_ĐỒ|SO_DO|Hình\s*ảnh\s*gốc|Hình\s*ảnh|Hình\s*vẽ\s*gốc|Hình\s*vẽ|Hình\s*minh\s*họa|Hình|Ảnh\s*gốc|Ảnh\s*minh\s*họa|Ảnh|Sơ\s*đồ|Hinh\s*anh|Hinh\s*ve)[\s_:.\-0-9a-zA-ZÀ-ỹ*]*\]|!\[[^\]]*\]\([^)]+\)|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|<span\s+[^>]*style="[^"]*color:\s*(?:red|#ff0000|#f00|#FF0000)[^"]*"[^>]*>[\s\S]*?<\/span>|<span\s+style="color:\s*red;?">[\s\S]*?<\/span>|<font\s+[^>]*color="?(?:red|#ff0000|#f00|#FF0000)"?[^>]*>[\s\S]*?<\/font>|<font\s+color="red">[\s\S]*?<\/font>|<sub\s*>[\s\S]*?<\/sub\s*>|<sup\s*>[\s\S]*?<\/sup\s*>|\*\*[^\*\n\r]+\*\*|_[\s\S]*?_)/gi;
    const parts = text.split(regex);

    parts.forEach(part => {
        if (!part) return;
        const lowerPart = part.toLowerCase();
        
        let matchStyles = { ...inheritedStyles };
        let innerText = part;
        let isMatched = false;

        // Chỉ bôi đỏ nếu đoạn văn bản THỰC SỰ là nội dung tích hợp bắt đầu bằng dấu * (NLS, AI, STEM, GDQP, Khuyết tật...)
        const isStrictIntegration = (
            (lowerPart.startsWith('*') && !lowerPart.startsWith('* hướng dẫn') && !lowerPart.startsWith('*hướng dẫn')) ||
            lowerPart.startsWith('tích hợp') || 
            lowerPart.startsWith('hs khuyết tật') ||
            lowerPart.startsWith('học sinh khuyết tật')
        );

        if (!matchStyles.color && isStrictIntegration) {
            matchStyles.color = "FF0000";
            matchStyles.italics = false;
        }

        // 1. If it is an image tag, render it directly as an image without breaking into italics
        if ((part.startsWith('[') && part.endsWith(']') && /(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|IMG|IMAGE|HÌNH_ẢNH_GỐC|HÌNH_ẢNH|HÌNH_VẼ_GỐC|HÌNH_VẼ|HÌNH_MINH_HỌA|HÌNH|HINH|ẢNH_GỐC|ẢNH|ANH|SƠ_ĐỒ|SO_DO|Hình|Ảnh|Sơ\s*đồ|Hinh|Anh)/i.test(part)) ||
            (part.startsWith('![') && part.includes(')'))) {
            runs.push(...createTextRuns(part, matchStyles));
            return;
        } else if (part.startsWith('$$') && part.endsWith('$$')) {
            runs.push(...createTextRuns(part, matchStyles));
            return;
        } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
            runs.push(...createTextRuns(part, matchStyles));
            return;
        } else if (lowerPart.startsWith('<span') && (lowerPart.includes('red') || lowerPart.includes('blue') || lowerPart.includes('#ff0000') || lowerPart.includes('#f00'))) {
            innerText = part.replace(/^<span[^>]*>|<\/span>$/gi, '');
            matchStyles.color = "FF0000";
            matchStyles.italics = false;
            isMatched = true;
        } else if (lowerPart.startsWith('<font') && (lowerPart.includes('red') || lowerPart.includes('blue') || lowerPart.includes('#ff0000') || lowerPart.includes('#f00'))) {
            innerText = part.replace(/^<font[^>]*>|<\/font>$/gi, '');
            matchStyles.color = "FF0000";
            matchStyles.italics = false;
            isMatched = true;
        } else if (lowerPart.startsWith('<sub') && lowerPart.endsWith('</sub>')) {
            innerText = part.replace(/^<sub\s*>|<\/sub\s*>$/gi, '');
            matchStyles.subScript = true;
            isMatched = true;
        } else if (lowerPart.startsWith('<sup') && lowerPart.endsWith('</sup>')) {
            innerText = part.replace(/^<sup\s*>|<\/sup\s*>$/gi, '');
            matchStyles.superScript = true;
            isMatched = true;
        } else if (part.startsWith('**') && part.endsWith('**')) {
            innerText = part.slice(2, -2);
            matchStyles.bold = true;
            isMatched = true;
        } else if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
             innerText = part.slice(1, -1);
             matchStyles.italics = true;
             isMatched = true;
        }

        if (isMatched) {
             runs.push(...parseTextWithFormatting(innerText, matchStyles));
        } else {
             runs.push(...createTextRuns(part, matchStyles));
        }
    });

    return runs;
  };

  // Helper: Smart split for markdown tables that ignores pipes inside math formulas ($...$)
  const smartSplitTableLine = (line: string): string[] => {
      const cells: string[] = [];
      let currentCell = '';
      let inMath = false;
      let inDoubleMath = false;

      for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '\\' && nextChar === '|') {
              currentCell += '|';
              i++; // skip next |
          } else if (char === '$' && nextChar === '$') {
              inDoubleMath = !inDoubleMath;
              currentCell += '$$';
              i++; // skip next $
          } else if (char === '$' && !inDoubleMath) {
              inMath = !inMath;
              currentCell += '$';
          } else if (char === '|' && !inMath && !inDoubleMath) {
              cells.push(currentCell);
              currentCell = '';
          } else {
              currentCell += char;
          }
      }
      cells.push(currentCell);
      return cells;
  };

  const parseHtmlTableToDocx = (htmlTable: string, baseStyles: any): Table => {
      let docxRows: TableRow[] = [];
      try {
          const doc = new DOMParser().parseFromString(htmlTable, "text/html");
          const tableNode = doc.querySelector("table");
          let tableFontSize = 28; // default 14pt -> 28 half-points
          if (tableNode?.style?.fontSize) {
              const ptMatch = tableNode.style.fontSize.match(/(\d+)/);
              if (ptMatch) {
                  tableFontSize = parseInt(ptMatch[1], 10) * 2;
              }
          }

          // Only get rows that belong to this table directly (skip rows in nested tables)
          const trs = tableNode 
              ? Array.from(tableNode.children).flatMap(child => 
                  child.tagName === 'TR' ? [child] : Array.from(child.children).filter(c => c.tagName === 'TR')
                ) 
              : Array.from(doc.querySelectorAll("tr"));
          
          docxRows = trs.map((tr, rowIndex) => {
              const cells = Array.from(tr.children).filter(c => c.tagName === 'TD' || c.tagName === 'TH');
              if (cells.length === 0) return null;

              const isHeaderRow = cells.some(c => c.tagName === 'TH') || rowIndex === 0;

              return new TableRow({
                  children: cells.map(td => {
                      let cellFontSize = tableFontSize;
                      const htmlTd = td as HTMLElement;
                      if (htmlTd.style.fontSize) {
                          const ptMatch = htmlTd.style.fontSize.match(/(\d+)/);
                          if (ptMatch) {
                              cellFontSize = parseInt(ptMatch[1], 10) * 2;
                          }
                      }
                      
                      const cellStyles = { ...baseStyles, size: cellFontSize, bold: isHeaderRow || baseStyles.bold };
                      const text = td.innerHTML || "";
                      return new TableCell({
                          children: parseDocxCellContent(text.trim(), cellStyles, isHeaderRow) as any,
                          borders: {
                              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                          ...(td.getAttribute("width") || htmlTd.style.width ? {
                              width: (td.getAttribute("width") || htmlTd.style.width).includes("%") 
                                  ? { size: parseFloat(td.getAttribute("width") || htmlTd.style.width || "0"), type: WidthType.PERCENTAGE }
                                  : { size: parseFloat(td.getAttribute("width") || htmlTd.style.width || "0") * 15, type: WidthType.DXA }
                          } : {})
                      });
                  })
              });
          }).filter((row): row is TableRow => row !== null);
      } catch (e) {
          console.error("Failed to parse HTML table", e);
      }
      
      if (docxRows.length === 0) {
          docxRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph("")] })] }));
      }
      
      return new Table({
          rows: docxRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.AUTOFIT,
      });
  };

  const parseDocxCellContent = (cellText: string, baseStyles: any, isHeaderRow: boolean): any[] => {
      const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
      const parts = cellText.split(tableRegex);
      const matches = cellText.match(tableRegex);
      
      const children: any[] = [];
      let matchIdx = 0;
      
      parts.forEach((part, index) => {
          if (part.trim() || parts.length === 1) {
              children.push(new Paragraph({
                    children: parseTextWithFormatting(part.trim() || " ", baseStyles),
                    spacing: { before: 120, after: 0, line: 240, lineRule: LineRuleType.AUTO },
                    indent: { firstLine: 0, left: 0, right: 0 },
                    alignment: isHeaderRow ? AlignmentType.CENTER : AlignmentType.LEFT
              }));
          }
          if (matches && matchIdx < matches.length && index < parts.length - 1) {
              const htmlTable = matches[matchIdx];
              matchIdx++;
              children.push(parseHtmlTableToDocx(htmlTable, baseStyles));
          }
      });
      
      return children;
  };

  // Helper: Reconstruct sub-table or join extra cells in 2-column activity tables
  const reconstructCellWithSubTables = (rawCells: string[]): string => {
      if (rawCells.length === 0) return '';
      if (rawCells.length === 1) return rawCells[0] || '';

      // Check if there are markdown table separator/alignment tokens (:---, ---, :---:)
      const sepIndices: number[] = [];
      rawCells.forEach((c, idx) => {
          if (/^:?-{2,}:?$/.test(c.trim()) || /^:?-+:?$/.test(c.trim())) {
              sepIndices.push(idx);
          }
      });

      if (sepIndices.length > 0) {
          const firstSep = sepIndices[0];
          let sepCount = 1;
          while (sepCount < sepIndices.length && sepIndices[sepCount] === firstSep + sepCount) {
              sepCount++;
          }

          const subCols = sepCount;
          const headerStart = firstSep - subCols;

          if (headerStart >= 0) {
              const beforeText = rawCells.slice(0, headerStart).join(' ').trim();
              const subHeaders = rawCells.slice(headerStart, firstSep);
              
              let dataIdx = firstSep + subCols;
              const subRows: string[][] = [];
              
              while (dataIdx + subCols <= rawCells.length) {
                  const candidateRow = rawCells.slice(dataIdx, dataIdx + subCols);
                  subRows.push(candidateRow);
                  dataIdx += subCols;
                  if (dataIdx < rawCells.length && dataIdx + subCols > rawCells.length) {
                      break;
                  }
              }

              const afterText = rawCells.slice(dataIdx).join(' ').trim();

              let htmlSubTable = `<table border="1" style="width: 100%; border-collapse: collapse; font-size: 10pt; margin: 6px 0;">`;
              htmlSubTable += `<tr>${subHeaders.map(h => `<th style="border: 1px solid black; padding: 4px; text-align: center; background-color: #f8fafc;">${h.trim()}</th>`).join('')}</tr>`;
              subRows.forEach(r => {
                  htmlSubTable += `<tr>${r.map(d => `<td style="border: 1px solid black; padding: 4px; text-align: center;">${d.trim()}</td>`).join('')}</tr>`;
              });
              htmlSubTable += `</table>`;

              let result = '';
              if (beforeText) result += beforeText + '<br>';
              result += htmlSubTable;
              if (afterText) result += '<br>' + afterText;
              return result;
          }
      }

      // Default: join multiple cells with <br>
      return rawCells.join('<br>');
  };

  // Helper: Create Docx Table from Markdown lines
  const createTableFromMarkdown = (tableLines: string[]): Table | null => {
    try {
        const validLines = tableLines.filter(line => !line.match(/^\|?\s*[-:]+[-|\s:]*\|?\s*$/));
        if (validLines.length === 0) return null;
        
        const parsedRows = validLines.map(line => {
            let cells = smartSplitTableLine(line);
            if (line.trim().startsWith('|') && cells.length > 0 && cells[0].trim() === '') cells.shift();
            if (line.trim().endsWith('|') && cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
            return cells;
        });

        if (parsedRows.length === 0) return null;

        // Check if this is a 2-column Activity Table (Phụ lục 4)
        const headerRow0 = parsedRows[0];
        const isActivityTable = (
            headerRow0.length === 2 ||
            /(?:tổ\s*chức\s*thực\s*hiện|hoạt\s*động)/i.test(headerRow0[0] || '') ||
            /sản\s*phẩm/i.test(headerRow0[1] || '')
        );

        if (isActivityTable) {
            // Chuẩn hóa bảng 2 cột Phụ lục 4:
            // HÀNG 1: Tiêu đề "Hoạt động của giáo viên và học sinh" | "Kết quả hoạt động"
            // HÀNG 2: Gộp toàn bộ các bước 1, 2, 3, 4 vào 1 ô duy nhất ở Cột 1; Toàn bộ kết quả và hình ảnh ở Cột 2
            
            const headerRow = new TableRow({
                children: [
                    new TableCell({
                        children: parseDocxCellContent("Hoạt động của giáo viên và học sinh", { bold: true }, true) as any,
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                    }),
                    new TableCell({
                        children: parseDocxCellContent("Kết quả hoạt động", { bold: true }, true) as any,
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                    }),
                ]
            });

            // Gộp tất cả các hàng dữ liệu thành 1 hàng duy nhất
            const dataRows = parsedRows.slice(1);
            let combinedCol0Parts: string[] = [];
            let combinedCol1Parts: string[] = [];

            dataRows.forEach(cells => {
                while (cells.length > 0 && (cells[0].trim() === '' || cells[0].trim() === '\\')) {
                    cells.shift();
                }
                if (cells.length === 0) return;

                const c0 = (cells[0] || '').trim().replace(/^[\\|\s]+/, '');
                const c1 = reconstructCellWithSubTables(cells.slice(1)).trim().replace(/^[\\|\s]+/, '');
                if (c0) combinedCol0Parts.push(c0);
                if (c1) combinedCol1Parts.push(c1);
            });

            let col0Text = combinedCol0Parts.join('<br>');
            let col1Text = combinedCol1Parts.join('<br>');

            // Khắc phục trường hợp Col 0 bị rỗng do bảng markdown lệch cột
            if (!col0Text && col1Text) {
                if (/Bước\s*[1-4]|GV|Giáo\s*viên/i.test(col1Text)) {
                    col0Text = col1Text;
                    col1Text = "- Học sinh hoàn thành các nhiệm vụ học tập theo yêu cầu của giáo viên.<br>- Lời giải, kết quả chi tiết các bài tập / hoạt động.";
                }
            }

            if (!col1Text) {
                col1Text = "- Học sinh hoàn thành các nhiệm vụ học tập theo yêu cầu của giáo viên.<br>- Lời giải, kết quả chi tiết các bài tập / hoạt động.";
            }

            col0Text = col0Text.replace(/^\*\s*/, "").replace(/^\\s+/, "").replace(/^[\\|\s]+/, "");
            col1Text = col1Text.replace(/^\*\s*/, "").replace(/^\\s+/, "").replace(/^[\\|\s]+/, "");

            // ĐẢM BẢO 100% HÌNH ẢNH / HÌNH VẼ ĐƯỢC CHUYỂN VỀ CỘT 2 (KẾT QUẢ HOẠT ĐỘNG / SẢN PHẨM)
            const imgTagRegex = /\[[\s\S]*?(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|HÌNH_ẢNH_GỐC|HÌNH_ẢNH|HÌNH_VẼ_GỐC|HÌNH_VẼ|HÌNH_MINH_HỌA|HÌNH|HINH|IMG|IMAGE|ẢNH_GỐC|ẢNH|ANH|SƠ_ĐỒ|SO_DO|Hình\s*ảnh\s*gốc|Hình\s*ảnh|Hình\s*vẽ\s*gốc|Hình\s*vẽ|Hình\s*minh\s*họa|Hình|Ảnh\s*gốc|Ảnh\s*minh\s*họa|Ảnh|Sơ\s*đồ|Hinh\s*anh|Hinh\s*ve)[\s_:.\-0-9a-zA-ZÀ-ỹ*]*\]|!\[[^\]]*\]\([^)]+\)/gi;
            const col0Imgs = col0Text.match(imgTagRegex);
            if (col0Imgs && col0Imgs.length > 0) {
                col0Text = col0Text.replace(imgTagRegex, '').replace(/(?:<br>\s*)+/g, '<br>').trim();
                col1Text = `${col1Text}<br>${col0Imgs.join('<br>')}`.trim();
            }

            const contentRow = new TableRow({
                children: [
                    new TableCell({
                        children: parseDocxCellContent(col0Text, {}, false) as any,
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                    }),
                    new TableCell({
                        children: parseDocxCellContent(col1Text, {}, false) as any,
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                    }),
                ]
            });

            return new Table({
                rows: [headerRow, contentRow],
                width: { size: 100, type: WidthType.PERCENTAGE },
                layout: TableLayoutType.AUTOFIT,
            });
        }

        // Generic Table (not 2-column activity table)
        let maxCols = 0;
        parsedRows.forEach(cells => {
            if (cells.length > maxCols) maxCols = cells.length;
        });

        const rows = parsedRows.map((cells, rowIndex) => {
            while (cells.length < maxCols) {
                cells.push('');
            }
            if (cells.length === 0) {
                cells = [''];
            }

            const isHeaderRow = rowIndex === 0;

            return new TableRow({
                children: cells.map((cellContent) => {
                    let cellText = cellContent.trim();
                    cellText = cellText.replace(/^\\\*\s*/, "").replace(/^\\\s+/, "");
                    const baseStyles = isHeaderRow ? { bold: true } : {};

                    return new TableCell({
                        children: parseDocxCellContent(cellText, baseStyles, isHeaderRow) as any,
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                    });
                })
            });
        });

        return new Table({
            rows: rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.AUTOFIT,
        });
    } catch (e) {
        console.error("Lỗi parse table:", e);
        return null;
    }
  };

  const generateDocx = async () => {
    if (!safeResult) return;
    setIsGeneratingDoc(true);

    try {
      // Pre-convert any SVG data in imageCache to PNG DataURLs for DOCX ImageRun compatibility
      for (const key of Object.keys(imageCache)) {
        const item = imageCache[key];
        if (item && item.dataUrl && (item.dataUrl.startsWith('data:image/svg+xml') || item.dataUrl.includes('<svg'))) {
          try {
            const rawSvg = item.dataUrl.startsWith('data:image/svg+xml')
              ? decodeURIComponent(item.dataUrl.replace(/^data:image\/svg\+xml;[^,]*,/, ''))
              : item.dataUrl;
            const pngUrl = await convertSvgToPngDataUrl(rawSvg, 500, 320);
            item.dataUrl = pngUrl;
          } catch (e) {
            console.warn("Could not pre-convert SVG to PNG for docx:", e);
          }
        }
      }

      // Pre-process: Clean up stray MathType artifacts, normalize math formula spacing, and collapse multi-line HTML tables
      let preProcessedResult = safeResult
        .replace(/\$?\s*EMBED\s+Equation(?:\.DSMT4|\.3|\.2|\b[^\s<"]*)\s*\$?|\[CÔNG_THỨC_TOÁN:\s*MathType\]/gi, '')
        .replace(/\$\s+([^$\n\r]+?)\s+\$/g, (_m, g) => `$${g}$`)
        .replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => `$$${content.trim()}$$`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (match, content) => `$${content.trim()}$`)
        .replace(/\[MATH:\s*([\s\S]*?)\]/g, (match, content) => `$${content.trim()}$`);

      preProcessedResult = repairRacToFrac(preProcessedResult);
      preProcessedResult = ensureMathFormulaSpacing(preProcessedResult);
      preProcessedResult = preProcessedResult.replace(/<table[\s\S]*?<\/table>/gi, match => match.replace(/\r?\n/g, ' '));

      // Tự động kiểm tra và bảo tồn tất cả hình vẽ gốc từ imageCache vào CỘT 2 (Kết quả hoạt động) của bảng giáo án
      const cachedKeys = Object.keys(imageCache);
      const educationalImages: string[] = [];
      const seenUrls = new Set<string>();

      cachedKeys.forEach(k => {
        const item = imageCache[k];
        if (item && item.dataUrl && !seenUrls.has(item.dataUrl) && !item.isMathFormula) {
          seenUrls.add(item.dataUrl);
          const numMatch = k.match(/\d+/);
          const tag = numMatch ? `[HINHANHGOC_${numMatch[0]}]` : `[${k}]`;
          educationalImages.push(tag);
        }
      });

      if (educationalImages.length > 0 && !preProcessedResult.includes('[HINHANHGOC_') && !preProcessedResult.includes('[HÌNH_VẼ_GỐC_') && !preProcessedResult.includes('[HÌNH VẼ GỐC')) {
        console.log("[DOCX Export] Tự động chèn hình vẽ học liệu gốc vào Cột 2 (Sản phẩm / Kết quả hoạt động):", educationalImages);
        const imgTagsInCell = educationalImages.map(t => `<br>${t}<br>`).join(' ');
        
        // Chèn vào Cột 2 của bảng 2 cột
        const tableRowMatch = preProcessedResult.match(/(\|\s*[^|\n]+\|)([^|\n]+)(\|)/);
        if (tableRowMatch) {
            preProcessedResult = preProcessedResult.replace(tableRowMatch[0], `${tableRowMatch[1]}${tableRowMatch[2]} ${imgTagsInCell}${tableRowMatch[3]}`);
        }
      }
      const lines = preProcessedResult.split('\n');
      const children: (Paragraph | Table)[] = [];
      let tableBuffer: string[] = [];
      let inTable = false;

      // === CONSTANTS FOR FORMATTING ===
      const FIRST_LINE_INDENT = 720; // 1.27cm
      const PARAGRAPH_SPACING = { before: 120, after: 0, line: 240, lineRule: LineRuleType.AUTO };

      const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
      const noBorders = {
        top: noBorder,
        bottom: noBorder,
        left: noBorder,
        right: noBorder,
        insideHorizontal: noBorder,
        insideVertical: noBorder,
      };

      // Header Phụ lục IV & Thông tin Trường / Tổ / Giáo viên
      if (teacherInfo?.includeInHeader && (teacherInfo.schoolName || teacherInfo.teacherName || teacherInfo.department)) {
          // 1. Phụ lục IV ở góc trên bên phải
          children.push(new Paragraph({
              children: [
                  new TextRun({
                      text: "Phụ lục IV",
                      bold: true,
                      size: 28,
                      font: "Times New Roman"
                  })
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { before: 0, after: 100, line: 240, lineRule: LineRuleType.AUTO }
          }));

          let schoolClean = teacherInfo.schoolName || "THCS Đồng Yên";
          if (schoolClean.startsWith("Trường: ")) schoolClean = schoolClean.replace(/^Trường:\s*/i, '');
          else if (schoolClean.startsWith("Trường ")) schoolClean = schoolClean.replace(/^Trường\s+/i, '');

          let deptClean = teacherInfo.department || "Khoa học Tự Nhiên";
          if (deptClean.startsWith("Tổ: ")) deptClean = deptClean.replace(/^Tổ:\s*/i, '');
          else if (deptClean.startsWith("Tổ ")) deptClean = deptClean.replace(/^Tổ\s+/i, '');

          const teacherClean = teacherInfo.teacherName || "Mai Văn Hùng";

          // 2. Bảng 2 cột không viền (Trường, Tổ bôi đỏ bên trái & Họ tên giáo viên bên phải)
          const headerTable = new Table({
              borders: noBorders,
              rows: [
                  new TableRow({
                      children: [
                          new TableCell({
                              width: { size: 55, type: WidthType.PERCENTAGE },
                              borders: noBorders,
                              children: [
                                  new Paragraph({
                                      children: [
                                          new TextRun({ text: "Trường: ", bold: true, size: 28, font: "Times New Roman" }),
                                          new TextRun({ text: schoolClean, bold: true, size: 28, font: "Times New Roman" })
                                      ],
                                      spacing: { before: 0, after: 60, line: 240, lineRule: LineRuleType.AUTO },
                                      alignment: AlignmentType.LEFT
                                  }),
                                  new Paragraph({
                                      children: [
                                          new TextRun({ text: "Tổ: ", bold: true, size: 28, font: "Times New Roman" }),
                                          new TextRun({ text: deptClean, bold: true, color: "FF0000", size: 28, font: "Times New Roman" })
                                      ],
                                      spacing: { before: 0, after: 120, line: 240, lineRule: LineRuleType.AUTO },
                                      alignment: AlignmentType.LEFT
                                  })
                              ]
                          }),
                          new TableCell({
                              width: { size: 45, type: WidthType.PERCENTAGE },
                              borders: noBorders,
                              children: [
                                  new Paragraph({
                                      children: [
                                          new TextRun({ text: "Họ và tên giáo viên:", size: 28, font: "Times New Roman" })
                                      ],
                                      spacing: { before: 0, after: 60, line: 240, lineRule: LineRuleType.AUTO },
                                      alignment: AlignmentType.CENTER
                                  }),
                                  new Paragraph({
                                      children: [
                                          new TextRun({ text: teacherClean, bold: true, size: 28, font: "Times New Roman" })
                                      ],
                                      spacing: { before: 0, after: 120, line: 240, lineRule: LineRuleType.AUTO },
                                      alignment: AlignmentType.CENTER
                                  })
                              ]
                          })
                      ]
                  })
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.AUTOFIT,
          });

           children.push(headerTable);
      }

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i].trimEnd();
        let trimmed = rawLine.trim();

        // --- CLEANING ARTIFACTS START ---
        // 1. Remove leftover HTML anchors if any
        trimmed = trimmed.replace(/<a\s+id="[^"]*"><\/a>/gi, "");
        
        // 2. Remove escaped asterisk at start (e.g. "\* Text")
        trimmed = trimmed.replace(/^\\\*\s*/, "");

        // 3. Remove escaped space at start (e.g. "\ Text")
        trimmed = trimmed.replace(/^\\\s+/, "");

        // 4. Remove any markdown hashes ##### or #### at the start of lines
        trimmed = trimmed.replace(/^#{3,6}\s*/, "");
        
        // Re-trim after cleaning
        trimmed = trimmed.trim();

        // Bảo toàn tuyệt đối 100% mục c) Sản phẩm và d) Tổ chức thực hiện trong DOCX (Không bỏ qua)
        
        // 1. Table Handling
        if (trimmed.startsWith('|')) {
            inTable = true;
            tableBuffer.push(rawLine);
            continue;
        } else if (inTable) {
            if (tableBuffer.length > 0) {
                const tableNode = createTableFromMarkdown(tableBuffer);
                if (tableNode) {
                    children.push(tableNode);
                }
                tableBuffer = [];
            }
            inTable = false;
        }

        // 2. Empty Line Handling
        if (!trimmed) {
          continue;
        }

        // Horizontal Rule
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          continue;
        }

        // Check for "* Hướng dẫn về nhà" (Ảnh 2)
        if (/^\*?\s*Hướng\s*dẫn\s*(?:về\s*nhà|học\s*ở\s*nhà|tự\s*học)/i.test(trimmed)) {
          children.push(new Paragraph({
            children: [
              new TextRun({
                text: "* Hướng dẫn về nhà",
                bold: true,
                size: 28,
                font: "Times New Roman"
              })
            ],
            spacing: { before: 200, after: 80, line: 240, lineRule: LineRuleType.AUTO },
            indent: { firstLine: FIRST_LINE_INDENT },
            alignment: AlignmentType.JUSTIFIED
          }));
          continue;
        }

        // Check for sub-items: "1. Ôn tập kiến thức:", "2. Bài tập về nhà:", "3. Chuẩn bị bài mới:"
        if (/^(?:\d+\.|\d+\))\s*(?:Ôn\s*tập\s*kiến\s*thức|Bài\s*tập\s*về\s*nhà|Chuẩn\s*bị\s*bài\s*mới)/i.test(trimmed)) {
          children.push(new Paragraph({
            children: parseTextWithFormatting(`**${trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '')}**`),
            spacing: PARAGRAPH_SPACING,
            indent: { firstLine: FIRST_LINE_INDENT },
            alignment: AlignmentType.JUSTIFIED
          }));
          continue;
        }

        // 3. Center-aligned Lesson Title & metadata (Ảnh 1)
        if (trimmed.startsWith('# ') || (/^(?:Bài|BÀI)\s*\d+/i.test(trimmed) && trimmed.length < 150)) {
          children.push(new Paragraph({
            children: parseTextWithFormatting(trimmed.replace(/^#+\s*/, ''), { bold: true, size: 30 }),
            heading: HeadingLevel.TITLE,
            spacing: { before: 180, after: 60, line: 240, lineRule: LineRuleType.AUTO },
            alignment: AlignmentType.CENTER
          }));
        } 
        else if (/^(?:Môn\s*học|Thời\s*gian\s*thực\s*hiện|Số\s*báo\s*giảng)/i.test(trimmed) && trimmed.length < 220) {
          children.push(new Paragraph({
            children: parseTextWithFormatting(trimmed),
            spacing: { before: 40, after: 40, line: 240, lineRule: LineRuleType.AUTO },
            alignment: AlignmentType.CENTER
          }));
        }
        else if (trimmed.startsWith('<center>') && trimmed.endsWith('</center>')) {
          children.push(new Paragraph({
            children: parseTextWithFormatting(trimmed.replace('<center>', '').replace('</center>', '')),
            spacing: PARAGRAPH_SPACING,
            alignment: AlignmentType.CENTER
          }));
        }
        else if (trimmed.startsWith('## ')) {
          children.push(new Paragraph({
            children: parseTextWithFormatting(trimmed.replace('## ', '')),
            heading: HeadingLevel.HEADING_1,
            spacing: PARAGRAPH_SPACING,
            indent: { firstLine: FIRST_LINE_INDENT },
            alignment: AlignmentType.JUSTIFIED
          }));
        } 
        else if (trimmed.startsWith('### ')) {
          children.push(new Paragraph({
             children: parseTextWithFormatting(trimmed.replace('### ', '')),
            heading: HeadingLevel.HEADING_2,
            spacing: PARAGRAPH_SPACING,
            indent: { firstLine: FIRST_LINE_INDENT },
            alignment: AlignmentType.JUSTIFIED
          }));
        }
        else if (trimmed.startsWith('#### ')) {
            children.push(new Paragraph({
               children: parseTextWithFormatting(trimmed.replace('#### ', '')),
              heading: HeadingLevel.HEADING_3,
              spacing: PARAGRAPH_SPACING,
              indent: { firstLine: FIRST_LINE_INDENT },
              alignment: AlignmentType.JUSTIFIED
            }));
        }
        // 4. List Handling
        else if (trimmed.startsWith('- ') || trimmed.startsWith('+ ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            children.push(new Paragraph({
                children: parseTextWithFormatting(`- ${content}`),
                spacing: PARAGRAPH_SPACING,
                indent: { firstLine: FIRST_LINE_INDENT },
                alignment: AlignmentType.JUSTIFIED
            }));
        }
        // 5. Regular Text
        else {
            const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
            if (trimmed.match(tableRegex)) {
                const parts = trimmed.split(tableRegex);
                const matches = trimmed.match(tableRegex);
                let matchIdx = 0;
                
                parts.forEach((part, index) => {
                    if (part.trim() || parts.length === 1) {
                         children.push(new Paragraph({
                            children: parseTextWithFormatting(part.trim() || " "),
                            spacing: PARAGRAPH_SPACING,
                            indent: { firstLine: FIRST_LINE_INDENT },
                            alignment: AlignmentType.JUSTIFIED
                        }));
                    }
                    if (matches && matchIdx < matches.length && index < parts.length - 1) {
                        const htmlTable = matches[matchIdx];
                        matchIdx++;
                        children.push(parseHtmlTableToDocx(htmlTable, {}));
                    }
                });
            } else {
                 children.push(new Paragraph({
                    children: parseTextWithFormatting(trimmed),
                    spacing: PARAGRAPH_SPACING,
                    indent: { firstLine: FIRST_LINE_INDENT },
                    alignment: AlignmentType.JUSTIFIED
                }));
            }
        }
      }

      // Flush remaining table
      if (tableBuffer.length > 0) {
         const tableNode = createTableFromMarkdown(tableBuffer);
         if (tableNode) children.push(tableNode);
      }

      // Bảng chữ ký phê duyệt ở cuối văn bản (Ảnh 3)
      if (teacherInfo?.includeInHeader) {
          const reviewerClean = teacherInfo.reviewerName || "Nguyễn Thị Huệ";
          const teacherClean = teacherInfo.teacherName || "Mai Văn Hùng";

          const signatureTable = new Table({
              borders: noBorders,
              rows: [
                  new TableRow({
                      children: [
                          new TableCell({
                              width: { size: 50, type: WidthType.PERCENTAGE },
                              borders: noBorders,
                              children: [
                                  new Paragraph({
                                      children: [
                                          new TextRun({ text: "Người kiểm tra", bold: true, size: 28, font: "Times New Roman" })
                                      ],
                                      alignment: AlignmentType.CENTER,
                                      spacing: { before: 200, after: 800, line: 240, lineRule: LineRuleType.AUTO }
                                  }),
                                  new Paragraph({
                                      children: [
                                          new TextRun({ text: reviewerClean, bold: true, size: 28, font: "Times New Roman" })
                                      ],
                                      alignment: AlignmentType.CENTER,
                                      spacing: { before: 0, after: 120, line: 240, lineRule: LineRuleType.AUTO }
                                  })
                              ]
                          }),
                          new TableCell({
                              width: { size: 50, type: WidthType.PERCENTAGE },
                              borders: noBorders,
                              children: [
                                  new Paragraph({
                                      children: [
                                          new TextRun({ text: "Người xây dựng kế hoạch", bold: true, size: 28, font: "Times New Roman" })
                                      ],
                                      alignment: AlignmentType.CENTER,
                                      spacing: { before: 200, after: 800, line: 240, lineRule: LineRuleType.AUTO }
                                  }),
                                  new Paragraph({
                                      children: [
                                          new TextRun({ text: teacherClean, bold: true, size: 28, font: "Times New Roman" })
                                      ],
                                      alignment: AlignmentType.CENTER,
                                      spacing: { before: 0, after: 120, line: 240, lineRule: LineRuleType.AUTO }
                                  })
                              ]
                          })
                      ]
                  })
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.AUTOFIT
          });

          children.push(new Paragraph({ spacing: { before: 240, after: 120 } }));
          children.push(signatureTable);
      }

      // === PAGE MARGINS ===
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                size: 28, // 14pt
                font: "Times New Roman",
                color: "000000"
              },
              paragraph: {
                spacing: { line: 240, before: 120, after: 0 },
              }
            },
            title: {
                run: { size: 32, bold: true, font: "Times New Roman", color: "000000" },
                paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER }
            },
            heading1: {
                run: { size: 28, bold: true, font: "Times New Roman", color: "000000" },
                paragraph: { spacing: { before: 120, after: 0 }, indent: { firstLine: FIRST_LINE_INDENT } }
            },
            heading2: {
                run: { size: 28, bold: true, font: "Times New Roman", color: "000000" },
                paragraph: { spacing: { before: 120, after: 0 }, indent: { firstLine: FIRST_LINE_INDENT } }
            },
            heading3: {
                run: { size: 28, bold: true, font: "Times New Roman", color: "000000" },
                paragraph: { spacing: { before: 120, after: 0 }, indent: { firstLine: FIRST_LINE_INDENT } }
            }
          }
        },
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1134,
                bottom: 1134,
                left: 1418, 
                right: 1134,
              },
            },
          },
          children: children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      FileSaver.saveAs(blob, "Giao_an_tich_hop.docx");
    } catch (error) {
      console.error("Lỗi tạo doc:", error);
      alert("Lỗi khi tạo file DOC. Đang tải xuống file văn bản thay thế.");
      handleDownloadTxt();
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!safeResult) return;
    const blob = new Blob([safeResult], { type: 'text/plain' });
    FileSaver.saveAs(blob, 'Giao_an_NLS.txt');
  };


  const getPreviewHtml = (text: string) => {
    if (!text) return "";

    // 0. Remove any erroneous image tags created from math fractions like [1/2], [S = 1/2...], [Phân số 1/2]
    let html = text.replace(/\[\s*(?:phân\s*số\s*)?\d+\/\d+\s*\]/gi, '');
    html = html.replace(/\[\s*(?:HÌNH|HINH|IMG|IMAGE|ẢNH|ANH)?[\s_]*\d+\/\d+[\s_]*\]/gi, '');

    // 1. Xóa bỏ hoàn toàn các thẻ HTML rác / dangling tags (</span>, <span...>, <font...>, </font>)
    html = html.replace(/<\/?(?:span|font|u)[^>]*>/gi, '');

    // 2. Đảm bảo khoảng cách công thức toán không dính chữ
    html = ensureMathFormulaSpacing(html);

    // Regex matching legitimate image placeholders (e.g., [HINHANHGOC_1], [IMG1], [Hình 1: ...])
    const imgRegex = /(?:!\[([^\]]*)\]\(([^)]+)\)|\*{0,2}\[\s*(?:HINHANHGOC|HINH_ANH_GOC|HINH_ANH|HINHANH|HÌNH_ẢNH_GỐC|HÌNH_ẢNH|HÌNH_VẼ_GỐC|HÌNH_VẼ|HÌNH_MINH_HỌA|HÌNH|HINH|IMG|IMAGE|ẢNH_GỐC|ẢNH|ANH|SƠ_ĐỒ|SO_DO|Hình\s*ảnh\s*gốc|Hình\s*ảnh|Hình\s*vẽ\s*gốc|Hình\s*vẽ|Hình\s*minh\s*họa|Ảnh\s*gốc|Ảnh\s*minh\s*họa|Sơ\s*đồ|Hinh\s*anh|Hinh\s*ve)[\s_:.\-0-9a-zA-ZÀ-ỹ*]*\]\*{0,2})/gi;

    html = html.replace(imgRegex, (match, p1, p2, offset) => {
       const cleanMatch = match.replace(/^\*+|\*+$/g, '').trim();
       const rawId = cleanMatch.replace(/^!\[|^\[|\]$|\)$/g, '').trim();
       const numMatch = cleanMatch.match(/\d+/);
       const num = numMatch ? numMatch[0] : '1';
       
       const cachedImg = lookupCachedImage(cleanMatch) || lookupCachedImage(`HINHANHGOC_${num}`) || lookupCachedImage(num);

       if (cachedImg && typeof cachedImg.dataUrl === 'string' && cachedImg.dataUrl.trim() !== '') {
           return `<img src="${cachedImg.dataUrl}" alt="Hình ${num}: Minh họa trực quan" data-img-num="${num}" />`;
       }

       return `<div class="my-2 p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500 italic">[Hình vẽ gốc ${num}]</div>`;
    });

    // Remove any empty img tags that might cause React warning: <img src="" ...> or <img ... src="" ...>
    html = html.replace(/<img[^>]*?src=["']\s*["'][^>]*?>/gi, '');

    // Clean up any stray MathType EMBED Equation artifacts
    html = html.replace(/\$?\s*EMBED\s+Equation(?:\.DSMT4|\.3|\.2|\b[^\s<"]*)\s*\$?|\[CÔNG_THỨC_TOÁN:\s*MathType\]/gi, '');

    // Normalize LaTeX math formulas
    html = repairRacToFrac(html);
    html = ensureMathFormulaSpacing(html);
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => `$$${content.trim()}$$`);
    html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, content) => `$${content.trim()}$`);
    html = html.replace(/\[MATH:\s*([\s\S]*?)\]/g, (match, content) => `$${content.trim()}$`);
    html = html.replace(/\$\s+([^$\n\r]+?)\s+\$/g, (_m, g) => `$${g}$`);

    // 3. Tự động bôi đỏ tất cả các dòng tích hợp trên giao diện xem trước (bắt đầu bằng dấu * tích hợp)
    const lines = html.split('\n');
    const styledLines = lines.map(line => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      const isIntegrationLine = (
        (lower.startsWith('*') && !lower.startsWith('* hướng dẫn') && !lower.startsWith('*hướng dẫn')) ||
        lower.startsWith('tích hợp') ||
        lower.startsWith('hs khuyết tật') ||
        lower.startsWith('học sinh khuyết tật')
      );

      if (isIntegrationLine && !trimmed.startsWith('|') && !trimmed.startsWith('#')) {
        return `<span style="color: red; font-weight: 500;">${line}</span>`;
      }
      return line;
    });
    html = styledLines.join('\n');

    // Render KaTeX block math $$...$$ directly into HTML for 100% crisp formulas
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, expr) => {
      try {
        const rendered = katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
        return `<div class="katex-display-wrapper my-2 text-center overflow-x-auto">${rendered}</div>`;
      } catch (e) {
        return match;
      }
    });

    // Render KaTeX inline math $...$ directly into HTML for 100% crisp formulas
    html = html.replace(/\$([^\$\n\r]+?)\$/g, (match, expr) => {
      try {
        return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    return html;
  };

  if (loading && !safeResult) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 animate-fade-in-up">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-inner">
          <Sparkles size={28} className="animate-spin text-blue-600" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Đang phân tích và xử lý Kế hoạch bài dạy...
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Hệ thống đang kết nối với Google Gemini 2.5 Flash để tích hợp chuẩn hóa mục tiêu, tiến trình dạy học theo chuẩn GDPT 2018...
          </p>
        </div>
        <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full w-2/3 animate-pulse rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!safeResult) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden animate-fade-in-up">
      {/* Banner Thành công hoặc Đang tải */}
      <div className="bg-slate-900 px-6 py-8 sm:py-10 flex flex-col items-center justify-center text-center space-y-3 text-white">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
           {loading ? <Sparkles size={26} className="animate-spin" /> : <CheckCircle size={26} />}
        </div>
        
        <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {loading ? 'Đang tạo giáo án trực tiếp (Streaming)...' : 'Kế hoạch bài dạy đã được xử lý hoàn tất'}
            </h2>
            <p className="text-slate-300 mt-1 max-w-lg mx-auto text-xs sm:text-sm font-normal">
              {loading ? 'Nội dung đang được AI sinh trực tiếp theo thời gian thực bên dưới.' : 'Tài liệu đã được tích hợp đầy đủ năng lực mục tiêu và định dạng sẵn sàng cho Word (.docx).'}
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-md">
          <button 
            onClick={generateDocx}
            disabled={isGeneratingDoc}
            className="flex-1 flex items-center justify-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm active:scale-95 cursor-pointer"
          >
             {isGeneratingDoc ? (
                 <span className="animate-pulse">Đang xuất file Word...</span>
             ) : (
                 <>
                    <Download size={18} />
                    <span>Tải về file Word (.docx)</span>
                 </>
             )}
          </button>
          <button
             onClick={onReset}
             className="flex items-center justify-center space-x-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-700 active:scale-95 cursor-pointer"
          >
             <RotateCcw size={16} />
             <span>Soạn bài khác</span>
          </button>
        </div>

        {/* Mẹo chuyển đổi MathType trong Word */}
        <div className="mt-2 max-w-xl text-left bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
          <span className="text-base leading-none mt-0.5">📐</span>
          <div>
            <span className="font-semibold text-amber-300">Công thức chuẩn LaTeX (Tương thích 100% MathType): </span>
            Sau khi tải file Word về, Thầy/Cô mở file trong Word, nhấn <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-600 rounded text-amber-200 font-mono text-[11px]">Ctrl + A</kbd> (chọn tất cả) rồi bấm <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-600 rounded text-amber-200 font-mono text-[11px]">Alt + \</kbd> (hoặc vào tab <span className="text-white font-medium">MathType &gt; Toggle TeX</span> / <span className="text-white font-medium">Convert Equations</span>) để chuyển đổi toàn bộ công thức sang MathType tự động không bị lỗi.
          </div>
        </div>
      </div>

      {/* Accordion Toggle */}
      <div className="bg-white">
        <button 
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-center text-slate-700 text-xs font-bold uppercase tracking-wider py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer"
        >
            {showPreview ? (
                <>Thu gọn bản xem trước <ChevronUp size={16} className="ml-1.5" /></>
            ) : (
                <>Xem trước nội dung văn bản <ChevronDown size={16} className="ml-1.5" /></>
            )}
        </button>
      </div>

      {showPreview && (
        <div className="p-6 sm:p-10 border-t border-slate-200 bg-white font-serif max-w-none text-slate-800 text-sm sm:text-base leading-relaxed overflow-x-auto [&_p]:my-2 [&_p]:leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-400 [&_table]:my-4 [&_th]:border [&_th]:border-slate-400 [&_th]:p-2.5 [&_th]:bg-slate-100 [&_th]:font-bold [&_th]:text-center [&_td]:border [&_td]:border-slate-400 [&_td]:p-2.5 [&_td]:align-top [&_td]:leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1 [&_li]:leading-relaxed [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex]:text-slate-900 [&_span[style*='color: red']]:text-red-600 [&_span[style*='color: red']]:font-semibold [&_font[color='red']]:text-red-600 [&_font[color='red']]:font-semibold">
            {/* Top Header Mockup */}
            {teacherInfo?.includeInHeader && (
              <div className="mb-6 pb-2">
                <div className="text-right font-bold text-sm sm:text-base mb-2">Phụ lục IV</div>
                <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
                  <div>
                    <p className="font-bold text-slate-900">
                      Trường: {teacherInfo.schoolName ? teacherInfo.schoolName.replace(/^Trường:\s*/i, '').replace(/^Trường\s+/i, '') : 'THCS Đồng Yên'}
                    </p>
                    <p className="font-bold text-slate-900">
                      Tổ: <span className="text-red-600 font-bold">{teacherInfo.department ? teacherInfo.department.replace(/^Tổ:\s*/i, '').replace(/^Tổ\s+/i, '') : 'Khoa học Tự Nhiên'}</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-800">Họ và tên giáo viên:</p>
                    <p className="font-bold text-slate-900">{teacherInfo.teacherName || 'Mai Văn Hùng'}</p>
                  </div>
                </div>
              </div>
            )}

            <ReactMarkdown 
                remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} 
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                  img: ({ src, alt }) => {
                    if (!src || typeof src !== 'string' || src.trim() === '') {
                      return null;
                    }
                    let realSrc = src;
                    if (!realSrc.startsWith('data:image/') && !realSrc.startsWith('blob:') && !realSrc.startsWith('http://') && !realSrc.startsWith('https://')) {
                      const cached = lookupCachedImage(src) || lookupCachedImage(alt || '');
                      if (cached?.dataUrl) {
                        realSrc = cached.dataUrl;
                      } else {
                        realSrc = '';
                      }
                    }

                    if (!realSrc) {
                      return (
                        <div className="my-2 p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500 italic">
                          [Hình vẽ gốc / Ảnh minh họa]
                        </div>
                      );
                    }

                    const numMatch = (alt || src).match(/\d+/);
                    const num = numMatch ? numMatch[0] : '1';

                    return (
                      <EducationalImageRenderer
                        src={realSrc}
                        alt={alt || `Hình vẽ / Sơ đồ minh họa ${num}`}
                        num={num}
                        id={src}
                      />
                    );
                  }
                }}
            >
            {getPreviewHtml(safeResult)}
            </ReactMarkdown>

            {/* Bottom Signatures Mockup */}
            {teacherInfo?.includeInHeader && (
              <div className="mt-12 pt-4">
                <div className="grid grid-cols-2 gap-6 text-center text-sm sm:text-base">
                  <div>
                    <p className="font-bold text-slate-900">Người kiểm tra</p>
                    <div className="h-20 flex items-center justify-center text-xs text-slate-400 italic">
                      (Ký và ghi rõ họ tên)
                    </div>
                    <p className="font-bold text-slate-900">{teacherInfo.reviewerName || 'Nguyễn Thị Huệ'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Người xây dựng kế hoạch</p>
                    <div className="h-20 flex items-center justify-center text-xs text-slate-400 italic">
                      (Ký và ghi rõ họ tên)
                    </div>
                    <p className="font-bold text-slate-900">{teacherInfo.teacherName || 'Mai Văn Hùng'}</p>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;