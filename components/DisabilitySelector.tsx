import React, { useState } from 'react';
import { HeartHandshake, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { DISABILITY_OPTIONS } from '../constants';

interface DisabilitySelectorProps {
  selectedDisabilities: string[];
  setSelectedDisabilities: (entries: string[]) => void;
}

const DisabilitySelector: React.FC<DisabilitySelectorProps> = ({ selectedDisabilities, setSelectedDisabilities }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (disability: string) => {
    if (selectedDisabilities.includes(disability)) {
      setSelectedDisabilities(selectedDisabilities.filter(d => d !== disability));
    } else {
      setSelectedDisabilities([...selectedDisabilities, disability]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden mt-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50/80 hover:bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between transition-colors text-left"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <HeartHandshake size={14} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
              <span>Dạng khuyết tật hòa nhập (Thông tư 03/2018/TT-BGDĐT)</span>
              <span className="text-[11px] font-normal text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                (Bấm để {isOpen ? 'thu gọn' : 'chọn'})
              </span>
            </h3>
            <p className="text-[10px] text-slate-500">Cá nhân hóa mục tiêu và phương pháp phù hợp với từng dạng khuyết tật</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/60">
            Đã chọn: {selectedDisabilities.length}
          </span>
          {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 sm:p-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {DISABILITY_OPTIONS.map((disability) => {
              const isSelected = selectedDisabilities.includes(disability);
              return (
                <label
                  key={disability}
                  className={`flex items-center space-x-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-teal-50 border-teal-600 text-teal-950 font-semibold shadow-2xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50/30'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-teal-700 border-teal-700' : 'bg-white border-slate-300'
                  }`}>
                    {isSelected && <Check className="text-white w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => handleToggle(disability)}
                  />
                  <span className="text-xs truncate select-none">{disability}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisabilitySelector;

