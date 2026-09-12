declare global {
  interface Window {
    __globalImageCache?: Record<string, CachedImage>;
  }
}
export interface CachedImage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  isMathFormula?: boolean;
  originalWidth?: number;
  originalHeight?: number;
}
export const imageCache: Record<string, CachedImage> = (typeof window !== 'undefined' && (window.__globalImageCache = window.__globalImageCache || {})) || {};

export const clearImageCache = () => {
  for (const key in imageCache) {
    delete imageCache[key];
  }
  if (typeof window !== 'undefined' && window.__globalImageCache) {
    for (const key in window.__globalImageCache) {
      delete window.__globalImageCache[key];
    }
  }
};

// Helper: Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu để so khớp linh hoạt
const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const isValidEducationalImage = (item: CachedImage | null | undefined): boolean => {
  if (!item || !item.dataUrl) return false;
  if (item.isMathFormula) return false;
  if (item.dataUrl.startsWith('data:image/svg')) return false; // Không dùng svg do AI bịa
  if (item.originalHeight && item.originalHeight < 55) return false; // Ảnh công thức toán inline MathType
  if (item.originalWidth && item.originalHeight && item.originalWidth < 60 && item.originalHeight < 60) return false; // Icon rác
  return true;
};

export const lookupCachedImage = (tagOrId: string): CachedImage | null => {
  if (!tagOrId) return null;
  if (tagOrId.startsWith('data:image/') || tagOrId.startsWith('blob:') || tagOrId.startsWith('http://') || tagOrId.startsWith('https://')) {
    return { id: 'inline', dataUrl: tagOrId, width: 280, height: 200 };
  }

  const globalCache = (typeof window !== 'undefined' && window.__globalImageCache) ? window.__globalImageCache : {};
  const activeCache = { ...globalCache, ...imageCache };

  const clean = tagOrId.replace(/^[*_~`#\s]+|[*_~`#\s]+$/g, '');
  const rawId = clean.replace(/^!\[|^\[|\]$|\)$/g, '').trim();

  // 1. Direct key match (exact or trimmed)
  if (isValidEducationalImage(activeCache[rawId])) return activeCache[rawId];
  if (isValidEducationalImage(activeCache[clean])) return activeCache[clean];

  const normalizedKey = rawId.replace(/[\s\-]+/g, '_').toUpperCase();
  if (isValidEducationalImage(activeCache[normalizedKey])) return activeCache[normalizedKey];

  const noToneKey = removeVietnameseTones(normalizedKey);
  if (isValidEducationalImage(activeCache[noToneKey])) return activeCache[noToneKey];

  // 2. Build unique list of authentic original images in cache
  const uniqueList: CachedImage[] = [];
  const seenUrls = new Set<string>();
  Object.keys(activeCache).forEach(k => {
    const item = activeCache[k];
    if (isValidEducationalImage(item) && !seenUrls.has(item.dataUrl)) {
      seenUrls.add(item.dataUrl);
      uniqueList.push(item);
    }
  });

  const numMatch = rawId.match(/\d+/);
  if (numMatch) {
    const num = numMatch[0];
    const numIdx = parseInt(num, 10);
    const candidates = [
      `HINHANHGOC_${num}`,
      `HINHANHGOC${num}`,
      `HINH_ANH_GOC_${num}`,
      `HINH_ANH_GOC${num}`,
      `HINH_VE_GOC_${num}`,
      `HINH_VE_GOC${num}`,
      `HINH_ANH_${num}`,
      `HINHANH_${num}`,
      `HINHANH${num}`,
      `HINH_VE_${num}`,
      `HINHVE_${num}`,
      `HINHVE${num}`,
      `HÌNH_ẢNH_GỐC_${num}`,
      `HÌNH_ẢNH_GỐC${num}`,
      `HÌNH_VẼ_GỐC_${num}`,
      `HÌNH_VẼ_GỐC${num}`,
      `HÌNH_ẢNH_${num}`,
      `HÌNH_VẼ_${num}`,
      `HÌNH_${num}`,
      `HÌNH${num}`,
      `ẢNH_GỐC_${num}`,
      `ẢNH_GỐC${num}`,
      `ẢNH_${num}`,
      `ẢNH${num}`,
      `IMG${num}`,
      `IMG_${num}`,
      `IMAGE_${num}`,
      `IMAGE${num}`,
      `SGK_${num}`,
      `SGK${num}`,
      `HINH_${num}`,
      `HINH${num}`,
      num,
      `image${num}.png`,
      `image${num}.jpeg`,
      `image${num}.jpg`,
      `image${num}.gif`,
      `image${num}.webp`,
      `image${num}`,
      `rId${num}`
    ];

    for (const key of candidates) {
      if (isValidEducationalImage(activeCache[key])) return activeCache[key];
      const upper = key.toUpperCase();
      if (isValidEducationalImage(activeCache[upper])) return activeCache[upper];
      const noTone = removeVietnameseTones(upper);
      if (isValidEducationalImage(activeCache[noTone])) return activeCache[noTone];
    }

    if (numIdx > 0 && numIdx <= uniqueList.length) {
      return uniqueList[numIdx - 1];
    }
  }

  // Fallback: Chỉ trả về ảnh nếu thực sự có ảnh học liệu thật trong danh sách
  if (uniqueList.length > 0) {
    if (numMatch) {
      const idx = (parseInt(numMatch[0], 10) - 1) % uniqueList.length;
      return uniqueList[idx >= 0 ? idx : 0];
    }
    return uniqueList[0];
  }

  return null;
};

