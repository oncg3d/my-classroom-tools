/**
 * 座標獵人 Coordinate Hunter
 * 適合大螢幕投影與學生平板互動的直角座標小遊戲
 */

(function () {
  'use strict';

  // --- 狀態定義 ---
  const state = {
    mode: 'hunt', // 'hunt' | 'identify' | 'quadrant'
    range: 5,     // -5~5 或 -10~10
    showGuide: true,
    soundEnabled: true,
    score: 0,
    streak: 0,
    round: 10,
    currentSeat: '1',
    target: { x: 0, y: 0 },
    hoverCoord: { x: null, y: null },
    answeredThisRound: false,
  };

  // --- DOM 元件快取 ---
  const canvas = document.getElementById('gridCanvas');
  const ctx = canvas.getContext('2d');
  const canvasContainer = document.getElementById('canvas-container');
  const hoverCoordText = document.getElementById('current-hover-coord');
  const targetMarker = document.getElementById('target-marker');

  const modeButtons = document.querySelectorAll('.mode-btn');
  const rangeSelect = document.getElementById('range-select');
  const guidelineToggle = document.getElementById('guideline-toggle');
  const soundToggle = document.getElementById('sound-toggle');
  const seatInput = document.getElementById('seat-number');

  const scoreDisplay = document.getElementById('score-display');
  const streakDisplay = document.getElementById('streak-display');
  const roundDisplay = document.getElementById('round-display');
  const taskQuestion = document.getElementById('task-question');
  const targetCoordDisplay = document.getElementById('target-coord-display');
  const feedbackMsg = document.getElementById('feedback-msg');

  const inputAnswerPanel = document.getElementById('input-answer-panel');
  const quadrantButtonsPanel = document.getElementById('quadrant-buttons-panel');
  const inputX = document.getElementById('input-x');
  const inputY = document.getElementById('input-y');
  const submitCoordBtn = document.getElementById('submit-coord-btn');
  const quadButtons = document.querySelectorAll('.quad-btn');

  const nextQuestionBtn = document.getElementById('next-question-btn');
  const resetGameBtn = document.getElementById('reset-game-btn');
  const clearRecordsBtn = document.getElementById('clear-records-btn');
  const leaderboardList = document.getElementById('leaderboard-list');

  // --- Web Audio 音效引擎 ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(type) {
    if (!state.soundEnabled) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'correct') {
      // 成功琶音 (C5 -> E5 -> G5)
      const baseFreq = 523.25 + Math.min(state.streak * 40, 400);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.setValueAtTime(baseFreq * 1.25, now + 0.08);
      osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.16);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'wrong') {
      // 失敗低音
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.25);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'click') {
      // 點擊輕音
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  // --- 坐標轉換計算 ---
  let canvasWidth = 0;
  let canvasHeight = 0;
  let originX = 0;
  let originY = 0;
  let stepPixels = 0;

  function resizeCanvas() {
    const rect = canvasContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvasWidth = rect.width;
    canvasHeight = rect.height;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;

    ctx.scale(dpr, dpr);

    originX = canvasWidth / 2;
    originY = canvasHeight / 2;

    // 格線間距
    const minDim = Math.min(canvasWidth, canvasHeight);
    stepPixels = (minDim * 0.85) / (state.range * 2);

    render();
    updateTargetMarkerPosition();
  }

  function mathToScreen(x, y) {
    return {
      x: originX + x * stepPixels,
      y: originY - y * stepPixels,
    };
  }

  function screenToMath(screenX, screenY) {
    const mathX = (screenX - originX) / stepPixels;
    const mathY = (originY - screenY) / stepPixels;
    return {
      x: Math.round(mathX),
      y: Math.round(mathY),
    };
  }

  // --- 繪圖引擎 ---
  function render() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const r = state.range;

    // 1. 繪製象限背景標註與符號
    drawQuadrantLabels();

    // 2. 繪製次要網格
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.setLineDash([]);

    for (let i = -r; i <= r; i++) {
      if (i === 0) continue;
      // 垂直網格
      const ptV = mathToScreen(i, 0);
      ctx.beginPath();
      ctx.moveTo(ptV.x, originY - r * stepPixels);
      ctx.lineTo(ptV.x, originY + r * stepPixels);
      ctx.stroke();

      // 水平網格
      const ptH = mathToScreen(0, i);
      ctx.beginPath();
      ctx.moveTo(originX - r * stepPixels, ptH.y);
      ctx.lineTo(originX + r * stepPixels, ptH.y);
      ctx.stroke();
    }

    // 3. 繪製主 X 軸與 Y 軸
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8';

    // X 軸
    ctx.beginPath();
    ctx.moveTo(originX - r * stepPixels - 20, originY);
    ctx.lineTo(originX + r * stepPixels + 25, originY);
    ctx.stroke();

    // X 軸箭頭
    drawArrow(originX + r * stepPixels + 25, originY, 'right');

    // Y 軸
    ctx.beginPath();
    ctx.moveTo(originX, originY + r * stepPixels + 20);
    ctx.lineTo(originX, originY - r * stepPixels - 25);
    ctx.stroke();

    // Y 軸箭頭
    drawArrow(originX, originY - r * stepPixels - 25, 'up');

    // 4. 繪製軸標籤與刻度數字
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('X', originX + r * stepPixels + 35, originY);
    ctx.fillText('Y', originX, originY - r * stepPixels - 35);

    // 原點 (0, 0)
    ctx.fillStyle = '#64748b';
    ctx.fillText('0', originX - 12, originY + 14);

    // 刻度線與數字
    ctx.fillStyle = '#cbd5e1';
    for (let i = -r; i <= r; i++) {
      if (i === 0) continue;

      // X 軸刻度
      const px = mathToScreen(i, 0);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px.x, originY - 4);
      ctx.lineTo(px.x, originY + 4);
      ctx.stroke();
      ctx.fillText(i.toString(), px.x, originY + 16);

      // Y 軸刻度
      const py = mathToScreen(0, i);
      ctx.beginPath();
      ctx.moveTo(originX - 4, py.y);
      ctx.lineTo(originX + 4, py.y);
      ctx.stroke();
      ctx.fillText(i.toString(), originX - 16, py.y);
    }

    // 5. 繪製滑鼠懸停點與輔助投影線
    if (state.hoverCoord.x !== null && Math.abs(state.hoverCoord.x) <= r && Math.abs(state.hoverCoord.y) <= r) {
      drawHoverIndicators(state.hoverCoord.x, state.hoverCoord.y);
    }
  }

  function drawArrow(x, y, dir) {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    if (dir === 'right') {
      ctx.moveTo(x, y);
      ctx.lineTo(x - 8, y - 5);
      ctx.lineTo(x - 8, y + 5);
    } else if (dir === 'up') {
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + 8);
      ctx.lineTo(x + 5, y + 8);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawQuadrantLabels() {
    const offset = state.range * stepPixels * 0.7;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';

    // Ⅰ (+,+)
    ctx.fillText('第 Ⅰ 象限 (+,+)', originX + offset, originY - offset);
    // Ⅱ (-,+)
    ctx.fillText('第 Ⅱ 象限 (-,+)', originX - offset, originY - offset);
    // Ⅲ (-,-)
    ctx.fillText('第 Ⅲ 象限 (-,-)', originX - offset, originY + offset);
    // Ⅳ (+,-)
    ctx.fillText('第 Ⅳ 象限 (+,-)', originX + offset, originY + offset);
  }

  function drawHoverIndicators(x, y) {
    const pt = mathToScreen(x, y);

    if (state.showGuide) {
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // 垂直到 X 軸
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x, originY);
      ctx.stroke();

      // 水平到 Y 軸
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(originX, pt.y);
      ctx.stroke();
      ctx.restore();
    }

    // 懸停吸附十字點
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // --- 目標標記（模式二與模式三在畫面上標記題目點） ---
  function updateTargetMarkerPosition() {
    if (state.mode === 'hunt') {
      targetMarker.classList.add('hidden');
      return;
    }
    const pt = mathToScreen(state.target.x, state.target.y);
    targetMarker.style.left = `${pt.x}px`;
    targetMarker.style.top = `${pt.y}px`;
    targetMarker.classList.remove('hidden');
  }

  // --- 題目生成 ---
  function generateQuestion() {
    state.answeredThisRound = false;
    const r = state.range;

    // 隨機產生 -r 到 r 的整數 (確保不會連續出相同坐標)
    let newX, newY;
    do {
      newX = Math.floor(Math.random() * (2 * r + 1)) - r;
      newY = Math.floor(Math.random() * (2 * r + 1)) - r;
    } while (newX === state.target.x && newY === state.target.y);

    state.target = { x: newX, y: newY };

    feedbackMsg.className = 'feedback-msg';

    if (state.mode === 'hunt') {
      taskQuestion.innerHTML = '請在座標平面上點擊：';
      targetCoordDisplay.textContent = `( ${newX} , ${newY} )`;
      targetCoordDisplay.classList.remove('hidden');
      feedbackMsg.textContent = '移到坐標平面交叉點，點擊進行捕捉！';
      inputAnswerPanel.classList.add('hidden');
      quadrantButtonsPanel.classList.add('hidden');
    } else if (state.mode === 'identify') {
      taskQuestion.innerHTML = '請觀察左方紅點，輸入其座標：';
      targetCoordDisplay.textContent = '( ? , ? )';
      targetCoordDisplay.classList.remove('hidden');
      feedbackMsg.textContent = '請輸入 X 與 Y 值後送出。';
      inputAnswerPanel.classList.remove('hidden');
      quadrantButtonsPanel.classList.add('hidden');
      inputX.value = '';
      inputY.value = '';
      inputX.focus();
    } else if (state.mode === 'quadrant') {
      taskQuestion.innerHTML = `請問點位 <strong style="color:#38bdf8">( ${newX} , ${newY} )</strong> 位於何處？`;
      targetCoordDisplay.classList.add('hidden');
      feedbackMsg.textContent = '請從下方選項選出正確位置。';
      inputAnswerPanel.classList.add('hidden');
      quadrantButtonsPanel.classList.remove('hidden');
    }

    updateTargetMarkerPosition();
    render();
  }

  // --- 判定答案 ---
  function judgeAnswer(isCorrect, playerAnsText, correctAnsText) {
    if (state.answeredThisRound) return;
    state.answeredThisRound = true;

    if (isCorrect) {
      state.score += 100 + state.streak * 20;
      state.streak += 1;
      playTone('correct');

      feedbackMsg.className = 'feedback-msg correct';
      feedbackMsg.textContent = `🎉 太棒了！回答正確：${correctAnsText}（+${100 + (state.streak - 1) * 20} 分）`;
    } else {
      state.streak = 0;
      playTone('wrong');

      feedbackMsg.className = 'feedback-msg wrong';
      feedbackMsg.textContent = `❌ 哎呀答錯了！你的答案：${playerAnsText}，正確是：${correctAnsText}`;
    }

    state.round = Math.max(0, state.round - 1);
    updateStatsDisplay();

    // 儲存排行榜分數
    saveScore();

    // 自動進入下一題（1.5 秒延遲）
    if (state.round > 0) {
      setTimeout(() => {
        if (state.answeredThisRound) {
          generateQuestion();
        }
      }, 1400);
    } else {
      feedbackMsg.textContent += ' 🏁 本輪練習結束！請點擊「重新計分」開啟新挑戰！';
    }
  }

  function getQuadrantName(x, y) {
    if (x === 0 && y === 0) return 'origin';
    if (y === 0) return 'x-axis';
    if (x === 0) return 'y-axis';
    if (x > 0 && y > 0) return '1';
    if (x < 0 && y > 0) return '2';
    if (x < 0 && y < 0) return '3';
    if (x > 0 && y < 0) return '4';
    return '';
  }

  function getQuadrantLabel(key) {
    const map = {
      '1': '第 Ⅰ 象限',
      '2': '第 Ⅱ 象限',
      '3': '第 Ⅲ 象限',
      '4': '第 Ⅳ 象限',
      'x-axis': 'X 軸上',
      'y-axis': 'Y 軸上',
      'origin': '原點 (0,0)',
    };
    return map[key] || key;
  }

  // --- 點擊 Canvas 事件（模式一） ---
  function handleCanvasClick(e) {
    playTone('click');
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const math = screenToMath(clickX, clickY);

    if (state.mode === 'hunt') {
      const isCorrect = (math.x === state.target.x && math.y === state.target.y);
      judgeAnswer(
        isCorrect,
        `( ${math.x} , ${math.y} )`,
        `( ${state.target.x} , ${state.target.y} )`
      );
    }
  }

  function handleCanvasMove(e) {
    const rect = canvas.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;
    const math = screenToMath(moveX, moveY);

    if (math.x !== state.hoverCoord.x || math.y !== state.hoverCoord.y) {
      state.hoverCoord = math;
      if (Math.abs(math.x) <= state.range && Math.abs(math.y) <= state.range) {
        hoverCoordText.textContent = `滑鼠游標：( ${math.x} , ${math.y} )`;
      } else {
        hoverCoordText.textContent = `滑鼠游標：( -- , -- )`;
      }
      render();
    }
  }

  function handleCanvasLeave() {
    state.hoverCoord = { x: null, y: null };
    hoverCoordText.textContent = `滑鼠游標：( -- , -- )`;
    render();
  }

  // --- 模式二：輸入座標送出 ---
  function handleSubmitCoord() {
    const valX = parseInt(inputX.value, 10);
    const valY = parseInt(inputY.value, 10);

    if (isNaN(valX) || isNaN(valY)) {
      feedbackMsg.className = 'feedback-msg wrong';
      feedbackMsg.textContent = '⚠️ 請輸入整數座標 (X, Y)！';
      return;
    }

    const isCorrect = (valX === state.target.x && valY === state.target.y);
    judgeAnswer(
      isCorrect,
      `( ${valX} , ${valY} )`,
      `( ${state.target.x} , ${state.target.y} )`
    );
  }

  // --- 模式三：象限按鈕選擇 ---
  function handleQuadrantClick(e) {
    const targetBtn = e.target.closest('.quad-btn');
    if (!targetBtn) return;

    const chosen = targetBtn.dataset.answer;
    const correctKey = getQuadrantName(state.target.x, state.target.y);

    const isCorrect = (chosen === correctKey);
    judgeAnswer(
      isCorrect,
      getQuadrantLabel(chosen),
      getQuadrantLabel(correctKey)
    );
  }

  // --- UI 更新與統計 ---
  function updateStatsDisplay() {
    scoreDisplay.textContent = state.score;
    streakDisplay.textContent = `${state.streak} 🔥`;
    roundDisplay.textContent = state.round;
  }

  function resetGame() {
    state.score = 0;
    state.streak = 0;
    state.round = 10;
    updateStatsDisplay();
    generateQuestion();
  }

  // --- 本地座號排行榜 (LocalStorage) ---
  function getStorageKey() {
    return 'coordinate_hunter_scores';
  }

  function saveScore() {
    const seat = parseInt(state.currentSeat, 10);
    if (!seat || seat <= 0) return;

    try {
      const records = JSON.parse(localStorage.getItem(getStorageKey()) || '{}');
      const prev = records[seat] || { bestScore: 0, streak: 0 };

      records[seat] = {
        bestScore: Math.max(prev.bestScore, state.score),
        streak: Math.max(prev.streak, state.streak),
        lastUpdate: new Date().toLocaleTimeString(),
      };

      localStorage.setItem(getStorageKey(), JSON.stringify(records));
      renderLeaderboard();
    } catch (err) {
      console.warn('LocalStorage access error:', err);
    }
  }

  function renderLeaderboard() {
    try {
      const records = JSON.parse(localStorage.getItem(getStorageKey()) || '{}');
      const seats = Object.keys(records).map(Number).sort((a, b) => records[b].bestScore - records[a].bestScore);

      if (seats.length === 0) {
        leaderboardList.innerHTML = '<li class="empty-hint">尚無紀錄，開始練習挑戰高分吧！</li>';
        return;
      }

      leaderboardList.innerHTML = seats.slice(0, 8).map((seat, idx) => {
        const item = records[seat];
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
        return `
          <li class="leaderboard-item">
            <span class="seat-rank">${medal} 座號 ${seat} 號</span>
            <span>${item.bestScore} 分 (最高連對 ${item.streak})</span>
          </li>
        `;
      }).join('');
    } catch (err) {
      leaderboardList.innerHTML = '<li class="empty-hint">排行榜讀取失敗</li>';
    }
  }

  function clearRecords() {
    if (confirm('確定要清除所有本機座號成績紀錄嗎？')) {
      localStorage.removeItem(getStorageKey());
      renderLeaderboard();
    }
  }

  // --- 事件監聽綁定 ---
  function bindEvents() {
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMove);
    canvas.addEventListener('mouseleave', handleCanvasLeave);

    // 平板 Touch 支援
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleCanvasMove({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (state.hoverCoord.x !== null) {
        handleCanvasClick({ clientX: 0, clientY: 0 }); // 透過已捕捉的 hoverCoord 點擊
      }
    });

    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        modeButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.mode = btn.dataset.mode;
        resetGame();
      });
    });

    rangeSelect.addEventListener('change', (e) => {
      state.range = parseInt(e.target.value, 10);
      resizeCanvas();
      resetGame();
    });

    guidelineToggle.addEventListener('change', (e) => {
      state.showGuide = e.target.checked;
      render();
    });

    soundToggle.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      soundToggle.textContent = state.soundEnabled ? '🔊' : '🔇';
    });

    seatInput.addEventListener('change', (e) => {
      state.currentSeat = e.target.value || '1';
    });

    submitCoordBtn.addEventListener('click', handleSubmitCoord);

    // Enter 鍵快速送出
    inputX.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') inputY.focus();
    });
    inputY.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmitCoord();
    });

    quadButtons.forEach((btn) => {
      btn.addEventListener('click', handleQuadrantClick);
    });

    nextQuestionBtn.addEventListener('click', () => {
      generateQuestion();
    });

    resetGameBtn.addEventListener('click', resetGame);
    clearRecordsBtn.addEventListener('click', clearRecords);
  }

  // --- 初始化啟動 ---
  function init() {
    bindEvents();
    resizeCanvas();
    renderLeaderboard();
    resetGame();
  }

  // 待 DOM 載入後啟動
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
