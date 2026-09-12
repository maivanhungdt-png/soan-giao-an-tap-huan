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
};

export const lookupCachedImage = (tagOrId: string): CachedImage | null => {
  if (!tagOrId) return null;
  if (tagOrId.startsWith('data:image/') || tagOrId.startsWith('blob:') || tagOrId.startsWith('http://') || tagOrId.startsWith('https://')) {
    return { id: 'inline', dataUrl: tagOrId, width: 280, height: 200 };
  }

  const clean = tagOrId.replace(/^[*_~`#\s]+|[*_~`#\s]+$/g, '');
  const rawId = clean.replace(/^!\[|^\[|\]$|\)$/g, '').trim();

  // 1. Direct key match
  if (imageCache[rawId] && !imageCache[rawId].isMathFormula) return imageCache[rawId];
  if (imageCache[clean] && !imageCache[clean].isMathFormula) return imageCache[clean];

  const normalizedKey = rawId.replace(/[\s\-]+/g, '_').toUpperCase();
  if (imageCache[normalizedKey] && !imageCache[normalizedKey].isMathFormula) return imageCache[normalizedKey];

  // 2. Build unique list of authentic original images in cache
  const uniqueList: CachedImage[] = [];
  const seenUrls = new Set<string>();
  Object.keys(imageCache).forEach(k => {
    const item = imageCache[k];
    if (item && item.dataUrl && !item.isMathFormula && !seenUrls.has(item.dataUrl)) {
      // Exclude data:image/svg+xml that was auto-generated if we want only real images
      seenUrls.add(item.dataUrl);
      uniqueList.push(item);
    }
  });

  const numMatch = rawId.match(/\d+/);
  if (numMatch) {
    const num = numMatch[0];
    const candidates = [
      `HINHANHGOC_${num}`,
      `HINHANHGOC${num}`,
      `HINH_ANH_GOC_${num}`,
      `HINH_ANH_GOC${num}`,
      `HINH_ANH_${num}`,
      `HINHANH_${num}`,
      `HINHANH${num}`,
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
      `image${num}.svg`,
      `image${num}`,
      `rId${num}`
    ];
    for (const key of candidates) {
      if (imageCache[key] && !imageCache[key].isMathFormula) return imageCache[key];
    }

    const numIdx = parseInt(num, 10);
    if (numIdx > 0 && numIdx <= uniqueList.length) {
      return uniqueList[numIdx - 1];
    }
  }

  // Fallback: If cache has any real curriculum image, return the first one
  if (uniqueList.length > 0) {
    return uniqueList[0];
  }

  return null;
};
