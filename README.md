# Bus ETA MVP

一個用 React + Vite + TypeScript 製作嘅巴士到站 MVP，支援：
- Citybus open API
- KMB open API
- 路線搜尋
- 站點選擇
- ETA 自動更新
- Light / dark mode
- 可直接部署到 GitHub Pages 或 Cloudflare Pages

## 開發

```bash
npm install
npm run dev
```

## Build

```bash
npm install
npm run build
```

build output 會喺 `dist/`。

## GitHub 部署

因為 `vite.config.ts` 已經設定 `base: './'`，所以可以直接將 `dist` 靜態部署去 GitHub Pages。

最簡單做法：
1. push repo 去 GitHub
2. 用 GitHub Actions 或手動 deploy `dist`
3. Pages source 指向 build output

## 注意

- Citybus API 同 KMB API response schema 偶爾會有欄位差異，正式版建議再加 schema guard。
- 呢個 MVP 係純前端，未有收藏、地理定位、離線 cache。
- 如果要做 GitHub Pages subpath deployment，現時設定已較穩陣。
