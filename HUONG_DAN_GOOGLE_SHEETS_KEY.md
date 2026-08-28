# HƯỚNG DẪN TẠO VÀ QUẢN LÝ KEY BẢN QUYỀN TRÊN GOOGLE TRANG TÍNH (GOOGLE SHEETS)
*(Đúng chuẩn cấu trúc 6 cột theo mẫu ảnh 1 • 200k/lần • Hạn dùng tính từ lúc kích hoạt)*

---

## 📊 CẤU TRÚC 6 CỘT CHUẨN TRÊN GOOGLE SHEET (THEO MẪU ẢNH 1)

| Cột A | Cột B | Cột C | Cột D | Cột E | Cột F |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mã kích hoạt (Key)** | **Mã phần cứng (Machine ID)** | **Ngày kích hoạt** | **Loại bản quyền** | **Ngày tạo** | **Ngày hết hạn** |
| `GV1Y-A89B-CD12-EF34` | *(Tự điền khi khách kích hoạt)* | *(Tự ghi khi kích hoạt)* | `1 Năm (200k)` | `28/08/2026 19:30:00` | *(Tính từ ngày kích hoạt)* |

- **Thời hạn sử dụng**: Tự động tính đúng **365 ngày (1 năm)**, **730 ngày (2 năm)**, **1095 ngày (3 năm)** hoặc **Vĩnh viễn** tính từ thời điểm khách hàng bấm kích hoạt key trên máy của họ.
- **Khóa thiết bị 1 key / 1 máy**: Khi kích hoạt, `Mã phần cứng (Machine ID)` được lưu vào cột B. Nếu ai khác dùng key này trên máy khác sẽ bị từ chối ngay lập tức.

---

## BƯỚC 1: TẠO GOOGLE SHEET & DÁN MÃ NGUỒN (CHỈ 2 PHÚT)

1. Mở trình duyệt và tạo 1 Google Sheet mới tại: [https://sheets.new](https://sheets.new).
2. Đổi tên Google Sheet thành: **Quan_Ly_Ban_Quyen_Giao_An**.
3. Trên thanh menu, chọn: **Tiện ích mở rộng** (Extensions) -> **Apps Script**.
4. Xóa toàn bộ nội dung trong `Code.gs` và **Dán đoạn mã ở BƯỚC 2 dưới đây** vào.
5. Bấm biểu tượng **💾 Lưu** (Save) hoặc nhấn `Ctrl + S`.
6. Bấm nút **Chạy** (Run) hàm `setupSheets` lần đầu tiên để Google Sheet tự động tạo bảng với 6 cột chuẩn và giao diện đẹp mắt.

---

## BƯỚC 2: MÃ NGUỒN GOOGLE APPS SCRIPT (`Code.gs`)

```javascript
/**
 * ============================================================================
 * HỆ THỐNG QUẢN LÝ BẢN QUYỀN PHẦN MỀM TÍCH HỢP GIÁO ÁN GDPT 2018
 * Chuẩn cấu trúc 6 cột: Mã kích hoạt | Mã phần cứng | Ngày kích hoạt | Loại bản quyền | Ngày tạo | Ngày hết hạn
 * Quản lý: 1 Key / 1 Máy | 200k/lần | Hạn dùng tính từ lúc kích hoạt
 * Tác giả: Thầy Mai Văn Hùng - THCS Đồng Yên (0941037116)
 * ============================================================================
 */

const SHEET_KEYS = "Keys";

// Tạo Menu Quản lý trực tiếp trên Google Sheet
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🔑 QUẢN LÝ BẢN QUYỀN")
    .addItem("➕ Tạo Key Hàng Loạt (200k/năm...)", "generateKeysPrompt")
    .addItem("🔄 Reset Mã Phần Cứng Cho Key (Đổi máy)", "resetKeyDevicePrompt")
    .addItem("🚫 Khóa / Mở Khóa Key", "toggleKeyStatusPrompt")
    .addSeparator()
    .addItem("📊 Thống Kê Bản Quyền", "showStatsPrompt")
    .addItem("⚙️ Khởi Tạo Bảng Tính 6 Cột Chuẩn Mẫu", "setupSheets")
    .addToUi();
}

/**
 * Khởi tạo cấu trúc 6 cột chuẩn đúng theo mẫu ảnh 1
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_KEYS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_KEYS);
  }
  
  const headers = [
    ["Mã kích hoạt (Key)", "Mã phần cứng (Machine ID)", "Ngày kích hoạt", "Loại bản quyền", "Ngày tạo", "Ngày hết hạn"]
  ];
  
  sheet.getRange(1, 1, 1, 6).setValues(headers);
  sheet.getRange(1, 1, 1, 6)
    .setBackground("#1e3a8a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
    
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);
  
  // Độ rộng cột
  sheet.setColumnWidth(1, 230); // Mã kích hoạt (Key)
  sheet.setColumnWidth(2, 280); // Mã phần cứng (Machine ID)
  sheet.setColumnWidth(3, 180); // Ngày kích hoạt
  sheet.setColumnWidth(4, 160); // Loại bản quyền
  sheet.setColumnWidth(5, 180); // Ngày tạo
  sheet.setColumnWidth(6, 190); // Ngày hết hạn

  SpreadsheetApp.getUi().alert("Khởi tạo bảng tính chuẩn 6 cột thành công!");
}

/**
 * Tạo Key hàng loạt từ Menu Google Sheet
 */
function generateKeysPrompt() {
  const ui = SpreadsheetApp.getUi();
  
  const typeResponse = ui.prompt(
    "CHỌN GÓI BẢN QUYỀN",
    "Nhập số tương ứng với gói cần tạo:\n1: Gói 1 Năm (200.000 VNĐ)\n2: Gói 2 Năm (400.000 VNĐ)\n3: Gói 3 Năm (600.000 VNĐ)\n4: Gói Vĩnh Viễn VIP",
    ui.ButtonSet.OK_CANCEL
  );
  if (typeResponse.getSelectedButton() !== ui.Button.OK) return;
  
  const choice = typeResponse.getResponseText().trim();
  let typeLabel = "1 Năm (200k)";
  let prefix = "GV1Y";
  let expireNote = "1 năm từ lúc kích hoạt";
  
  if (choice === "2") {
    typeLabel = "2 Năm";
    prefix = "GV2Y";
    expireNote = "2 năm từ lúc kích hoạt";
  } else if (choice === "3") {
    typeLabel = "3 Năm";
    prefix = "GV3Y";
    expireNote = "3 năm từ lúc kích hoạt";
  } else if (choice === "4") {
    typeLabel = "Vĩnh Viễn (VIP)";
    prefix = "GVVIP";
    expireNote = "Vĩnh viễn";
  }
  
  const countResponse = ui.prompt(
    "SỐ LƯỢNG KEY",
    "Nhập số lượng Key muốn tạo (Ví dụ: 10, 20, 50):",
    ui.ButtonSet.OK_CANCEL
  );
  if (countResponse.getSelectedButton() !== ui.Button.OK) return;
  
  const count = parseInt(countResponse.getResponseText().trim(), 10) || 1;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KEYS);
  
  const now = new Date();
  const nowStr = now.toLocaleDateString("vi-VN") + " " + now.toLocaleTimeString("vi-VN");
  const newRows = [];
  
  for (let i = 0; i < count; i++) {
    const r1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const r2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const r3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `${prefix}-${r1}-${r2}-${r3}`;
    
    // 6 Cột: Key | Machine ID | Ngày kích hoạt | Loại bản quyền | Ngày tạo | Ngày hết hạn
    newRows.push([
      key,
      "",        // Machine ID (trống, chờ khách kích hoạt)
      "",        // Ngày kích hoạt (trống)
      typeLabel, // Loại bản quyền
      nowStr,    // Ngày tạo
      expireNote // Ghi chú thời hạn
    ]);
  }
  
  if (newRows.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, newRows.length, 6).setValues(newRows);
    ui.alert(`Đã tạo thành công ${count} key thuộc gói [${typeLabel}]!`);
  }
}

/**
 * Reset Mã Phần Cứng cho Key để khách đổi máy mới
 */
function resetKeyDevicePrompt() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "RESET MÃ PHẦN CỨNG (ĐỔI MÁY)",
    "Nhập mã Key cần mở khóa máy cũ:",
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  
  const targetKey = response.getResponseText().trim().toUpperCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KEYS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === targetKey) {
      sheet.getRange(i + 1, 2).setValue(""); // Xóa Machine ID
      ui.alert(`Đã mở khóa máy cho Key [${targetKey}]. Khách hàng có thể nhập key này trên máy tính mới!`);
      return;
    }
  }
  ui.alert(`Không tìm thấy mã Key: ${targetKey}`);
}

/**
 * Khóa / Mở khóa Key
 */
function toggleKeyStatusPrompt() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "KHÓA / MỞ KHÓA KEY",
    "Nhập mã Key cần thay đổi trạng thái:",
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  
  const targetKey = response.getResponseText().trim().toUpperCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KEYS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === targetKey) {
      const currentMachine = String(data[i][1]);
      if (currentMachine === "BLOCKED_BY_ADMIN") {
        sheet.getRange(i + 1, 2).setValue("");
        ui.alert(`Đã MỞ KHÓA cho Key [${targetKey}].`);
      } else {
        sheet.getRange(i + 1, 2).setValue("BLOCKED_BY_ADMIN");
        ui.alert(`Đã KHÓA Key [${targetKey}].`);
      }
      return;
    }
  }
  ui.alert(`Không tìm thấy mã Key: ${targetKey}`);
}

/**
 * Thống kê
 */
function showStatsPrompt() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KEYS);
  const data = sheet.getDataRange().getValues();
  
  let total = data.length - 1;
  let active = 0, unused = 0, blocked = 0;
  
  for (let i = 1; i < data.length; i++) {
    const machine = String(data[i][1]).trim();
    if (machine === "BLOCKED_BY_ADMIN") blocked++;
    else if (machine.length > 0) active++;
    else unused++;
  }
  
  SpreadsheetApp.getUi().alert(
    "📊 THỐNG KÊ BẢN QUYỀN\n\n" +
    `• Tổng số Key: ${total}\n` +
    `• Đã kích hoạt (Đang dùng): ${active}\n` +
    `• Chưa kích hoạt (Tồn kho): ${unused}\n` +
    `• Đang bị khóa: ${blocked}`
  );
}

// ============================================================================
// WEB API ENDPOINTS CHO PHẦN MỀM (doGet & doPost)
// ============================================================================

function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }
    
    const action = payload.action;
    if (action === "activate") {
      return handleActivate(payload.key, payload.deviceId);
    } else if (action === "verify") {
      return handleVerify(payload.key, payload.deviceId);
    } else if (action === "import_keys") {
      return handleImportKeys(payload.keys);
    }
    
    return jsonResponse({ success: false, message: "Action không hợp lệ." });
  } catch (err) {
    return jsonResponse({ success: false, message: "Lỗi xử lý API: " + err.toString() });
  }
}

function doGet(e) {
  const p = e.parameter || {};
  const action = p.action;
  
  if (action === "verify") {
    return handleVerify(p.key, p.deviceId);
  } else if (action === "ping") {
    return jsonResponse({ success: true, message: "Server bản quyền đang sẵn sàng!" });
  }
  
  return jsonResponse({ success: true, message: "Google Sheets License API Ready." });
}

/**
 * Xử lý Kích Hoạt Key
 */
function handleActivate(rawKey, rawDeviceId) {
  if (!rawKey || !rawDeviceId) {
    return jsonResponse({ success: false, message: "Thiếu mã Key hoặc Mã phần cứng máy." });
  }
  
  const key = String(rawKey).trim().toUpperCase();
  const deviceId = String(rawDeviceId).trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KEYS);
  if (!sheet) {
    return jsonResponse({ success: false, message: "Chưa khởi tạo trang tính Keys." });
  }
  
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let rowData = null;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === key) {
      rowIndex = i + 1;
      rowData = data[i];
      break;
    }
  }
  
  if (rowIndex === -1) {
    return jsonResponse({ success: false, message: "Mã kích hoạt không tồn tại trong hệ thống. Vui lòng kiểm tra lại!" });
  }
  
  const boundMachineId = String(rowData[1]).trim();
  const typeText = String(rowData[3]).trim();
  
  if (boundMachineId === "BLOCKED_BY_ADMIN") {
    return jsonResponse({ success: false, message: "Mã kích hoạt này đã bị khóa bởi quản trị viên." });
  }
  
  const now = new Date();
  
  // 1. Nếu key đã có Machine ID gắn vào
  if (boundMachineId) {
    if (boundMachineId !== deviceId) {
      return jsonResponse({ 
        success: false, 
        message: "Key này đã được kích hoạt trên một máy tính khác (" + boundMachineId.substring(0, 8) + "...). Mỗi key chỉ sử dụng cho 1 máy duy nhất!" 
      });
    }
    
    // Nếu cùng DeviceId (Khách nhập lại trên máy cũ) -> Cho phép khôi phục
    let expiresAtIso = null;
    if (rowData[5] && rowData[5] !== "Vĩnh viễn") {
      expiresAtIso = new Date(rowData[5]).toISOString();
    }
    
    return jsonResponse({
      success: true,
      type: parseTypeCode(typeText),
      activatedAt: rowData[2] ? new Date(rowData[2]).toISOString() : now.toISOString(),
      expiresAt: expiresAtIso,
      message: "Khôi phục bản quyền thành công trên thiết bị hiện tại!"
    });
  }
  
  // 2. Key mới -> Tiến hành khóa vào máy này và tính hạn bắt đầu từ lúc này
  let daysToAdd = 365;
  let isLifetime = false;
  
  if (typeText.includes("VIP") || typeText.includes("Vĩnh Viễn") || typeText.includes("LIFETIME")) {
    isLifetime = true;
  } else if (typeText.includes("3 Năm") || typeText.includes("3_YEAR")) {
    daysToAdd = 365 * 3;
  } else if (typeText.includes("2 Năm") || typeText.includes("2_YEAR")) {
    daysToAdd = 365 * 2;
  } else {
    daysToAdd = 365; // 1 Năm (200k)
  }
  
  const activatedAtStr = now.toLocaleDateString("vi-VN") + " " + now.toLocaleTimeString("vi-VN");
  let expiresAtDate = null;
  let expiresAtDisplay = "Vĩnh viễn";
  
  if (!isLifetime) {
    expiresAtDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    expiresAtDisplay = expiresAtDate.toLocaleDateString("vi-VN") + " " + expiresAtDate.toLocaleTimeString("vi-VN");
  }
  
  // Cập nhật các cột: B (Machine ID), C (Ngày kích hoạt), F (Ngày hết hạn)
  sheet.getRange(rowIndex, 2).setValue(deviceId);
  sheet.getRange(rowIndex, 3).setValue(activatedAtStr);
  sheet.getRange(rowIndex, 6).setValue(expiresAtDisplay);
  
  return jsonResponse({
    success: true,
    type: parseTypeCode(typeText),
    activatedAt: now.toISOString(),
    expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
    message: "Kích hoạt bản quyền thành công!"
  });
}

/**
 * Xác thực định kỳ
 */
function handleVerify(rawKey, rawDeviceId) {
  if (!rawKey || !rawDeviceId) return jsonResponse({ success: false });
  
  const key = String(rawKey).trim().toUpperCase();
  const deviceId = String(rawDeviceId).trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KEYS);
  if (!sheet) return jsonResponse({ success: false });
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === key) {
      const machine = String(data[i][1]).trim();
      if (machine === "BLOCKED_BY_ADMIN") {
        return jsonResponse({ success: true, status: "blocked" });
      }
      if (machine && machine !== deviceId) {
        return jsonResponse({ success: true, status: "device_mismatch" });
      }
      
      const expiresText = data[i][5];
      let expiresIso = null;
      if (expiresText && expiresText !== "Vĩnh viễn") {
        expiresIso = new Date(expiresText).toISOString();
      }
      
      return jsonResponse({
        success: true,
        status: "active",
        type: parseTypeCode(String(data[i][3])),
        expiresAt: expiresIso
      });
    }
  }
  return jsonResponse({ success: false });
}

/**
 * Đẩy danh sách Key từ ứng dụng vào Sheet
 */
function handleImportKeys(keysList) {
  if (!keysList || !Array.isArray(keysList) || keysList.length === 0) {
    return jsonResponse({ success: false, message: "Không có key nào." });
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KEYS);
  if (!sheet) return jsonResponse({ success: false, message: "Chưa có sheet Keys." });
  
  const rows = keysList.map(k => [
    k.key,
    "",
    "",
    k.licenseType || "1 Năm (200k)",
    k.createdAt || new Date().toLocaleString("vi-VN"),
    k.expiresAt || "1 năm từ lúc kích hoạt"
  ]);
  
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, 6).setValues(rows);
  
  return jsonResponse({ success: true, message: `Đã nhập thành công ${rows.length} key!` });
}

function parseTypeCode(text) {
  if (text.includes("VIP") || text.includes("Vĩnh") || text.includes("LIFETIME")) return "LIFETIME";
  if (text.includes("3 Năm") || text.includes("3_YEAR")) return "3_YEAR";
  if (text.includes("2 Năm") || text.includes("2_YEAR")) return "2_YEAR";
  return "1_YEAR";
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## BƯỚC 3: TRIỂN KHAI THÀNH WEB APP (DEPLOY)

1. Tại cửa sổ **Apps Script**, bấm nút **Triển khai** (Deploy) ở góc trên bên phải -> chọn **Tùy chọn triển khai mới** (New deployment).
2. Nhấp vào bánh răng ⚙️ (Chọn loại) -> Chọn **Ứng dụng web** (Web app).
3. Cài đặt:
   - **Mô tả**: `He thong Key Ban Quyen v2`
   - **Thực thi dưới dạng**: `Tôi (<địa chỉ gmail của bạn>)` (Me)
   - **Người có quyền truy cập**: `Bất kỳ ai` (**Anyone**).
4. Bấm **Triển khai** (Deploy) và copy đường dẫn **URL của ứng dụng web** (dạng `https://script.google.com/macros/s/AKfycb.../exec`).

---

## BƯỚC 4: DÙNG CÔNG CỤ TẠO KEY & XUẤT EXCEL TRÊN PHẦN MỀM

1. Mở phần mềm, nhấp vào nút **Bản Quyền** (hoặc nút **🛠️ Tạo Key & Xuất Excel** trên thanh công cụ).
2. Trong bảng công cụ, bạn có thể:
   - Chọn loại gói (1 Năm 200k, 2 Năm, 3 Năm, Vĩnh viễn).
   - Chọn số lượng Key cần tạo (10, 20, 50, 100 key...).
   - Bấm **"Sinh Mã Key"**.
   - Bấm **"📥 Xuất File Excel (.xlsx)"** -> Tải ngay file Excel chuẩn đúng mẫu 6 cột về máy!
   - Bấm **"Đẩy vào Google Sheet"** -> Danh sách key sẽ tự động lưu thẳng vào Google Sheet mà không cần nhập tay!
