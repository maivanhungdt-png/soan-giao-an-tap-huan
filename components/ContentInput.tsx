import React, { useRef, useState } from 'react';
import { Loader2, CheckCircle2, FileText, Upload, AlertTriangle, FileBarChart, Eye, X, Check, Clipboard, RefreshCw, Table, ChevronDown, ChevronUp } from 'lucide-react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { imageCache, clearImageCache } from '../services/imageCache';

// Khai báo thư viện ngoại
declare const mammoth: any;
declare const pdfjsLib: any;

interface ContentInputProps {
  lessonContent: string;
  setLessonContent: (val: string) => void;
  distributionContent: string;
  setDistributionContent: (val: string) => void;
  lessonFileName?: string | null;
  setLessonFileName?: (val: string | null) => void;
  distFileName?: string | null;
  setDistFileName?: (val: string | null) => void;
  integrateNLS: boolean;
  integrateAI: boolean;
  mode?: 'full' | 'extrasOnly';
}

interface UploadBoxProps {
  title: React.ReactNode;
  subTitle: React.ReactNode;
  inputRef: React.RefObject<HTMLInputElement | null>;
  fileName: string | null;
  isProcessing: boolean;
  isLesson: boolean;
  hasContent: boolean;
  content: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'lesson' | 'dist' | 'ai') => void;
  onDropFile: (file: File, type: 'lesson' | 'dist' | 'ai') => void;
  onClear?: () => void;
  onPreview?: () => void;
  onOpenPasteModal?: () => void;
  type: 'lesson' | 'dist' | 'ai';
}

const UploadBox: React.FC<UploadBoxProps> = ({ 
  title, 
  subTitle, 
  inputRef, 
  fileName, 
  isProcessing, 
  isLesson, 
  hasContent,
  content,
  onFileChange,
  onDropFile,
  onClear,
  onPreview,
  onOpenPasteModal,
  type
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTableExcerpt, setShowTableExcerpt] = useState(true);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onDropFile(file, type);
    }
  };

  // Trích xuất các dòng bảng để hiển thị xem trước
  const getTableRowsExcerpt = (rawText: string) => {
    if (!rawText) return [];
    // Làm sạch thẻ HTML nếu có
    const cleanSource = rawText.includes('<') && rawText.includes('>') 
      ? rawText.replace(/<[^>]+>/g, ' ') 
      : rawText;
    const lines = cleanSource.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 0);
    // Lấy các dòng có chứa dấu phân cách bảng '|' hoặc tab
    const tableLines = lines.filter(l => l.includes('|') || l.includes('\t'));
    const sourceLines = tableLines.length > 0 ? tableLines : lines;
    return sourceLines.slice(0, 5).map(line => {
      if (line.includes('|')) {
        return line.split('|').map(c => c.trim()).filter(Boolean);
      }
      if (line.includes('\t')) {
        return line.split('\t').map(c => c.trim()).filter(Boolean);
      }
      return [line.trim()];
    });
  };

  const tableExcerpt = hasContent ? getTableRowsExcerpt(content) : [];
  const lineCount = hasContent ? content.split('\n').filter(l => l.trim()).length : 0;

  return (
    <div className="flex flex-col h-full">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing) {
            inputRef.current?.click();
          }
        }}
        className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-5 sm:p-6 transition-all duration-200 cursor-pointer text-center flex flex-col justify-center
          ${isDragOver 
            ? 'border-blue-600 bg-blue-100/60 scale-[1.01]' 
            : hasContent 
              ? 'border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70' 
              : 'border-slate-300 bg-slate-50/70 hover:border-blue-500 hover:bg-blue-50/30'
          }
        `}
      >
        <input 
          type="file" 
          ref={inputRef}
          onChange={(e) => onFileChange(e, type)}
          accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.csv,.tsv,.ods,.png,.jpg,.jpeg,.webp,.gif,.bmp" 
          className="hidden" 
        />
        
        <div className="flex flex-col items-center justify-center relative z-10 my-auto">
          {isProcessing ? (
             <div className="p-3.5 bg-white rounded-full shadow-md mb-3 border border-slate-200">
                 <Loader2 className="text-blue-700 animate-spin" size={28} />
             </div>
          ) : hasContent ? (
             <div className="p-3 bg-white rounded-full shadow-md mb-2 border border-emerald-200">
               <CheckCircle2 className="text-emerald-600" size={26} />
             </div>
          ) : (
            <div className={`p-3.5 rounded-xl shadow-sm mb-3 transition-transform group-hover:-translate-y-0.5
                ${isLesson ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
               {isLesson ? <FileText size={24} /> : <FileBarChart size={24} />}
            </div>
          )}

          {isProcessing ? (
               <p className="text-xs font-semibold text-slate-700 animate-pulse">Đang giải mã và phân tích cấu trúc bảng & văn bản...</p>
          ) : hasContent ? (
              <>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 break-all px-2 line-clamp-2">
                    {fileName || (isLesson ? "Giáo án đã nạp" : "Phụ lục 1 / PPCT đã nạp")}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Check size={12} className="stroke-[3]" />
                      Đã nạp thành công (~{lineCount} dòng)
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                    {onPreview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview();
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={12} />
                        Xem toàn bộ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-900 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                    >
                      Chọn lại tệp
                    </button>
                    {onClear && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClear();
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg shadow-2xs transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
              </>
          ) : (
              <>
                  <p className="text-sm sm:text-base font-bold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">{subTitle}</p>
                  <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                    <div className="inline-flex items-center justify-center space-x-1.5 text-xs text-blue-900 font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs group-hover:border-blue-400 group-hover:bg-blue-50 transition-colors">
                        <Upload size={13} />
                        <span>Chọn tệp hoặc Kéo thả</span>
                    </div>
                    {onOpenPasteModal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPasteModal();
                        }}
                        className="inline-flex items-center justify-center space-x-1 text-xs text-slate-700 hover:text-blue-900 font-medium px-2.5 py-1.5 rounded-lg bg-slate-100/90 hover:bg-white border border-slate-200 transition-colors"
                      >
                        <Clipboard size={12} />
                        <span>Dán nội dung</span>
                      </button>
                    )}
                  </div>
              </>
          )}
        </div>
      </div>
    </div>
  );
};

const ContentInput: React.FC<ContentInputProps> = ({ 
  lessonContent, 
  setLessonContent,
  distributionContent,
  setDistributionContent,
  lessonFileName: propLessonFileName,
  setLessonFileName: propSetLessonFileName,
  distFileName: propDistFileName,
  setDistFileName: propSetDistFileName,
  integrateNLS,
  integrateAI,
  mode = 'full'
}) => {
  if (mode === 'extrasOnly' && !integrateNLS && !integrateAI) {
      return null;
  }

  const lessonInputRef = useRef<HTMLInputElement>(null);
  const distInputRef = useRef<HTMLInputElement>(null);
  
  const [processingLesson, setProcessingLesson] = useState(false);
  const [processingDist, setProcessingDist] = useState(false);
  
  const [internalLessonFileName, setInternalLessonFileName] = useState<string | null>(null);
  const [internalDistFileName, setInternalDistFileName] = useState<string | null>(null);

  const lessonFileName = propLessonFileName !== undefined ? propLessonFileName : internalLessonFileName;
  const setLessonFileName = propSetLessonFileName || setInternalLessonFileName;

  const distFileName = propDistFileName !== undefined ? propDistFileName : internalDistFileName;
  const setDistFileName = propSetDistFileName || setInternalDistFileName;

  const [previewContent, setPreviewContent] = useState<{ title: string; text: string } | null>(null);
  const [pasteModal, setPasteModal] = useState<{ isOpen: boolean; type: 'lesson' | 'dist'; text: string } | null>(null);
  
  // Chuyển đổi mã HTML (từ Mammoth hoặc tệp xuất vnEdu/SMAS) thành bảng dạng Text phân tách bằng |
  const htmlToStructuredText = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      let result = '';

      const processNode = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();

          if (tag === 'table') {
            result += '\n--- BẢNG PHỤ LỤC / PHÂN PHỐI CHƯƠNG TRÌNH ---\n';
            const rows = Array.from(el.querySelectorAll('tr'));
            for (const row of rows) {
              const cells = Array.from(row.querySelectorAll('th, td'));
              const cellTexts = cells.map(c => (c.textContent || '').replace(/\s+/g, ' ').trim());
              if (cellTexts.some(t => t.length > 0)) {
                result += cellTexts.join(' | ') + '\n';
              }
            }
            result += '\n';
            return;
          }

          if (tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'li' || tag === 'div') {
            // Nếu phần tử chứa table thì duyệt con, nếu không thì lấy text
            if (el.querySelector('table')) {
              for (let i = 0; i < el.childNodes.length; i++) {
                processNode(el.childNodes[i]);
              }
              return;
            }
            const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (text.length > 0) {
              result += text + '\n';
            }
            return;
          }
        }

        for (let i = 0; i < node.childNodes.length; i++) {
          processNode(node.childNodes[i]);
        }
      };

      if (doc.body) {
        processNode(doc.body);
      }

      return result.trim() || (doc.body ? doc.body.textContent || '' : '').trim();
    } catch (e) {
      console.warn("HTML conversion error", e);
      return html.replace(/<[^>]+>/g, ' ').trim();
    }
  };

  // Trích xuất bảng từ Excel (.xlsx, .xls, .csv)
  const extractTextFromXLSX = async (file: File): Promise<string> => {
      try {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellText: true });
          let fullText = '';
          
          workbook.SheetNames.forEach((sheetName: string) => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
            if (rows && rows.length > 0) {
              fullText += `=== BẢNG PHỤ LỤC / PHÂN PHỐI CHƯƠNG TRÌNH (Sheet: ${sheetName}) ===\n`;
              for (const row of rows) {
                if (Array.isArray(row) && row.some(cell => String(cell).trim().length > 0)) {
                  const formattedRow = row.map(cell => String(cell ?? '').trim().replace(/\r?\n/g, ' '));
                  fullText += formattedRow.join(' | ') + '\n';
                }
              }
              fullText += '\n';
            }
          });
          return fullText.trim();
      } catch (e) {
          console.error("Error reading xlsx", e);
          return "";
      }
  };

  // Trích xuất cấu trúc XML Word (.docx) trực tiếp bằng DOMParser (hỗ trợ mọi cấu trúc bảng lồng, text box, nhiều cột, v.v.)
  const extractDirectXmlFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      let combinedText = "";
      
      // Duyệt qua tất cả các file XML chính trong word/
      const xmlFiles = Object.keys(zip.files).filter(name => 
        name.match(/^word\/(document|header\d*|footer\d*|footnotes)\.xml$/i)
      );
      
      // Sắp xếp để word/document.xml luôn được xử lý trước
      xmlFiles.sort((a, b) => {
        if (a.includes('document.xml')) return -1;
        if (b.includes('document.xml')) return 1;
        return a.localeCompare(b);
      });

      const parser = new DOMParser();

      for (const fileName of xmlFiles) {
        const docXmlFile = zip.file(fileName);
        if (!docXmlFile) continue;
        const xml = await docXmlFile.async("string");
        if (!xml) continue;

        let sectionText = "";

        // 1. Phân tích qua DOMParser XML (Chuẩn xác 100% cho cây XML Word)
        try {
          const xmlDoc = parser.parseFromString(xml, "application/xml");
          
          // Helper: Lấy text từ một node w:p hoặc w:r hoặc node bất kỳ
          const getNodeText = (node: Element): string => {
            const tNodes = node.getElementsByTagName("w:t");
            const pieces: string[] = [];
            for (let i = 0; i < tNodes.length; i++) {
              pieces.push(tNodes[i].textContent || "");
            }
            let rawText = pieces.join("").trim();
            rawText = rawText.replace(/\bEMBED\s+Equation(?:\.DSMT4|\.3|\.2|\b[^\s<"]*)/gi, '[CÔNG_THỨC_TOÁN: MathType]');
            rawText = rawText.replace(/\bEquation\.DSMT4\b/gi, '[CÔNG_THỨC_TOÁN: MathType]');
            return rawText;
          };

          // Helper duyệt qua các con của body hoặc sub-container
          const traverseXmlNode = (node: Element): string => {
            let buffer = "";
            const children = Array.from(node.children);

            for (const child of children) {
              const nodeName = child.nodeName.toLowerCase();

              if (nodeName === "w:tbl" || nodeName.endsWith(":tbl") || child.localName === "tbl") {
                // Xử lý bảng <w:tbl>
                let tblStr = "\n--- BẢNG PHỤ LỤC / PHÂN PHỐI CHƯƠNG TRÌNH ---\n";
                let hasRowData = false;

                // Lấy tất cả hàng <w:tr>
                const rows = Array.from(child.getElementsByTagName("w:tr"));
                // Lọc chỉ lấy rows là con trực tiếp hoặc cấp 1 của bảng này (tránh đè bởi nested table nếu có)
                for (const row of rows) {
                  // Lấy các ô <w:tc>
                  const cells = Array.from(row.getElementsByTagName("w:tc"));
                  const cellTexts: string[] = [];

                  for (const cell of cells) {
                    // Nếu ô là ô con trực tiếp của row
                    const cellPText: string[] = [];
                    const pElements = Array.from(cell.getElementsByTagName("w:p"));
                    for (const p of pElements) {
                      const pTxt = getNodeText(p);
                      if (pTxt) cellPText.push(pTxt);
                    }
                    // Nếu không tìm thấy w:p thì lấy text chung của cell
                    const cellVal = cellPText.length > 0 ? cellPText.join(" ") : getNodeText(cell);
                    cellTexts.push(cellVal.replace(/\s+/g, " ").trim());
                  }

                  if (cellTexts.some(c => c.length > 0)) {
                    tblStr += cellTexts.join(" | ") + "\n";
                    hasRowData = true;
                  }
                }

                if (hasRowData) {
                  buffer += tblStr + "\n";
                }
              } else if (nodeName === "w:p" || nodeName.endsWith(":p") || child.localName === "p") {
                const pText = getNodeText(child);
                if (pText) {
                  buffer += pText + "\n";
                }
              } else if (child.children.length > 0) {
                buffer += traverseXmlNode(child);
              }
            }
            return buffer;
          };

          const bodyEl = xmlDoc.getElementsByTagName("w:body")[0] || xmlDoc.documentElement;
          if (bodyEl) {
            sectionText = traverseXmlNode(bodyEl);
          }
        } catch (domErr) {
          console.warn("DOMParser XML failed, falling back to regex parser:", domErr);
        }

        // 2. Fallback nếu DOMParser không ra kết quả: Dùng Regex phân tích
        if (!sectionText.trim()) {
          // Trích xuất tất cả các bảng <w:tbl> trong XML bằng Regex
          const tableRegex = /<w:tbl\b[\s\S]*?<\/w:tbl>/gi;
          let tblMatch;
          let lastIndex = 0;

          while ((tblMatch = tableRegex.exec(xml)) !== null) {
            const beforeTableXml = xml.substring(lastIndex, tblMatch.index);
            const pMatches = beforeTableXml.match(/<w:p\b[\s\S]*?<\/w:p>/gi) || [];
            for (const pXml of pMatches) {
              const tMatches = pXml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
              const pText = tMatches.map(t => t.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')).join('').trim();
              if (pText.length > 0) {
                sectionText += pText + '\n';
              }
            }

            const tblXml = tblMatch[0];
            const trMatches = tblXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/gi) || [];
            let tableBuffer = '\n--- BẢNG PHỤ LỤC / PHÂN PHỐI CHƯƠNG TRÌNH ---\n';
            let hasRows = false;

            for (const trXml of trMatches) {
              const tcMatches = trXml.match(/<w:tc\b[\s\S]*?<\/w:tc>/gi) || [];
              const cellTexts: string[] = [];

              for (const tcXml of tcMatches) {
                const tMatches = tcXml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
                let cellContent = tMatches
                  .map(t => t.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'))
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                cellTexts.push(cellContent);
              }

              if (cellTexts.some(c => c.length > 0)) {
                tableBuffer += cellTexts.join(' | ') + '\n';
                hasRows = true;
              }
            }

            if (hasRows) {
              sectionText += tableBuffer + '\n';
            }

            lastIndex = tblMatch.index + tblMatch[0].length;
          }

          const afterLastTableXml = xml.substring(lastIndex);
          const remainingPMatches = afterLastTableXml.match(/<w:p\b[\s\S]*?<\/w:p>/gi) || [];
          for (const pXml of remainingPMatches) {
            const tMatches = pXml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
            const pText = tMatches.map(t => t.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')).join('').trim();
            if (pText.length > 0) {
              sectionText += pText + '\n';
            }
          }
        }

        // 3. Fallback tối thượng: Lấy toàn bộ văn bản từ thẻ <w:t>
        if (!sectionText.trim()) {
          const allTMatches = xml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
          sectionText = allTMatches.map(t => t.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')).join(' ');
        }

        if (sectionText.trim()) {
          combinedText += sectionText + '\n\n';
        }
      }

      return combinedText.trim();
    } catch (e) {
      console.warn("Direct XML extraction error:", e);
      return "";
    }
  };

  // Trích xuất chuyên sâu cho Phụ lục 1 / Phụ lục 3 từ tệp Word .docx
  const extractDistributionFromDOCX = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    let result = "";

    // 1. Thử qua Mammoth HTML (bảo toàn cấu trúc bảng HTML)
    if (typeof mammoth !== 'undefined') {
      try {
        const mammothResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer.slice(0) });
        if (mammothResult && mammothResult.value) {
          const structured = htmlToStructuredText(mammothResult.value);
          if (structured && structured.trim().length > 30) {
            result = structured;
          }
        }
      } catch (mErr) {
        console.warn("Mammoth HTML conversion error for dist file:", mErr);
      }
    }

    // 2. Thử qua Trích xuất XML trực tiếp (đặc biệt tốt cho tệp bảng có nhiều cột, text box, hoặc nested cell)
    try {
      const xmlExtracted = await extractDirectXmlFromDocx(arrayBuffer.slice(0));
      // Ưu tiên bản trích xuất nào chứa nhiều thông tin hơn hoặc cấu trúc đầy đủ hơn
      if (xmlExtracted && (xmlExtracted.trim().length > result.trim().length || !result.trim())) {
        result = xmlExtracted;
      }
    } catch (xErr) {
      console.warn("XML direct extraction error for dist file:", xErr);
    }

    // 3. Fallback qua Mammoth Raw Text
    if (!result.trim() && typeof mammoth !== 'undefined') {
      try {
        const rawResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer.slice(0) });
        if (rawResult && rawResult.value) {
          result = rawResult.value.trim();
        }
      } catch (rErr) {
        console.warn("Mammoth Raw Text error:", rErr);
      }
    }

    return result.trim();
  };

  // Trích xuất file .doc xuất từ phần mềm vnEdu / SMAS / HTML / RTF / Binary
  const extractFromDocOrHtml = async (file: File, arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      // 1. Kiểm tra nếu là file zip docx nhưng bị đổi đuôi sang .doc
      const headerBytes = new Uint8Array(arrayBuffer.slice(0, 4));
      if (headerBytes[0] === 0x50 && headerBytes[1] === 0x4B && headerBytes[2] === 0x03 && headerBytes[3] === 0x04) {
        try {
          const docxText = await extractDistributionFromDOCX(arrayBuffer);
          if (docxText && docxText.trim().length > 20) {
            return docxText;
          }
        } catch (e) {
          // Tiếp tục thử các phương pháp khác
        }
      }

      // 2. Thử đọc dưới dạng văn bản (HTML / RTF)
      const textSample = await file.slice(0, 4000).text();
      
      // Nếu là tệp HTML xuất từ vnEdu/SMAS mang đuôi .doc
      if (textSample.includes('<html') || textSample.includes('<table') || textSample.includes('xmlns:w') || textSample.includes('<!DOCTYPE') || textSample.includes('<body')) {
        const fullHtml = await file.text();
        const extracted = htmlToStructuredText(fullHtml);
        if (extracted.trim().length > 20) {
          return extracted;
        }
      }

      // Nếu là tệp RTF
      if (textSample.startsWith('{\\rtf')) {
        const fullRtf = await file.text();
        const cleanRtf = fullRtf
          .replace(/\\par[d]?/g, '\n')
          .replace(/\\tab/g, ' | ')
          .replace(/\\cell/g, ' | ')
          .replace(/\\row/g, '\n')
          // Chỉ xóa các thẻ cấu trúc / bảng font / màu của RTF, KHÔNG xóa cú pháp công thức \frac, \sqrt, \cdot, {}
          .replace(/\\(?:fonttbl|colortbl|stylesheet|info|header|footer)[^}]*}/gi, '')
          .replace(/\\(?:f\d+|fs\d+|cf\d+|cb\d+|b\d*|i\d*|ul\d*|strike\d*|qc|ql|qr|qj|marg[ltrb]\d+)\b/gi, '')
          .trim();
        if (cleanRtf.length > 20) return cleanRtf;
      }

      // 3. Giải mã nhị phân Word 97-2003 OLE2
      const uint8 = new Uint8Array(arrayBuffer);
      let text = '';
      for (let i = 0; i < uint8.length - 1; i += 2) {
        const code = uint8[i] | (uint8[i + 1] << 8);
        if ((code >= 32 && code <= 126) || (code >= 0x00C0 && code <= 0x1EF9) || code === 10 || code === 13) {
          text += String.fromCharCode(code);
        } else if (text.endsWith(' ') || text.endsWith('\n')) {
          // skip
        } else {
          text += ' ';
        }
      }
      const clean = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
      return clean.length > 30 ? clean : "";
    } catch (e) {
      console.error("Error reading .doc", e);
      return "";
    }
  };

  // Helper: Chuyển đổi Office Math Markup Language (OMML) của Word sang mã chuẩn LaTeX
  const ommlToLatex = (ommlXml: string): string => {
    if (!ommlXml) return '';

    const cleanMathText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/≤/g, ' \\le ')
        .replace(/≥/g, ' \\ge ')
        .replace(/≠/g, ' \\neq ')
        .replace(/≈/g, ' \\approx ')
        .replace(/±/g, ' \\pm ')
        .replace(/×/g, ' \\times ')
        .replace(/÷/g, ' \\div ')
        .replace(/·/g, ' \\cdot ');
    };

    const parseNode = (xml: string): string => {
      if (!xml) return '';
      let res = '';
      let pos = 0;

      while (pos < xml.length) {
        const tagMatch = xml.slice(pos).match(/<m:([a-zA-Z0-9]+)([^>]*)>([\s\S]*?)<\/m:\1>|<m:([a-zA-Z0-9]+)([^>]*)\/>/);
        if (!tagMatch) {
          const plainText = xml.slice(pos).replace(/<[^>]+>/g, '');
          res += cleanMathText(plainText);
          break;
        }

        const matchIndex = tagMatch.index || 0;
        if (matchIndex > 0) {
          const textBefore = xml.slice(pos, pos + matchIndex).replace(/<[^>]+>/g, '');
          res += cleanMathText(textBefore);
        }

        const tagName = tagMatch[1] || tagMatch[4];
        const tagBody = tagMatch[3] || '';
        pos += matchIndex + tagMatch[0].length;

        switch (tagName) {
          case 'f': { // Phân số \frac{tử}{mẫu}
            const numMatch = tagBody.match(/<m:num>([\s\S]*?)<\/m:num>/);
            const denMatch = tagBody.match(/<m:den>([\s\S]*?)<\/m:den>/);
            const num = numMatch ? parseNode(numMatch[1]).trim() : '';
            const den = denMatch ? parseNode(denMatch[1]).trim() : '';
            res += `\\frac{${num}}{${den}}`;
            break;
          }
          case 'sSup': { // Số mũ / Luỹ thừa
            const eMatch = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/);
            const supMatch = tagBody.match(/<m:sup>([\s\S]*?)<\/m:sup>/);
            const e = eMatch ? parseNode(eMatch[1]).trim() : '';
            const sup = supMatch ? parseNode(supMatch[1]).trim() : '';
            res += `{${e}}^{${sup}}`;
            break;
          }
          case 'sSub': { // Chỉ số dưới
            const eMatch = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/);
            const subMatch = tagBody.match(/<m:sub>([\s\S]*?)<\/m:sub>/);
            const e = eMatch ? parseNode(eMatch[1]).trim() : '';
            const sub = subMatch ? parseNode(subMatch[1]).trim() : '';
            res += `{${e}}_{${sub}}`;
            break;
          }
          case 'sSubSup': { // Cả chỉ số dưới và trên
            const eMatch = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/);
            const subMatch = tagBody.match(/<m:sub>([\s\S]*?)<\/m:sub>/);
            const supMatch = tagBody.match(/<m:sup>([\s\S]*?)<\/m:sup>/);
            const e = eMatch ? parseNode(eMatch[1]).trim() : '';
            const sub = subMatch ? parseNode(subMatch[1]).trim() : '';
            const sup = supMatch ? parseNode(supMatch[1]).trim() : '';
            res += `{${e}}_{${sub}}^{${sup}}`;
            break;
          }
          case 'rad': { // Căn bậc n / Căn bậc 2
            const degMatch = tagBody.match(/<m:deg>([\s\S]*?)<\/m:deg>/);
            const eMatch = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/);
            const deg = degMatch ? parseNode(degMatch[1]).trim() : '';
            const e = eMatch ? parseNode(eMatch[1]).trim() : '';
            res += deg ? `\\sqrt[${deg}]{${e}}` : `\\sqrt{${e}}`;
            break;
          }
          case 'd': { // Dấu ngoặc / Dấu giá trị tuyệt đối
            const begChrMatch = tagBody.match(/<m:begChr[^>]*m:val="([^"]*)"/);
            const endChrMatch = tagBody.match(/<m:endChr[^>]*m:val="([^"]*)"/);
            const beg = begChrMatch ? begChrMatch[1] : '(';
            const end = endChrMatch ? endChrMatch[1] : ')';
            const eMatch = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/);
            const content = eMatch ? parseNode(eMatch[1]).trim() : '';
            
            let leftDelim = beg === '{' ? '\\{' : (beg === '' ? '.' : beg);
            let rightDelim = end === '}' ? '\\}' : (end === '' ? '.' : end);
            res += `\\left${leftDelim} ${content} \\right${rightDelim}`;
            break;
          }
          case 'nary': { // Tích phân, Tổng sigma
            const chrMatch = tagBody.match(/<m:chr[^>]*m:val="([^"]*)"/);
            const chr = chrMatch ? chrMatch[1] : '∑';
            const subMatch = tagBody.match(/<m:sub>([\s\S]*?)<\/m:sub>/);
            const supMatch = tagBody.match(/<m:sup>([\s\S]*?)<\/m:sup>/);
            const eMatch = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/);
            const sub = subMatch ? parseNode(subMatch[1]).trim() : '';
            const sup = supMatch ? parseNode(supMatch[1]).trim() : '';
            const e = eMatch ? parseNode(eMatch[1]).trim() : '';
            
            let op = '\\sum';
            if (chr === '∫') op = '\\int';
            else if (chr === '∏') op = '\\prod';
            
            let limits = '';
            if (sub) limits += `_{${sub}}`;
            if (sup) limits += `^{${sup}}`;
            res += `${op}${limits} ${e}`;
            break;
          }
          case 'func': { // Hàm lượng giác, logarit, giới hạn
            const fNameMatch = tagBody.match(/<m:fName>([\s\S]*?)<\/m:fName>/);
            const eMatch = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/);
            const fName = fNameMatch ? parseNode(fNameMatch[1]).trim() : '';
            const e = eMatch ? parseNode(eMatch[1]).trim() : '';
            res += `\\${fName}(${e})`;
            break;
          }
          case 'bar': { // Gạch ngang trên đầu
            const eMatch = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/);
            const e = eMatch ? parseNode(eMatch[1]).trim() : '';
            res += `\\overline{${e}}`;
            break;
          }
          case 'acc': { // Dấu mũ góc, véc tơ
            const chrMatch = tagBody.match(/<m:chr[^>]*m:val="([^"]*)"/);
            const chr = chrMatch ? chrMatch[1] : '^';
            const eMatch = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/);
            const e = eMatch ? parseNode(eMatch[1]).trim() : '';
            if (chr === '^' || chr === '̂') res += `\\widehat{${e}}`;
            else if (chr === '→' || chr === '⃗') res += `\\vec{${e}}`;
            else res += `\\bar{${e}}`;
            break;
          }
          case 'eqArr': { // Hệ phương trình
            const eMatches = tagBody.match(/<m:e>([\s\S]*?)<\/m:e>/g) || [];
            const rows = eMatches.map(m => parseNode(m.replace(/<\/?m:e>/g, '')).trim());
            res += `\\begin{cases} ${rows.join(' \\\\ ')} \\end{cases}`;
            break;
          }
          case 't': { // Text
            res += cleanMathText(tagBody);
            break;
          }
          default: {
            res += parseNode(tagBody);
            break;
          }
        }
      }

      return res;
    };

    let latex = parseNode(ommlXml).trim();
    latex = latex.replace(/\s+/g, ' ').trim();
    return latex ? `$${latex}$` : '';
  };

  const preprocessDOCXMath = async (arrayBuffer: ArrayBuffer): Promise<{ processedBuffer: ArrayBuffer; mathMediaFiles: Set<string> }> => {
    const mathMediaFiles = new Set<string>();
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXmlFile = zip.file("word/document.xml");
      if (!docXmlFile) return { processedBuffer: arrayBuffer, mathMediaFiles };

      let xml = await docXmlFile.async("string");

      // 1. Phân tích word/_rels/document.xml.rels để xác định các file media của MathType / OLE
      const relsFile = zip.file("word/_rels/document.xml.rels");
      const rIdToTarget: Record<string, string> = {};
      if (relsFile) {
        const relsXml = await relsFile.async("string");
        const relMatches = relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*>/gi);
        for (const rm of relMatches) {
          const rId = rm[1];
          const target = rm[2].replace(/^media\//, '').replace(/^word\/media\//, '');
          rIdToTarget[rId] = target;
        }
      }

      // Tìm tất cả các khối <w:object> hoặc <w:pict> chứa MathType / Equation OLE
      const objectRegex = /<w:object[^>]*>([\s\S]*?)<\/w:object>/gi;
      let objMatch;
      while ((objMatch = objectRegex.exec(xml)) !== null) {
        const objContent = objMatch[1];
        const isMathType = /Equation|DSMT4|oleObject/i.test(objContent);
        if (isMathType) {
          // Trích xuất các rId ảnh preview của công thức toán này
          const rIdMatches = objContent.matchAll(/r:id="([^"]+)"/gi);
          for (const rm of rIdMatches) {
            const rId = rm[1];
            if (rIdToTarget[rId]) {
              mathMediaFiles.add(rIdToTarget[rId]);
            }
          }
        }
      }

      // Helper: Thoát các ký tự XML bắt buộc để tệp XML không bao giờ bị hỏng khi Mammoth đọc
      const xmlEscape = (str: string): string => {
        if (!str) return '';
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };

      // 2. Phân giải toàn bộ OMML math blocks (<m:oMathPara> và <m:oMath>) trực tiếp sang chuẩn LaTeX $...$
      xml = xml.replace(/<m:oMathPara[^>]*>([\s\S]*?)<\/m:oMathPara>/g, (match) => {
        const latex = ommlToLatex(match);
        if (!latex) return '';
        const safeXml = xmlEscape(latex);
        return `<w:r><w:t xml:space="preserve"> ${safeXml} </w:t></w:r>`;
      });
      xml = xml.replace(/<m:oMath[^>]*>([\s\S]*?)<\/m:oMath>/g, (match) => {
        const latex = ommlToLatex(match);
        if (!latex) return '';
        const safeXml = xmlEscape(latex);
        return `<w:r><w:t xml:space="preserve"> ${safeXml} </w:t></w:r>`;
      });

      // 3. Xóa bỏ hoàn toàn thẻ ảnh preview của MathType OLE trong document.xml để Mammoth KHÔNG sinh ra thẻ <img> cho công thức toán
      xml = xml.replace(/<w:object[^>]*>[\s\S]*?<\/w:object>/gi, (match) => {
        if (/Equation|DSMT4|oleObject/i.test(match)) {
          // Bỏ hẳn ảnh chụp công thức toán, không để Mammoth chuyển thành ảnh
          return `<w:r><w:t xml:space="preserve"> </w:t></w:r>`;
        }
        return match;
      });

      // 4. Làm sạch các trường MathType OLE text thô để không bị rò rỉ mã lệnh
      xml = xml.replace(/<w:instrText[^>]*>\s*EMBED\s+Equation[^\s<]*\s*<\/w:instrText>/gi, () => {
        return `<w:t xml:space="preserve"> </w:t>`;
      });
      xml = xml.replace(/<w:fldSimple[^>]*w:instr="[^"]*Equation[^"]*"[^>]*>[\s\S]*?<\/w:fldSimple>/gi, () => {
        return `<w:r><w:t xml:space="preserve"> </w:t></w:r>`;
      });
      xml = xml.replace(/\bEMBED\s+Equation(?:\.DSMT4|\.3|\.2|\b[^\s<"]*)/gi, ' ');
      xml = xml.replace(/\bEquation\.DSMT4\b/gi, ' ');

      zip.file("word/document.xml", xml);
      const processedBuffer = await zip.generateAsync({ type: "arraybuffer" });
      return { processedBuffer, mathMediaFiles };
    } catch (e) {
      console.error("Error preprocessing DOCX math:", e);
      return { processedBuffer: arrayBuffer, mathMediaFiles };
    }
  };

  const extractTextFromDOCX = async (arrayBuffer: ArrayBuffer, shouldClearCache: boolean): Promise<string> => {
    if (typeof mammoth === 'undefined') return "";
    try {
        if (shouldClearCache) {
            clearImageCache();
        }

        // 1. Tiền xử lý DOCX để chuyển công thức OMML sang LaTeX và tìm danh sách ảnh công thức toán MathType
        const { processedBuffer, mathMediaFiles } = await preprocessDOCXMath(arrayBuffer);

        // 2. Trích xuất media từ thư mục word/media/ của tệp zip, LOẠI BỎ TRIỆT ĐỂ ẢNH CÔNG THỨC TOÁN
        const zip = await JSZip.loadAsync(arrayBuffer.slice(0));
        const mediaFiles = zip.file(/^word\/media\//);
        const zipImages: { name: string; dataUrl: string; width: number; height: number }[] = [];
        
        for (const mFile of mediaFiles) {
            const mName = mFile.name.split('/').pop() || '';
            const mExt = mName.split('.').pop()?.toLowerCase();
            
            // BỎ QUA 100% các tệp WMF, EMF (đây là ảnh snapshot của MathType / vector OLE, không phải ảnh học liệu)
            if (mExt === 'wmf' || mExt === 'emf') {
                continue;
            }

            // BỎ QUA nếu file nằm trong danh sách ảnh MathType OLE đã xác định
            if (mathMediaFiles.has(mName) || mathMediaFiles.has(mFile.name)) {
                continue;
            }

            // Chỉ chấp nhận các định dạng ảnh chụp/tranh vẽ học liệu thực sự
            if (['png', 'jpeg', 'jpg', 'gif', 'bmp', 'webp'].includes(mExt || '')) {
                const mime = mExt === 'png' ? 'image/png' : (mExt === 'gif' ? 'image/gif' : (mExt === 'webp' ? 'image/webp' : 'image/jpeg'));
                const b64 = await mFile.async("base64");
                const dataUrl = `data:${mime};base64,${b64}`;
                zipImages.push({ name: mName, dataUrl, width: 260, height: 180 });
            }
        }

        // 3. Chuyển đổi DOCX sang HTML với Mammoth
        const mammothOptions = {
            convertImage: (mammoth as any).images ? (mammoth as any).images.imgElement(function(element: any) {
                return element.read("base64").then(function(imageBuffer: string) {
                    return {
                        src: "data:" + (element.contentType || "image/png") + ";base64," + imageBuffer
                    };
                });
            }) : undefined
        };

        const result = await mammoth.convertToHtml({ arrayBuffer: processedBuffer }, mammothOptions);
        let html = result.value || "";

        const rawImgRegex = /<img[^>]*?src=["'](data:image\/[^"']+)["'][^>]*?>/gi;
        const imgMatches: { fullTag: string; dataUrl: string }[] = [];
        let mMatch;
        while ((mMatch = rawImgRegex.exec(html)) !== null) {
            const fullTag = mMatch[0];
            const dataUrl = mMatch[1];
            imgMatches.push({ fullTag, dataUrl });
        }

        let realImageCounter = 0;

        for (const rep of imgMatches) {
            if (!rep.dataUrl || typeof rep.dataUrl !== 'string' || rep.dataUrl.trim() === '') {
                html = html.replace(rep.fullTag, '');
                continue;
            }

            try {
                const img = new Image();
                img.src = rep.dataUrl;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });

                const originalWidth = img.naturalWidth || 0;
                const originalHeight = img.naturalHeight || 0;

                // 🚨 BỘ LỌC CÔNG THỨC TOÁN & ICON RÁC:
                // Các ảnh chụp phân số / công thức MathType thường có chiều cao <= 54px hoặc kích thước quá nhỏ < 60x55
                const isMathFormulaOrIcon = (originalHeight > 0 && originalHeight < 55) || (originalWidth > 0 && originalHeight > 0 && originalWidth < 60 && originalHeight < 60);

                if (isMathFormulaOrIcon) {
                    // TUYỆT ĐỐI KHÔNG GÁN [HINHANHGOC_X] cho công thức toán hay icon nhỏ, chỉ thay bằng khoảng trắng
                    html = html.replace(rep.fullTag, ' ');
                    continue;
                }

                // ĐÂY LÀ HÌNH ẢNH HỌC LIỆU THỰC SỰ (Tranh vẽ SGK, Khinh khí cầu, Hình học phẳng/không gian, Đồ thị, Thí nghiệm...)
                realImageCounter++;
                const cleanId = `HINHANHGOC_${realImageCounter}`;
                const replacementTag = `[${cleanId}]`;

                let finalDataUrl = rep.dataUrl;
                let targetW = originalWidth || 260;
                let targetH = originalHeight || 180;

                const maxRenderWidth = 260;
                let renderWidth = maxRenderWidth;
                let renderHeight = targetH * (maxRenderWidth / (targetW || 1));
                if (isNaN(renderHeight) || renderHeight <= 0) renderHeight = 180;

                const cachedObj = {
                    id: cleanId,
                    dataUrl: finalDataUrl,
                    width: renderWidth,
                    height: renderHeight,
                    isMathFormula: false,
                    originalWidth: targetW,
                    originalHeight: targetH
                };

                imageCache[cleanId] = cachedObj;
                imageCache[`HINHANHGOC${realImageCounter}`] = cachedObj;
                imageCache[`HINH_ANH_GOC_${realImageCounter}`] = cachedObj;
                imageCache[`HINH_ANH_GOC${realImageCounter}`] = cachedObj;
                imageCache[`HINH_VE_GOC_${realImageCounter}`] = cachedObj;
                imageCache[`HINH_VE_GOC${realImageCounter}`] = cachedObj;
                imageCache[`HÌNH_VẼ_GỐC_${realImageCounter}`] = cachedObj;
                imageCache[`HÌNH_VẼ_GỐC${realImageCounter}`] = cachedObj;
                imageCache[`HÌNH VẼ GỐC ${realImageCounter}`] = cachedObj;
                imageCache[`HÌNH_ẢNH_GỐC_${realImageCounter}`] = cachedObj;
                imageCache[`HÌNH_ẢNH_GỐC${realImageCounter}`] = cachedObj;
                imageCache[`HÌNH ẢNH GỐC ${realImageCounter}`] = cachedObj;
                imageCache[`IMG${realImageCounter}`] = cachedObj;
                imageCache[`IMG_${realImageCounter}`] = cachedObj;
                imageCache[`HINH_${realImageCounter}`] = cachedObj;
                imageCache[`HINH${realImageCounter}`] = cachedObj;
                imageCache[`${realImageCounter}`] = cachedObj;

                if (typeof window !== 'undefined') {
                    window.__globalImageCache = window.__globalImageCache || {};
                    window.__globalImageCache[cleanId] = cachedObj;
                    window.__globalImageCache[`HINHANHGOC_${realImageCounter}`] = cachedObj;
                    window.__globalImageCache[`HÌNH VẼ GỐC ${realImageCounter}`] = cachedObj;
                    window.__globalImageCache[`${realImageCounter}`] = cachedObj;
                }

                html = html.replace(rep.fullTag, `\n\n${replacementTag}\n\n`);
            } catch(e) {
                console.warn("Lỗi xử lý hình ảnh:", e);
                html = html.replace(rep.fullTag, '');
            }
        }

        // Bổ sung: Nếu Mammoth không nhận diện được thẻ <img> trong HTML nhưng trong zip có ảnh học liệu thật sự
        if (realImageCounter === 0 && zipImages.length > 0) {
            for (let i = 0; i < zipImages.length; i++) {
                const zImg = zipImages[i];
                const imgNum = i + 1;
                const cleanId = `HINHANHGOC_${imgNum}`;
                const cachedObj = {
                    id: cleanId,
                    dataUrl: zImg.dataUrl,
                    width: 260,
                    height: 180,
                    isMathFormula: false
                };
                imageCache[cleanId] = cachedObj;
                imageCache[`HINHANHGOC${imgNum}`] = cachedObj;
                imageCache[`HINH_ANH_GOC_${imgNum}`] = cachedObj;
                imageCache[`IMG${imgNum}`] = cachedObj;
                if (typeof window !== 'undefined') {
                    window.__globalImageCache = window.__globalImageCache || {};
                    window.__globalImageCache[cleanId] = cachedObj;
                    window.__globalImageCache[`HINHANHGOC_${imgNum}`] = cachedObj;
                }
            }
            html += `\n\n[HINHANHGOC_1]\n\n`;
        }

        return html;
    } catch (e) {
        console.error("Mammoth error", e);
        return "";
    }
  };

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    if (typeof pdfjsLib === 'undefined') return "";
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }
    return fullText;
  };

  const processFile = async (file: File, type: 'lesson' | 'dist' | 'ai') => {
    const setProcessing = type === 'lesson' ? setProcessingLesson : setProcessingDist;
    const setContent = type === 'lesson' ? setLessonContent : setDistributionContent;
    const setFileName = type === 'lesson' ? setLessonFileName : setDistFileName;

    setProcessing(true);
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = "";
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (file.type.startsWith("image/") || ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].includes(ext)) {
        // Hỗ trợ tải trực tiếp tệp ảnh gốc
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const cachedObj = {
          id: 'HINHANHGOC_1',
          dataUrl: b64,
          width: 260,
          height: 180,
          isMathFormula: false
        };
        imageCache['HINHANHGOC_1'] = cachedObj;
        imageCache['HINHANHGOC1'] = cachedObj;
        imageCache['HINH_ANH_GOC_1'] = cachedObj;
        imageCache['HINH_ANH_GOC1'] = cachedObj;
        imageCache['HINH_VE_GOC_1'] = cachedObj;
        imageCache['IMG1'] = cachedObj;
        imageCache['1'] = cachedObj;
        if (typeof window !== 'undefined' && window.__globalImageCache) {
          window.__globalImageCache['HINHANHGOC_1'] = cachedObj;
          window.__globalImageCache['1'] = cachedObj;
        }
        text = `[HINHANHGOC_1]\n\n(Hình ảnh học liệu gốc: ${file.name})`;
      } else if (file.type === "application/pdf" || ext === "pdf") {
        text = await extractTextFromPDF(arrayBuffer);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        ext === "docx"
      ) {
        if (type === 'dist') {
          // Trích xuất Phụ lục 1 / Phụ lục 3 với cơ chế 3 tầng chuyên sâu
          text = await extractDistributionFromDOCX(arrayBuffer);
        } else {
          // Đối với Giáo án, dùng Mammoth để bảo toàn hình ảnh và công thức
          text = await extractTextFromDOCX(arrayBuffer.slice(0), true);
          if (!text.trim()) {
            text = await extractDirectXmlFromDocx(arrayBuffer.slice(0));
          }
        }
      } else if (ext === "xlsx" || ext === "xls" || ext === "csv" || ext === "tsv" || ext === "ods") {
        text = await extractTextFromXLSX(file);
      } else if (ext === "txt") {
        text = await file.text();
      } else if (ext === "doc") {
        text = await extractFromDocOrHtml(file, arrayBuffer);
        if (!text.trim()) {
          // Thử trích xuất theo DOCX nếu tệp thực chất là XML/ZIP
          text = await extractDistributionFromDOCX(arrayBuffer);
        }
        if (!text.trim()) {
          alert("Tệp định dạng .doc cũ (Word 97-2003) không thể giải mã trực tiếp. Thầy/Cô vui lòng mở tệp trong Word và chọn 'Save As' sang định dạng .docx hoặc nhấn nút 'Dán nội dung' để dán bảng trực tiếp.");
          setFileName(null);
          setProcessing(false);
          return;
        }
      } else {
        // Thử tất cả các bộ giải mã thông minh theo nội dung tệp
        try {
          text = await extractDistributionFromDOCX(arrayBuffer);
        } catch (e) {
          text = "";
        }
        if (!text.trim()) {
          try {
            text = await extractFromDocOrHtml(file, arrayBuffer);
          } catch (e) {
            text = "";
          }
        }
        if (!text.trim()) {
          try {
            text = await extractTextFromXLSX(file);
          } catch (e) {
            text = "";
          }
        }
      }

      if (!text || !text.trim()) {
        alert(type === 'lesson' 
          ? "Không thể đọc được nội dung văn bản từ file giáo án. Có thể file chứa toàn bộ ảnh chụp scan?" 
          : "Không thể đọc được nội dung từ file Phụ lục 1 / Phụ lục 3. Thầy/Cô có thể mở tệp và nhấn nút 'Dán nội dung' để dán bảng trực tiếp."
        );
        setFileName(null);
        setContent("");
      } else {
        setContent(text);
      }

    } catch (error) {
      console.error("Error processing file:", error);
      alert("Có lỗi xảy ra khi đọc file. Thầy/Cô có thể sao chép văn bản và chọn 'Dán nội dung'.");
      setFileName(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'lesson'|'dist'|'ai') => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, type);
    }
    e.target.value = '';
  };

  const handleDropFile = (file: File, type: 'lesson' | 'dist' | 'ai') => {
    processFile(file, type);
  };

  const handleSavePastedText = () => {
    if (!pasteModal) return;
    const text = pasteModal.text.trim();
    if (!text) {
      alert("Vui lòng nhập hoặc dán nội dung văn bản.");
      return;
    }
    if (pasteModal.type === 'lesson') {
      setLessonContent(text);
      setLessonFileName("Văn bản dán trực tiếp (Giáo án)");
    } else {
      setDistributionContent(text);
      setDistFileName("Văn bản dán trực tiếp (Phụ lục/PPCT)");
    }
    setPasteModal(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
            03
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">
              {mode === 'full' ? 'Tài liệu Kế hoạch bài dạy đầu vào' : 'Tài liệu tích hợp bổ sung'}
            </h2>
            <p className="text-[11px] text-slate-500">Nạp file giáo án Word (.docx), Excel (.xlsx), PDF hoặc bảng phân phối</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-slate-200/70 text-slate-700 hidden sm:inline-block">
          Khuyến nghị: 1 bài (1 - 3 tiết)
        </span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ô Upload Giáo án */}
          {mode === 'full' && (
          <div className="flex flex-col h-full">
              <UploadBox 
                  title="Tải lên Giáo án gốc" 
                  subTitle="Hỗ trợ file Word (.docx) hoặc PDF dạng văn bản." 
                  inputRef={lessonInputRef}
                  fileName={lessonFileName}
                  isProcessing={processingLesson}
                  isLesson={true}
                  hasContent={!!lessonContent}
                  content={lessonContent}
                  onFileChange={handleFileChange}
                  onDropFile={handleDropFile}
                  onClear={() => {
                    setLessonContent('');
                    setLessonFileName(null);
                  }}
                  onPreview={() => {
                    setPreviewContent({
                      title: `Nội dung Giáo án: ${lessonFileName || 'Tệp giáo án'}`,
                      text: lessonContent
                    });
                  }}
                  onOpenPasteModal={() => {
                    setPasteModal({
                      isOpen: true,
                      type: 'lesson',
                      text: lessonContent || ''
                    });
                  }}
                  type="lesson"
              />
               {!lessonContent && (
                  <div className="flex items-center justify-center mt-2.5 text-rose-600 text-xs font-semibold">
                      <AlertTriangle size={13} className="mr-1.5 shrink-0"/>
                      <span>Vui lòng tải tệp giáo án để xử lý</span>
                  </div>
              )}
          </div>
          )}

          {/* Ô Upload Phụ lục 1 / PPCT */}
          {(integrateNLS || integrateAI) && (
              <div className="flex flex-col h-full">
                  <UploadBox 
                      title="Tải lên Phụ lục 1 / Phụ lục 3 (Khung KHDH & PPCT)" 
                      subTitle="Hỗ trợ đầy đủ Phụ lục 1 (Tổ chuyên môn), Phụ lục 3 (Giáo viên): Word (.docx, .doc), Excel (.xlsx, .xls), PDF hoặc dán trực tiếp." 
                      inputRef={distInputRef}
                      fileName={distFileName}
                      isProcessing={processingDist}
                      isLesson={false}
                      hasContent={!!distributionContent}
                      content={distributionContent}
                      onFileChange={handleFileChange}
                      onDropFile={handleDropFile}
                      onClear={() => {
                        setDistributionContent('');
                        setDistFileName(null);
                      }}
                      onPreview={() => {
                        setPreviewContent({
                          title: `Nội dung Phụ lục 1 / Phụ lục 3: ${distFileName || 'Tệp KHDH / PPCT'}`,
                          text: distributionContent
                        });
                      }}
                      onOpenPasteModal={() => {
                        setPasteModal({
                          isOpen: true,
                          type: 'dist',
                          text: distributionContent || ''
                        });
                      }}
                      type="dist"
                  />
                  <div className="mt-2.5 text-slate-500 text-[11px] leading-relaxed bg-blue-50/60 border border-blue-100 rounded-lg p-2.5">
                    <span className="font-semibold text-blue-950">💡 Hướng dẫn nạp Phụ lục: </span>
                    Thầy/Cô có thể nạp <strong>Phụ lục 1</strong> (Kế hoạch dạy học của Tổ chuyên môn) hoặc <strong>Phụ lục 3</strong> (Kế hoạch giáo dục của Giáo viên). Hệ thống sẽ tự động bóc tách đúng bài dạy, số tiết, YCCĐ và đối chiếu Năng lực số / AI tương ứng.
                  </div>
              </div>
          )}
        </div>

        {/* Khuyến nghị sư phạm */}
        {mode === 'full' && (
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-600">
            <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 font-bold mt-0.5">
               i
            </div>
            <div className="leading-relaxed">
               <strong>Khuyến nghị sư phạm: </strong>
               Nên tải lên từng bài dạy (1 - 3 tiết) để văn bản đầu ra đạt độ chi tiết cao nhất, bảng biểu chuẩn xác và bảo toàn 100% định dạng đồ họa, hình ảnh.
            </div>
        </div>
        )}

        {/* Modal Dán văn bản/bảng trực tiếp */}
        {pasteModal && pasteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 bg-blue-950 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clipboard className="text-blue-400 w-5 h-5" />
                  <h3 className="font-bold text-sm">
                    {pasteModal.type === 'lesson' 
                      ? 'Dán nội dung Kế hoạch bài dạy / Giáo án' 
                      : 'Dán nội dung Bảng Phụ lục 1 / Phân phối chương trình'}
                  </h3>
                </div>
                <button
                  onClick={() => setPasteModal(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 flex-1 bg-slate-50/50">
                <p className="text-xs text-slate-600 mb-2.5">
                  Thầy/Cô có thể copy toàn bộ văn bản hoặc bảng biểu từ Word / Excel và dán (Ctrl + V) vào khung bên dưới:
                </p>
                <textarea
                  value={pasteModal.text}
                  onChange={(e) => setPasteModal({ ...pasteModal, text: e.target.value })}
                  placeholder={pasteModal.type === 'lesson' 
                    ? "Dán nội dung bài dạy (Mục tiêu, Thiết bị dạy học, Tiến trình dạy học...)" 
                    : "Dán bảng phân phối chương trình (Tuần, Tiết, Tên bài dạy, Yêu cầu cần đạt...)"}
                  className="w-full h-64 p-3.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="px-5 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500">{pasteModal.text.length} ký tự</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPasteModal(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSavePastedText}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    Lưu nội dung
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xem nhanh nội dung đã đọc từ file */}
        {previewContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="text-blue-400 w-5 h-5" />
                  <h3 className="font-bold text-sm truncate max-w-md">{previewContent.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewContent(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
                <div className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-2xs max-h-[60vh] overflow-y-auto">
                  {previewContent.text}
                </div>
              </div>
              <div className="px-5 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                <span>Dung lượng đã đọc: ~{Math.round(previewContent.text.length / 1024)} KB ({previewContent.text.length} ký tự)</span>
                <button
                  onClick={() => setPreviewContent(null)}
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentInput;
