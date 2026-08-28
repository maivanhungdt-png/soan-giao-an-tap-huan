import React, { useEffect } from 'react';
import { BookOpen, Layers, GraduationCap } from 'lucide-react';

interface LessonFormProps {
  subject: string;
  setSubject: (val: string) => void;
  grade: number;
  setGrade: (val: number) => void;
}

const SUBJECTS_BY_LEVEL = {
  primary: [
    'Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Giáo dục lối sống', 'Đạo đức',
    'Tự nhiên và Xã hội', 'Lịch sử và Địa lý', 'Khoa học', 'Tin học và Công nghệ',
    'Giáo dục thể chất', 'Nghệ thuật', 'Tiếng dân tộc thiểu số', 'Hoạt động trải nghiệm/hướng nghiệp', 'Khác'
  ],
  secondary: [
    'Toán', 'Ngữ văn', 'Ngoại ngữ 1', 'Khoa học tự nhiên', 'Lịch sử và Địa lý',
    'Giáo dục công dân', 'Tin học', 'Công nghệ', 'Giáo dục thể chất', 'Nghệ thuật',
    'Tiếng dân tộc thiểu số', 'Ngoại ngữ 2', 'Hoạt động trải nghiệm/hướng nghiệp', 'Khác'
  ],
  highschool: [
    'Toán', 'Ngữ văn', 'Ngoại ngữ 1', 'Vật lý', 'Hóa học', 'Sinh học',
    'Lịch sử', 'Địa lý', 'Giáo dục kinh tế và pháp luật', 'Tin học', 'Công nghệ',
    'Giáo dục thể chất', 'Giáo dục quốc phòng và an ninh',
    'Nghệ thuật', 'Tiếng dân tộc thiểu số', 'Ngoại ngữ 2', 'Hoạt động trải nghiệm/hướng nghiệp', 'Khác'
  ]
};

const LessonForm: React.FC<LessonFormProps> = ({
  subject,
  setSubject,
  grade,
  setGrade,
}) => {
  const gradeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const isPrimary = grade >= 1 && grade <= 5;
  const isSecondary = grade >= 6 && grade <= 9;
  const isHighSchool = grade >= 10 && grade <= 12;

  const currentLevelName = isPrimary 
    ? 'Cấp Tiểu học' 
    : isSecondary 
      ? 'Cấp Trung học Cơ sở' 
      : 'Cấp Trung học Phổ thông';

  const currentSubjects = isPrimary 
    ? SUBJECTS_BY_LEVEL.primary 
    : isSecondary 
      ? SUBJECTS_BY_LEVEL.secondary 
      : SUBJECTS_BY_LEVEL.highschool;

  useEffect(() => {
    if (!currentSubjects.includes(subject)) {
      setSubject(currentSubjects[0]);
    }
  }, [grade, subject, currentSubjects, setSubject]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
            01
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">
              Thông tin Bài dạy & Phân cấp chuyên môn
            </h2>
            <p className="text-[11px] text-slate-500">Cấu hình cấp học và phân phối môn học GDPT 2018</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200/60 hidden sm:inline-block">
          {currentLevelName}
        </span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grade selection with segmented level hints */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span className="flex items-center">
                <Layers size={14} className="mr-1.5 text-blue-700" />
                Khối lớp giảng dạy
              </span>
              <span className="text-[11px] font-normal text-slate-600 capitalize">
                Lớp {grade} ({currentLevelName})
              </span>
            </label>
            <div className="relative">
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-800 font-semibold text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all cursor-pointer shadow-sm hover:border-slate-400"
              >
                <optgroup label="Cấp Tiểu học">
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>Khối Lớp {g} (Tiểu học)</option>
                  ))}
                </optgroup>
                <optgroup label="Cấp THCS">
                  {[6, 7, 8, 9].map((g) => (
                    <option key={g} value={g}>Khối Lớp {g} (THCS)</option>
                  ))}
                </optgroup>
                <optgroup label="Cấp THPT">
                  {[10, 11, 12].map((g) => (
                    <option key={g} value={g}>Khối Lớp {g} (THPT)</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span className="flex items-center">
                <BookOpen size={14} className="mr-1.5 text-blue-700" />
                Môn học / Hoạt động giáo dục
              </span>
              <span className="text-[11px] font-normal text-slate-600">
                {currentSubjects.length} môn chuẩn
              </span>
            </label>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-800 font-semibold text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all cursor-pointer shadow-sm hover:border-slate-400"
              >
                {currentSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonForm;