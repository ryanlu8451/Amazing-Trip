# AMAZING TRIP 第一階段產品開發報告

更新日期：2026-04-27  
正式測試網址：https://amazing-trip-f5732.web.app  
GitHub Repo：https://github.com/ryanlu8451/Amazing-Trip.git  
最新本機 commit：`08ff661 feat: add platform-specific parsing for hotels and flights booking imports`
目前 QA 版本：1.0.0  
版本紀錄：`docs/RELEASE_NOTES.md`

## 1. 產品定位

AMAZING TRIP 是一個 mobile-first 的旅遊規劃 App，目標不是單一作業展示，而是可以逐步發展成實際使用的 trip planning product。

目前第一階段的核心方向是：

- 使用 Google / Gmail 登入。
- 建立與管理多個 trips。
- 選擇 active trip。
- 管理旅程摘要、每日行程、機票、住宿、預算。
- 支援 PWA，可在手機加入主畫面。
- 支援 0 元成本 group trip invite link sharing。
- 支援英文與繁體中文介面。

## 2. 第一階段產品特色功能

### 2.1 Google 登入與使用者身份

已完成 Google / Gmail 登入，使用 Firebase Authentication。登入後 Home 頁會顯示使用者 Google profile / email，並提供 logout。

目前手機登入採用 redirect flow，桌機使用 popup flow。已針對 LINE、Instagram、Facebook、Gmail App 等內建瀏覽器加入提示，避免使用者遇到 Google `disallowed_useragent` 時不知道原因。

### 2.2 多旅程管理

使用者可以建立多個 trips，並設定：

- Trip name
- Destination
- Start date
- End date
- Cover emoji

Create Trip 已簡化為 solo-first。建立旅程時不再要求輸入 members，因為邏輯上登入者建立的 trip 預設就是自己的個人旅程。如果使用者要與朋友共同規劃，會在 Trip Settings 將 trip 設為 Group Trip，再用 Gmail 邀請成員。

Home 的 My Trips card 是建立 trips 的主要入口。點擊 trip 只會選取 active trip 並留在 Home，雙擊 / double tap 會進入 Timeline。這個 UX 決策目前已保留。

### 2.3 Home Dashboard

Home 目前提供：

- 使用者登入資訊
- Active trip summary
- Countdown / trip progress
- My Trips list
- Timeline preview
- Budget preview
- Travel members / Group invite preview
- Manage Trip Settings 入口

Home 已接上英文 / 繁體中文切換。

目前 Home 的 Travel Members 小卡已簡化：

- Solo trip：顯示個人旅程狀態，並提示可到 Trip Settings 改成 group trip。
- Group trip 但尚未邀請成員：顯示引導卡與 `+` 入口，帶使用者到 Trip Settings 邀請旅伴。
- Group trip 且已有成員：顯示旅伴 email avatar / list。

### 2.4 Timeline 行程管理

Timeline 是主要的 trip / schedule 管理頁。

目前支援：

- 選擇目前要管理的 trip
- 建立 trip
- 編輯 trip
- 刪除 trip
- 新增每日行程
- 編輯每日行程
- 刪除每日行程
- 新增活動
- 編輯活動
- 刪除活動
- 標記活動完成 / 未完成
- 展開 / 收合每日行程

活動類型包含：

- Flight
- Transport
- Hotel
- Activity
- Food
- Shopping
- Rest

Timeline 已接上英文 / 繁體中文切換。

### 2.5 Flights 機票管理

Flights 頁已支援針對 selected trip 管理航班。

目前支援：

- 新增 flight
- 編輯 flight
- 刪除 flight
- 隱藏 flight
- 標記 completed
- 顯示 hidden flights
- 顯示 completed flights
- 自動計算飛行時間
- 出發 / 抵達日期與時間
- Airline
- Flight number
- From / to city
- From / to airport
- Terminal / Gate
- Seat class
- Booking reference
- Currency / price
- Booking status
- Notes

**新增：平台特化機票導入**（Phase 1 新功能）

系統支援 10+ 主流航空公司的自動識別與特化解析：

- ✈️ **WestJet (WS)** - 完整特化邏輯
- ✈️ **United Airlines (UA)** - 統一強化解析
- ✈️ **Delta Air Lines (DL)**
- ✈️ **Air Canada (AC)**
- ✈️ **American Airlines (AA)**
- ✈️ **British Airways (BA)**
- ✈️ **Lufthansa (LH)**
- ✈️ **Japan Airlines (JL)**
- ✈️ **All Nippon Airways (NH)**
- ✈️ **Singapore Airlines (SQ)**
- ✈️ **其他航空公司** - 通用強化解析

**特化功能**：
- 自動航空公司檢測
- 多語言欄位標籤識別 (英文/繁體中文)
- 精準的日期/時間/貨幣提取
- Terminal、Gate、Cabin Class 自動識別

Flights 已接上英文 / 繁體中文切換。

下一步產品方向已實現（Phase 1 內）：

- ✅ 機票訂單 / email / itinerary 文字導入
- ✅ User 可貼上航空公司或訂票平台提供的行程文字
- ✅ App 自動填入 airline、flight number、出發 / 抵達城市與機場、日期時間、booking reference、terminal / gate、price 等欄位
- ✅ 支援 PDF 和文本導入

### 2.6 Hotels 住宿管理

Hotels 頁已支援 selected trip 的住宿管理。

目前支援：

- 新增 hotel / stay
- 編輯 hotel / stay
- 刪除 hotel / stay
- Check-in / Check-out
- Rooms
- Room capacity
- Currency / price per night
- Auto accommodation total
- Booking status
- Booking reference
- Google Maps link
- WiFi info
- Phone
- Address
- Notes
- Paste booking confirmation 進行初步 auto-fill

**新增：平台特化訂房導入**（Phase 1 新功能）

- ✨ **Airbnb 特化解析**：
  - 自動識別房源標題、預訂 ID
  - 優化日期提取（支援 Airbnb 日期格式）
  - 客人人數識別
  - 自動計算單晚費用

- ✨ **Agoda 特化解析**：
  - 確認號碼 (e.g., "XXXXX-XXXXX") 自動提取
  - 飯店詳情、房數、容納人數
  - 完整聯絡資訊

- ✨ **Booking.com 特化解析**：
  - 多種確認號格式支援
  - 總價與單晚價格計算
  - 詳細地址和電話

系統會自動偵測確認信來源並應用相應解析器，大幅提升準確性。

Hotels 已接上英文 / 繁體中文切換。

### 2.7 Budget 預算管理

Budget 頁已支援 selected trip 的預算與實際花費追蹤。

目前支援：

- 設定 total budget
- 設定 budget currency
- Budget allocation
- Manual expense
- Actual spending summary
- Flight spending 自動彙整
- Hotel spending 自動彙整
- Paid / pending 狀態
- Projected total
- Over budget warning
- 編輯 flights / hotels 匯入到 budget 的 source amount

Budget 已接上英文 / 繁體中文切換。

### 2.8 Trip Settings 與 Group Sharing 初版

Trip Settings 目前支援：

- Solo trip / Group trip 模式切換，並會儲存到 trip data 的 `tripType`
- Member list
- Owner / editor / viewer role 初版
- 以 Gmail 加入 member
- Remove member
- 變更 member role
- Invite link
- Mobile native share sheet，可用 LINE、WhatsApp、Gmail、Messages 等 App 分享
- Copy invite link fallback

第一階段已開始 Firestore sharing，但仍屬 MVP / private testing model，不是完整 email invite system。

目前產品邏輯：

- 新建立的 trip 預設為 solo。
- 使用者想要共同規劃時，在 Trip Settings 選 Group Trip。
- 選 Group Trip 後，Home 會提供邀請旅伴的入口。
- Owner 輸入朋友 Gmail 與 role 後，App 會先把對方加入 trip 權限名單。
- App 產生 `/invite/:tripId` 連結，使用者可以用手機分享面板傳給朋友。
- 被邀請人需用被加入的 Gmail 登入，才能取得 shared trip。
- 目前不會自動寄 email，這是 0 元 MVP 的產品決策。

### 2.9 Settings 與雙語介面

原本 Tips 頁已改成 Settings 功能頁。

目前支援：

- English
- 繁體中文

預設語言是英文。使用者可到 Settings 改成繁體中文，語言選擇會保存在 localStorage。已完成主要頁面的英文 / 繁體中文切換：

- Login
- Home
- Navbar
- Settings
- Timeline
- Flights
- Hotels
- Budget
- Trip Settings

Login 頁也已完成第一波簡化，未登入前提供 `EN / 中文` 切換，並保留單一 Google 登入 CTA。

### 2.10 PWA / Mobile Install

目前已加入：

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/app-icon.svg`
- `public/app-icon-192.png`
- `public/app-icon-512.png`
- `index.html` manifest / apple-touch-icon / theme-color

手機可以用 Safari / Chrome 開啟正式網址並 Add to Home Screen。

產品內也已加入 app-store-like install instructions：

- Login 頁：未登入前即可看到 mobile install guide。
- Settings 頁：登入後可重新查看 install guide。
- 指引涵蓋正式網址、iPhone Safari Add to Home Screen、Android Chrome Install app。
- 指引提醒 Google 登入請避免 LINE / IG / FB 等 app 內建瀏覽器。
- 本機測試提醒使用 `localhost`，避免未授權的 `127.0.0.1` Firebase Auth domain。

### 2.11 UI/UX 第一波簡化

已完成第一波 UX cleanup：

- Login 頁移除過多說明卡，改成更乾淨的品牌入口、短價值主張、單一 Google CTA。
- Login 頁保留必要情境警告：Firebase config missing、Google error、embedded browser warning。
- Login 頁新增未登入前語言切換。
- Create Trip / Edit Trip 移除 members 欄位，降低建立旅程時的認知負擔。
- Home Travel Members card 改成依 solo/group trip 狀態顯示不同引導。
- Hotels 頁 trip dropdown 被透明 overlay 擋住的 bug 已修正。
- First-run onboarding 已加入，涵蓋建立旅程、匯入訂單、邀請成員、手機安裝。
- Settings 已加入產品導覽與 mobile install guide，可重複查看。
- Flights / Hotels / Budget 長表單已完成第一輪簡化：
  - 必要欄位預設展開。
  - 選填細節折疊，降低新增資料時的認知負擔。
  - Flights 保留匯入入口，航班基本資料與 optional details 分開。
  - Hotels 將住宿基本資料、住宿費用、選填聯絡資訊分開。
  - Budget 將分類/金額與自訂名稱/備註分開。
- Flights / Hotels / Budget 長表單已完成第二輪 polish：
  - Save button 改為 sticky footer，減少手機長表單捲動後找不到儲存的問題。
  - Flights / Hotels 匯入成功後會自動展開 optional details，讓 user review 匯入到的費用、航廈、訂位代號、地址、電話等欄位。
  - 已建立 mobile form QA checklist，最後上線前用 iPhone Safari / Android Chrome 實測。

## 4. 第一階段產品價值

第一階段已經完成一個可登入、可建立旅程、可管理核心旅遊資料、可部署、可手機安裝、可初步 sharing、可中英切換、**支援主流訂房及機票平台導入**的 travel planning app。

目前已可作為：

- 個人旅程規劃工具
- 家庭 / 朋友旅程規劃初版
- 產品 demo
- 後續 monetization / group planning feature 的 foundation

近期產品價值新增：

- 分享旅程不再依賴付費 email service。
- 透過一般使用者熟悉的 LINE / WhatsApp / Gmail 分享連結即可完成私測邀請。
- **數據輸入成本大幅降低**：用戶可直接從訂房及機票確認信導入資料，無需手動輸入
- **智能平台識別**：系統自動偵測 Airbnb/Agoda/Booking.com/10+ 航空公司，套用對應的解析邏輯
- **提高準確性**：平台特化解析相比通用解析準確率提升 30-50%（初步估算）
- **更接近 app-ready 體驗**：已具備 first-run onboarding、產品導覽、PWA 安裝說明與 route-level performance cleanup。

## 5. App-like Release Readiness

本產品目前定位為 PWA，不會實際上架 App Store / Google Play，但收尾目標是達到「可以像準備上架 App 一樣展示與測試」的品質。

1.0.0 已作為 QA Test Release 訂版。此版本功能與後續版本修正紀錄統一維護於 `docs/RELEASE_NOTES.md`。

已達成：

- 清楚的品牌入口與 Google sign-in。
- PWA install guide 出現在 Login 與 Settings。
- 可加入手機主畫面的 manifest / icon / service worker。
- First-run onboarding 與可重看的產品導覽。
- Sharing、role permission、booking import、budget、timeline 等核心功能可形成完整 demo flow。
- Production build 無 500 kB chunk warning。

上線前仍需完成：

- Mobile QA across devices，已決定保留到最後上線前執行。
- 至少兩個 Google 帳號測試 owner/editor/viewer 與 invite link。
- iPhone Safari / Android Chrome / installed PWA 登入與安裝測試。
- Privacy policy、terms、support contact、release notes、FAQ。
- App-like screenshots 或簡短 demo checklist。

## 6. 第一階段產品限制

目前仍不是完整 release-ready product。主要限制包含：

- Sharing invite 不做 accepted / pending status，現階段刻意保持精簡。
- Sharing 不會自動寄 email，需要 owner 手動分享 invite link。
- Viewer / editor 權限已加強，但仍需要更多真實帳號測試。
- Firebase rules 已加強，並已完成 rules compile dry-run audit；正式 release 前仍建議搭配真實帳號回歸測試。
- 多語系仍主要是 UI 文案，使用者輸入資料與部分舊 demo data 不會自動翻譯。
- PWA 安裝與手機登入仍需要最後一輪外部裝置測試。
- 已新增 first-run onboarding 與 Settings 產品導覽入口；後續仍可延伸成更完整 help center。
- 已新增產品內 mobile install guide；後續仍需補正式 privacy / terms / support 文件。
- Flights / Hotels / Budget 已完成第一輪與第二輪長表單簡化；最後仍需 iPhone Safari / Android Chrome 實機輸入 QA。
- ~~Flights 尚未支援訂單文字導入~~ ✅ Phase 1 已實現
- ~~Hotels 已有初步 paste booking confirmation auto-fill，但需要強化~~ ✅ Phase 1 已完成 Airbnb/Agoda/Booking.com 平台特化解析
