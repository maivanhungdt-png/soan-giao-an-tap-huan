import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';
import { NLS_COMPONENT_OPTIONS, NLS_LEVEL_DETAILS } from '../constants';
import { ManualNLSEntry } from '../types';

interface ManualNLSInputProps {
  entries: ManualNLSEntry[];
  setEntries: (entries: ManualNLSEntry[]) => void;
}

const ManualNLSInput: React.FC<ManualNLSInputProps> = ({ entries, setEntries }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedCode, setSelectedCode] = useState<string>(NLS_COMPONENT_OPTIONS[0].code);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [description, setDescription] = useState<string>('');

  // Update level selection when component changes
  useEffect(() => {
    setSelectedLevel("");
    setDescription("");
  }, [selectedCode]);

  // Handle Level Change
  const handleLevelChange = (levelCode: string) => {
    setSelectedLevel(levelCode);
    
    // Auto-fill description based on selected level
    if (levelCode) {
        const details = NLS_LEVEL_DETAILS[selectedCode];
        const detail = details?.find(d => d.code === levelCode);
        if (detail) {
            setDescription(detail.desc);
        }
    } else {
        setDescription("");
    }
  };

  const handleAdd = () => {
    if (!description.trim()) {
        alert("Vui lòng nhập nội dung mô tả năng lực.");
        return;
    }

    const component = NLS_COMPONENT_OPTIONS.find(opt => opt.code === selectedCode);
    const finalCode = selectedLevel ? `${selectedCode}.${selectedLevel}` : selectedCode;

    const newEntry: ManualNLSEntry = {
      id: Date.now().toString(),
      code: finalCode,
      name: component ? component.label : finalCode,
      description: description.trim()
    };

    setEntries([...entries, newEntry]);
    
    // Reset fields except component (for easier repeated entry)
    setSelectedLevel("");
    setDescription(""); 
  };

  const handleRemove = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  // Get available levels for current component
  const availableLevels = NLS_LEVEL_DETAILS[selectedCode] || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden mt-6">
      <div 
        className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
            <Target size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Chỉ định Năng lực số cụ thể theo Khung chuẩn (Tùy chọn)</h3>
            <p className="text-[11px] text-slate-500">Thiết lập các chỉ số hành vi, thành phần NLS và mức độ đạt được</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={isExpanded} 
            onChange={() => setIsExpanded(!isExpanded)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-600 cursor-pointer"
          />
          <span className="text-xs font-semibold text-slate-600">{isExpanded ? 'Đang mở' : 'Chi tiết'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            
            {/* Dropdown 1: Thành phần (Component) */}
            <div className="md:col-span-4 space-y-1.5">
               <label className="block text-xs font-bold text-slate-700 uppercase">1. Thành phần NLS</label>
               <div className="relative">
                 <select
                   value={selectedCode}
                   onChange={(e) => setSelectedCode(e.target.value)}
                   className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-800 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                 >
                   {NLS_COMPONENT_OPTIONS.map((opt) => (
                     <option key={opt.code} value={opt.code}>
                       {opt.label}
                     </option>
                   ))}
                 </select>
               </div>
            </div>

            {/* Dropdown 2: Mức độ (Level) */}
            <div className="md:col-span-3 space-y-1.5">
               <label className="block text-xs font-bold text-slate-700 uppercase">2. Mức độ đạt được</label>
               <div className="relative">
                 <select
                   value={selectedLevel}
                   onChange={(e) => handleLevelChange(e.target.value)}
                   disabled={availableLevels.length === 0}
                   className={`block w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-800 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none
                      ${availableLevels.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   <option value="">-- Mặc định tự động --</option>
                   {availableLevels.map((lvl) => (
                     <option key={lvl.code} value={lvl.code}>
                       {lvl.code}
                     </option>
                   ))}
                 </select>
               </div>
            </div>

            {/* Input Description */}
            <div className="md:col-span-5 space-y-1.5">
               <label className="block text-xs font-bold text-slate-700 uppercase">3. Mô tả biểu hiện hành vi</label>
               <textarea
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Mô tả cụ thể hoạt động hoặc yêu cầu cần đạt..."
                 rows={2}
                 className="block w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-slate-800 font-normal text-xs sm:text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
               />
            </div>

            {/* Add Button */}
            <div className="md:col-span-12 pt-1 flex justify-end">
               <button
                 onClick={handleAdd}
                 className="flex items-center space-x-1.5 bg-blue-900 text-white px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm hover:bg-blue-800 transition-colors shadow-sm active:scale-95"
               >
                 <Plus size={16} />
                 <span>Thêm chỉ tiêu NLS</span>
               </button>
            </div>
          </div>

          {/* List of Added Entries */}
          {entries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chỉ tiêu đã thiết lập ({entries.length})</h4>
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start bg-slate-50 border border-slate-200 rounded-xl p-3.5 group hover:border-blue-300 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200/60">
                          {entry.code}
                        </span>
                        <span className="text-xs text-slate-600 font-semibold truncate max-w-[240px]">
                            {NLS_COMPONENT_OPTIONS.find(o => entry.code.startsWith(o.code))?.label.replace(/^\d\.\d\.\s/, '')}
                        </span>
                    </div>
                    <p className="text-slate-700 text-xs sm:text-sm mt-1 leading-relaxed">
                      {entry.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="ml-3 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManualNLSInput;