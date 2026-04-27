# AMAZING TRIP 第一階段產品開發報告

更新日期：2026-04-27  
正式測試網址：https://amazing-trip-f5732.web.app  
GitHub Repo：https://github.com/ryanlu8451/Amazing-Trip.git  
最新本機 commit：本文件所在 commit

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

Flights 已接上英文 / 繁體中文切換。

下一步產品方向：

- 加入機票訂單 / email / itinerary 文字導入。
- User 可貼上航空公司或訂票平台提供的行程文字。
- App 會嘗試自動填入 airline、flight number、出發 / 抵達城市與機場、日期時間、booking reference、terminal / gate、price 等欄位。
- 自動填入後仍由 user review，再決定是否儲存。

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

### 2.11 UI/UX 第一波簡化

已完成第一波 UX cleanup：

- Login 頁移除過多說明卡，改成更乾淨的品牌入口、短價值主張、單一 Google CTA。
- Login 頁保留必要情境警告：Firebase config missing、Google error、embedded browser warning。
- Login 頁新增未登入前語言切換。
- Create Trip / Edit Trip 移除 members 欄位，降低建立旅程時的認知負擔。
- Home Travel Members card 改成依 solo/group trip 狀態顯示不同引導。
- Hotels 頁 trip dropdown 被透明 overlay 擋住的 bug 已修正。

## 3. 目前產品價值

第一階段已經完成一個可登入、可建立旅程、可管理核心旅遊資料、可部署、可手機安裝、可初步 sharing、可中英切換的 travel planning app。

目前已可作為：

- 個人旅程規劃工具
- 家庭 / 朋友旅程規劃初版
- 產品 demo
- 後續 monetization / group planning feature 的 foundation

近期產品價值新增：

- 分享旅程不再依賴付費 email service。
- 透過一般使用者熟悉的 LINE / WhatsApp / Gmail 分享連結即可完成私測邀請。
- 下一個高價值方向是降低資料輸入成本：讓 user 從機票、住宿訂單文字直接導入資料。

## 4. 第一階段產品限制

目前仍不是完整 release-ready product。主要限制包含：

- Sharing invite 不做 accepted / pending status，現階段刻意保持精簡。
- Sharing 不會自動寄 email，需要 owner 手動分享 invite link。
- Viewer / editor 權限已加強，但仍需要更多真實帳號測試。
- Firebase rules 已加強，但尚未做完整 security audit。
- 多語系仍主要是 UI 文案，使用者輸入資料與部分舊 demo data 不會自動翻譯。
- PWA 安裝與手機登入仍需要更多外部裝置測試。
- 目前沒有 onboarding、help、empty-state education 的完整產品設計。
- Flights / Hotels / Budget 的長表單仍偏複雜。
- Flights 尚未支援訂單文字導入；這是下一個優先開發功能。
- Hotels 已有初步 paste booking confirmation auto-fill，但需要強化 Airbnb / Agoda / Booking.com 等格式。
