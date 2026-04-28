# Firebase 認證問題診斷及修復指南

**錯誤代碼**: `auth/internal-error`  
**錯誤信息**: "Google sign-in could not start. Please refresh the page and try again in Safari or Chrome."  
**最後更新**: 2026-04-27

---

## 🔴 問題症狀

當用戶在手機或正式環境訪問 Amazing Trip 時，Google 登入按鈕點擊後出現上述錯誤。

---

## ✅ 解決方案（完整步驟）

### 第 1 步：確認 Firebase 授權域配置

**最常見原因**：Firebase Console 中的授權域配置不完整。

**需要添加的授權域**（三個都必須有）：

1. `localhost` - 本地開發
2. `amazing-trip-f5732.web.app` - Firebase Hosting (.web.app)
3. `amazing-trip-f5732.firebaseapp.com` - Firebase 預設域 (.firebaseapp.com)

**具體操作**：

1. 打開 [Firebase Console](https://console.firebase.google.com)
2. 選擇 `amazing-trip-f5732` 項目
3. 左側菜單 → **Build** → **Authentication** → **Settings** (齒輪圖標)
4. 找到 **Authorized domains** 部分
5. 檢查是否包含上述三個域名：
   ```
   ✓ localhost
   ✓ amazing-trip-f5732.web.app
   ✓ amazing-trip-f5732.firebaseapp.com
   ```
6. 缺少的話點擊 **Add domain** 逐個添加
7. **保存**

### 第 2 步：確認 .env.local 配置

檢查 `.env.local` 文件中的 Firebase 配置：

```
VITE_FIREBASE_API_KEY=AIzaSyAp7X4QRyzmOh7b_WvrUk7zLvqe8jtPKUA
VITE_FIREBASE_AUTH_DOMAIN=amazing-trip-f5732.firebaseapp.com  ← 檢查此行
VITE_FIREBASE_PROJECT_ID=amazing-trip-f5732
VITE_FIREBASE_STORAGE_BUCKET=amazing-trip-f5732.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=564807212269
VITE_FIREBASE_APP_ID=1:564807212269:web:e47ac6a057cdf89f4700e4
```

✅ 正確格式：`amazing-trip-f5732.firebaseapp.com`  
❌ 錯誤格式：`https://amazing-trip-f5732.firebaseapp.com/`

### 第 3 步：清除瀏覽器快取

1. **電腦**：
   - Chrome: `Ctrl+Shift+Delete` (Windows) 或 `Cmd+Shift+Delete` (Mac)
   - Safari: 偏好設定 → 隱私 → 管理網站數據

2. **手機**：
   - iPhone Safari: 設定 → Safari → 清除歷史和網站數據
   - Android Chrome: 設定 → 隱私 → 清除瀏覽數據

### 第 4 步：刷新頁面

```
完全重新載入頁面（強制刷新）：
- Windows: Ctrl+F5 或 Ctrl+Shift+R
- Mac: Cmd+Shift+R
- 手機：關閉瀏覽器後重新打開
```

### 第 5 步：測試登入流程

**本地測試**（開發環境）：
```bash
npm run dev
# 在瀏覽器打開 http://localhost:5173
# 測試 Google 登入是否成功
```

**手機測試**（生產環境）：
1. 在手機上打開：`https://amazing-trip-f5732.web.app`
2. 使用 **Safari**（iPhone）或 **Chrome**（Android）
3. 點擊「Continue with Google」
4. 應該看到 Google 登入彈窗

---

## 🔍 進階診斷

### 檢查瀏覽器控制台日誌

1. 打開開發者工具：`F12` (Windows) 或 `Cmd+Option+I` (Mac)
2. 查看 **Console** 標籤
3. 如果看到以下信息表示配置正確：
   ```
   [Firebase Config Debug] {
     projectId: "amazing-trip-f5732",
     authDomain: "amazing-trip-f5732.web.app",
     currentHostname: "amazing-trip-f5732.web.app"
   }
   ```

### 常見日誌信息與解決方案

| 日誌信息 | 原因 | 解決方案 |
|--------|------|--------|
| `authDomain: "amazing-trip-f5732.firebaseapp.com"` | 本地或未識別的域 | 正常，非生產環境 |
| `authDomain: "amazing-trip-f5732.web.app"` | Firebase Hosting | 正確 ✓ |
| `isConfigured: false` | Firebase 配置缺失 | 檢查 .env.local 文件 |
| `auth/internal-error` | Firebase 配置與授權域不匹配 | 見上方第 1-2 步 |

---

## 🛠️ 完全重置流程

如果上述步驟仍未解決，請執行完全重置：

### 1. 本地重新構建
```bash
cd c:/Users/ryanl/amazing-trip

# 清除舊 build
rm -rf dist node_modules package-lock.json

# 重新安裝依賴
npm install

# 重新構建
npm run build

# 測試本地
npm run dev
```

### 2. 重新部署到 Firebase
```bash
# 登入 Firebase
firebase login

# 部署
npm run deploy
```

### 3. 清除 Firebase 快取（如需要）
```bash
# 清除所有 Firebase 快取配置
firebase hosting:channel:delete live
firebase hosting:channel:create test
firebase deploy --only hosting:test
```

---

## 📱 手機特定注意事項

### iPhone Safari
- ✅ 支援 Google 登入
- ⚠️ 避免在 WhatsApp/Gmail 應用內的瀏覽器中點擊連結
- 💡 使用 Safari 直接打開網址

### Android Chrome
- ✅ 支援 Google 登入
- ⚠️ 避免在 LINE/Facebook 應用內打開連結
- 💡 使用 Chrome 直接打開網址

### 檢查是否在應用內瀏覽器
如果看到此警告，表示在應用內瀏覽器中：
```
"Google blocks sign-in inside this in-app browser. 
Please open Amazing Trip in Safari or Chrome, then try again."
```

**解決方案**：
- iPhone：複製連結 → 在 Safari 中貼上
- Android：複製連結 → 在 Chrome 中貼上

---

## 🎯 快速檢查清單

在聯絡技術支援前，請確認：

- [ ] Firebase Console 已添加 3 個授權域
- [ ] `.env.local` 中的 `VITE_FIREBASE_PROJECT_ID` 正確
- [ ] 使用的是 Safari（iPhone）或 Chrome（Android）
- [ ] 在應用外的瀏覽器中打開（非 WhatsApp/LINE/Facebook 應用內瀏覽器）
- [ ] 已清除瀏覽器快取
- [ ] 頁面已完全刷新（Ctrl+F5 或 Cmd+Shift+R）
- [ ] 網路連線正常
- [ ] 不在 VPN 中（某些 VPN 可能阻止 Google 登入）

---

## 📞 如果問題持續

請收集以下信息供技術支援：

1. **錯誤代碼**: `auth/internal-error`
2. **瀏覽器控制台日誌**：複製 `[Firebase Config Debug]` 信息
3. **裝置信息**：
   - 作業系統（iOS/Android）
   - 瀏覽器版本
4. **測試環境**：
   - 本地 (localhost) 或生產 (amazing-trip-f5732.web.app)
5. **步驟重現**：具體如何操作導致錯誤

---

## 📚 相關資源

- [Firebase Authentication 官方文檔](https://firebase.google.com/docs/auth)
- [設定授權域](https://firebase.google.com/docs/auth/web/start#add_firebase_to_your_app)
- [Google Sign-In 常見問題](https://firebase.google.com/docs/auth/web/google-signin-web)
- [本項目 Firebase 配置詳情](./PROJECT_STATUS_PHASE_1.md)

---

**版本**: 1.0  
**最後更新**: 2026-04-27  
**維護者**: Amazing Trip 開發團隊
