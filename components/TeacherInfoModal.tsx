import React, { useState, useEffect } from 'react';
import { School, User, Phone, BookOpen, X, Check, Save, GraduationCap, Building2 } from 'lucide-react';

export interface TeacherInfo {
  schoolName: string;
  teacherName: string;
  reviewerName?: string;
  phoneNumber: string;
  department: string;
  includeInHeader: boolean;
}

interface TeacherInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: TeacherInfo;
  onSave: (info: TeacherInfo) => void;
}

const TeacherInfoModal: React.FC<TeacherInfoModalProps> = ({
  isOpen,
  onClose,
  info,
  onSave,
}) => {
  const [formData, setFormData] = useState<TeacherInfo>(info);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(info);
  }, [info, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900/80 rounded-xl border border-blue-700 flex items-center justify-center text-amber-300">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Hồ sơ Giáo viên & Đơn vị</h2>
              <p className="text-slate-400 text-xs">Cấu hình thông tin chuẩn hóa xuất giáo án</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
              <Building2 size={14} className="mr-1.5 text-blue-700" />
              Tên Trường / Cơ quan đơn vị
            </label>
            <input
              type="text"
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              placeholder="VD: Trường THCS Đồng Yên"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-800 font-medium text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <User size={14} className="mr-1.5 text-blue-700" />
                Người xây dựng kế hoạch
              </label>
              <input
                type="text"
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                placeholder="VD: Mai Văn Hùng"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-800 font-medium text-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <User size={14} className="mr-1.5 text-blue-700" />
                Người kiểm tra
              </label>
              <input
                type="text"
                value={formData.reviewerName || ''}
                onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                placeholder="VD: Nguyễn Thị Huệ"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-800 font-medium text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <BookOpen size={14} className="mr-1.5 text-blue-700" />
                Tổ chuyên môn / Khối
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="VD: Khoa học Tự Nhiên"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-800 font-medium text-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <Phone size={14} className="mr-1.5 text-blue-700" />
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="VD: 0941037116"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-800 font-medium text-sm transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer transition-colors hover:bg-blue-50/50">
              <input
                type="checkbox"
                checked={formData.includeInHeader}
                onChange={(e) => setFormData({ ...formData, includeInHeader: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                Tự động chèn thông tin Trường, Tổ chuyên môn & Giáo viên vào tiêu đề đầu trang và phần ký duyệt ở chân trang Word (.docx)
              </span>
            </label>
          </div>

          <div className="pt-3 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm ${
                savedSuccess ? 'bg-emerald-700' : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check size={18} />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Lưu hồ sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherInfoModal;
