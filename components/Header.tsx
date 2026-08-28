import React from 'react';
import { GraduationCap, School, BookOpenCheck, ChevronRight, Key, Crown, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LicenseInfo, getLicenseTypeName } from '../services/licenseService';

interface HeaderProps {
  onOpenTeacherInfo?: () => void;
  onOpenApiKey?: () => void;
  onOpenLicense?: () => void;
  schoolName?: string;
  teacherName?: string;
  phoneNumber?: string;
  hasApiKey?: boolean;
  licenseInfo?: LicenseInfo;
}

const Header: React.FC<HeaderProps> = ({ 
  onOpenTeacherInfo, 
  onOpenApiKey,
  onOpenLicense,
  schoolName, 
  teacherName, 
  hasApiKey = false,
  licenseInfo
}) => {
  const isActivated = licenseInfo?.status === 'active' && !licenseInfo.isTrial;
  const isTrial = licenseInfo?.status === 'trial';
  const isExpired = licenseInfo?.status === 'expired' || licenseInfo?.status === 'invalid';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-xs">
      {/* Top Academic Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-900 via-indigo-800 to-sky-700"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-md border border-blue-800 shrink-0">
            <GraduationCap size={28} className="text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 inline-flex items-center">
                <BookOpenCheck size={12} className="mr-1 text-blue-700" />
                Chương trình GDPT 2018
              </span>
              <span className="hidden md:inline-block text-[10px] font-semibold text-slate-500">
                Chuẩn Công văn 5512/BGDĐT
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              HỆ THỐNG TÍCH HỢP NỘI DUNG VÀO GIÁO ÁN
            </h1>
          </div>
        </div>

        {/* Right Actions: License, API Key & Teacher Info */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* License Status Button */}
          {onOpenLicense && (
            <button
              onClick={onOpenLicense}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shadow-xs active:scale-95 cursor-pointer ${
                isActivated 
                  ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 hover:from-amber-500/20 hover:to-emerald-500/20 text-amber-950 border-amber-300' 
                  : isTrial 
                  ? 'bg-blue-50/90 hover:bg-blue-100/90 text-blue-900 border-blue-300' 
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300 animate-bounce'
              }`}
              title="Xem thông tin và kích hoạt bản quyền"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                isActivated ? 'bg-amber-400 text-amber-950' : isTrial ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {isActivated ? <Crown size={14} /> : isTrial ? <Clock size={13} /> : <AlertTriangle size={13} />}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[9px] uppercase font-bold tracking-wider leading-none text-slate-600">Bản Quyền</p>
                <p className="text-xs font-bold mt-0.5 flex items-center">
                  {isActivated ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block"></span>
                      {licenseInfo?.type === 'LIFETIME' ? 'VIP Vĩnh Viễn' : getLicenseTypeName(licenseInfo?.type)}
                    </>
                  ) : isTrial ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 inline-block animate-pulse"></span>
                      Dùng thử ({licenseInfo?.hoursRemaining ?? 24}h)
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 inline-block"></span>
                      Hết hạn - Nhập Key
                    </>
                  )}
                </p>
              </div>
              <span className="md:hidden text-xs font-bold">
                {isActivated ? 'Bản quyền ✓' : isTrial ? `Thử (${licenseInfo?.hoursRemaining}h)` : 'Nhập Key!'}
              </span>
            </button>
          )}

          {/* API Key Config Button */}
          {onOpenApiKey && (
            <button
              onClick={onOpenApiKey}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shadow-xs active:scale-95 cursor-pointer ${
                hasApiKey 
                  ? 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-900 border-emerald-300' 
                  : 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 border-amber-300'
              }`}
              title="Cài đặt khóa API cá nhân (Google Gemini)"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                hasApiKey ? 'bg-emerald-200/70 text-emerald-800' : 'bg-amber-200/70 text-amber-800'
              }`}>
                <Key size={13} />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[9px] uppercase font-bold tracking-wider leading-none text-slate-600">Google AI Key</p>
                <p className="text-xs font-bold mt-0.5 flex items-center">
                  {hasApiKey ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block animate-pulse"></span>
                      Đã có khóa
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block"></span>
                      Nhập khóa API
                    </>
                  )}
                </p>
              </div>
              <span className="md:hidden text-xs font-bold">
                {hasApiKey ? 'Key AI ✓' : 'Khóa API'}
              </span>
            </button>
          )}

          {/* User / School Info Button */}
          {onOpenTeacherInfo && (
            <button
              onClick={onOpenTeacherInfo}
              className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/80 text-slate-800 text-xs sm:text-sm font-semibold transition-all border border-slate-200 hover:border-blue-300 shadow-xs active:scale-95 group cursor-pointer"
              title="Cập nhật thông tin giáo viên và trường học"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-800 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <School size={15} />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[10px] text-slate-600 uppercase font-semibold leading-none">Hồ sơ giáo viên</p>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[150px] mt-0.5">
                  {schoolName || teacherName || 'Cấu hình thông tin'}
                </p>
              </div>
              <span className="sm:hidden text-xs font-bold text-blue-900">Hồ sơ</span>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
