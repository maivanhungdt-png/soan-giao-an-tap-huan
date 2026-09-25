import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LessonForm from './components/LessonForm';
import ContentInput from './components/ContentInput';
import ManualNLSInput from './components/ManualNLSInput';
import ManualAIInput from './components/ManualAIInput';
import DisabilitySelector from './components/DisabilitySelector';
import ResultDisplay from './components/ResultDisplay';
import TeacherInfoModal, { TeacherInfo } from './components/TeacherInfoModal';
import ApiKeyModal, { USER_API_KEY_STORAGE } from './components/ApiKeyModal';
import LicenseModal from './components/LicenseModal';
import { 
  LicenseInfo, 
  getLicenseStatus, 
  verifyLicenseWithServer,
  getLicenseTypeName 
} from './services/licenseService';
import { ManualNLSEntry, ManualAIEntry } from './types';
import { generateNLSLessonPlan } from './services/geminiService';
import AutoGenerateInput from './components/AutoGenerateInput';
import { Sparkles, Sliders, ShieldCheck, Zap, Info, Check, FileEdit, FileSearch, School, Phone, User, Key, ChevronDown, ChevronUp, Crown, Clock, AlertTriangle } from 'lucide-react';

const TEACHER_INFO_KEY = 'user_teacher_profile_info';

export const DEFAULT_TEACHER_INFO: TeacherInfo = {
  schoolName: 'THCS Đồng Yên',
  teacherName: 'Mai Văn Hùng',
  reviewerName: 'Nguyễn Thị Huệ',
  phoneNumber: '0941037116',
  department: 'Khoa học Tự Nhiên',
  includeInHeader: true
};

const App: React.FC = () => {
  // License & Activation State
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>(() => getLicenseStatus());

  useEffect(() => {
    // Tự động kiểm tra và đồng bộ bản quyền với Google Sheets khi tải ứng dụng
    const sync = async () => {
      try {
        const latest = await verifyLicenseWithServer();
        setLicenseInfo(latest);
      } catch {
        setLicenseInfo(getLicenseStatus());
      }
    };
    sync();
  }, []);

  // API Key State
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(USER_API_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      if (newKey) {
        localStorage.setItem(USER_API_KEY_STORAGE, newKey);
      } else {
        localStorage.removeItem(USER_API_KEY_STORAGE);
      }
    } catch (e) {
      console.error("Error saving API key", e);
    }
  };

  // Teacher / School Profile State
  const [isTeacherInfoOpen, setIsTeacherInfoOpen] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>(() => {
    try {
      const saved = localStorage.getItem(TEACHER_INFO_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          schoolName: parsed.schoolName || DEFAULT_TEACHER_INFO.schoolName,
          teacherName: parsed.teacherName || DEFAULT_TEACHER_INFO.teacherName,
          reviewerName: parsed.reviewerName || DEFAULT_TEACHER_INFO.reviewerName,
          phoneNumber: parsed.phoneNumber || DEFAULT_TEACHER_INFO.phoneNumber,
          department: parsed.department || DEFAULT_TEACHER_INFO.department,
          includeInHeader: parsed.includeInHeader !== undefined ? parsed.includeInHeader : DEFAULT_TEACHER_INFO.includeInHeader
        };
      }
    } catch (e) {
      console.error("Error reading teacher info cache", e);
    }
    return DEFAULT_TEACHER_INFO;
  });

  const handleSaveTeacherInfo = (newInfo: TeacherInfo) => {
    setTeacherInfo(newInfo);
    try {
      localStorage.setItem(TEACHER_INFO_KEY, JSON.stringify(newInfo));
    } catch (e) {
      console.error("Error saving teacher info", e);
    }
  };

  // State for Form - Default to Toán
  const [subject, setSubject] = useState<string>('Toán');
  const [grade, setGrade] = useState<number>(6);
  
  // Content States
  const [lessonContent, setLessonContent] = useState<string>('');
  const [distributionContent, setDistributionContent] = useState<string>('');
  const [lessonFileName, setLessonFileName] = useState<string | null>(null);
  const [distFileName, setDistFileName] = useState<string | null>(null);
  
  // New State for Manual NLS Input
  const [manualNLSEntries, setManualNLSEntries] = useState<ManualNLSEntry[]>([]);
  const [manualAIEntries, setManualAIEntries] = useState<ManualAIEntry[]>([]);
  
  // State for Options
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [integrateNLS, setIntegrateNLS] = useState(true);
  const [integrateAI, setIntegrateAI] = useState(false);
  const [integrateDisability, setIntegrateDisability] = useState(false);
  const [integrateGDQPAN, setIntegrateGDQPAN] = useState(false);
  const [integrateSTEM, setIntegrateSTEM] = useState(false);
  const [stemType, setStemType] = useState<'integrate' | 'topic'>('integrate');
  const [layoutFormat, setLayoutFormat] = useState<'table' | 'no_table'>('table');
  const [selectedDisabilities, setSelectedDisabilities] = useState<string[]>(['Khuyết tật chung']);
  const [isEnglish, setIsEnglish] = useState(false);
  
  const [analyzeOnly, setAnalyzeOnly] = useState(false);
  const [detailedReport, setDetailedReport] = useState(false);

  // State for Auto Generate Input
  const [isAutoGenerate, setIsAutoGenerate] = useState(false);
  const [sgkImagesBase64, setSgkImagesBase64] = useState<string[]>([]);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>('THCS');
  const [template, setTemplate] = useState<string>('Công văn 5512');
  const [customActivities, setCustomActivities] = useState<string[]>([]);

  // App State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    // 1. Kiểm tra Bản Quyền / Dùng thử
    const currentLicense = getLicenseStatus();
    if (currentLicense.status === 'expired' || currentLicense.status === 'invalid') {
      setError(
        currentLicense.message || 
        'Thời hạn dùng thử 1 ngày đã hết (hoặc chưa kích hoạt bản quyền). Vui lòng nhập mã kích hoạt để tiếp tục sử dụng tính năng AI.'
      );
      setIsLicenseModalOpen(true);
      return;
    }

    if (!isAutoGenerate) {
       if (!lessonContent || lessonContent.trim().length === 0) {
         setError("Vui lòng tải lên file giáo án gốc (chưa được tải).");
         return;
       }
    }

    if (!integrateNLS && !integrateAI && !integrateDisability && !integrateGDQPAN && !integrateSTEM && !isAutoGenerate) {
      setError("Vui lòng chọn ít nhất 1 loại chức năng để xử lý.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Pass contents and manual entries to service
      const generatedText = await generateNLSLessonPlan(
        { 
            subject, 
            grade, 
            content: lessonContent,
            distributionContent: (integrateNLS || integrateAI) ? distributionContent : undefined,
            manualNLS: integrateNLS ? manualNLSEntries : undefined,
            manualAI: integrateAI ? manualAIEntries : undefined,
            isEnglish,
            selectedDisabilities: integrateDisability ? selectedDisabilities : undefined,
            isAutoGenerate,
            sgkImagesBase64,
            lessonTitle,
            duration,
            educationLevel,
            template,
            customActivities
        },
        { 
            integrateNLS, 
            integrateAI, 
            integrateDisability, 
            integrateGDQPAN, 
            integrateSTEM,
            stemType,
            layoutFormat,
            analyzeOnly, 
            detailedReport, 
            comparisonExport: false, 
            customApiKey: apiKey 
        },
        (progressText) => {
            setResult(progressText);
        }
      );

      if (!generatedText || generatedText.trim().length === 0) {
          throw new Error("AI trả về kết quả rỗng. Vui lòng thử lại với file giáo án rõ ràng hơn.");
      }

      setResult(generatedText);
    } catch (err: any) {
      console.error("Process Error:", err);
      setError(err.message || "Đã xảy ra lỗi không xác định khi kết nối với AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setResult(null);
    setError(null);
    setLessonContent('');
    setDistributionContent('');
    setLessonFileName(null);
    setDistFileName(null);
    setManualNLSEntries([]);
    setManualAIEntries([]);
    setLessonTitle('');
    setDuration('');
    setCustomActivities([]);
  };

  return (
    <div className="min-h-screen font-sans pb-20 bg-slate-100/70 text-slate-800 selection:bg-blue-100 selection:text-blue-900 relative">
      <Header 
        onOpenTeacherInfo={() => setIsTeacherInfoOpen(true)}
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        onOpenLicense={() => setIsLicenseModalOpen(true)}
        onOpenKeyGenerator={() => setIsKeyGeneratorOpen(true)}
        schoolName={teacherInfo.schoolName}
        teacherName={teacherInfo.teacherName}
        phoneNumber={teacherInfo.phoneNumber}
        hasApiKey={!!apiKey}
        licenseInfo={licenseInfo}
      />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 relative z-10">
        {/* User Info & License Quick Status Bar */}
        <div className="mb-6 bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-700">
            {/* License Tag */}
            <button
              onClick={() => setIsLicenseModalOpen(true)}
              className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                licenseInfo.status === 'active' && !licenseInfo.isTrial
                  ? 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                  : licenseInfo.status === 'trial'
                  ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
              }`}
              title="Bản quyền phần mềm"
            >
              {licenseInfo.status === 'active' && !licenseInfo.isTrial ? (
                <Crown size={13} className="mr-1.5 text-amber-600" />
              ) : licenseInfo.status === 'trial' ? (
                <Clock size={13} className="mr-1.5 text-blue-600" />
              ) : (
                <AlertTriangle size={13} className="mr-1.5 text-rose-600" />
              )}
              <span>
                {licenseInfo.status === 'active' && !licenseInfo.isTrial
                  ? `${getLicenseTypeName(licenseInfo.type)}`
                  : licenseInfo.status === 'trial'
                  ? `Dùng thử (${licenseInfo.hoursRemaining ?? 24}h còn lại)`
                  : 'Bản quyền hết hạn (Bấm để nhập Key)'}
              </span>
            </button>

            {teacherInfo.schoolName && (
              <span className="flex items-center font-bold text-blue-950 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/60">
                <School size={15} className="mr-1.5 text-blue-800" />
                {teacherInfo.schoolName}
              </span>
            )}
            {teacherInfo.department && (
              <span className="text-slate-700 bg-slate-100 font-medium px-3 py-1.5 rounded-lg border border-slate-200">
                {teacherInfo.department}
              </span>
            )}
            {teacherInfo.teacherName && (
              <span className="flex items-center text-slate-700 font-medium">
                <User size={15} className="mr-1.5 text-slate-500" />
                {teacherInfo.teacherName}
              </span>
            )}
            {teacherInfo.phoneNumber && (
              <span className="flex items-center text-slate-700 font-medium">
                <Phone size={15} className="mr-1.5 text-slate-500" />
                {teacherInfo.phoneNumber}
              </span>
            )}
            {/* API Key Status Tag */}
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                apiKey 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Nhấn để cấu hình khóa API"
            >
              <Key size={13} className={`mr-1.5 ${apiKey ? 'text-emerald-600' : 'text-amber-600'}`} />
              {apiKey ? (
                <span>Key AI: <b className="font-mono">{apiKey.substring(0, 4)}...{apiKey.substring(apiKey.length - 3)}</b></span>
              ) : (
                <span>Chưa nhập Khóa API (Bấm để cài đặt)</span>
              )}
            </button>
          </div>
          
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => setIsTeacherInfoOpen(true)}
              className="font-semibold text-blue-900 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Cập nhật hồ sơ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Main Column: Inputs */}
          <div className="lg:col-span-8 space-y-6">
            <LessonForm 
              subject={subject} setSubject={setSubject}
              grade={grade} setGrade={setGrade}
            />
            
            {/* Options Panel cho Loại tích hợp */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsIntegrationsOpen(!isIntegrationsOpen)}
                  className="w-full bg-slate-50/80 hover:bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      02
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Mục tiêu & Chế độ tích hợp chuyên đề</span>
                        <span className="text-[11px] font-normal text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                          (Bấm để {isIntegrationsOpen ? 'thu gọn' : 'chọn'})
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-500">Tùy chọn lồng ghép các yêu cầu cần đạt theo quy định ngành</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200/60">
                      Đã chọn: {[integrateNLS, integrateAI, integrateSTEM, integrateDisability, integrateGDQPAN].filter(Boolean).length}
                    </span>
                    {isIntegrationsOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </div>
                </button>

                {isIntegrationsOpen && (
                  <div className="p-3 sm:p-4 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                         <label className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${integrateNLS ? 'border-blue-900 bg-blue-50/60 shadow-2xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 mt-0.5 shrink-0 transition-colors ${integrateNLS ? 'bg-blue-900 border-blue-900' : 'bg-white border-slate-300'}`}>
                              {integrateNLS && <Check className="text-white w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <input 
                              type="checkbox" 
                              checked={integrateNLS}
                              onChange={(e) => setIntegrateNLS(e.target.checked)}
                              className="hidden" 
                            />
                            <div className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800">Năng lực số (NLS)</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">Khung NLS GDPT 2018 (Chỉ báo & nội dung)</span>
                            </div>
                        </label>

                         <label className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${integrateAI ? 'border-blue-900 bg-blue-50/60 shadow-2xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 mt-0.5 shrink-0 transition-colors ${integrateAI ? 'bg-blue-900 border-blue-900' : 'bg-white border-slate-300'}`}>
                              {integrateAI && <Check className="text-white w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <input 
                              type="checkbox" 
                              checked={integrateAI}
                              onChange={(e) => setIntegrateAI(e.target.checked)}
                              className="hidden" 
                            />
                            <div className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800">Năng lực Trí tuệ nhân tạo (AI)</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">Khai thác và ứng dụng công cụ AI</span>
                            </div>
                        </label>

                         <label className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${integrateSTEM ? 'border-amber-700 bg-amber-50/60 shadow-2xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 mt-0.5 shrink-0 transition-colors ${integrateSTEM ? 'bg-amber-700 border-amber-700' : 'bg-white border-slate-300'}`}>
                              {integrateSTEM && <Check className="text-white w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <input 
                              type="checkbox" 
                              checked={integrateSTEM}
                              onChange={(e) => setIntegrateSTEM(e.target.checked)}
                              className="hidden" 
                            />
                            <div className="w-full min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="block text-xs font-bold text-slate-800">Giáo dục STEM</span>
                                  {integrateSTEM && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <select
                                        value={stemType}
                                        onChange={(e) => setStemType(e.target.value as 'integrate' | 'topic')}
                                        className="text-[10px] bg-white border border-amber-300 text-amber-900 rounded px-1.5 py-0.5 font-medium"
                                      >
                                        <option value="integrate">Tích hợp</option>
                                        <option value="topic">Chủ đề</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                                <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">Tên bài mở ngoặc, ghép hoạt động vào Vận dụng</span>
                            </div>
                        </label>

                        <label className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${integrateDisability ? 'border-teal-700 bg-teal-50/60 shadow-2xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 mt-0.5 shrink-0 transition-colors ${integrateDisability ? 'bg-teal-700 border-teal-700' : 'bg-white border-slate-300'}`}>
                              {integrateDisability && <Check className="text-white w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <input 
                              type="checkbox" 
                              checked={integrateDisability}
                              onChange={(e) => setIntegrateDisability(e.target.checked)}
                              className="hidden" 
                            />
                            <div className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800">Giáo dục hòa nhập (HSKT)</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">Mục tiêu in nghiêng *[Dành cho HSKT hòa nhập]*</span>
                            </div>
                        </label>

                        <label className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${integrateGDQPAN ? 'border-blue-900 bg-blue-50/60 shadow-2xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 mt-0.5 shrink-0 transition-colors ${integrateGDQPAN ? 'bg-blue-900 border-blue-900' : 'bg-white border-slate-300'}`}>
                              {integrateGDQPAN && <Check className="text-white w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <input 
                              type="checkbox" 
                              checked={integrateGDQPAN}
                              onChange={(e) => setIntegrateGDQPAN(e.target.checked)}
                              className="hidden" 
                            />
                            <div className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800">Lồng ghép GDQP&AN</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">Thông tư quy định về GDQPAN</span>
                            </div>
                        </label>
                    </div>

                    {/* Format Layout Selector (Kẻ bảng 2 cột vs Không kẻ bảng) */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-900 mr-2"></span>
                        Hình thức trình bày tiến trình hoạt động (Phụ lục 4):
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setLayoutFormat('table')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                            layoutFormat === 'table' 
                              ? 'bg-blue-900 text-white shadow-2xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Kẻ bảng 2 cột chuẩn
                        </button>
                        <button
                          type="button"
                          onClick={() => setLayoutFormat('no_table')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                            layoutFormat === 'no_table' 
                              ? 'bg-blue-900 text-white shadow-2xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Không kẻ bảng (4 mục a,b,c,d)
                        </button>
                      </div>
                    </div>

                    {/* Quy chuẩn Bộ GD&ĐT Banner */}
                    <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-[10.5px] text-blue-900/90 leading-relaxed space-y-1">
                      <div className="font-bold text-blue-950 flex items-center text-xs">
                        <span className="mr-1.5">📋</span> Quy chuẩn sư phạm Phụ lục 4 (CV 5512, TT 30, TT 38 & Bảo toàn hình vẽ):
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-blue-900/80 text-[10.5px]">
                        <li><b>Xây dựng theo bài:</b> Không ghi ngày soạn, ngày giảng; Thứ tự tiết ghi theo Phụ lục 3 sau hoạt động đầu tiên.</li>
                        <li><b>Mục tiêu:</b> 1. Kiến thức, 2. Năng lực (Không ghi NL chung; Chỉ có NL đặc thù & NLS kèm chỉ báo), 3. Phẩm chất.</li>
                        <li><b>Thiết bị & Học liệu:</b> Chuẩn Thông tư 38/BGDĐT, chỉ thêm Ti vi vào Phụ lục 4.</li>
                        <li><b>Tiến trình:</b> Không kẻ bảng đủ 4 phần (a, b, c, d); Kẻ bảng gồm mục a, b và bảng 2 cột (Tổ chức thực hiện | Sản phẩm).</li>
                        <li><b>Bảo toàn hình vẽ & công thức toán:</b> Nhận diện 100% hình vẽ và công thức toán học giống SGK.</li>
                      </ul>
                    </div>
                  </div>
                )}
            </div>

            {/* Mode Selection Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-1.5 flex space-x-1.5">
                <button
                    onClick={() => setIsAutoGenerate(false)}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors ${!isAutoGenerate ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <FileEdit className="mr-2" size={16} />
                    CHỈNH SỬA TỪ GIÁO ÁN GỐC (.DOCX)
                </button>
                <button
                    onClick={() => setIsAutoGenerate(true)}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors ${isAutoGenerate ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <FileSearch className="mr-2" size={16} />
                    SOẠN BÀI MỚI TỪ SÁCH GIÁO KHOA
                </button>
            </div>

            {isAutoGenerate ? (
                <>
                    <AutoGenerateInput 
                        subject={subject}
                        grade={grade}
                        sgkImagesBase64={sgkImagesBase64}
                        setSgkImagesBase64={setSgkImagesBase64}
                        lessonTitle={lessonTitle}
                        setLessonTitle={setLessonTitle}
                        duration={duration}
                        setDuration={setDuration}
                        educationLevel={educationLevel}
                        setEducationLevel={setEducationLevel}
                        template={template}
                        setTemplate={setTemplate}
                        customActivities={customActivities}
                        setCustomActivities={setCustomActivities}
                    />
                    <ContentInput 
                        lessonContent={lessonContent} 
                        setLessonContent={setLessonContent}
                        distributionContent={distributionContent}
                        setDistributionContent={setDistributionContent}
                        lessonFileName={lessonFileName}
                        setLessonFileName={setLessonFileName}
                        distFileName={distFileName}
                        setDistFileName={setDistFileName}
                        integrateNLS={integrateNLS}
                        integrateAI={integrateAI}
                        mode="extrasOnly"
                    />
                </>
            ) : (
                <ContentInput 
                    lessonContent={lessonContent} 
                    setLessonContent={setLessonContent}
                    distributionContent={distributionContent}
                    setDistributionContent={setDistributionContent}
                    lessonFileName={lessonFileName}
                    setLessonFileName={setLessonFileName}
                    distFileName={distFileName}
                    setDistFileName={setDistFileName}
                    integrateNLS={integrateNLS}
                    integrateAI={integrateAI}
                />
            )}

            {/* Disability Selector Section - Show if integrateDisability is checked */}
            {integrateDisability && (
              <DisabilitySelector 
                  selectedDisabilities={selectedDisabilities}
                  setSelectedDisabilities={setSelectedDisabilities}
              />
            )}

            {/* Manual NLS Input Section - Only show if integrate NLS is checked */}
            {integrateNLS && (
                <ManualNLSInput 
                    entries={manualNLSEntries}
                    setEntries={setManualNLSEntries}
                />
            )}

            {/* Manual AI Input Section - Only show if integrate AI is checked */}
            {integrateAI && (
                <ManualAIInput 
                    entries={manualAIEntries}
                    setEntries={setManualAIEntries}
                    defaultGrade={grade}
                />
            )}
            
            {/* Tùy chọn Ngôn ngữ */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isEnglish ? 'bg-blue-900 border-blue-900' : 'bg-white border-slate-300'}`}>
                  {isEnglish && <Check className="text-white w-3 h-3 stroke-[3]" />}
                </div>
                <input 
                  type="checkbox" 
                  checked={isEnglish}
                  onChange={(e) => setIsEnglish(e.target.checked)}
                  className="hidden" 
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-700">Kế hoạch bài dạy bằng ngôn ngữ Tiếng Anh</span>
              </label>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-3.5 rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-xs text-xs sm:text-sm font-medium">
                <div className="flex items-center space-x-2.5">
                  <Info className="shrink-0 text-rose-600" size={18} />
                  <span>{error}</span>
                </div>
                {(error.toLowerCase().includes('khóa api') || error.toLowerCase().includes('api_key') || error.toLowerCase().includes('quota') || error.toLowerCase().includes('hạn mức')) && (
                  <button
                    type="button"
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-900 text-white rounded-lg font-bold text-xs hover:bg-blue-800 transition-colors inline-flex items-center shadow-xs cursor-pointer"
                  >
                    <Key size={13} className="mr-1.5" />
                    Cài đặt Khóa API
                  </button>
                )}
              </div>
            )}
            
            <button
              onClick={handleProcess}
              disabled={loading}
              className={`w-full py-4 rounded-xl shadow-sm flex items-center justify-center space-x-2 text-white font-bold text-sm sm:text-base tracking-wide transition-colors ${
                loading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-blue-900 hover:bg-blue-800 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <span>Hệ thống đang xử lý kế hoạch bài dạy...</span>
              ) : (
                <>
                  <Zap size={18} className="fill-current text-amber-300" />
                  <span>TIẾN HÀNH XỬ LÝ & TÍCH HỢP GIÁO ÁN</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Pedagogical Guide */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
              <h3 className="font-bold text-base mb-5 flex items-center text-slate-100">
                 <ShieldCheck className="mr-2 text-blue-400" size={20} />
                 Quy trình thực hiện sư phạm
              </h3>
              <ul className="space-y-5 text-xs">
                <li className="flex">
                   <div className="shrink-0 w-6 h-6 rounded-md bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-500/30 mr-3 mt-0.5">1</div>
                   <div>
                       <p className="font-bold text-slate-200">Thiết lập thông tin môn & bài học</p>
                       <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">Chọn phân môn, khối lớp và các nội dung chuyên đề cần lồng ghép.</p>
                   </div>
                </li>
                <li className="flex">
                   <div className="shrink-0 w-6 h-6 rounded-md bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-500/30 mr-3 mt-0.5">2</div>
                   <div>
                       <p className="font-bold text-slate-200">Nạp tệp Kế hoạch bài dạy</p>
                       <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">Tải lên file giáo án Word (.docx) hoặc ảnh/PDF trang Sách Giáo Khoa.</p>
                   </div>
                </li>
                <li className="flex">
                   <div className="shrink-0 w-6 h-6 rounded-md bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-500/30 mr-3 mt-0.5">3</div>
                   <div>
                       <p className="font-bold text-slate-200">Xử lý chuẩn hóa & Xuất Word</p>
                       <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">Hệ thống phân tích, bảo toàn định dạng và xuất file Word hoàn chỉnh.</p>
                   </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-wider">Tiêu chuẩn kỹ thuật đầu ra</h4>
              <div className="flex flex-col gap-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start">
                   <div className="mt-1 mr-2.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-900"></div>
                   <p className="flex-1">Bảo toàn 100% hình ảnh đồ họa, bảng biểu và công thức toán học</p>
                </div>
                <div className="flex items-start">
                   <div className="mt-1 mr-2.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-900"></div>
                   <p className="flex-1">Đúng thể thức theo Công văn 5512/BGDĐT hoặc Công văn 2345/BGDĐT</p>
                </div>
                <div className="flex items-start">
                   <div className="mt-1 mr-2.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-900"></div>
                   <p className="flex-1">Phân định rõ ràng các nội dung tích hợp bằng quy chuẩn định dạng</p>
                </div>
                <div className="flex items-start">
                   <div className="mt-1 mr-2.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-900"></div>
                   <p className="flex-1">Tùy biến nhúng thông tin trường học & giáo viên vào phần đầu trang</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="mt-10 mb-16">
           <ResultDisplay 
              result={result} 
              loading={loading} 
              onReset={handleReset} 
              teacherInfo={teacherInfo}
              layoutFormat={layoutFormat}
           />
        </div>
      </main>

      {/* License Modal */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        onLicenseUpdated={(updated) => setLicenseInfo(updated)}
      />

      {/* Teacher Info Modal */}
      <TeacherInfoModal
        isOpen={isTeacherInfoOpen}
        onClose={() => setIsTeacherInfoOpen(false)}
        info={teacherInfo}
        onSave={handleSaveTeacherInfo}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
      
      <footer className="mt-12 text-center text-slate-500 text-xs py-8 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 space-y-2">
          <p className="font-bold text-slate-800 text-sm">
            {teacherInfo.schoolName || 'Trường THCS Đồng Yên'} {teacherInfo.department ? `— ${teacherInfo.department}` : '— Tổ Toán-Tin-CĐS.'}
          </p>
          <p className="text-slate-600 font-medium">
            Tác giả & Bản quyền phần mềm: <span className="font-bold text-blue-950">{teacherInfo.teacherName || 'Mai Văn Hùng'}</span> | Điện thoại/Zalo: <span className="font-semibold text-slate-800">{teacherInfo.phoneNumber || '0941037116'}</span>
          </p>
          <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-100 max-w-xl mx-auto">
            Hệ thống chuyên sâu: Tích hợp Kế hoạch bài dạy & Giáo án theo Chương trình GDPT 2018 (NLS, AI, Giáo dục hòa nhập, GDQP&AN)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;