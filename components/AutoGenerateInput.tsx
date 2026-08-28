import React, { useCallback, useState, useEffect } from 'react';
import { Upload, X, FileImage, FileText, CheckCircle2, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { saveSgkImages, loadSgkImages } from '../utils/indexedDBCache';
import { imageCache } from '../services/imageCache';

// Khai báo cho PDFJS
declare const pdfjsLib: any;

interface AutoGenerateInputProps {
  subject: string;
  grade: number;
  sgkImagesBase64: string[];
  setSgkImagesBase64: (images: string[]) => void;
  lessonTitle: string;
  setLessonTitle: (title: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  educationLevel: string;
  setEducationLevel: (level: string) => void;
  template: string;
  setTemplate: (template: string) => void;
  customActivities: string[];
  setCustomActivities: React.Dispatch<React.SetStateAction<string[]>>;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const pdfToBase64Images = async (file: File): Promise<string[]> => {
  if (typeof pdfjsLib === 'undefined') {
    alert("Thư viện xử lý PDF chưa được tải.");
    return [];
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    
    // Tạo canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        images.push(canvas.toDataURL('image/jpeg', 0.8));
    }
  }
  return images;
};

const AutoGenerateInput: React.FC<AutoGenerateInputProps> = ({
  subject,
  grade,
  sgkImagesBase64,
  setSgkImagesBase64,
  lessonTitle,
  setLessonTitle,
  duration,
  setDuration,
  educationLevel,
  setEducationLevel,
  template,
  setTemplate,
  customActivities,
  setCustomActivities
}) => {
  const [currentActivityTitle, setCurrentActivityTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCachedImages, setHasCachedImages] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkCache = async () => {
      try {
        const cachedImages = await loadSgkImages(subject, grade);
        if (isMounted) {
            if (cachedImages && cachedImages.length > 0) {
                setSgkImagesBase64(cachedImages);
                setHasCachedImages(true);
            } else {
                setSgkImagesBase64([]);
                setHasCachedImages(false);
            }
        }
      } catch (e) {
          console.error("Lỗi khi tải cache SGK:", e);
      }
    };
    checkCache();
    return () => { isMounted = false; };
  }, [subject, grade, setSgkImagesBase64]);

  useEffect(() => {
    if (sgkImagesBase64 && sgkImagesBase64.length > 0) {
      sgkImagesBase64.forEach((dataUrl, idx) => {
        const imgNum = idx + 1;
        const cachedObj = {
          id: `HINHANHGOC_${imgNum}`,
          dataUrl,
          width: 250,
          height: 180
        };
        imageCache[`HINHANHGOC_${imgNum}`] = cachedObj;
        imageCache[`HINHANHGOC${imgNum}`] = cachedObj;
        imageCache[`HINH_ANH_GOC_${imgNum}`] = cachedObj;
        imageCache[`HINH_ANH_GOC${imgNum}`] = cachedObj;
        imageCache[`HINH_ANH_${imgNum}`] = cachedObj;
        imageCache[`HINHANH_${imgNum}`] = cachedObj;
        imageCache[`HINHANH${imgNum}`] = cachedObj;
        imageCache[`IMG${imgNum}`] = cachedObj;
        imageCache[`IMG_${imgNum}`] = cachedObj;
        imageCache[`IMAGE_${imgNum}`] = cachedObj;
        imageCache[`IMAGE${imgNum}`] = cachedObj;
        imageCache[`SGK_${imgNum}`] = cachedObj;
        imageCache[`SGK${imgNum}`] = cachedObj;
        imageCache[`${imgNum}`] = cachedObj;
      });
    }
  }, [sgkImagesBase64]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsLoading(true);
    try {
        let newImages: string[] = [...sgkImagesBase64];
        
        for (const file of acceptedFiles) {
            if (file.type === "application/pdf") {
                const pdfImages = await pdfToBase64Images(file);
                newImages = [...newImages, ...pdfImages];
            } else if (file.type.startsWith("image/")) {
                const base64 = await fileToBase64(file);
                newImages.push(base64);
            }
        }
        
        setSgkImagesBase64(newImages);
        if (newImages.length > 0) {
            await saveSgkImages(subject, grade, newImages);
            setHasCachedImages(true);
        }
    } catch (e) {
        console.error("Error processing files", e);
        alert("Có lỗi xảy ra khi xử lý file");
    } finally {
        setIsLoading(false);
    }
  }, [sgkImagesBase64, setSgkImagesBase64, subject, grade]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxSize: 52428800, // 50MB
  });

  const handleAddActivity = () => {
    if (currentActivityTitle.trim()) {
      setCustomActivities(prev => [...prev, currentActivityTitle.trim()]);
      setCurrentActivityTitle(''); 
    }
  };

  const handleRemoveActivity = (indexToRemove: number) => {
    setCustomActivities(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const removeImage = async (index: number) => {
      const updated = [...sgkImagesBase64];
      updated.splice(index, 1);
      setSgkImagesBase64(updated);
      await saveSgkImages(subject, grade, updated);
      if (updated.length === 0) setHasCachedImages(false);
  };

  const handleClearCache = async () => {
      setSgkImagesBase64([]);
      await saveSgkImages(subject, grade, []);
      setHasCachedImages(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden mt-6">
      {/* Header */}
      <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
            03
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">Thiết lập tham số bài dạy từ SGK</h2>
            <p className="text-[11px] text-slate-500">Tự động cấu trúc hóa nội dung học liệu theo khung chuẩn Bộ GD&ĐT</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200/60 hidden sm:inline-block">
          {template}
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Cấp học</label>
              <select 
                value={educationLevel}
                onChange={e => setEducationLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none font-medium text-sm bg-white"
              >
                <option value="Tiểu học">Cấp Tiểu học</option>
                <option value="THCS">Cấp Trung học Cơ sở (THCS)</option>
                <option value="THPT">Cấp Trung học Phổ thông (THPT)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Khung Kế hoạch bài dạy</label>
              <select 
                value={template}
                onChange={e => setTemplate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none font-medium text-sm bg-white"
              >
                <option value="Công văn 5512">Công văn 5512/BGDĐT (Chuẩn phổ thông)</option>
                <option value="Công văn 2345">Công văn 2345/BGDĐT (Tiểu học)</option>
                <option value="Công văn 1001">Công văn 1001/BGDĐT</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Tên bài dạy / Chủ đề</label>
              <input 
                value={lessonTitle}
                onChange={e => setLessonTitle(e.target.value)}
                placeholder="VD: Bài 5. Định dạng văn bản và bảng biểu"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none font-medium text-sm bg-white"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Thời lượng thực hiện</label>
              <input 
                 value={duration}
                 onChange={e => setDuration(e.target.value)}
                 placeholder="VD: 2 tiết"
                 className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none font-medium text-sm bg-white"
              />
            </div>
        </div>
        
        {/* Upload Box */}
        <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Tài liệu / Ảnh chụp trang Sách Giáo Khoa (SGK)</span>
                {hasCachedImages && (
                    <button onClick={handleClearCache} className="text-xs text-rose-600 hover:underline font-semibold">Làm mới tài liệu SGK</button>
                )}
            </label>

            {hasCachedImages && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-start text-xs leading-relaxed">
                   <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-emerald-700" />
                   <div>
                       <span className="font-bold block mb-0.5">Đã lưu trữ {sgkImagesBase64.length} trang sách trong bộ nhớ trình duyệt!</span>
                       Hệ thống tự động sử dụng lại trang sách SGK môn {subject} - Khối Lớp {grade} đã nạp trước đó.
                   </div>
                </div>
            )}

            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'}`}
            >
              <input {...getInputProps()} />
              {isLoading ? (
                 <div className="flex flex-col items-center">
                   <div className="w-7 h-7 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mb-2.5"></div>
                   <p className="text-xs font-semibold text-blue-900">Đang trích xuất trang SGK...</p>
                 </div>
              ) : (
                  <div className="flex flex-col items-center">
                    <FileImage className="text-slate-400 w-10 h-10 mb-2" />
                    <p className="text-sm font-bold text-slate-800">Kéo thả hoặc Nhấp để chọn ảnh / PDF Sách Giáo Khoa</p>
                    <p className="text-xs text-slate-500 mt-1">Định dạng hỗ trợ: PDF, JPG, PNG (Dung lượng khuyến nghị dưới 50MB)</p>
                  </div>
              )}
            </div>
        </div>

        {/* Custom Activities */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Các hoạt động dạy học trọng tâm (Tùy chọn)</label>
            <p className="text-xs text-slate-500">Mặc định AI sẽ tự động phân bổ theo 4 bước: Khởi động, Khám phá kiến thức, Luyện tập, Vận dụng.</p>
            <div className="flex gap-2.5 mt-2">
               <input
                type="text"
                value={currentActivityTitle}
                onChange={(e) => setCurrentActivityTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddActivity(); } }}
                className="flex-1 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none font-medium text-sm bg-white"
                placeholder="VD: Hoạt động 1. Tìm hiểu quy tắc an toàn số..."
              />
              <button
                type="button"
                onClick={handleAddActivity}
                className="px-4 py-2.5 bg-blue-900 text-white rounded-xl font-semibold text-xs hover:bg-blue-800 transition-colors shrink-0"
              >
                Thêm hoạt động
              </button>
            </div>
            {customActivities.length > 0 && (
              <div className="mt-3 space-y-2">
                {customActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">Hoạt động {index + 1}: {activity}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(index)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AutoGenerateInput;
