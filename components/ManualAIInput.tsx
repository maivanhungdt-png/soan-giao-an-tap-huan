import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';
import { ManualAIEntry } from '../types';
import { parseAICSV } from '../utils/csvParser';
import { YeuCauCanDat } from '../masterData';

interface ManualAIInputProps {
  entries: ManualAIEntry[];
  setEntries: (entries: ManualAIEntry[]) => void;
  defaultGrade?: number; // optionally pass selected grade from lesson form to filter
}

const ManualAIInput: React.FC<ManualAIInputProps> = ({ entries, setEntries, defaultGrade }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  const parsedData = useMemo(() => parseAICSV(), []);
  
  // States for dropdowns
  const [selectedLop, setSelectedLop] = useState<string>('');
  const [selectedNangLuc, setSelectedNangLuc] = useState<string>('');
  const [selectedYCCD, setSelectedYCCD] = useState<string>('');
  
  const [description, setDescription] = useState<string>('');

  // Extract unique Lớp options
  const lopOptions = useMemo(() => {
    const lops = new Set<string>();
    parsedData.forEach(item => lops.add(item.lop));
    // Sort naturally: Lớp 1, Lớp 2, ..., Lớp 10, Lớp 11, Lớp 12
    return Array.from(lops).sort((a, b) => {
        const numA = parseInt(a.replace('Lớp ', ''));
        const numB = parseInt(b.replace('Lớp ', ''));
        return numA - numB;
    });
  }, [parsedData]);
  
  // Set default Lop based on defaultGrade
  useEffect(() => {
      if (defaultGrade) {
          const lopStr = `Lớp ${defaultGrade}`;
          if (lopOptions.includes(lopStr)) {
              setSelectedLop(lopStr);
          }
      }
  }, [defaultGrade, lopOptions]);

  // Extract Năng lực based on selected Lớp
  const nangLucOptions = useMemo(() => {
      if (!selectedLop) return [];
      const nl = new Map<string, string>(); // code -> name
      parsedData.filter(d => d.lop === selectedLop).forEach(item => {
          const key = `${item.maNangLuc} - ${item.tenNangLuc}`;
          nl.set(item.maNangLuc, key);
      });
      return Array.from(nl.entries()).map(([code, label]) => ({ code, label }));
  }, [parsedData, selectedLop]);
  
  // Extract YCCD based on Lớp and Năng lực
  const yccdOptions = useMemo(() => {
      if (!selectedLop || !selectedNangLuc) return [];
      return parsedData.filter(d => d.lop === selectedLop && d.maNangLuc === selectedNangLuc);
  }, [parsedData, selectedLop, selectedNangLuc]);

  // Reset dependent states
  useEffect(() => {
      setSelectedNangLuc('');
  }, [selectedLop]);
  
  useEffect(() => {
      setSelectedYCCD('');
      setDescription('');
  }, [selectedNangLuc]);

  const handleYCCDChange = (maYccd: string) => {
      setSelectedYCCD(maYccd);
      const yccd = yccdOptions.find(y => y.maYccd === maYccd);
      if (yccd) {
          setDescription(`[${yccd.maYccd}] ${yccd.noiDungCuThe}: ${yccd.yeuCauCanDat}`);
      } else {
          setDescription('');
      }
  };

  const handleAdd = () => {
    if (!description.trim()) {
        alert("Vui lòng nhập nội dung mô tả năng lực.");
        return;
    }

    let code = selectedYCCD || `AI.${Date.now().toString().slice(-4)}`;
    let name = '';
    
    if (selectedYCCD) {
        const yccd = yccdOptions.find(y => y.maYccd === selectedYCCD);
        if (yccd) {
            name = yccd.tenNangLuc;
        }
    } else if (selectedNangLuc) {
        name = nangLucOptions.find(n => n.code === selectedNangLuc)?.label || '';
    } else {
        name = 'Năng lực AI';
    }

    const newEntry: ManualAIEntry = {
      id: Date.now().toString(),
      code,
      name,
      description: description.trim()
    };

    setEntries([...entries, newEntry]);
    
    // Reset selected YCCD to allow adding more easily
    setSelectedYCCD('');
    setDescription('');
  };

  const handleRemove = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden mt-6">
      <div 
        className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-xs">
            <Target size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Chỉ định Năng lực Trí tuệ nhân tạo (AI) cụ thể (Tùy chọn)</h3>
            <p className="text-[11px] text-slate-500">Tra cứu khung năng lực AI theo cấp học hoặc chỉ định yêu cầu cần đạt</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={isExpanded} 
            onChange={() => setIsExpanded(!isExpanded)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-indigo-900 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
          />
          <span className="text-xs font-semibold text-slate-600">{isExpanded ? 'Đang mở' : 'Chi tiết'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            
            {/* Lớp */}
            <div className="md:col-span-3 space-y-1.5">
               <label className="block text-xs font-bold text-slate-700 uppercase">1. Khối Lớp</label>
               <select
                 value={selectedLop}
                 onChange={(e) => setSelectedLop(e.target.value)}
                 className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-800 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
               >
                 <option value="">-- Chọn Khối lớp --</option>
                 {lopOptions.map((opt) => (
                   <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
            </div>

            {/* Năng lực */}
            <div className="md:col-span-4 space-y-1.5">
               <label className="block text-xs font-bold text-slate-700 uppercase">2. Thành phần Năng lực AI</label>
               <select
                 value={selectedNangLuc}
                 onChange={(e) => setSelectedNangLuc(e.target.value)}
                 disabled={nangLucOptions.length === 0}
                 className={`block w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-800 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none ${nangLucOptions.length === 0 ? 'opacity-50' : ''}`}
               >
                 <option value="">-- Chọn Thành phần --</option>
                 {nangLucOptions.map((opt) => (
                   <option key={opt.code} value={opt.code}>{opt.label}</option>
                 ))}
               </select>
            </div>
            
            {/* Yêu cầu cần đạt */}
            <div className="md:col-span-5 space-y-1.5">
               <label className="block text-xs font-bold text-slate-700 uppercase">3. Yêu cầu cần đạt chuẩn</label>
               <select
                 value={selectedYCCD}
                 onChange={(e) => handleYCCDChange(e.target.value)}
                 disabled={yccdOptions.length === 0}
                 className={`block w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-slate-800 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none ${yccdOptions.length === 0 ? 'opacity-50' : ''}`}
               >
                 <option value="">-- Tự nhập mô tả --</option>
                 {yccdOptions.map((y) => (
                   <option key={y.maYccd} value={y.maYccd} title={y.yeuCauCanDat}>
                     [{y.maYccd}] {y.noiDungCuThe}
                   </option>
                 ))}
               </select>
            </div>

            {/* Input Description */}
            <div className="md:col-span-12 space-y-1.5">
               <label className="block text-xs font-bold text-slate-700 uppercase">4. Nội dung mô tả / Hoạt động thực hiện</label>
               <textarea
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Mô tả năng lực AI hoặc công cụ thực hiện mong muốn..."
                 rows={2}
                 className="block w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-slate-800 font-normal text-xs sm:text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
               />
            </div>

            {/* Add Button */}
            <div className="md:col-span-12 pt-1 flex justify-end">
               <button
                 onClick={handleAdd}
                 className="flex items-center space-x-1.5 bg-indigo-900 text-white px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm hover:bg-indigo-800 transition-colors shadow-sm active:scale-95"
               >
                 <Plus size={16} />
                 <span>Thêm chỉ tiêu AI</span>
               </button>
            </div>
          </div>

          {/* List of Added Entries */}
          {entries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chỉ tiêu AI đã thiết lập ({entries.length})</h4>
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start bg-slate-50 border border-slate-200 rounded-xl p-3.5 group hover:border-indigo-300 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 text-xs font-bold border border-indigo-200/60">
                        {entry.code}
                        </span>
                        <span className="text-xs text-slate-600 font-semibold truncate max-w-[240px]" title={entry.name}>
                            {entry.name}
                        </span>
                    </div>
                    <p className="text-slate-700 text-xs sm:text-sm mt-1 leading-relaxed whitespace-pre-wrap">
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

export default ManualAIInput;
