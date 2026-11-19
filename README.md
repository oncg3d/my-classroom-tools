# 🏫 my-classroom-tools（班級工具網頁庫）

> 專為班級教學現場打造的無廣告、高互動性網頁工具庫與教學簡報。

## 🌐 線上展示（GitHub Pages）

- **工具總首頁入口**：[https://oncg3d.github.io/my-classroom-tools/](https://oncg3d.github.io/my-classroom-tools/)
- 🎨 **AI 魔法畫布與時光機（生圖/生片教學簡報）**：[https://oncg3d.github.io/my-classroom-tools/tools/ai-generation-guide/](https://oncg3d.github.io/my-classroom-tools/tools/ai-generation-guide/)
- 🎯 **座標獵人 Coordinate Hunter（直角坐標練習遊戲）**：[https://oncg3d.github.io/my-classroom-tools/tools/coordinate-hunter/](https://oncg3d.github.io/my-classroom-tools/tools/coordinate-hunter/)

---

## 📁 專案架構

```
my-classroom-tools/
├── index.html                   # 工具庫導覽入口首頁
├── AGENTS.md                    # 跨 Agent 專案藍圖規範
├── CLAUDE.md                    # 專案環境與規範設定
├── handoff.md                   # 跨電腦/跨 Session 交接檔
└── tools/
    ├── ai-generation-guide/     # 🎨 文字生成圖片/影片互動教學簡報
    │   ├── index.html           # 互動簡報主程式（13頁完整投影片＋動態互動）
    │   └── README.md            # 教學指南與架構說明
    └── coordinate-hunter/       # 🎯 座標獵人小遊戲
        ├── index.html
        ├── game.js
        ├── style.css
        └── README.md
```

---

## 🎨 AI 圖像與影音生成探險簡報特色

1. **直覺易懂的認知設計**：以「除霧魔法」解釋擴散模型，以「手翻書＋時間注意力」解釋影片連續性。
2. **動態實時互動**：
   - 雜訊除霧互動滑桿（親身體驗從電視雪花雜訊還原出畫作）
   - 五星咒語大調配室（積木式點選組合 Prompt，一鍵複製）
   - 隨堂闖關測驗（答對慶祝彩帶與 Web Audio 音效）
3. **課堂好操作**：支援投影全螢幕、鍵盤/觸控翻頁、一鍵轉 PDF / 列印。
