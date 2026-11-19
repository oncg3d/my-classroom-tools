# my-classroom-tools（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準）。任何 Agent 的每個 session 都應先讀本檔＋`handoff.md`。

## 專案簡介
班級工具總專案：以三層級與三個家為架構，建立給老師上課與教學互動使用的班級工具網頁庫。

## 關鍵時程
- 2026-11-17：專案初始化與跨電腦三層級技能全面啟用

## 目標與路線圖
- [x] 專案基礎建設與 GitHub Repo、Pages 建立
- [x] 部署跨電腦專案管理三技能（project-init, startup, shutdown）
- [x] 製作第一個工具：tools/coordinate-hunter（座標獵人）
- [x] 製作第二個工具：tools/ai-generation-guide（AI 圖像與影音生成互動簡報）
- [ ] 串接 Firebase 免費即時資料庫

## 資料夾結構
```
my-classroom-tools/
├── index.html                   # 工具庫導覽入口首頁
├── AGENTS.md                   # 跨 Agent 專案藍圖
├── CLAUDE.md                   # Claude / Antigravity 專案設定
├── handoff.md                  # 跨 Session / 跨電腦交接檔
├── .gitignore                  # Git 忽略設定
├── README.md                   # 專案入口說明
└── tools/
    ├── ai-generation-guide/    # AI 圖像與影音生成互動教學簡報
    └── coordinate-hunter/      # 直角座標練習小遊戲
```

## 同步層級（本專案初始化至第 3 層級）

| 層級 | 平台 | 位置 | 讀取時機 |
|------|------|------|---------|
| L1 | 本地（工作桌） | `AGENTS.md`＋`handoff.md` | 每個 session |
| L2 | GitHub | [oncg3d/my-classroom-tools](https://github.com/oncg3d/my-classroom-tools) | 指定時 |
| L3 | Obsidian | `MyVault/my-classroom-tools/專案工作流程.md` | 有需要時 |

## 工作約定
- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 修改共用檔案前先讀最新內容，避免覆蓋其他 Agent 的變更
- 所有回應與文件使用繁體中文
- 修改前先確認計畫，優先保留原有資料結構

## 安全與隱私（不可違反）
- **不把 API key、密碼、憑證寫進 repo**，也不要貼進 `AGENTS.md`／`handoff.md`；一律放 `.env` 並列入 `.gitignore`
- **學生資料只用座號**，不出現姓名、學號、班級以外的個資、照片或聯絡方式
- 要公開分享前，先確認檔案裡沒有上述兩類內容
