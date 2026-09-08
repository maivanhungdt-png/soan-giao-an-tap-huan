export interface CachedImage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  isMathFormula?: boolean;
  originalWidth?: number;
  originalHeight?: number;
}
export const imageCache: Record<string, CachedImage> = {};

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

  if (imageCache[rawId]) return imageCache[rawId];
  if (imageCache[clean]) return imageCache[clean];

  const normalizedKey = rawId.replace(/[\s\-]+/g, '_').toUpperCase();
  if (imageCache[normalizedKey]) return imageCache[normalizedKey];

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
      `image${num}`
    ];
    for (const key of candidates) {
      if (imageCache[key]) return imageCache[key];
    }

    // Fallback theo thứ tự xuất hiện trong imageCache
    const uniqueDataUrls: { [url: string]: any } = {};
    Object.keys(imageCache).forEach(k => {
      if (imageCache[k]?.dataUrl) {
        uniqueDataUrls[imageCache[k].dataUrl] = imageCache[k];
      }
    });
    const uniqueList = Object.values(uniqueDataUrls);
    const numIdx = parseInt(num, 10);
    if (numIdx > 0 && numIdx <= uniqueList.length) {
      return uniqueList[numIdx - 1];
    }
  }

  return null;
};
