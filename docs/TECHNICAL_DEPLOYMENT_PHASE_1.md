# AMAZING TRIP 第一階段技術與部署報告

更新日期：2026-04-27  
Firebase project：`amazing-trip-f5732`  
正式測試網址：https://amazing-trip-f5732.web.app  
GitHub repo：https://github.com/ryanlu8451/Amazing-Trip.git  
最新本機 commit：本文件所在 commit

## 1. 技術棧

目前使用：

- React 19
- Vite
- Tailwind CSS
- React Router
- Zustand
- Firebase Authentication
- Firestore
- Firebase Hosting
- lucide-react
- PWA manifest / service worker

## 2. 專案結構重點

主要目錄：

```text
src/
  components/
  hooks/
  lib/
  pages/
  store/
public/
firestore.rules
firebase.json
```

重要檔案：

- `src/App.jsx`：主要 routing 與 auth gate
- `src/components/Navbar.jsx`：底部 mobile navigation
- `src/store/tripStore.js`：trip data / local persistence
- `src/store/authStore.js`：Firebase Auth state
- `src/store/settingsStore.js`：language preference
- `src/hooks/useTripCloudSync.js`：Firestore sync
- `src/lib/firebase.js`：Firebase config initialization
- `src/lib/tripCloud.js`：Firestore trip helpers / permission helpers
- `src/lib/browser.js`：in-app browser detection
- `src/lib/i18n.js`：English / Traditional Chinese translation helper
- `src/pages/Invite.jsx`：invite link landing / shared trip activation
- `firestore.rules`：Firestore security rules
- `public/manifest.webmanifest`：PWA manifest
- `public/sw.js`：service worker

## 3. Authentication

Firebase Auth 已完成 Google login。

目前登入策略：

- Desktop：`signInWithPopup`
- Mobile：`signInWithRedirect`
- App 啟動時處理 redirect result
- Auth listener 維持登入狀態

已知 Google login 注意事項：

- LINE / Instagram / Facebook / Gmail App 內建瀏覽器可能造成 `disallowed_useragent`
- App 已偵測 embedded browser 並提示使用 Safari / Chrome
- 本機測試應使用 `http://localhost:5173`，不要用 `127.0.0.1:5173`，除非 Firebase Authorized domains 有加入 `127.0.0.1`

Firebase Authentication Authorized domains 建議：

```text
localhost
amazing-trip-f5732.web.app
amazing-trip-f5732.firebaseapp.com
```

Google Cloud OAuth JavaScript origins 建議：

```text
http://localhost
http://localhost:5173
http://localhost:5000
https://amazing-trip-f5732.web.app
https://amazing-trip-f5732.firebaseapp.com
```

Google Cloud OAuth redirect URIs 已加入：

```text
https://amazing-trip-f5732.firebaseapp.com/__/auth/handler
https://amazing-trip-f5732.web.app/__/auth/handler
```

## 4. Firestore Data Model

Trips collection：

```text
trips/{tripId}
```

Trip document 重要欄位：

```text
id
name
destination
startDate
endDate
coverEmoji
members
flights
hotels
budget
timeline
tips
status
isHidden
tripType
ownerId
ownerEmail
memberEmails
memberRoles
updatedAt
```

Sharing 權限欄位：

```text
ownerId: Firebase Auth uid
ownerEmail: normalized Google email
memberEmails: normalized email array
memberRoles: {
  "owner@example.com": "owner",
  "friend@example.com": "viewer" | "editor"
}
```

Trip type 欄位：

```text
tripType: "solo" | "group"
```

目前新建立的 trip 預設為 `solo`。使用者在 Trip Settings 切換 Solo / Group 時會更新 `tripType`。Home 會依照 `tripType` 決定 Travel Members 小卡顯示 solo 狀態或 group invite 入口。

Invite link：

```text
/invite/{tripId}
```

Invite link 不包含 secret token。安全性依賴 Firestore membership：

- Owner 必須先把朋友 Gmail 加入 `memberEmails`。
- 朋友打開 invite link 後仍需 Google 登入。
- 登入 email 必須存在於該 trip 的 `memberEmails` 才能讀取 trip。
- 如果登入 email 不符合，Invite 頁只會顯示無權限提示。

## 5. Firestore Security Rules

目前 rules 行為：

- Signed-in user 才能操作
- User email 必須在 `memberEmails` 才能 read
- Create 時 ownerId 必須等於 request auth uid
- Update：
  - owner 可更新
  - editor 可更新 trip content
  - editor 不可修改 owner/member fields
- Delete：
  - owner only

目前 member management 在前端也收斂為 owner-only，避免 editor 改 roles 或邀請其他人。

## 6. Cloud Sync

`useTripCloudSync` 目前負責：

- 訂閱目前使用者可見 trips
- Firestore trips 轉入 Zustand store
- 首次登入時將 local trips migrate to cloud
- 本地 trips 改變後 debounce save to Firestore
- Delete trip 後同步刪除 cloud document

第一階段 hardening：

- Viewer 的 trips 不會嘗試 save to cloud
- Viewer 不會觸發 delete cloud trip
- 可減少 Firestore permission-denied error

Invite flow 補充：

- Trip Settings 加入 member 後會更新 Zustand store。
- Cloud sync 會將 trip 權限寫入 Firestore。
- 為了讓使用者分享連結前更快落地，Invite 動作也會直接呼叫 `saveTripToCloud` 嘗試立即保存。
- 被邀請人登入後，`useTripCloudSync` 會以 `memberEmails array-contains user.email` 查詢可見 trips。
- Invite 頁找到 matching trip 後呼叫 `setActiveTrip(tripId)`。

## 7. i18n / Language Settings

新增：

- `src/store/settingsStore.js`
- `src/lib/i18n.js`

目前支援：

- `en`
- `zh-TW`

預設：

- English

保存方式：

- localStorage key：`amazing-trip-settings`

使用方式：

```js
const { t } = useTranslation()
t('settings.title')
```

目前已接上主要頁面：

- Login
- Home
- Navbar
- Settings
- Timeline
- Flights
- Hotels
- Budget
- Trip Settings

Login 頁已加入未登入前語言切換，因此使用者不需要登入後進 Settings 才能改語言。

## 8. PWA

已完成：

- Web app manifest
- App icon
- Service worker
- Apple touch icon
- Theme color

部署到 Firebase Hosting 後，手機可加入主畫面。

待測：

- iPhone Safari Add to Home Screen icon
- Android Chrome Install app
- Installed PWA login behavior

## 9. 環境設定

`.env.local` 已排除在 git 外。

`.env.example` 用於開發者參考。

本機開發：

```bash
npm install
npm run dev
```

本機測試網址：

```text
http://localhost:5173
```

Production build：

```bash
npm run build
```

Lint：

```bash
npm run lint
```

Deploy：

```bash
npm run deploy
```

或分開部署：

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

## 10. 部署狀態

已完成：

- Firebase Hosting 初次部署成功
- 正式測試網址可開啟
- PWA 檔案已加入
- Invite link sharing 版本已部署到 Firebase Hosting
- Firestore rules 已部署
- 正式 `/invite/:tripId` deep link 已確認回應正常

最近部署：

```text
2026-04-27
npx firebase deploy --only hosting,firestore:rules
```

重要提醒：

GitHub push 不等於 Firebase deploy。若要讓正式網址看到最新中英設定與 permission hardening，需要再執行：

```bash
npm run build
firebase deploy
```

或：

```bash
firebase deploy --only hosting,firestore:rules
```

## 11. Build / Performance

目前 build 通過。

最近一次本機驗證：

```bash
npm run lint
npm run build
```

結果：

- Lint 通過
- Build 通過
- Vite chunk size warning 仍存在

已知 warning：

```text
Some chunks are larger than 500 kB after minification.
```

原因：

- Firebase JS bundle
- App pages 目前都在同一個 main bundle

建議 Phase 2 處理：

- Route-based lazy loading
- Firebase dynamic import
- Bundle splitting
- 檢查未使用 dependency

## 12. 技術風險與建議

### 12.1 Sharing 權限

目前已比初版安全，但仍需要真實多人帳號測試。

建議：

- 使用 owner / editor / viewer 三個帳號測試
- 在 Firestore Console 檢查 document 欄位是否符合預期
- 測試 editor 是否無法改 memberRoles
- 測試 viewer 是否完全不能寫入

目前產品決策：

- 不做 invite status / pending / accepted。
- 不自動寄 email。
- 目前維持 0 元成本，使用 Web Share API + clipboard fallback。

### 12.2 Auth / OAuth 設定

Google login 對 domain 與 redirect URI 很敏感。

建議：

- 正式測試前再次確認 Firebase Authorized domains
- 再確認 Google Cloud OAuth origins / redirect URIs
- 手機測試一定使用 Safari / Chrome，不要用 LINE / IG / FB app browser

### 12.3 Data Migration

目前 local trip 會在 cloud empty 時 migrate to Firestore。未來若資料模型變大，建議加入 schema version 或 migration helper。

### 12.4 Offline / PWA

目前 service worker 是初版。未來若要正式支援 offline planning，需要設計：

- offline write queue
- sync conflict handling
- local/cloud merge rules

### 12.5 UI/UX 技術變更

最近一輪 UI/UX cleanup 涉及：

- `src/pages/Login.jsx`
  - 登入頁改為簡化 layout
  - 保留 Google-only CTA
  - 新增未登入前語言切換
- `src/pages/Home.jsx`
  - Create / Edit Trip 移除 members input
  - Travel Members card 依 `tripType` 顯示 solo 或 group invite 狀態
- `src/pages/TripSettings.jsx`
  - Solo / Group trip type 直接寫入 trip data
  - 邀請成員仍集中在 Trip Settings
  - 加入 invite link、native share sheet、copy link fallback
  - Owner 可變更 member role、移除 member
- `src/pages/Invite.jsx`
  - 處理 `/invite/:tripId`
  - 登入後確認 shared trip 權限
  - 權限符合時自動選取 trip
- `src/store/tripStore.js`
  - 新增 `tripType` 預設值
- `src/pages/Hotels.jsx`
  - 修正 trip dropdown z-index / overlay bug

### 12.6 Booking Import 技術方向

下一個優先功能是 Flights 訂單文字導入。

建議初版採本機解析，不使用付費 OCR / AI API：

- 使用 textarea paste 訂單或 email 文字。
- 使用規則式 parser 擷取常見欄位。
- 優先支援英文 itinerary 常見格式。
- 自動填欄後讓 user review。
- 不直接自動儲存，避免 parser 誤判污染資料。

後續再延伸：

- 住宿訂房文字導入強化。
- 若未來產品成熟並準備上架，再評估 OCR、email forwarding、或 AI parsing 的付費方案。
