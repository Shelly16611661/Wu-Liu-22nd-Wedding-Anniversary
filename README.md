# 吳文勝・劉翊鈴｜22 週年結婚紀念

以霧白、象牙白、淡金與酒紅封蠟構成的互動紀念網站。使用 Vite、原生 JavaScript、CSS 3D 與 Three.js；沒有後端、追蹤程式或外部字體請求。

## 啟動

需要 Node.js 22.12+。

```sh
npm ci
npm run dev
```

開啟終端機顯示的網址。預覽伺服器綁定 `0.0.0.0`，支援 Arena 的 `.e2b.app` 預覽網域。

```sh
npm run build     # 產生 dist/
npm run preview   # 預覽正式版本
```

`dist/` 可部署至 GitHub Pages 或其他靜態網站服務。Vite 使用相對資源路徑，支援倉庫名稱子路徑。此工作只建立網站，沒有自動推送、變更 Pages 設定或發布正式站台。

## 四個場景

- **序章**：象牙白紋理書封、淡金題牌、酒紅封蠟、滑鼠視差與開書動畫。封面主文為「吳文勝 劉翊鈴 婚紗照」。
- **相伴**：兩張原始陶瓷娃娃的透明去背衍生圖，透過柔光、視差、浮動與慢轉底座營造 2.5D 音樂盒。娃娃本身不是可繞背觀看的 3D 模型，也不會自動輪播或放大；點擊、左右滑動或方向鍵切換，交叉淡化約一秒。
- **婚紗紀事**：20 張照片、20 個閱讀頁，桌機雙頁、手機單頁，照片完整 contain 呈現。支援拖曳／滑動、桌機滾輪、方向鍵與按鈕翻頁，只預載當前及相鄰跨頁，不推算年份。
- **永恆之心**：真正的 WebGL 3D 愛心，支援拖曳與鍵盤旋轉、五種顏色、三種材質、表面點綴、復原、清除、重設視角及 PNG 下載。設計僅保存在使用者裝置的 localStorage，不會上傳伺服器。選擇點綴後，聚焦愛心並按 Enter 可在正面加入。

右上角音效預設關閉，點擊後才播放 Web Audio 合成的柔和音樂盒音。支援 `prefers-reduced-motion`；頁籤不可見時停止動畫與音訊。愛心場景才載入 Three.js；無 WebGL 時顯示替代提示。

## 素材與字體

原始檔保留於 `assets/`，實際名稱為：

- `doll-01.jpeg`、`doll-02.jpeg`
- `wedding-01.png` 至 `wedding-20.png`

網頁使用 `public/media/` 的 22 張 WebP 衍生圖，合計約 3.6 MB。去背處理包含 EXIF 方向校正、人工輪廓引導的 GrabCut、內部空隙遮罩與柔邊，保留陶瓷高光。若替換原始娃娃構圖，需同步調整腳本中的輪廓座標。

重新產生圖片（不是一般建置的必要步驟）：

```sh
python -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/prepare_assets.py
```

字體由 Fontsource 套件自行託管：Noto Serif TC 400／600、Cinzel 500／600、Cormorant Garamond 400／500。字體授權隨各套件提供。婚紗及陶瓷素材沿用本倉庫使用者提供的原檔；不轉載參考網站的素材或程式碼。

## 驗證

先保持 `npm run dev` 執行，再於另一個終端機執行：

```sh
npm test
```

可用 `TEST_URL` 指定其他測試網址。測試使用 Playwright 與 npm 提供的 Chromium（Linux），輸出螢幕截圖至忽略的 `.cache/screenshots/`。

涵蓋：封蠟進場、娃娃切換、照片延遲載入、全部 20 頁、翻頁邊界、拖曳與方向鍵、手機單頁與水平溢出檢查、3D 材質／顏色／點綴、localStorage 還原、PNG 下載、聲音切換及瀏覽器執行錯誤。
