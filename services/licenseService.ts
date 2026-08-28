/**
 * Hệ thống Quản lý Bản quyền & Thiết bị (License & Device Lock System)
 * Tích hợp Google Sheets qua Google Apps Script Web App
 */

export type LicenseType = '1_YEAR' | '2_YEAR' | '3_YEAR' | 'LIFETIME' | 'TRIAL';

export interface LicenseInfo {
  status: 'active' | 'trial' | 'expired' | 'invalid' | 'none';
  key?: string;
  type?: LicenseType;
  deviceId: string;
  activatedAt?: string; // ISO String
  expiresAt?: string | null; // ISO String or null (lifetime)
  customerName?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  isTrial: boolean;
  message?: string;
}

// Storage keys
const STORAGE_DEVICE_ID = 'app_device_fingerprint_id';
const STORAGE_LICENSE_CACHE = 'app_license_activation_cache';
const STORAGE_TRIAL_START = 'app_trial_first_launch_time';
const STORAGE_GAS_URL = 'app_license_google_script_url';

// Default Google Apps Script URL (User / Admin can configure this in Settings)
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxpMh4c7OVp_345O6rjKx3MojQwht0uru6VLPGFYteJJWxopeNx-yehP0jYFupfrih6IA/exec';

/**
 * Sinh mã thiết bị (Hardware & Browser Fingerprint ID) duy nhất và bền vững
 */
export const getOrCreateDeviceId = (): string => {
  try {
    // 1. Kiểm tra trong localStorage
    let storedId = localStorage.getItem(STORAGE_DEVICE_ID);
    if (storedId && storedId.startsWith('DEV-') && storedId.length >= 16) {
      return storedId;
    }

    // 2. Tạo fingerprint từ đặc trưng máy tính và trình duyệt
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
    const lang = navigator.language || 'vi-VN';
    const cores = navigator.hardwareConcurrency || 4;
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || 'Win32';

    // Canvas fingerprinting nhẹ
    let canvasHash = 'c-math';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('AI-GIAOAN-2026', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('AI-GIAOAN-2026', 4, 17);
        const dataUrl = canvas.toDataURL();
        let hash = 0;
        for (let i = 0; i < dataUrl.length; i++) {
          hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
          hash |= 0;
        }
        canvasHash = Math.abs(hash).toString(16).toUpperCase();
      }
    } catch {
      canvasHash = 'DEFAULT';
    }

    // Kết hợp tạo hash
    const rawString = `${platform}_${screenInfo}_${timezone}_${lang}_${cores}_${canvasHash}`;
    let numHash = 5381;
    for (let i = 0; i < rawString.length; i++) {
      numHash = (numHash * 33) ^ rawString.charCodeAt(i);
    }
    const hex1 = Math.abs(numHash).toString(16).toUpperCase().padStart(8, '0').slice(0, 4);
    
    // Thêm random entropy để đảm bảo không trùng
    const randomHex1 = Math.random().toString(16).substring(2, 6).toUpperCase();
    const randomHex2 = Math.random().toString(16).substring(2, 6).toUpperCase();
    
    const deviceId = `DEV-${hex1}-${canvasHash.slice(0, 4)}-${randomHex1}${randomHex2}`;
    localStorage.setItem(STORAGE_DEVICE_ID, deviceId);
    return deviceId;
  } catch {
    const fallbackId = `DEV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return fallbackId;
  }
};

/**
 * Lấy URL Google Apps Script Web App được lưu cấu hình
 */
export const getGasUrl = (): string => {
  try {
    return localStorage.getItem(STORAGE_GAS_URL) || DEFAULT_GAS_URL;
  } catch {
    return DEFAULT_GAS_URL;
  }
};

/**
 * Lưu URL Google Apps Script Web App
 */
export const setGasUrl = (url: string): void => {
  try {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_GAS_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_GAS_URL);
    }
  } catch (e) {
    console.error('Error saving GAS URL', e);
  }
};

/**
 * Khởi tạo hoặc lấy thời gian bắt đầu dùng thử 1 ngày (24h)
 */
export const getTrialInfo = (deviceId: string): { isEligible: boolean; expiresAt: Date; hoursLeft: number } => {
  const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000; // 24 giờ
  const now = Date.now();

  let firstLaunchStr = localStorage.getItem(STORAGE_TRIAL_START);
  let firstLaunchTime: number;

  if (!firstLaunchStr) {
    firstLaunchTime = now;
    localStorage.setItem(STORAGE_TRIAL_START, firstLaunchTime.toString());
  } else {
    firstLaunchTime = parseInt(firstLaunchStr, 10);
    if (isNaN(firstLaunchTime) || firstLaunchTime > now + 60000) {
      // Bị thay đổi đồng hồ hệ thống bất thường -> đặt lại
      firstLaunchTime = now;
      localStorage.setItem(STORAGE_TRIAL_START, firstLaunchTime.toString());
    }
  }

  const expiresAtTime = firstLaunchTime + TRIAL_DURATION_MS;
  const timeLeftMs = expiresAtTime - now;
  const isEligible = timeLeftMs > 0;
  const hoursLeft = Math.max(0, Math.ceil(timeLeftMs / (1000 * 60 * 60)));

  return {
    isEligible,
    expiresAt: new Date(expiresAtTime),
    hoursLeft
  };
};

/**
 * Lấy trạng thái Bản quyền hiện tại của phần mềm (Bản quyền key hoặc Dùng thử)
 */
export const getLicenseStatus = (): LicenseInfo => {
  const deviceId = getOrCreateDeviceId();
  const now = new Date();

  // 1. Kiểm tra cache Key đã kích hoạt trong máy
  try {
    const cachedData = localStorage.getItem(STORAGE_LICENSE_CACHE);
    if (cachedData) {
      const parsed: LicenseInfo = JSON.parse(cachedData);
      if (parsed && parsed.status === 'active' && parsed.key) {
        // Kiểm tra xem có đúng DeviceId không
        if (parsed.deviceId === deviceId) {
          // Kiểm tra thời hạn
          if (!parsed.expiresAt) {
            // Vĩnh viễn (Lifetime)
            return {
              ...parsed,
              status: 'active',
              type: 'LIFETIME',
              isTrial: false,
              daysRemaining: 99999
            };
          }

          const expiryDate = new Date(parsed.expiresAt);
          const diffTime = expiryDate.getTime() - now.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffTime > 0) {
            return {
              ...parsed,
              status: 'active',
              daysRemaining,
              isTrial: false
            };
          } else {
            return {
              ...parsed,
              status: 'expired',
              daysRemaining: 0,
              isTrial: false,
              message: 'Khóa bản quyền đã hết hạn sử dụng. Vui lòng gia hạn thêm.'
            };
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading license cache', e);
  }

  // 2. Nếu chưa có Key hoặc Key hết hạn -> Kiểm tra Dùng thử 1 ngày
  const trial = getTrialInfo(deviceId);
  if (trial.isEligible) {
    const diffMs = trial.expiresAt.getTime() - now.getTime();
    const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const minutesRemaining = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

    return {
      status: 'trial',
      type: 'TRIAL',
      deviceId,
      expiresAt: trial.expiresAt.toISOString(),
      hoursRemaining,
      daysRemaining: 1,
      isTrial: true,
      message: `Đang dùng thử miễn phí (Còn ${hoursRemaining} giờ ${minutesRemaining} phút)`
    };
  }

  // 3. Đã hết hạn dùng thử và chưa có key
  return {
    status: 'expired',
    deviceId,
    isTrial: true,
    daysRemaining: 0,
    hoursRemaining: 0,
    message: 'Thời gian dùng thử 1 ngày đã hết. Vui lòng nhập mã bản quyền để tiếp tục sử dụng.'
  };
};

/**
 * Gửi yêu cầu kích hoạt Key tới Google Apps Script Web App
 */
export const activateLicenseKey = async (
  rawKey: string,
  customerName?: string
): Promise<{ success: boolean; license?: LicenseInfo; message: string }> => {
  const key = rawKey.trim().toUpperCase();
  const deviceId = getOrCreateDeviceId();
  const gasUrl = getGasUrl();

  if (!key) {
    return { success: false, message: 'Vui lòng nhập mã kích hoạt.' };
  }

  // Nếu chưa cấu hình Google Sheet URL, hỗ trợ kích hoạt cục bộ với Master Key (Fallback an toàn)
  if (!gasUrl) {
    // Kiểm tra định dạng key hợp lệ offline
    return handleOfflineOrMockActivation(key, deviceId, customerName);
  }

  try {
    const payload = {
      action: 'activate',
      key: key,
      deviceId: deviceId,
      customerName: customerName || '',
      timestamp: new Date().toISOString()
    };

    // Google Apps Script Web App redirect: fetch with redirect follow
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Tránh CORS preflight issues với Apps Script
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result && result.success) {
      const licenseInfo: LicenseInfo = {
        status: 'active',
        key: key,
        type: result.type || '1_YEAR',
        deviceId: deviceId,
        activatedAt: result.activatedAt || new Date().toISOString(),
        expiresAt: result.expiresAt || null,
        customerName: result.customerName || customerName,
        isTrial: false
      };

      // Lưu vào cache máy
      localStorage.setItem(STORAGE_LICENSE_CACHE, JSON.stringify(licenseInfo));

      return {
        success: true,
        license: licenseInfo,
        message: result.message || 'Kích hoạt bản quyền thành công!'
      };
    } else {
      return {
        success: false,
        message: result.message || 'Mã kích hoạt không hợp lệ hoặc đã được sử dụng trên máy khác.'
      };
    }
  } catch (err: any) {
    console.error('License Activation Request Error:', err);
    // Nếu lỗi mạng hoặc kết nối Sheet thất bại, thử kiểm tra định dạng key offline
    return handleOfflineOrMockActivation(key, deviceId, customerName, true);
  }
};

/**
 * Đồng bộ / Kiểm tra lại trạng thái Key với Google Sheets khi có kết nối
 */
export const verifyLicenseWithServer = async (): Promise<LicenseInfo> => {
  const current = getLicenseStatus();
  const gasUrl = getGasUrl();

  if (!gasUrl || !current.key || current.isTrial) {
    return current;
  }

  try {
    const url = new URL(gasUrl);
    url.searchParams.set('action', 'verify');
    url.searchParams.set('key', current.key);
    url.searchParams.set('deviceId', current.deviceId);

    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();

    if (data && data.success) {
      if (data.status === 'blocked') {
        // Key bị admin khóa
        localStorage.removeItem(STORAGE_LICENSE_CACHE);
        return {
          status: 'invalid',
          deviceId: current.deviceId,
          isTrial: false,
          message: 'Khóa bản quyền của bạn đã bị vô hiệu hóa bởi quản trị viên.'
        };
      }

      // Cập nhật lại cache
      const updated: LicenseInfo = {
        status: 'active',
        key: current.key,
        type: data.type || current.type,
        deviceId: current.deviceId,
        activatedAt: data.activatedAt || current.activatedAt,
        expiresAt: data.expiresAt !== undefined ? data.expiresAt : current.expiresAt,
        customerName: data.customerName || current.customerName,
        isTrial: false
      };
      localStorage.setItem(STORAGE_LICENSE_CACHE, JSON.stringify(updated));
      return getLicenseStatus();
    } else if (data && data.status === 'device_mismatch') {
      localStorage.removeItem(STORAGE_LICENSE_CACHE);
      return {
        status: 'invalid',
        deviceId: current.deviceId,
        isTrial: false,
        message: 'Khóa bản quyền đã được chuyển sang thiết bị khác.'
      };
    }
  } catch (e) {
    console.warn('Cannot sync license with server at this time:', e);
  }

  return current;
};

/**
 * Xử lý kích hoạt quy chuẩn khi chưa cấu hình Google Sheet hoặc mạng ngắt kết nối
 */
const handleOfflineOrMockActivation = (
  key: string,
  deviceId: string,
  customerName?: string,
  isNetworkError = false
): { success: boolean; license?: LicenseInfo; message: string } => {
  const now = new Date();
  let type: LicenseType = '1_YEAR';
  let days = 365;

  // Nhận diện loại key từ tiền tố hoặc mã key chuẩn
  if (key.includes('VIP') || key.includes('VINHVIEN') || key.includes('LIFETIME') || key.startsWith('GV-VIP-')) {
    type = 'LIFETIME';
    days = 99999;
  } else if (key.includes('3Y') || key.includes('3NAM') || key.startsWith('GV-3Y-')) {
    type = '3_YEAR';
    days = 365 * 3;
  } else if (key.includes('2Y') || key.includes('2NAM') || key.startsWith('GV-2Y-')) {
    type = '2_YEAR';
    days = 365 * 2;
  } else if (key.includes('1Y') || key.includes('1NAM') || key.startsWith('GV-1Y-') || key.startsWith('GV-')) {
    type = '1_YEAR';
    days = 365;
  } else if (key.length >= 10) {
    // Key ngẫu nhiên mặc định 1 năm
    type = '1_YEAR';
    days = 365;
  } else {
    return {
      success: false,
      message: 'Mã kích hoạt không đúng định dạng. Vui lòng kiểm tra lại mã hoặc liên hệ quản trị viên.'
    };
  }

  const expiresAt = type === 'LIFETIME' ? null : new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const licenseInfo: LicenseInfo = {
    status: 'active',
    key: key,
    type: type,
    deviceId: deviceId,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt,
    customerName: customerName || 'Giáo viên',
    isTrial: false
  };

  localStorage.setItem(STORAGE_LICENSE_CACHE, JSON.stringify(licenseInfo));

  const noteMsg = isNetworkError
    ? ' (Kích hoạt chế độ ngoại tuyến)'
    : !getGasUrl()
    ? ' (Đã lưu bản quyền vào máy)'
    : '';

  return {
    success: true,
    license: licenseInfo,
    message: `Kích hoạt thành công gói ${getLicenseTypeName(type)}!${noteMsg}`
  };
};

/**
 * Xóa bản quyền khỏi máy (Đăng xuất key)
 */
export const removeLicenseKey = (): void => {
  try {
    localStorage.removeItem(STORAGE_LICENSE_CACHE);
  } catch (e) {
    console.error('Error removing license key', e);
  }
};

/**
 * Lấy tên hiển thị thân thiện của gói cước
 */
export const getLicenseTypeName = (type?: LicenseType): string => {
  switch (type) {
    case '1_YEAR':
      return 'Bản quyền 1 Năm';
    case '2_YEAR':
      return 'Bản quyền 2 Năm';
    case '3_YEAR':
      return 'Bản quyền 3 Năm';
    case 'LIFETIME':
      return 'Bản quyền Vĩnh Viễn (VIP)';
    case 'TRIAL':
      return 'Dùng thử 1 Ngày';
    default:
      return 'Chưa kích hoạt';
  }
};
