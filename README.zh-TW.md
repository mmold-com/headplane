# MMold headplane 繁體中文版

以官方穩定版 `v0.8.2` 為基礎，保留原始授權與上游來源。主要網頁導覽、操作按鈕、裝置、使用者、DNS 與核准名單採用台灣繁體中文。裝置、使用者、存取控制與 DNS 的操作說明、對話框及欄位提示已補齊繁體中文；Magic DNS 與協定名稱保留原文。上游伺服器回傳的動態錯誤及 CLI 訊息仍可能為英文。

原始碼分支：`mmold/zh-tw`。映像由 `.github/workflows/mmold-image.yml` 建置並以 commit SHA 標記，部署使用不可變 digest。上游 workflows 保留於 `.github/upstream-workflows/`，避免 fork 自行執行上游發版與文件發佈。

部署設定與維運程序：<https://github.com/mmold-com/vpn-infrastructure>。目標為 `https://mesh.mmold.com`，實際上線狀態以部署驗收為準。
