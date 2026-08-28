import { masterDataCsv, YeuCauCanDat, MaNangLuc, CapHoc, LoaiNoiDung } from '../masterData';

export function parseAICSV(): YeuCauCanDat[] {
  const lines = masterDataCsv.trim().split('\n');
  
  const results: YeuCauCanDat[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    if (values.length >= 10) {
      results.push({
        maNangLuc: values[0] as MaNangLuc,
        tenNangLuc: values[1],
        maChuDe: values[2],
        tenChuDe: values[3],
        capHoc: values[4] as CapHoc,
        lop: values[5],
        noiDungCuThe: values[6],
        yeuCauCanDat: values[7],
        maYccd: values[8],
        loaiNoiDung: values[9] as LoaiNoiDung,
      });
    }
  }
  return results;
}
