import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Key, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  X, 
  FileSpreadsheet, 
  UploadCloud, 
  Layers, 
  Calendar, 
  DollarSign,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { getGasUrl, LicenseType } from '../services/licenseService';

interface GeneratedKeyItem {
  key: string;
  machineId: string; // Mã phần cứng
  activatedAt: string; // Ngày kích hoạt
  licenseType: string; // Loại bản quyền
  createdAt: string; // Ngày tạo
  expiresAt: string; // Ngày hết hạn
}

interface KeyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyGeneratorModal: React.FC<KeyGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [keyType, setKeyType] = useState<LicenseType>('1_YEAR');
  const [quantity, setQuantity] = useState<number>(10);
  const [customPrefix, setCustomPrefix] = useState<string>('');
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeyItem[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isPushingToSheet, setIsPushingToSheet] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const getPrefix = (type: LicenseType) => {
    if (customPrefix.trim()) return customPrefix.trim().toUpperCase();
    switch (type) {
      case '1_YEAR':
        return 'GV1Y';
      case '2_YEAR':
        return 'GV2Y';
      case '3_YEAR':
        return 'GV3Y';
      case 'LIFETIME':
        return 'GVVIP';
      default:
        return 'KEY';
    }
  };

  const getTypeName = (type: LicenseType) => {
    switch (type) {
      case '1_YEAR':
        return '1 Năm (200k)';
      case '2_YEAR':
        return '2 Năm';
      case '3_YEAR':
        return '3 Năm';
      case 'LIFETIME':
        return 'Vĩnh Viễn (VIP)';
      default:
        return '1 Năm';
    }
  };

  const getExpiresDurationText = (type: LicenseType) => {
    switch (type) {
      case '1_YEAR':
        return '1 năm từ lúc kích hoạt';
      case '2_YEAR':
        return '2 năm từ lúc kích hoạt';
      case '3_YEAR':
        return '3 năm từ lúc kích hoạt';
      case 'LIFETIME':
        return 'Vĩnh viễn';
      default:
        return '1 năm từ lúc kích hoạt';
    }
  };

  const handleGenerate = () => {
    const prefix = getPrefix(keyType);
    const now = new Date();
    const createdAtStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN');
    const typeLabel = getTypeName(keyType);
    const expireNote = getExpiresDurationText(keyType);

    const newItems: GeneratedKeyItem[] = [];

    for (let i = 0; i < quantity; i++) {
      const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const rand3 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const key = `${prefix}-${rand1}-${rand2}-${rand3}`;

      newItems.push({
        key,
        machineId: '', // Trống - chờ máy khách kích hoạt
        activatedAt: '', // Trống - tính từ lúc khách kích hoạt
        licenseType: typeLabel,
        createdAt: createdAtStr,
        expiresAt: expireNote
      });
    }

    setGeneratedKeys(newItems);
    setSyncMessage(null);
  };

  const handleExportExcel = () => {
    if (generatedKeys.length === 0) return;

    // Chuẩn bị dữ liệu theo đúng chuẩn ảnh 1 của người dùng:
    // Cột A: Mã kích hoạt (Key)
    // Cột B: Mã phần cứng (Machine ID)
    // Cột C: Ngày kích hoạt
    // Cột D: Loại bản quyền
    // Cột E: Ngày tạo
    // Cột F: Ngày hết hạn
    const excelRows = generatedKeys.map((item) => ({
      'Mã kích hoạt (Key)': item.key,
      'Mã phần cứng (Machine ID)': item.machineId,
      'Ngày kích hoạt': item.activatedAt,
      'Loại bản quyền': item.licenseType,
      'Ngày tạo': item.createdAt,
      'Ngày hết hạn': item.expiresAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Định dạng độ rộng cột
    worksheet['!cols'] = [
      { wch: 25 }, // Mã kích hoạt (Key)
      { wch: 30 }, // Mã phần cứng (Machine ID)
      { wch: 20 }, // Ngày kích hoạt
      { wch: 18 }, // Loại bản quyền
      { wch: 22 }, // Ngày tạo
      { wch: 25 }  // Ngày hết hạn
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Keys');

    const fileName = `Danh_Sach_Key_${keyType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleCopySingle = (key: string, index: number) => {
    navigator.clipboard.writeText(key);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (generatedKeys.length === 0) return;
    const allText = generatedKeys.map((k) => k.key).join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handlePushToGoogleSheets = async () => {
    const gasUrl = getGasUrl();
    if (!gasUrl) {
      setSyncMessage({
        type: 'error',
        text: 'Chưa cấu hình URL Google Apps Script. Vui lòng dán URL Web App vào phần Cài đặt của Hộp thoại Bản Quyền.'
      });
      return;
    }

    if (generatedKeys.length === 0) {
      setSyncMessage({ type: 'error', text: 'Chưa có danh sách key để tải lên.' });
      return;
    }

    setIsPushingToSheet(true);
    setSyncMessage(null);

    try {
      const payload = {
        action: 'import_keys',
        keys: generatedKeys.map((k) => ({
          key: k.key,
          type: keyType,
          licenseType: k.licenseType,
          createdAt: k.createdAt,
          expiresAt: k.expiresAt
        }))
      };

      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const res = await response.json();
      if (res && res.success) {
        setSyncMessage({
          type: 'success',
          text: `Đã đồng bộ thành công ${generatedKeys.length} key lên Google Trang tính!`
        });
      } else {
        setSyncMessage({
          type: 'error',
          text: res?.message || 'Có lỗi khi đồng bộ lên Google Sheets.'
        });
      }
    } catch (e: any) {
      setSyncMessage({
        type: 'error',
        text: 'Không thể kết nối với Google Apps Script. Bạn có thể xuất file Excel và dán thủ công vào Sheet.'
      });
    } finally {
      setIsPushingToSheet(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950 via-indigo-900 to-sky-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-md">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Công Cụ Tạo Key & Xuất File Excel</span>
                <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-extrabold uppercase">
                  Dành cho Quản Trị
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Tạo mã bản quyền theo đợt (200k/lần) • Xuất Excel đúng chuẩn • Tính hạn từ lúc kích hoạt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Key Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
                  <Calendar size={13} className="mr-1 text-blue-700" />
                  Loại gói bản quyền:
                </label>
                <select
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value as LicenseType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="1_YEAR">Gói 1 Năm (200.000 VNĐ - 365 Ngày)</option>
                  <option value="2_YEAR">Gói 2 Năm (730 Ngày)</option>
                  <option value="3_YEAR">Gói 3 Năm (1095 Ngày)</option>
                  <option value="LIFETIME">Gói Vĩnh Viễn VIP (Trọn Đời)</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
                  <Layers size={13} className="mr-1 text-indigo-700" />
                  Số lượng Key cần tạo:
                </label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                >
                  <option value={1}>1 Key</option>
                  <option value={5}>5 Key</option>
                  <option value={10}>10 Key</option>
                  <option value={20}>20 Key</option>
                  <option value={50}>50 Key</option>
                  <option value={100}>100 Key</option>
                </select>
              </div>

              {/* Custom Prefix */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
                  <Key size={13} className="mr-1 text-amber-600" />
                  Tiền tố mã (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())}
                  placeholder={`Mặc định: ${getPrefix(keyType)}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono uppercase text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-600 font-medium flex items-center space-x-1.5">
                <DollarSign size={14} className="text-emerald-600" />
                <span>Quy chuẩn: <strong className="text-blue-900">200k / lần</strong> • Thời hạn bắt đầu tính từ lúc khách kích hoạt key.</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw size={15} />
                  <span>Sinh {quantity} Mã Key</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync Message Alert */}
          {syncMessage && (
            <div className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-medium ${
              syncMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              {syncMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <X size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{syncMessage.text}</span>
            </div>
          )}

          {/* Table Preview */}
          {generatedKeys.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center">
                  <FileSpreadsheet size={16} className="mr-1.5 text-emerald-600" />
                  Danh Sách {generatedKeys.length} Key Chuẩn Cấu Trúc (Sẵn sàng Xuất Excel)
                </h4>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyAll}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    title="Sao chép toàn bộ danh sách key"
                  >
                    {copiedAll ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedAll ? 'Đã chép tất cả' : 'Sao chép tất cả'}</span>
                  </button>

                  <button
                    onClick={handlePushToGoogleSheets}
                    disabled={isPushingToSheet}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 text-xs font-semibold shadow-xs flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    title="Tải trực tiếp danh sách key này lên Google Trang tính đã kết nối"
                  >
                    <UploadCloud size={14} className={isPushingToSheet ? 'animate-bounce text-sky-700' : 'text-sky-700'} />
                    <span>{isPushingToSheet ? 'Đang đẩy lên...' : 'Đẩy vào Google Sheet'}</span>
                  </button>

                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Download size={14} />
                    <span>Xuất File Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Table rendering matching the exact image 1 columns */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 w-10 text-center">STT</th>
                        <th className="p-2.5">Mã kích hoạt (Key)</th>
                        <th className="p-2.5">Mã phần cứng (Machine ID)</th>
                        <th className="p-2.5">Ngày kích hoạt</th>
                        <th className="p-2.5">Loại bản quyền</th>
                        <th className="p-2.5">Ngày tạo</th>
                        <th className="p-2.5">Ngày hết hạn</th>
                        <th className="p-2.5 text-center w-16">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {generatedKeys.map((item, idx) => (
                        <tr key={item.key} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-900">{item.key}</td>
                          <td className="p-2.5 text-slate-400 italic font-mono text-[11px]">
                            {item.machineId || '(Chờ kích hoạt)'}
                          </td>
                          <td className="p-2.5 text-slate-400 italic text-[11px]">
                            {item.activatedAt || '(Tính khi kích hoạt)'}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                              {item.licenseType}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600 text-[11px]">{item.createdAt}</td>
                          <td className="p-2.5 text-emerald-700 font-medium text-[11px]">{item.expiresAt}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleCopySingle(item.key, idx)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                              title="Sao chép mã key này"
                            >
                              {copiedIndex === idx ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Xuất file Excel tương thích hoàn toàn với Microsoft Excel & Google Sheets
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

export default KeyGeneratorModal;
