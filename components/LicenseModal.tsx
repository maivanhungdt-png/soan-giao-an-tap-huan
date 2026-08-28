import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Lock, 
  RefreshCw, 
  X, 
  HelpCircle, 
  PhoneCall, 
  Settings, 
  Database,
  Crown,
  Calendar,
  Laptop
} from 'lucide-react';
import { 
  LicenseInfo, 
  getOrCreateDeviceId, 
  getLicenseStatus, 
  activateLicenseKey, 
  removeLicenseKey, 
  getLicenseTypeName,
  getGasUrl,
  setGasUrl,
  verifyLicenseWithServer
} from '../services/licenseService';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseUpdated?: (license: LicenseInfo) => void;
  onOpenKeyGenerator?: () => void;
}

const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  onLicenseUpdated,
  onOpenKeyGenerator
}) => {
  const [license, setLicense] = useState<LicenseInfo>(() => getLicenseStatus());
  const [inputKey, setInputKey] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedDevice, setCopiedDevice] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Admin GAS URL settings
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [gasUrlInput, setGasUrlInput] = useState(() => getGasUrl());
  const [gasStatus, setGasStatus] = useState<string>('');

  const deviceId = getOrCreateDeviceId();

  useEffect(() => {
    if (isOpen) {
      const current = getLicenseStatus();
      setLicense(current);
      setMessage(null);
      setGasUrlInput(getGasUrl());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDevice(true);
    setTimeout(() => setCopiedDevice(false), 2000);
  };

  const handleCopyActiveKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleActivate = async () => {
    const trimmed = inputKey.trim().toUpperCase();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mã kích hoạt bản quyền.' });
      return;
    }

    setIsActivating(true);
    setMessage({ type: 'info', text: 'Đang kết nối và xác thực với máy chủ...' });

    try {
      const res = await activateLicenseKey(trimmed, customerName);
      if (res.success && res.license) {
        setLicense(res.license);
        setMessage({ type: 'success', text: res.message });
        setInputKey('');
        if (onLicenseUpdated) {
          onLicenseUpdated(res.license);
        }
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi kết nối khi kích hoạt.' });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSyncServer = async () => {
    setIsActivating(true);
    setMessage({ type: 'info', text: 'Đang đồng bộ trạng thái với Google Sheets...' });
    try {
      const updated = await verifyLicenseWithServer();
      setLicense(updated);
      if (onLicenseUpdated) {
        onLicenseUpdated(updated);
      }
      setMessage({ type: 'success', text: 'Đã đồng bộ thông tin bản quyền mới nhất.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Không thể đồng bộ lúc này.' });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSaveGasUrl = () => {
    setGasUrl(gasUrlInput.trim());
    setGasStatus('Đã lưu cấu hình Google Apps Script URL.');
    setTimeout(() => setGasStatus(''), 3000);
  };

  const handleDeactivate = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy kích hoạt key trên máy tính này không?')) {
      removeLicenseKey();
      const updated = getLicenseStatus();
      setLicense(updated);
      if (onLicenseUpdated) {
        onLicenseUpdated(updated);
      }
      setMessage({ type: 'info', text: 'Đã gỡ bản quyền khỏi máy.' });
    }
  };

  const isActivated = license.status === 'active' && !license.isTrial;
  const isTrialActive = license.status === 'trial';
  const isExpired = license.status === 'expired' || license.status === 'invalid';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center shadow-inner">
              <KeyRound size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Kích Hoạt & Bản Quyền Phần Mềm
                </h3>
                {isActivated && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-flex items-center">
                    <CheckCircle2 size={11} className="mr-1" /> Đã kích hoạt
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200/80">
                Bảo vệ 1 key / 1 máy • Quản lý trực tiếp trên Google Trang tính
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 relative z-10">
            <button
              onClick={() => setShowAdminSettings(!showAdminSettings)}
              className={`p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
                showAdminSettings ? 'bg-white/20 text-white' : ''
              }`}
              title="Cài đặt kết nối Google Sheet & Công cụ tạo Key"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Admin GAS URL & Key Generator Drawer (Collapsible) */}
          {showAdminSettings && (
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3 animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
                  <Database size={14} className="mr-1.5" />
                  Cấu hình Quản trị & Công cụ Tạo Key
                </span>
                <a
                  href="#admin-guide"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Vui lòng xem file HUONG_DAN_GOOGLE_SHEETS_KEY.md trong thư mục mã nguồn để lấy mã code Apps Script và hướng dẫn thiết lập trong 2 phút.');
                  }}
                  className="text-[11px] text-sky-400 hover:underline flex items-center"
                >
                  <HelpCircle size={12} className="mr-1" /> Hướng dẫn tạo Sheet
                </a>
              </div>

              <p className="text-xs text-slate-300">
                Dán URL Web App (Google Apps Script) của Google Sheet quản lý key vào đây:
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-hidden focus:border-amber-400"
                />
                <button
                  onClick={handleSaveGasUrl}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Lưu
                </button>
              </div>
              {gasStatus && (
                <p className="text-xs text-emerald-400 font-medium">{gasStatus}</p>
              )}
            </div>
          )}

          {/* Current Status Card */}
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className={`p-4 ${
              isActivated 
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50/60 border-b border-emerald-200/80' 
                : isTrialActive 
                ? 'bg-gradient-to-r from-amber-50 to-orange-50/60 border-b border-amber-200/80' 
                : 'bg-gradient-to-r from-rose-50 to-red-50/60 border-b border-rose-200/80'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    isActivated 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : isTrialActive 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'bg-rose-500 text-white shadow-md'
                  }`}>
                    {isActivated ? <Crown size={22} /> : isTrialActive ? <Clock size={22} /> : <Lock size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {getLicenseTypeName(license.type)}
                      </h4>
                      {isActivated && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          CHÍNH THỨC
                        </span>
                      )}
                      {isTrialActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          DÙNG THỬ 24H
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isActivated ? (
                        license.type === 'LIFETIME' ? (
                          'Bản quyền vĩnh viễn không giới hạn thời gian.'
                        ) : (
                          `Hạn sử dụng: Còn lại ${license.daysRemaining ?? '---'} ngày (Đến ngày ${license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('vi-VN') : '---'})`
                        )
                      ) : isTrialActive ? (
                        `Bạn còn ${license.hoursRemaining ?? 24} giờ trải nghiệm miễn phí toàn bộ tính năng.`
                      ) : (
                        'Đã hết hạn sử dụng. Vui lòng kích hoạt key để tiếp tục tạo giáo án.'
                      )}
                    </p>
                  </div>
                </div>

                {isActivated && (
                  <button
                    onClick={handleSyncServer}
                    disabled={isActivating}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                    title="Đồng bộ lại với Google Sheets"
                  >
                    <RefreshCw size={12} className={isActivating ? 'animate-spin' : ''} />
                    <span>Đồng bộ</span>
                  </button>
                )}
              </div>
            </div>

            {/* Device ID and Active Key Details */}
            <div className="p-3.5 bg-slate-50/80 divide-y divide-slate-200/70 text-xs">
              {/* Device ID Row */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Laptop size={14} className="text-slate-500" />
                  <span className="font-semibold">Mã máy (Device ID):</span>
                </div>
                <div className="flex items-center space-x-2">
                  <code className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-800 text-[11px] sm:text-xs select-all">
                    {deviceId}
                  </code>
                  <button
                    onClick={handleCopyDeviceId}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="Sao chép mã máy để gửi người bán key"
                  >
                    {copiedDevice ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Active Key Row (If activated) */}
              {isActivated && license.key && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <KeyRound size={14} className="text-slate-500" />
                    <span className="font-semibold">Mã key đang dùng:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded font-mono font-bold text-emerald-800 text-[11px]">
                      {license.key}
                    </code>
                    <button
                      onClick={() => handleCopyActiveKey(license.key!)}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title="Sao chép key"
                    >
                      {copiedKey ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={handleDeactivate}
                      className="text-[10px] text-rose-600 hover:underline font-semibold ml-1 cursor-pointer"
                      title="Gỡ key để chuyển sang máy khác"
                    >
                      Gỡ key
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activation Form */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-4">
            <div className="flex items-center space-x-2">
              <KeyRound size={16} className="text-blue-900" />
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                {isActivated ? 'Đổi hoặc Gia Hạn Key Mới' : 'Nhập Mã Kích Hoạt Bản Quyền'}
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã bản quyền (License Key):
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: GV-1Y-XXXX-XXXX hoặc GV-VIP-XXXX-XXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold tracking-wider uppercase text-slate-900 bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên giáo viên / Đơn vị (tùy chọn):
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Thầy/Cô: Mai Văn Hùng"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Message Banner */}
              {message && (
                <div className={`p-3 rounded-xl flex items-start space-x-2 text-xs font-medium ${
                  message.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                    : message.type === 'error' 
                    ? 'bg-rose-50 text-rose-900 border border-rose-200' 
                    : 'bg-blue-50 text-blue-900 border border-blue-200'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : message.type === 'error' ? (
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <RefreshCw size={16} className="text-blue-600 shrink-0 mt-0.5 animate-spin" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <button
                onClick={handleActivate}
                disabled={isActivating || !inputKey.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isActivating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Đang kích hoạt...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Kích Hoạt Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pricing / Packages Table */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <Sparkles size={14} className="mr-1.5 text-amber-500" />
              Các gói thời hạn bản quyền hỗ trợ:
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center shadow-xs">
                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">Gói 1 Năm</span>
                <p className="text-xs font-bold text-slate-900 mt-1.5">365 Ngày</p>
                <p className="text-[10px] text-slate-500 mt-0.5">1 máy tính</p>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center shadow-xs">
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">Gói 2 Năm</span>
                <p className="text-xs font-bold text-slate-900 mt-1.5">730 Ngày</p>
                <p className="text-[10px] text-slate-500 mt-0.5">1 máy tính</p>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center shadow-xs">
                <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">Gói 3 Năm</span>
                <p className="text-xs font-bold text-slate-900 mt-1.5">1095 Ngày</p>
                <p className="text-[10px] text-slate-500 mt-0.5">1 máy tính</p>
              </div>

              <div className="p-2.5 rounded-xl border border-amber-300 bg-amber-50/50 text-center shadow-xs">
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-400">Vĩnh Viễn VIP</span>
                <p className="text-xs font-extrabold text-amber-950 mt-1.5">Trọn Đời</p>
                <p className="text-[10px] text-amber-700 mt-0.5">Hỗ trợ trọn đời</p>
              </div>
            </div>
          </div>

          {/* Contact / Purchase Info */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <PhoneCall size={16} />
              </div>
              <div>
                <p className="font-bold text-blue-950">Liên hệ mua Key & Hỗ trợ kỹ thuật</p>
                <p className="text-[11px] text-blue-800">
                  Thầy Mai Văn Hùng • Hotline / Zalo: <span className="font-bold font-mono text-blue-900">0941037116</span>
                </p>
              </div>
            </div>
            <a
              href="https://zalo.me/0941037116"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs"
            >
              Nhắn Zalo
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Hệ thống bảo vệ bản quyền GDPT 2018
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenseModal;
