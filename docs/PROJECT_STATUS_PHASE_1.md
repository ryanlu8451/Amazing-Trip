# AMAZING TRIP 第一階段專案進度與時程控管

更新日期：2026-04-27  
目前階段：Phase 1 MVP / Private Testing  
最新本機 commit：`08ff661 feat: add platform-specific parsing for hotels and flights booking imports`
目前 QA 版本：1.0.0  
版本紀錄：`docs/RELEASE_NOTES.md`

## 1. 已完成開發順序

### Step 1 - 專案初始化

已完成：

- 建立 React + Vite 專案
- 加入 Tailwind CSS
- 加入 React Router
- 加入 Zustand
- 加入 lucide-react
- 建立主要頁面架構
- 建立 Git repo
- Push 到 GitHub

目前 GitHub repo：

https://github.com/ryanlu8451/Amazing-Trip.git

### Step 2 - 基礎 travel planning pages

已完成主要功能頁：

- Home
- Timeline
- Flights
- Hotels
- Budget
- Tips，後來改成 Settings
- Trip Settings
- Login

每個頁面目前都有 mobile-first layout 與底部 navigation。

### Step 3 - 多旅程資料模型

已完成：

- 多 trips
- activeTripId
- active trip section data
- flights / hotels / budget / timeline / tips data model
- localStorage persistence
- old single-trip state migration

### Step 4 - Google Login / Firebase Auth

已完成：

- Firebase app config
- Google login
- Desktop popup login
- Mobile redirect login
- Auth listener
- Redirect result handling
- Logout
- Login error display
- In-app browser detection

重要問題與處理：

- LINE / IG / FB / Gmail App 內建瀏覽器會造成 Google login 被擋。
- 已加入提示，要求使用 Safari / Chrome。
- Firebase auth domain 已改為正式 hosting domain。

### Step 5 - Firebase Hosting

已完成：

- Firebase project：`amazing-trip-f5732`
- Firebase Hosting deploy
- 正式測試網址：

https://amazing-trip-f5732.web.app

### Step 6 - PWA

已完成：

- Manifest
- Service worker
- App icons
- Apple touch icon
- Theme color
- Mobile Add to Home Screen support

### Step 7 - Firestore Trip Sharing MVP

已完成：

- Trips 儲存到 Firestore `trips` collection
- Trip data 加入：
  - ownerId
  - ownerEmail
  - memberEmails
  - memberRoles
- 使用者登入後，依 Google email 查詢 `memberEmails` 包含自己的 trips
- Trip Settings 可以輸入 Gmail 分享 trip
- Role 初版支援：
  - owner
  - editor
  - viewer

### Step 8 - Permission Hardening

已完成：

- Viewer 前端 UI 防編輯
- Editor / owner 可編輯 trip content
- Delete trip 只有 owner 可做
- Member invite / remove 目前收斂為 owner-only
- Firestore rules 加強：
  - member 才能 read
  - owner/editor 才能 update
  - editor 不能修改 owner / memberEmails / memberRoles
  - owner 才能 delete
- Cloud sync 會跳過 viewer 無權寫入的 trips，避免 Firestore permission error

### Step 9 - Settings 與中英語系

已完成：

- 原 Tips 頁改成 Settings 頁
- 新增 settings store
- 新增 i18n translation helper
- 支援 English / 繁體中文
- 預設英文
- 使用者選擇語言後保存於 localStorage
- 主要頁面已完成中英切換

### Step 10 - Commit / Push

已完成 commit 並 push 到 GitHub。

最新 commit：

`bdf8175 Add language settings and sharing permission guards`

### Step 11 - UI/UX 簡化第一波

已完成：

- Login 頁簡化：
  - 移除過多說明卡
  - 保留品牌、核心價值、單一 Google 登入 CTA
  - 必要時才顯示 Firebase config / Auth error / embedded browser warning
  - 未登入前也可以切換 English / 繁體中文
- 帳號策略初步決策：
  - Phase 1 先維持 Google/Gmail-only login
  - 暫不加入 email/password，避免 password reset、email verification、帳號安全與分享 email 對應成本
- Create Trip / Edit Trip 簡化：
  - 移除 members 欄位
  - 建立 trip 預設為 solo trip
- TripSettings：
  - Solo / Group trip 選擇現在會儲存到 trip data 的 `tripType`
  - Group invite 邏輯維持在 Trip Settings
- Home Travel Members card：
  - Solo trip 顯示個人旅程狀態
  - Group trip 顯示邀請入口與 `+` button
  - 已邀請成員時顯示旅伴 email list
- Hotels bug fix：
  - 修正 trip dropdown 被透明 overlay 擋住，導致無法選擇 trip 的問題

### Step 12 - 0 元成本 Invite Link Sharing

已完成並完成手機測試：

- 新增 `/invite/:tripId` route。
- Trip Settings 產生每趟 trip 的 invite link。
- Owner 輸入朋友 Gmail 與 role 後，會先把對方加入 `memberEmails` / `memberRoles`。
- 手機使用 Web Share API 呼叫系統分享面板，可用 LINE、WhatsApp、Gmail、Messages 等 App 手動分享。
- 不支援原生分享時 fallback 為 copy invite link。
- 被邀請人用連結開啟後，需使用被加入的 Gmail 登入。
- 登入後若 email 有權限，App 會自動選取 shared trip。
- 若登入錯 Gmail，Invite 頁會提示請 owner 邀請目前登入的完整 Gmail。
- 已部署到 Firebase Hosting 並在手機測試通過。

產品決策：

- 目前開發成本維持 0 元。
- 不串付費 email service、不做 Cloud Functions 寄信。
- 目前不做 invite pending / accepted status，避免 sharing 功能線膨脹。
- 分享方式採「加入權限 + 使用者手動分享連結」。

### Step 13 - 平台特化訂房及機票導入解析

已完成：

#### Hotels 平台特化解析
- **Airbnb** 特化解析：
  - 自動識別房源標題、預訂 ID
  - 優化 Check-in/Check-out 日期提取
  - 識別客人人數作為房間容納人數
  - 自動計算單晚費用
  
- **Agoda** 特化解析：
  - 確認號碼特定格式識別
  - 飯店詳細資訊提取
  - 精確房間數和容納人數
  - 完整的聯絡資訊
  
- **Booking.com** 特化解析：
  - 多種確認號格式支援
  - "Total price"、"Amount to pay" 等費用識別
  - 詳細地址和電話提取

#### Flights 機票特化解析
- 自動航空公司檢測 (10+ 航空公司)：
  - WestJet (WS) - 完整特化邏輯
  - United Airlines (UA)
  - Delta Air Lines (DL)
  - Air Canada (AC)
  - American Airlines (AA)
  - British Airways (BA)
  - Lufthansa (LH)
  - Japan Airlines (JL)
  - All Nippon Airways (NH)
  - Singapore Airlines (SQ)
  - 其他航空公司 (通用解析)

- 統一解析增強：
  - 多語言欄位標籤識別 (英文/繁體中文)
  - 自動日期時間提取
  - 貨幣自動偵測
  - Terminal、Gate、Cabin Class 提取

#### 技術實現
- Hotels.jsx：
  - `detectPlatform()` 函數 - 平台自動偵測
  - `parseAirbnbConfirmation()` - Airbnb 特化
  - `parseAgodaConfirmation()` - Agoda 特化
  - `parseBookingComConfirmation()` - Booking.com 特化
  - 修改 `parseHotelConfirmation()` 新增平台路由

- Flights.jsx：
  - `detectAirline()` 函數 - 航空公司自動偵測
  - `parseUnifiedFlightConfirmation()` - 統一解析器
  - 修改 `parseFlightConfirmation()` 新增航空公司路由

#### 測試與部署
- ✅ ESLint 檢查通過
- ✅ Vite build 成功，Milestone C code splitting 後最大主要 chunk 402.31 KB
- ✅ 已部署到 Firebase Hosting
- ✅ 新增完整文檔 `PLATFORM_SPECIFIC_PARSING.md`
- ✅ 提交 commit: `08ff661`

#### 文檔更新
- 新增 `docs/PLATFORM_SPECIFIC_PARSING.md` 包含：
  - 所有支援平台詳細說明
  - 欄位提取邏輯
  - 使用指南
  - 測試指南
  - 技術實現細節

## 2. 目前已驗證項目

本機已通過：

```bash
npm run lint      # ✅ 通過
npm run build     # ✅ 通過，最大主要 chunk 402.31 KB
npm run deploy    # ✅ 部署成功
```

最近驗證時間：2026-04-28 - Milestone C performance / rules audit 強化後

正式部署網址（已更新）：

```text
https://amazing-trip-f5732.web.app
```

部署狀態：
- ✅ 新功能已部署到 Firebase Hosting
- ✅ Firestore rules 已同步
- ✅ 可在手機進行測試

已確認：

- 正式首頁回應正常
- Hotels 頁面支援 Airbnb/Agoda/Booking.com 導入
- Flights 頁面支援 10+ 航空公司導入
- `/invite/:tripId` deep link 正常
- 手機分享面板可用
- 平台特化解析邏輯正確運作

已知 warning：

- 目前 `npm run build` 已無 Vite 500 kB chunk warning。

## 3. 尚未完成 / 尚未測試項目

### Phase 1.5 - Private Testing / QA

這一階段目標是確認目前 MVP 在真實使用環境可以穩定運作。

待測：

- 正式網址登入：
  - Desktop Chrome
  - iPhone Safari
  - Android Chrome
- PWA Add to Home Screen icon 是否正常
- PWA installed app 是否可正常開啟
- Redirect login 是否在手機穩定
- 使用 `localhost` 與正式網址登入是否都正常
- 加拿大 / 台灣朋友跨地區 login 測試
- Owner 建立 trip 後用 invite link 分享給 friend
- Friend 從 Safari / Chrome 開啟 invite link
- Friend 使用被邀請 Gmail 登入後是否看到 shared trip
- Viewer 是否真的不能編輯：
  - Timeline
  - Flights
  - Hotels
  - Budget
  - Trip Settings
- Editor 是否可以編輯 trip content
- Editor 是否無法管理 members
- Owner 是否可以 delete trip
- Firestore rules 是否與前端行為一致
- 繁體中文切換後所有主流程是否可讀、無破版
- 英文切回後是否正確
- Login 簡化後，在 desktop / mobile 重新確認畫面是否足夠清楚
- Home Travel Members card 在 solo/group/has members 三種狀態下的顯示是否符合預期
- Trip Settings 的 Solo / Group 選擇是否正確同步到 Firestore

Phase 1.5 建議完成條件：

- 至少 2 個 Google 帳號測試 sharing
- 至少 1 台 iPhone Safari 測試
- 至少 1 台 Android Chrome 測試
- 正式網址 deploy 後測試 PWA icon 與登入
- Firestore rules deploy 後測試 viewer/editor/owner

### Phase 2 - Product Beta

這一階段目標是從 MVP 走向 beta product。

建議開發項目：

- Booking Import UX：
  - Flights：貼上航空公司 / 訂票平台 email 或行程文字，自動填入 flight form。
  - Flights：辨識 airline、flight number、route、departure / arrival date time、booking reference、terminal / gate、price 等欄位。
  - Hotels：延伸現有住宿匯入，支援 Airbnb、Agoda、Booking.com、hotel email 等常見格式。
  - Import preview：自動填入後仍要求 user review 再儲存。
- Sharing UX 維持精簡：
  - 保留 member list
  - change role
  - remove member
  - share invite link
  - 暫不做 invite pending / accepted status
- Trip visibility：
  - hidden trips default hidden
  - completed trips default hidden or grouped
  - Show Hidden / Show Completed menu
- Activity UX：
  - completed activities 顯示規則
  - day reorder
  - activity reorder
  - time conflict warning
- Settings 強化：
  - language
  - default currency
  - date format
  - time format
  - sign out / account section
- Translation completeness：
  - demo data 中英版本
  - all placeholder text audit
  - form validation message audit
- Performance：
  - ✅ route-based code splitting
  - Firebase dynamic import
  - ✅ chunk warning cleanup
- Product polish：
  - ✅ onboarding
  - ✅ app-store-like install instructions
  - ✅ Flights / Hotels / Budget 長表單第一輪簡化
  - empty states
  - loading states
  - offline behavior messaging
  - error recovery

## 4. 專案管理建議

### 近期優先順序

1. 用正式網址完成一輪 owner/editor/viewer 權限回歸測試。
2. 上線前用 iPhone Safari / Android Chrome 測試 PWA install icon 與 installed app login。
3. 進行 mobile QA across devices，確認登入、邀請、匯入、表單與中英切換沒有破版。
4. 補齊正式 release 前的 privacy / support / terms 說明頁或文件。
5. 繼續做 empty/loading/error states 與第二輪表單微調。

### 建議里程碑

Milestone A - MVP Private Test Ready

- Firebase Hosting 最新版
- Firestore rules 最新版
- Login confirmed
- PWA confirmed
- Bilingual UI confirmed
- Basic sharing confirmed

Milestone B - Group Trip Beta

- Role management
- Member remove/change role
- Viewer/editor/owner tested
- Invite link sharing tested
- Booking import for flights and hotels

Milestone C - Public Beta

- ✅ Performance/code splitting
  - 已完成 route-level lazy loading。
  - `npm run build` 通過，已消除 Vite 500 kB chunk warning。
- ✅ Stronger Firestore rules audit
  - 已補上 member role value validation，限制為 owner/editor/viewer。
  - `npx firebase deploy --only firestore:rules --dry-run` 編譯通過，未實際部署。
- ✅ More polished onboarding
  - 已新增 first-run onboarding flow，完成狀態會存在 local settings。
  - Settings 可重新開啟產品導覽。
  - 導覽涵蓋建立旅程、匯入訂單、邀請成員與手機安裝。
- ⏭ Mobile QA across devices
  - 依產品決策，保留到最後上線前測試。
  - 必測：iPhone Safari、Android Chrome、PWA installed app、正式網址 Google login、invite link、viewer/editor/owner。
- ✅ Clear product landing / app store-like install instructions
  - Login 頁已加入產品可見的 mobile install guide。
  - Settings 頁已加入可重看的 mobile install guide。
  - 文案涵蓋正式網址、iPhone Safari Add to Home Screen、Android Chrome Install app、避免 app 內建瀏覽器與 localhost/127.0.0.1 測試提醒。

## 5. App-like Release Readiness

目前 Amazing Trip 已接近「可作為 PWA 上架等級展示」的狀態，但本階段不實際提交 App Store / Play Store。

目前已訂版為 `1.0.0` QA Test Release。未來新增功能或修正 bug 時，請先更新 `docs/RELEASE_NOTES.md`，再依需要調整 `package.json` version。

已完成：

- 可登入、可同步、可共享的核心旅程資料模型。
- PWA manifest、icon、service worker 與 mobile install guide。
- First-run onboarding 與 Settings 產品導覽。
- Route-level code splitting，production build 已無 500 kB chunk warning。
- Firestore rules compile dry-run audit 通過。
- Flights / Hotels 訂單文字與 PDF 導入。

尚未完成 / 上線前仍需處理：

- Mobile QA across devices：iPhone Safari、Android Chrome、installed PWA。
- 正式網址 owner/editor/viewer 多帳號回歸測試。
- Privacy policy / terms / support contact 等 app listing 常見資訊。
- App-like screenshots / release notes / FAQ。
- Offline 行為與錯誤恢復訊息更完整化。
- Flights / Hotels / Budget 長表單已完成第一輪簡化：必要欄位預設展開，選填細節折疊。
- Flights / Hotels / Budget 長表單已完成第二輪拋光：
  - Modal save button 改為 sticky save footer。
  - Flights / Hotels 匯入文字或 PDF auto-fill 後會自動展開 optional details，方便 review。
  - `npm run lint` / `npm run build` 通過。
- Mobile 實機輸入 QA 仍需在最後上線前用真機執行。

### Mobile Form QA Checklist

上線前使用 iPhone Safari 與 Android Chrome 各測一次：

- Flights：
  - 新增航班，確認 sticky save footer 在鍵盤開啟 / 關閉後仍可操作。
  - 貼上 flight confirmation 文字後，optional details 自動展開。
  - 選擇 flight PDF 後，optional details 自動展開並可 review price / terminal / gate / booking ref。
  - 必填缺漏時錯誤訊息可見，不被 sticky footer 遮擋。
- Hotels：
  - 新增住宿，確認住宿與費用區塊、optional details 在手機上可順暢展開 / 收合。
  - 貼上 Airbnb / Agoda / Booking.com 文字後，optional details 自動展開。
  - 選擇 booking PDF 後，optional details 自動展開並可 review booking ref / address / phone。
  - 日期、房數、價格輸入時不造成版面跳動。
- Budget：
  - Set total budget、Add allocation、Add expense、Save imported spending 的 sticky footer 均可操作。
  - 自訂 category 的 emoji / name 在 optional details 中可正常填寫。
  - 手機鍵盤開啟時，amount / note 欄位可正常輸入與儲存。
