import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Trash2, X, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cleanApiKey } from '../services/geminiService';

export const USER_API_KEY_STORAGE = 'user_gemini_api_key';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey
}) => {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    setInputKey(apiKey || '');
    setTestStatus('idle');
    setTestMessage('');
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const cleaned = cleanApiKey(inputKey);
    onSaveApiKey(cleaned);
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
    setTestStatus('idle');
    setTestMessage('Đã xóa khóa API.');
  };

  const handleTestKey = async () => {
    const trimmed = cleanApiKey(inputKey);
    if (!trimmed) {
      setTestStatus('error');
      setTestMessage('Vui lòng nhập khóa API trước khi kiểm tra.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Đang kết nối thử nghiệm với Google AI...');

    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-8b'
    ];
    let lastErr: any = null;
    let successfulModel = '';

    try {
      const ai = new GoogleGenAI({ apiKey: trimmed });
      
      for (const m of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: 'Xin chào, vui lòng phản hồi đúng chữ "OK".'
          });

          if (response && response.text) {
            successfulModel = m;
            break;
          }
        } catch (mErr: any) {
          lastErr = mErr;
          console.warn(`Test SDK model ${m} failed:`, mErr);
          
          // Thử gọi qua REST fetch nếu SDK lỗi
          try {
            const restResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${trimmed}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'OK' }] }]
              })
            });
            if (restResp.ok) {
              successfulModel = `${m} (REST)`;
              break;
            }
          } catch (fetchErr) {
            // Tiếp tục thử model tiếp theo
          }
        }
      }

      if (successfulModel) {
        setTestStatus('success');
        setTestMessage(`Khóa API hợp lệ! Kết nối thành công với Google Gemini (${successfulModel}). Bạn có thể nhấn "Lưu khóa API" ngay.`);
      } else {
        throw lastErr || new Error('Không nhận được phản hồi từ AI.');
      }
    } catch (err: any) {
      console.error('API Key Test Error:', err);
      setTestStatus('error');
      const msg = err?.message || JSON.stringify(err || '');
      const errStr = msg.toLowerCase();
      if (errStr.includes('api_key_invalid') || errStr.includes('invalid') || errStr.includes('400')) {
        setTestMessage('Khóa API không hợp lệ hoặc đã bị vô hiệu hóa. Vui lòng kiểm tra lại mã khóa tạo từ Google AI Studio.');
      } else if (errStr.includes('quota') || errStr.includes('429') || errStr.includes('resource_exhausted')) {
        setTestMessage('Khóa API đã hết hạn mức (Quota / 15 lượt gọi/phút cho Free tier). Vui lòng đổi khóa khác.');
      } else if (errStr.includes('404') || errStr.includes('not_found')) {
        setTestMessage('Mã khóa API không hỗ trợ model hoặc chưa kích hoạt. Mã Google AI Studio thường bắt đầu bằng AIzaSy...');
      } else {
        setTestMessage(`Lỗi kết nối: ${msg}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
              <Key size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Cấu hình Khóa API (Google Gemini)</h3>
              <p className="text-xs text-blue-200">Nhập API Key cá nhân để sử dụng không giới hạn</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Alert */}
          {apiKey ? (
            <div className="flex items-center p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 size={18} className="text-emerald-600 mr-2 shrink-0" />
              <div className="flex-1">
                <span className="font-bold">Đã thiết lập khóa API cá nhân: </span>
                <span className="font-mono text-[11px] text-emerald-900">
                  {apiKey.substring(0, 8)}••••••••{apiKey.substring(apiKey.length - 4)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertCircle size={18} className="text-amber-600 mr-2 shrink-0" />
              <div>
                <span className="font-bold">Chưa cấu hình khóa API riêng: </span>
                <span>Hệ thống sẽ sử dụng khóa mặc định của ứng dụng (có thể bị giới hạn lưu lượng).</span>
              </div>
            </div>
          )}

          {/* API Key Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Khóa API của bạn (Google AI Studio Key)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Dán mã khóa dạng AIzaSy..."
                className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                  title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center">
              <ShieldCheck size={13} className="mr-1 text-emerald-600" />
              Khóa API được lưu cục bộ trên trình duyệt của bạn (LocalStorage) và không tải lên máy chủ bên ngoài.
            </p>
          </div>

          {/* Test Status Feedback */}
          {testStatus !== 'idle' && (
            <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
              testStatus === 'testing' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
              testStatus === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {testStatus === 'testing' && <RefreshCw size={15} className="animate-spin text-blue-600 mt-0.5 shrink-0" />}
              {testStatus === 'success' && <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />}
              {testStatus === 'error' && <AlertCircle size={15} className="text-rose-600 mt-0.5 shrink-0" />}
              <span className="font-medium leading-relaxed">{testMessage}</span>
            </div>
          )}

          {/* Guide on Getting Free API Key */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 inline-flex items-center justify-center mr-1.5 text-[11px]">?</span>
                Cách lấy khóa Google Gemini API miễn phí:
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 hover:text-blue-900 inline-flex items-center hover:underline font-semibold"
              >
                Trang lấy Key <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11.5px] leading-relaxed">
              <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-700 font-semibold underline">aistudio.google.com/app/apikey</a> và đăng nhập Google.</li>
              <li>Nhấn vào nút màu xanh <b>"Create API key"</b> (Tạo khóa API).</li>
              <li>Sao chép mã khóa (bắt đầu bằng <code>AIzaSy...</code>) và dán vào ô trên.</li>
              <li>Nhấn <b>"Kiểm tra"</b> rồi chọn <b>"Lưu khóa API"</b>.</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 size={14} className="mr-1.5" />
                Xóa khóa
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testStatus === 'testing' || !inputKey.trim()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center"
            >
              <RefreshCw size={13} className={`mr-1.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
              Kiểm tra
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 active:bg-blue-950 rounded-xl transition-colors shadow-sm cursor-pointer inline-flex items-center"
            >
              <CheckCircle2 size={14} className="mr-1.5" />
              Lưu khóa API
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
