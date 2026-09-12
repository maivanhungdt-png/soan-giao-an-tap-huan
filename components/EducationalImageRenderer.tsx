import React, { useState, useEffect } from 'react';
import { Eye, Download, Upload, RefreshCw, ZoomIn, X, Check, Sparkles } from 'lucide-react';
import { imageCache, lookupCachedImage } from '../services/imageCache';
import { generateEducationalDiagramSvg, convertSvgToPngDataUrl, detectDiagramType } from '../utils/diagramGenerator';

interface EducationalImageRendererProps {
  src: string;
  alt: string;
  id?: string;
  num?: string;
  contextText?: string;
  onUpdateImage?: (newSrc: string) => void;
}

export const EducationalImageRenderer: React.FC<EducationalImageRendererProps> = ({
  src,
  alt,
  id,
  num = '1',
  contextText = '',
  onUpdateImage
}) => {
  // Helper to resolve src to actual dataUrl
  const resolveSource = (inputSrc: string): string => {
    if (inputSrc && (inputSrc.startsWith('data:image/') || inputSrc.startsWith('blob:') || inputSrc.startsWith('http://') || inputSrc.startsWith('https://'))) {
      return inputSrc;
    }

    const cached = lookupCachedImage(inputSrc) || lookupCachedImage(id || '') || lookupCachedImage(alt || '') || lookupCachedImage(num);
    if (cached?.dataUrl) {
      return cached.dataUrl;
    }

    return inputSrc || '';
  };

  const [currentSrc, setCurrentSrc] = useState<string>(() => resolveSource(src));
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const resolved = resolveSource(src);
    setCurrentSrc(resolved);
  }, [src, id, num, alt]);

  // Handle image load error fallback
  const handleImageError = () => {
    const cached = lookupCachedImage(`HINHANHGOC_${num}`) || lookupCachedImage(num);
    if (cached?.dataUrl) {
      setCurrentSrc(cached.dataUrl);
    }
  };

  // Handle custom image upload from user computer
  const handleUploadCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCurrentSrc(dataUrl);

      // Save to imageCache under all relevant keys
      if (id) {
        imageCache[id] = { id, dataUrl, width: 280, height: 200 };
      }
      imageCache[`HINHANHGOC_${num}`] = { id: `HINHANHGOC_${num}`, dataUrl, width: 280, height: 200 };
      imageCache[`IMG${num}`] = { id: `IMG${num}`, dataUrl, width: 280, height: 200 };
      imageCache[`HINH_${num}`] = { id: `HINH_${num}`, dataUrl, width: 280, height: 200 };
      imageCache[`${num}`] = { id: `${num}`, dataUrl, width: 280, height: 200 };

      if (onUpdateImage) onUpdateImage(dataUrl);
      setIsMenuOpen(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle changing diagram preset
  const handleChangePreset = async (presetType: string) => {
    const svg = generateEducationalDiagramSvg(presetType, num, alt);
    const pngDataUrl = await convertSvgToPngDataUrl(svg, 500, 320);
    setCurrentSrc(pngDataUrl);

    if (id) {
      imageCache[id] = { id, dataUrl: pngDataUrl, width: 280, height: 200 };
    }
    imageCache[`HINHANHGOC_${num}`] = { id: `HINHANHGOC_${num}`, dataUrl: pngDataUrl, width: 280, height: 200 };
    imageCache[`IMG${num}`] = { id: `IMG${num}`, dataUrl: pngDataUrl, width: 280, height: 200 };
    imageCache[`HINH_${num}`] = { id: `HINH_${num}`, dataUrl: pngDataUrl, width: 280, height: 200 };
    imageCache[`${num}`] = { id: `${num}`, dataUrl: pngDataUrl, width: 280, height: 200 };

    if (onUpdateImage) onUpdateImage(pngDataUrl);
    setIsMenuOpen(false);
  };

  // Download image to computer
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentSrc;
    link.download = `Hinh_minh_hoa_${num}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <span className="my-4 block max-w-full text-center not-italic font-sans">
      <span className="relative inline-flex flex-col items-center max-w-full rounded-2xl p-2 bg-slate-50/80 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
        {/* Main Image / Diagram */}
        <span className="bg-white rounded-xl p-1.5 border border-slate-200/80 inline-block">
          <img
            src={currentSrc}
            alt={alt || `Hình vẽ minh họa ${num}`}
            onError={handleImageError}
            className="max-w-full max-h-[380px] w-auto h-auto object-contain rounded-lg inline-block mx-auto bg-white"
            loading="lazy"
          />
        </span>

        {/* Action Toolbar - Always visible with clear styling */}
        <span className="mt-2.5 flex items-center justify-center flex-wrap gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            title="Phóng to xem chi tiết hình vẽ"
            className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <ZoomIn size={14} className="text-blue-600" />
            <span>Phóng to</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={handleDownload}
            title="Tải hình vẽ này về máy tính"
            className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Tải về</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Chọn mẫu hình vẽ khác hoặc tải ảnh từ máy tính"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className="text-blue-600" />
            <span>Đổi hình / Tải ảnh</span>
          </button>
        </span>

        {/* Caption */}
        {alt && (
          <span className="text-xs text-slate-600 font-semibold italic mt-1.5 px-2 pb-0.5 font-sans block text-center">
            [{alt}]
          </span>
        )}
      </span>

      {/* Preset Picker Modal / Drawer */}
      {isMenuOpen && (
        <span className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in text-left">
          <span className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 max-w-lg w-full relative max-h-[85vh] flex flex-col">
            <span className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base">
                <Sparkles size={18} className="text-blue-600" />
                Chọn mẫu hình vẽ sư phạm (Hình {num})
              </span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </span>

            <span className="py-3 text-xs text-slate-500">
              Thầy/Cô có thể chọn các hình vẽ hình học chuẩn chương trình GDPT hoặc tải ảnh từ máy tính:
            </span>

            <span className="overflow-y-auto flex-1 pr-1 space-y-2 max-h-[50vh]">
              {/* Presets */}
              <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block mt-1">
                Hình học phẳng &amp; Cắt dán
              </span>
              <span className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChangePreset('fold_square_from_rect')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>✂️ Gấp cắt hình vuông</span>
                  <span className="text-[10px] text-slate-500 font-normal">Gấp chéo từ hình chữ nhật</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('square')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>🟦 Hình vuông ABCD</span>
                  <span className="text-[10px] text-slate-500 font-normal">Cạnh a, 4 góc vuông</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('rectangle')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>▭ Hình chữ nhật</span>
                  <span className="text-[10px] text-slate-500 font-normal">Chiều dài a, chiều rộng b</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('rhombus')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>🔶 Hình thoi ABCD</span>
                  <span className="text-[10px] text-slate-500 font-normal">2 đường chéo vuông góc</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('parallelogram')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>▱ Hình bình hành</span>
                  <span className="text-[10px] text-slate-500 font-normal">Cạnh đáy a, đường cao h</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('trapezoid')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>⏢ Hình thang cân</span>
                  <span className="text-[10px] text-slate-500 font-normal">Đáy nhỏ a, đáy lớn b, cao h</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('right_triangle')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>📐 Tam giác vuông (Pythagore)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Cạnh góc vuông &amp; huyền</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('circle')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>⚪ Đường tròn &amp; Bán kính</span>
                  <span className="text-[10px] text-slate-500 font-normal">Tâm O, bán kính R</span>
                </button>
              </span>

              <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block mt-3">
                KHTN, Tin học &amp; Không gian
              </span>
              <span className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChangePreset('coordinate')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>📈 Trục toạ độ Oxy</span>
                  <span className="text-[10px] text-slate-500 font-normal">Hệ toạ độ &amp; Đồ thị</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('cube_3d')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>🧊 Hình lập phương 3D</span>
                  <span className="text-[10px] text-slate-500 font-normal">Khối hộp không gian</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('circuit')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>💡 Sơ đồ mạch điện</span>
                  <span className="text-[10px] text-slate-500 font-normal">Pin, công tắc, bóng đèn</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePreset('flowchart')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-800 flex flex-col gap-1"
                >
                  <span>🔄 Sơ đồ khối thuật toán</span>
                  <span className="text-[10px] text-slate-500 font-normal">Bắt đầu, xử lý, điều kiện</span>
                </button>
              </span>
            </span>

            {/* Custom Upload Button */}
            <span className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadCustom}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
              >
                <Upload size={14} />
                <span>Tải ảnh từ máy tính lên</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </span>
          </span>
        </span>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <span className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in">
          <span className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-3 right-3 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer z-10"
            >
              <X size={20} />
            </button>
            <img
              src={currentSrc}
              alt={alt || `Hình vẽ minh họa ${num}`}
              className="max-w-full max-h-[78vh] object-contain rounded-lg"
            />
            {alt && (
              <span className="text-sm text-slate-700 font-semibold italic mt-3 text-center">
                [{alt}]
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  );
};
