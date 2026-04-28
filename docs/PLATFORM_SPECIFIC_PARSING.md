# 平台特化訂房及機票解析功能文檔

更新日期：2026-04-27  
功能完成狀態：✅ 完成並通過測試
目前 QA 版本：1.0.0  
版本紀錄：`docs/RELEASE_NOTES.md`

## 概述

為了提升訂房和機票導入的準確性，我們為主流平台（Airbnb、Agoda、Booking.com）和航空公司實現了專門的解析邏輯。系統會自動檢測確認信的來源平台，並使用對應的解析器提取資訊。

---

## 1. 住宿 (Hotels) 平台特化解析

### 1.1 支援的平台

#### **Airbnb**
- 平台識別：檢測文本中是否包含 "AIRBNB"
- 特化邏輯：
  - **預訂編號**：從 "Reservation ID" 或類似欄位提取，通常是較長的數字串
  - **房源名稱**：優先提取房源標題
  - **入住/退房日期**：支援 Airbnb 特定的日期格式 (e.g., "Check-in: January 15, 2025")
  - **房客人數**：從 "guest"、"person" 等關鍵字識別人數
  - **價格**：提取總價格並按房間數和夜數計算單晚費用
  - **地址**：提取地點資訊作為區域名稱

**檢測範例**：
```
Airbnb Reservation Confirmation
Your reservation:
Reservation ID: A123456789
Property: Cozy Apartment in Tokyo
Check-in: January 15, 2025
Check-out: January 20, 2025
2 guests, 1 bedroom
Total: JPY 75,000
```

#### **Agoda**
- 平台識別：檢測文本中是否包含 "AGODA"
- 特化邏輯：
  - **確認編號**：從 "Confirmation Number" 提取，通常是 "XXXXX-XXXXXX" 格式
  - **飯店名稱**：清晰標示的飯店名稱
  - **日期範圍**：標準 Check-in/Check-out 格式
  - **房間及客人資訊**：精確提取房數和容納人數
  - **地址和電話**：詳細的聯絡資訊
  - **費用計算**：從總價計算單晚費用

**檢測範例**：
```
AGODA CONFIRMATION
Confirmation Number: 1234567-ABCDE
Hotel: Tokyo Bay Hilton
Check-in: 15 Jan 2025
Check-out: 20 Jan 2025
Address: 1-9-1 Daiba, Minato Ward, Tokyo
Rooms: 1 | Guests: 2
Total: JPY 80,000 (¥16,000/night)
```

#### **Booking.com**
- 平台識別：檢測文本中是否包含 "BOOKING.COM"
- 特化邏輯：
  - **預訂編號**：從 "Booking Number" 或 "Confirmation Number" 提取
  - **房產名稱**：標準欄位提取
  - **日期**：支援 "Check-in" / "Check-out" 格式
  - **住宿詳情**：房間數和容納人數
  - **地址**：詳細的飯店地址
  - **聯絡方式**：電話號碼
  - **費用**：支援 "Total price"、"Amount to pay" 等變體

**檢測範例**：
```
Booking.com Confirmation
Booking Number: XXXXX-XXXXX-XXXXX
Accommodation: Tokyo Bay Hilton
Check-in: 15 January 2025
Check-out: 20 January 2025
Street address: 1-9-1 Daiba, Minato-ku
Rooms: 1 room, 2 guests
Total price: ¥ 80,000
```

### 1.2 解析結果對應

平台特化解析會自動填充以下欄位：

| 欄位 | Airbnb | Agoda | Booking.com | 通用 |
|------|--------|-------|-------------|------|
| 飯店名稱 | ✅ | ✅ | ✅ | ✅ |
| Check-in | ✅ | ✅ | ✅ | ✅ |
| Check-out | ✅ | ✅ | ✅ | ✅ |
| 房數 | ❌* | ✅ | ✅ | ✅ |
| 容納人數 | ✅** | ✅ | ✅ | ✅ |
| 訂位號 | ✅ | ✅ | ✅ | ✅ |
| 地址 | ✅ | ✅ | ✅ | ✅ |
| 電話 | ❌ | ✅ | ✅ | ✅ |
| 單晚價格 | ✅ | ✅ | ✅ | ✅ |
| 總費用 | ✅ | ✅ | ✅ | ✅ |

\* Airbnb 傾向顯示客人人數，房數需手動輸入或從人數推斷  
\** 用作房間容納人數

---

## 2. 機票 (Flights) 平台特化解析

### 2.1 支援的航空公司

#### **已實現的特化解析**
- ✅ **WestJet** (WS) - 完整特化邏輯
- ✅ **United Airlines** (UA)
- ✅ **Delta Air Lines** (DL)
- ✅ **Air Canada** (AC)
- ✅ **American Airlines** (AA)
- ✅ **British Airways** (BA)
- ✅ **Lufthansa** (LH)
- ✅ **Japan Airlines** (JL)
- ✅ **All Nippon Airways** (NH)
- ✅ **Singapore Airlines** (SQ)
- ✅ **其他航空公司** (通用解析)

### 2.2 特化解析邏輯

#### **WestJet (特化)**
- 識別：e-Ticket Receipt 或 Itinerary Details
- 特化欄位：
  - 訂位代碼 (RESERVATION CODE)
  - 簽發航空公司 (ISSUING AIRLINE)
  - 機型識別 (WS 開頭的班次編號)
  - 出發/抵達日期時間
  - 艙等 (Cabin Class)

#### **其他航空公司 (統一解析)**
使用增強的通用解析器，支援多種欄位標籤：

**支援的標籤變體**（自動識別）：
- 確認編號：Booking reference, Confirmation Number, Reservation Code, PNR, Itinerary Number, 訂位代號, 確認號碼
- 航空公司：Airline, Carrier, Operated by, 航空公司
- 機場：Departure Airport, Arrival Airport, Departing from, Destination, Departure City, Arrival City
- 日期：Departure Date, Arrival Date, Flight Date, Depart Date, 出發日期, 飛行日期
- 時間：Departure Time, Arrival Time, Departs, Arrives, 出發時間
- 其他：Terminal, Gate, Cabin Class, Service Class, 航廈, 登機門, 艙等

### 2.3 航空公司檢測規則

系統根據以下優先順序檢測航空公司：

```
1. 文本中是否包含航空公司名稱 (e.g., "UNITED AIRLINES", "DELTA AIR", "LUFTHANSA")
2. 是否包含航空公司代碼 (e.g., "UA", "DL", "BA")
3. 如無匹配 → 使用通用解析器
```

**檢測範例**：
```javascript
// WestJet 檢測
"WESTJET" in text  → 航空公司 = 'westjet'

// United Airlines 檢測
"UNITED AIRLINES" in text OR /\bUA\b/ → 航空公司 = 'united'

// 通用解析
Default → 航空公司 = 'generic'
```

### 2.4 解析結果對應

| 欄位 | WestJet | 其他航空 | 通用 |
|------|---------|---------|------|
| 航空公司 | ✅ | ✅ | ✅ |
| 班次號 | ✅ | ✅ | ✅ |
| 出發城市 | ✅ | ✅ | ✅ |
| 出發機場 | ✅ | ✅ | ✅ |
| 抵達城市 | ✅ | ✅ | ✅ |
| 抵達機場 | ✅ | ✅ | ✅ |
| 出發日期 | ✅ | ✅ | ✅ |
| 出發時間 | ✅ | ✅ | ✅ |
| 抵達日期 | ✅ | ✅ | ✅ |
| 抵達時間 | ✅ | ✅ | ✅ |
| 訂位號 | ✅ | ✅ | ✅ |
| 航廈 | ✅ | ✅ | ✅ |
| 登機門 | ✅ | ✅ | ✅ |
| 艙等 | ✅ | ✅ | ✅ |
| 價格 | ✅ | ✅ | ✅ |

---

## 3. 使用方式

### 3.1 匯入流程

1. **打開 Hotels 或 Flights 頁面**
2. **新增或編輯訂房/機票**
3. **展開 "Import from Confirmation" 區塊**
4. **選擇匯入方式**：
   - 📄 上傳 PDF 檔案
   - 📋 粘貼文本內容
5. **系統自動檢測平台並解析**
6. **檢查自動填入的欄位**
7. **手動調整任何不正確的欄位**
8. **儲存**

### 3.2 支援的格式

**Hotels**:
- PDF 確認信
- 文本確認碼 (複製自郵件或網頁)

**Flights**:
- PDF 機票/確認信
- 文本行程單 (複製自郵件或網頁)

### 3.3 平台自動檢測

系統會自動檢測並顯示匹配的平台：

```
Hotels:
- Airbnb → 使用 Airbnb 特化解析
- Agoda → 使用 Agoda 特化解析
- Booking.com → 使用 Booking.com 特化解析
- 其他 → 使用通用解析

Flights:
- WestJet → 使用 WestJet 特化解析
- [其他航空公司] → 使用統一解析
- 未識別 → 使用通用解析
```

---

## 4. 技術實現細節

### 4.1 Hotels.jsx 新增函數

- `detectPlatform(text)` - 偵測訂房平台
- `parseAirbnbConfirmation(text, currentForm)` - Airbnb 特化解析
- `parseAgodaConfirmation(text, currentForm)` - Agoda 特化解析
- `parseBookingComConfirmation(text, currentForm)` - Booking.com 特化解析

### 4.2 Flights.jsx 新增函數

- `detectAirline(text)` - 偵測航空公司
- `parseUnifiedFlightConfirmation(text, currentForm)` - 統一解析器

### 4.3 呼叫順序

```
Hotels:
1. detectPlatform() → 確定平台
2. 根據平台呼叫對應的解析器
3. parseHotelConfirmation() → 總協調函數

Flights:
1. detectAirline() → 確定航空公司
2. 若為 WestJet → 使用 parseWestJetEticket()
3. 否則 → 使用 parseUnifiedFlightConfirmation()
4. parseFlightConfirmation() → 總協調函數
```

---

## 5. 已知限制及未來改進

### 5.1 目前限制
- PDF 提取受限於 PDF 格式（某些複雜排版可能無法正確識別）
- 多語言日期格式仍在持續優化
- 某些小眾航空公司暫未支援特化解析

### 5.2 未來改進方向
- [ ] 增加更多航空公司特化支持
- [ ] 支援 PDF 表格結構識別
- [ ] 支援 Expedia、Kayak 等聚合平台
- [ ] 機器學習模型優化日期/地址提取準確度
- [ ] Import Preview 功能 - 自動填入前顯示預覽

---

## 6. 測試指南

### 6.1 測試 Airbnb 解析
```
1. 複製 Airbnb 確認信文本或 PDF
2. 在 Hotels 頁面點擊 "Import from Confirmation"
3. 上傳或粘貼內容
4. 驗證自動填入的欄位：
   - 房源名稱 ✓
   - Check-in / Check-out ✓
   - 客人人數 ✓
   - 總價格 ✓
```

### 6.2 測試 Booking.com 解析
```
1. 複製 Booking.com 確認信
2. 上傳或粘貼
3. 驗證自動填入的欄位：
   - 飯店名稱 ✓
   - 確認號碼 ✓
   - 日期範圍 ✓
   - 費用資訊 ✓
```

### 6.3 測試 United Airlines 解析
```
1. 複製 United Airlines 機票確認信
2. 上傳或粘貼到 Flights 頁面
3. 驗證自動填入：
   - 航空公司名稱 ✓
   - 班次號 ✓
   - 出發/抵達機場 ✓
   - 日期時間 ✓
```

---

## 7. 版本控制

| 版本 | 日期 | 變更 |
|------|------|------|
| 1.0 | 2026-04-27 | 初始發佈 - Airbnb、Agoda、Booking.com 及主流航空公司支持 |
| 1.1 | 2026-04-28 | 補充 app-like release readiness；新增 onboarding / install guide 狀態 |

---

## 8. App-like Release Readiness 關聯

平台特化解析目前已納入 Public Beta 的 app-ready demo flow：

1. 使用者登入 Amazing Trip。
2. First-run onboarding 介紹建立旅程、匯入訂單、邀請成員、手機安裝。
3. 使用者在 Flights / Hotels 貼上確認信文字或選擇 PDF。
4. 系統自動辨識平台 / 航空公司並填入可辨識欄位。
5. 使用者 review 後儲存，資料可進一步用於 Budget 與 Timeline。

與上架型產品體驗相關的已完成項目：

- Login / Settings 皆提供 mobile install guide。
- Onboarding 已明確介紹 booking import 的價值。
- Production build 已通過，且無 Vite 500 kB chunk warning。
- 導入解析在瀏覽器本機執行，不需上傳 PDF 或確認信內容到第三方服務。

上線前仍需補測：

- iPhone Safari / Android Chrome 上傳 PDF 與 paste text 行為。
- Mobile viewport 下匯入後 review 是否易用；目前 Flights / Hotels / Budget 已完成折疊式長表單簡化與 sticky save footer。
- Flights / Hotels 匯入後 optional details 已自動展開，方便檢查費用、訂位代號、航廈 / 登機門、地址與電話等欄位。
- 最後上線前仍需用 iPhone Safari / Android Chrome 實測 PDF 選擇、文字貼上、鍵盤輸入與儲存流程。
- 真實航空公司 / 訂房平台確認信回歸樣本。
- 匯入失敗或部分填入時的錯誤恢復訊息。

---

## 附錄：支援的日期格式

系統支援以下日期格式自動轉換為 ISO 格式 (YYYY-MM-DD)：

- **ISO**: `2025-01-15`
- **中文**: `2025年01月15日` 或 `2025 01 15`
- **英文月份**: `January 15, 2025` 或 `15 Jan 2025`
- **數字分隔**: `2025/01/15` 或 `15.01.2025`
- **帶星期**: `Monday, January 15, 2025` (星期會被忽略)

---

## 附錄：支援的幣種

自動識別以下幣種標記：
- **CAD**: CA$、CAD
- **USD**: US$、USD  
- **TWD**: NT$、NTD、TWD
- **JPY**: ¥、JPY
- **EUR**: €、EUR

---

**需要更多協助？**  
請查看項目狀態文檔或聯絡開發團隊。
