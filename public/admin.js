// Admin & Test Simulator Script
const socket = io();

// Web Audio API Synthesizer for Admin
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, type = 'triangle', duration = 0.15, gainVal = 0.35, startTime = 0) {
  initAudio();
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime + startTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration);
  } catch (e) {}
}

function playCorrectChime() {
  initAudio();
  playTone(523.25, 'triangle', 0.14, 0.40, 0.00); // C5
  playTone(659.25, 'triangle', 0.14, 0.45, 0.08); // E5
  playTone(783.99, 'triangle', 0.18, 0.50, 0.16); // G5
  playTone(1046.50, 'sine',    0.45, 0.60, 0.24); // C6
}

// Indonesian Text-to-Speech (TTS Engine) for Admin
let indonesianVoice = null;
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  indonesianVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')) || null;
}
if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speakIndonesian(text) {
  if (!('speechSynthesis' in window)) {
    alert('Browser kamu tidak mendukung SpeechSynthesis. Disarankan buka menggunakan Google Chrome atau Microsoft Edge.');
    return;
  }
  try {
    initAudio();
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      if (!indonesianVoice) loadVoices();
      if (indonesianVoice) utterance.voice = indonesianVoice;
      window.speechSynthesis.speak(utterance);
    }, 50);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

// Streamer PIN Authentication
const adminAuthModal = document.getElementById('adminAuthModal');
const authPinForm = document.getElementById('authPinForm');
const authPinInput = document.getElementById('authPinInput');
const btnSubmitPin = document.getElementById('btnSubmitPin');
const authErrorMessage = document.getElementById('authErrorMessage');
const btnLockAdmin = document.getElementById('btnLockAdmin');
const inputOldPin = document.getElementById('inputOldPin');
const inputNewPin = document.getElementById('inputNewPin');
const btnChangePin = document.getElementById('btnChangePin');
const pinChangeFeedback = document.getElementById('pinChangeFeedback');

function checkAuthStatus() {
  const isAuth = sessionStorage.getItem('adminAuth') === 'true';
  if (isAuth) {
    if (adminAuthModal) adminAuthModal.classList.add('hidden');
  } else {
    if (adminAuthModal) {
      adminAuthModal.classList.remove('hidden');
      if (authPinInput) authPinInput.focus();
    }
  }
}

async function verifyPin(pin) {
  try {
    const res = await fetch('/api/admin/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('adminAuth', 'true');
      if (adminAuthModal) adminAuthModal.classList.add('hidden');
      if (authErrorMessage) authErrorMessage.classList.add('hidden');
      initAudio();
      playCorrectChime();
    } else {
      if (authErrorMessage) {
        authErrorMessage.textContent = data.message || 'PIN Salah!';
        authErrorMessage.classList.remove('hidden');
      }
      if (authPinInput) {
        authPinInput.value = '';
        authPinInput.focus();
      }
    }
  } catch (err) {
    console.error(err);
  }
}

if (btnSubmitPin) {
  btnSubmitPin.addEventListener('click', () => {
    const pin = authPinInput.value.trim();
    if (pin) verifyPin(pin);
  });
}

if (authPinForm) {
  authPinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = authPinInput.value.trim();
    if (pin) verifyPin(pin);
  });
}

// Close / Back button to return to homepage
const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
if (btnCloseAuthModal) {
  btnCloseAuthModal.addEventListener('click', () => {
    window.location.href = '/';
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && adminAuthModal && !adminAuthModal.classList.contains('hidden')) {
    window.location.href = '/';
  }
});

if (btnLockAdmin) {
  btnLockAdmin.addEventListener('click', () => {
    sessionStorage.removeItem('adminAuth');
    checkAuthStatus();
  });
}

if (btnChangePin) {
  btnChangePin.addEventListener('click', async () => {
    const oldP = inputOldPin.value.trim();
    const newP = inputNewPin.value.trim();
    if (!oldP || !newP) {
      alert('Harap isi PIN Lama dan PIN Baru!');
      return;
    }
    try {
      const res = await fetch('/api/admin/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPin: oldP, newPin: newP })
      });
      const data = await res.json();
      if (pinChangeFeedback) {
        pinChangeFeedback.style.display = 'block';
        pinChangeFeedback.style.color = data.success ? '#16a34a' : '#dc2626';
        pinChangeFeedback.textContent = data.message;
      }
      if (data.success) {
        inputOldPin.value = '';
        inputNewPin.value = '';
      }
    } catch (e) {
      console.error(e);
    }
  });
}

checkAuthStatus();

// DOM References
const connStatusPill = document.getElementById('connStatusPill');
const tiktokUsernameInput = document.getElementById('tiktokUsernameInput');
const btnConnectTikTok = document.getElementById('btnConnectTikTok');
const btnDisconnectTikTok = document.getElementById('btnDisconnectTikTok');
const connErrorMessage = document.getElementById('connErrorMessage');

const activeCategoryPill = document.getElementById('activeCategoryPill');
const activeQIndex = document.getElementById('activeQIndex');
const activeQPoints = document.getElementById('activeQPoints');
const activeQTime = document.getElementById('activeQTime');
const activeQText = document.getElementById('activeQText');
const activeQAnswer = document.getElementById('activeQAnswer');
const activeQVariations = document.getElementById('activeQVariations');
const activeQHint = document.getElementById('activeQHint');

const btnNextQuestion = document.getElementById('btnNextQuestion');
const btnTogglePause = document.getElementById('btnTogglePause');
const btnRevealHint = document.getElementById('btnRevealHint');

const btnSimCorrect = document.getElementById('btnSimCorrect');
const btnSimFollow = document.getElementById('btnSimFollow');
const btnSimHattrick = document.getElementById('btnSimHattrick');
const btnSimGift = document.getElementById('btnSimGift');
const btnSimLike = document.getElementById('btnSimLike');
const simUsername = document.getElementById('simUsername');
const simComment = document.getElementById('simComment');
const btnSimSendChat = document.getElementById('btnSimSendChat');
const btnAutoFillKey = document.getElementById('btnAutoFillKey');
const btnAdminTestSound = document.getElementById('btnAdminTestSound');
const btnTestVoiceFollow = document.getElementById('btnTestVoiceFollow');
const btnTestVoice5s = document.getElementById('btnTestVoice5s');
const btnTestVoiceHattrick = document.getElementById('btnTestVoiceHattrick');
const btnTestVoiceRace = document.getElementById('btnTestVoiceRace');

const adminToast = document.getElementById('adminToast');
const toastUser = document.getElementById('toastUser');
const toastMsg = document.getElementById('toastMsg');

const categoryFilter = document.getElementById('categoryFilter');
const timerDurationSelect = document.getElementById('timerDurationSelect');
const btnResetLeaderboard = document.getElementById('btnResetLeaderboard');
const subjectSelect = document.getElementById('subjectSelect');
const btnNextSubject = document.getElementById('btnNextSubject');
const adminSubjectCountdown = document.getElementById('adminSubjectCountdown');
const btnSimGiftDonut = document.getElementById('btnSimGiftDonut');

// Intermission & Top Spender / Champions Admin References
const btnTriggerIntermission = document.getElementById('btnTriggerIntermission');
const btnTriggerRace = document.getElementById('btnTriggerRace');
const btnEndIntermission = document.getElementById('btnEndIntermission');
const adminIntermissionBadge = document.getElementById('adminIntermissionBadge');
const adminIntermissionTimer = document.getElementById('adminIntermissionTimer');
const btnSaveDailyChampions = document.getElementById('btnSaveDailyChampions');
const btnSimSultanGift = document.getElementById('btnSimSultanGift');
const btnSimOvertake = document.getElementById('btnSimOvertake');
const adminSultanList = document.getElementById('adminSultanList');
const adminDailyChampionsList = document.getElementById('adminDailyChampionsList');
const adminTodayName = document.getElementById('adminTodayName');

function formatAdminTime(sec) {
  if (sec === undefined || sec === null || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

let currentQuestionsList = [];
let activeState = null;
let toastTimeout = null;

// Fetch Questions Database
fetch('/api/questions')
  .then(res => res.json())
  .then(data => {
    currentQuestionsList = data;
  })
  .catch(err => console.error(err));

// Socket.io Events
socket.on('game:syncState', state => {
  activeState = state;
  updateUI(state);
});

socket.on('game:tick', data => {
  activeQTime.textContent = `${data.timeLeft}s`;
  if (adminSubjectCountdown && data.subjectTimeLeft !== undefined) {
    adminSubjectCountdown.textContent = formatAdminTime(data.subjectTimeLeft);
  }
});

socket.on('game:newQuestion', data => {
  activeQTime.textContent = `${data.timeLeft}s`;
  // Full question info will come from syncState or fetch
  refreshQuestionPreview(data.question, data.questionIndex);
});

// Winner celebration sound & notification on Admin
socket.on('game:correctAnswer', data => {
  playCorrectChime();
  if (adminToast && data.winner) {
    toastUser.textContent = `@${data.winner.nickname || data.winner.uniqueId}`;
    toastMsg.textContent = `Menjawab Benar! (+${data.winner.pointsEarned} Poin)`;
    adminToast.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      adminToast.classList.add('hidden');
    }, 4000);
  }
});

function updateUI(state) {
  // TikTok Status
  connStatusPill.className = 'status-pill';
  if (state.tiktokStatus === 'CONNECTED') {
    connStatusPill.classList.add('connected');
    connStatusPill.textContent = 'TERHUBUNG';
    btnConnectTikTok.style.display = 'none';
    btnDisconnectTikTok.style.display = 'inline-flex';
    connErrorMessage.classList.add('hidden');
    if (state.tiktokUser) tiktokUsernameInput.value = state.tiktokUser;
  } else if (state.tiktokStatus === 'CONNECTING') {
    connStatusPill.classList.add('connecting');
    connStatusPill.textContent = 'MENGHUBUNGKAN...';
    btnConnectTikTok.disabled = true;
    connErrorMessage.classList.add('hidden');
  } else if (state.tiktokStatus === 'ERROR') {
    connStatusPill.classList.add('disconnected');
    connStatusPill.textContent = 'ERROR';
    btnConnectTikTok.style.display = 'inline-flex';
    btnConnectTikTok.disabled = false;
    btnDisconnectTikTok.style.display = 'none';
    connErrorMessage.textContent = state.tiktokError || 'Gagal terhubung.';
    connErrorMessage.classList.remove('hidden');
  } else {
    connStatusPill.classList.add('disconnected');
    connStatusPill.textContent = 'TERPUTUS';
    btnConnectTikTok.style.display = 'inline-flex';
    btnConnectTikTok.disabled = false;
    btnDisconnectTikTok.style.display = 'none';
    connErrorMessage.classList.add('hidden');
  }

  // Subject Select & Countdown
  if (state.currentSubject && subjectSelect) {
    subjectSelect.value = state.currentSubject.key;
  }
  if (adminSubjectCountdown && state.subjectTimeLeft !== undefined) {
    adminSubjectCountdown.textContent = formatAdminTime(state.subjectTimeLeft);
  }

  // Active Question
  if (state.currentQuestion) {
    refreshQuestionPreview(state.currentQuestion, state.questionIndex, state.displayAnswer);
  }

  // Pause button
  btnTogglePause.textContent = state.isPaused ? '▶️ Lanjutkan Waktu' : '⏸️ Jeda Waktu';
  btnTogglePause.className = state.isPaused ? 'btn btn-success' : 'btn btn-warning';

  // Category filter
  if (state.activeCategory && categoryFilter.value !== state.activeCategory) {
    categoryFilter.value = state.activeCategory;
  }

  // Timer select
  if (state.timerDuration && timerDurationSelect.value !== state.timerDuration.toString()) {
    timerDurationSelect.value = state.timerDuration.toString();
  }

  // Intermission State
  if (adminIntermissionBadge && adminIntermissionTimer) {
    if (state.isIntermission) {
      adminIntermissionBadge.className = 'status-pill connecting';
      adminIntermissionBadge.textContent = 'SEDANG JEDA ISTIRAHAT 🔔';
      adminIntermissionTimer.textContent = `${state.intermissionTimeLeft || 30}s`;
    } else {
      adminIntermissionBadge.className = 'status-pill connected';
      adminIntermissionBadge.textContent = 'KUIS AKTIF 🟢';
      adminIntermissionTimer.textContent = '-';
    }
  }

  // Today Name & Champions
  if (adminTodayName && state.todayDayName) {
    adminTodayName.textContent = state.todayDayName;
  }
  if (state.dailyChampions) {
    renderAdminDailyChampionsList(state.dailyChampions, state.todayDayName || 'Selasa');
  }

  // Top Spenders List
  if (state.topSpenders) {
    renderAdminSultanList(state.topSpenders);
  }
}

function renderAdminSultanList(spenders) {
  if (!adminSultanList) return;
  if (!spenders || spenders.length === 0) {
    adminSultanList.innerHTML = `<div style="font-size: 11px; color: #92400e;">Belum ada donatur sultan.</div>`;
    return;
  }

  adminSultanList.innerHTML = '';
  spenders.slice(0, 5).forEach((s, idx) => {
    const rank = idx + 1;
    const rankBadgeHtml = `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;font-size:10px;font-weight:900;border:1.5px solid #0f172a;${
      rank === 1 ? 'background:#fde047;color:#713f12;' : rank === 2 ? 'background:#e2e8f0;color:#1e293b;' : rank === 3 ? 'background:#fed7aa;color:#7c2d12;' : 'background:#f1f5f9;color:#64748b;'
    }">${rank}</span>`;

    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.background = '#ffffff';
    div.style.border = '1px solid #fcd34d';
    div.style.padding = '4px 8px';
    div.style.borderRadius = '6px';
    div.style.fontSize = '11px';

    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        ${rankBadgeHtml}
        <img src="${s.avatar}" style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #78350f;">
        <span style="font-weight: 700; color: #0f172a;">@${s.nickname || s.uniqueId}</span>
      </div>
      <span style="font-weight: 800; color: #78350f; background: #fef08a; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#ca8a04" stroke="#854d0e" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-7 0c0 2 1.5 3 3.5 3s3.5 1 3.5 3a3.5 3.5 0 0 1-7 0"></path></svg>
        ${(s.totalCoins || 0).toLocaleString()} koin
      </span>
    `;
    adminSultanList.appendChild(div);
  });
}

function renderAdminDailyChampionsList(dailyChamps, todayName) {
  if (!adminDailyChampionsList) return;
  const list = dailyChamps[todayName] || [];
  if (list.length === 0) {
    adminDailyChampionsList.innerHTML = `<div style="font-size: 11px; color: #0369a1;">Belum ada juara kelas tercatat hari ini.</div>`;
    return;
  }

  adminDailyChampionsList.innerHTML = '';
  list.slice(0, 5).forEach((c, idx) => {
    const rank = c.rank || (idx + 1);
    const rankBadgeHtml = `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;font-size:10px;font-weight:900;border:1.5px solid #0f172a;${
      rank === 1 ? 'background:#fde047;color:#713f12;' : rank === 2 ? 'background:#e2e8f0;color:#1e293b;' : rank === 3 ? 'background:#fed7aa;color:#7c2d12;' : 'background:#f1f5f9;color:#64748b;'
    }">${rank}</span>`;

    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.background = '#ffffff';
    div.style.border = '1px solid #bae6fd';
    div.style.padding = '4px 8px';
    div.style.borderRadius = '6px';
    div.style.fontSize = '11px';

    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        ${rankBadgeHtml}
        <img src="${c.avatar}" style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #0369a1;">
        <div>
          <span style="font-weight: 700; color: #0f172a;">@${c.nickname || c.uniqueId}</span>
          <span style="font-size: 9px; color: #64748b; margin-left: 4px;">(${c.badge || 'Juara'})</span>
        </div>
      </div>
      <span style="font-weight: 800; color: #0369a1; background: #e0f2fe; padding: 1px 6px; border-radius: 4px;">${c.score || 0} PTS</span>
    `;
    adminDailyChampionsList.appendChild(div);
  });
}

function refreshQuestionPreview(q, idx, displayAnswer) {
  if (!q) return;
  activeQIndex.textContent = idx || 1;
  activeQPoints.textContent = q.points;
  activeQText.textContent = q.question;
  activeCategoryPill.textContent = q.category;
  activeQHint.textContent = q.hint || '-';

  // Match with questions list to get accepted answers array
  const fullQ = currentQuestionsList.find(item => item.id === q.id);
  if (fullQ) {
    activeQAnswer.textContent = fullQ.displayAnswer;
    activeQVariations.textContent = JSON.stringify(fullQ.answers);
  } else {
    activeQAnswer.textContent = displayAnswer || '-';
  }
}

// Event Listeners
btnConnectTikTok.addEventListener('click', () => {
  const user = tiktokUsernameInput.value.trim();
  if (!user) {
    alert('Masukkan username TikTok terlebih dahulu!');
    return;
  }
  socket.emit('admin:connectTikTok', { username: user });
});

btnDisconnectTikTok.addEventListener('click', () => {
  socket.emit('admin:disconnectTikTok');
});

btnNextQuestion.addEventListener('click', () => {
  socket.emit('admin:nextQuestion');
});

btnTogglePause.addEventListener('click', () => {
  socket.emit('admin:togglePause');
});

btnRevealHint.addEventListener('click', () => {
  socket.emit('admin:revealHint');
});

categoryFilter.addEventListener('change', () => {
  socket.emit('admin:setCategory', { category: categoryFilter.value });
});

timerDurationSelect.addEventListener('change', () => {
  socket.emit('admin:setTimerDuration', { duration: timerDurationSelect.value });
});

btnResetLeaderboard.addEventListener('click', () => {
  if (confirm('Yakin ingin mereset seluruh klasemen skor?')) {
    socket.emit('admin:resetLeaderboard');
  }
});

// Simulator Buttons
if (btnAdminTestSound) {
  btnAdminTestSound.addEventListener('click', () => {
    initAudio();
    playCorrectChime();
  });
}

if (btnSimFollow) {
  btnSimFollow.addEventListener('click', () => {
    initAudio();
    socket.emit('sim:follow');
  });
}

if (btnSimHattrick) {
  btnSimHattrick.addEventListener('click', () => {
    initAudio();
    socket.emit('sim:fastestStreak3x');
  });
}

// Voice Test Buttons (Instant Browser Audio Preview)
if (btnTestVoiceFollow) {
  btnTestVoiceFollow.addEventListener('click', () => {
    speakIndonesian('Selamat datang Budi Santoso, terima kasih sudah follow kelas kita!');
  });
}
if (btnTestVoice5s) {
  btnTestVoice5s.addEventListener('click', () => {
    speakIndonesian('Lima detik lagi, ayo cepat jawab!');
  });
}
if (btnTestVoiceHattrick) {
  btnTestVoiceHattrick.addEventListener('click', () => {
    speakIndonesian('Luar biasa pintarnya, Fajar Juara berhasil menjawab tercepat 3 kali berturut-turut! Hattrick juara kelas!');
  });
}
if (btnTestVoiceRace) {
  btnTestVoiceRace.addEventListener('click', () => {
    speakIndonesian('Sesi Balap Buaya Sungai dimulai! Ketik tagar satu sampai lima untuk dukung jagoanmu!');
  });
}

// Subject Controls
if (subjectSelect) {
  subjectSelect.addEventListener('change', () => {
    socket.emit('admin:setSubject', { subjectKey: subjectSelect.value });
  });
}

if (btnNextSubject) {
  btnNextSubject.addEventListener('click', () => {
    socket.emit('admin:nextSubject');
  });
}

btnSimGift.addEventListener('click', () => {
  initAudio();
  socket.emit('sim:gift', {
    giftName: 'Mawar',
    diamondCount: 1, // 1 koin = +20 detik
    repeatCount: 1
  });
});

if (btnSimGiftDonut) {
  btnSimGiftDonut.addEventListener('click', () => {
    initAudio();
    socket.emit('sim:gift', {
      giftName: 'Donut',
      diamondCount: 30, // 30 koin = +600 detik (10 menit!)
      repeatCount: 1
    });
  });
}

// Simulator Sultan & Balap Takhta
if (btnSimSultanGift) {
  btnSimSultanGift.addEventListener('click', () => {
    initAudio();
    socket.emit('sim:sultanGift', {
      coins: 100,
      giftName: 'Paus Laut',
      uniqueId: 'sultan_bos_dermawan',
      nickname: '👑 Sultan Bos Dermawan'
    });
  });
}

if (btnSimOvertake) {
  btnSimOvertake.addEventListener('click', () => {
    initAudio();
    const randomId = 'sultan_penantang_' + Math.floor(Math.random() * 900 + 100);
    socket.emit('sim:sultanGift', {
      coins: 1500, // Langsung membalap rank 1 (yang tadinya 1250)
      giftName: 'Singa Emas',
      uniqueId: randomId,
      nickname: '🔥 Sultan Penantang Baru'
    });
  });
}

// Intermission Break Scene & Crocodile Race Controls
if (btnTriggerIntermission) {
  btnTriggerIntermission.addEventListener('click', () => {
    socket.emit('admin:startIntermission', { duration: 15 });
  });
}

if (btnTriggerRace) {
  btnTriggerRace.addEventListener('click', () => {
    initAudio();
    socket.emit('admin:startRace');
  });
}

if (btnEndIntermission) {
  btnEndIntermission.addEventListener('click', () => {
    socket.emit('admin:endIntermission');
  });
}

if (btnSaveDailyChampions) {
  btnSaveDailyChampions.addEventListener('click', () => {
    socket.emit('admin:saveDailyChampions');
  });
}

// Crocodile Race Event
socket.on('event:raceStart', data => {
  playCorrectChime();
  speakIndonesian('Sesi Balap Buaya Sungai dimulai! Ketik tagar satu sampai lima untuk dukung jagoanmu!');
  if (adminToast) {
    toastUser.textContent = `🐊 BALAP BUAYA SUNGAI!`;
    toastMsg.textContent = `Balapan dimulai! Juara: ${data.winner ? data.winner.name : 'Rahasia'}`;
    adminToast.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      adminToast.classList.add('hidden');
    }, 4500);
  }
});

// Follower & Hattrick Admin Notifications
socket.on('event:newFollower', data => {
  playCorrectChime();
  speakIndonesian(data.greetingText || `Selamat datang @${data.nickname || data.uniqueId}, terima kasih sudah follow kelas kita!`);
  if (adminToast) {
    toastUser.textContent = `👤 Follower Baru!`;
    toastMsg.textContent = `@${data.nickname || data.uniqueId} baru saja follow! (TTS Aktif)`;
    adminToast.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      adminToast.classList.add('hidden');
    }, 4000);
  }
});

socket.on('event:fastestStreak3x', data => {
  playCorrectChime();
  speakIndonesian(`Luar biasa pintarnya, ${data.nickname || data.uniqueId} berhasil menjawab tercepat 3 kali berturut-turut! Hattrick juara kelas!`);
  if (adminToast) {
    toastUser.textContent = `🔥 HATTRICK 3X TERCEPAT!`;
    toastMsg.textContent = `@${data.nickname || data.uniqueId} 3x berturut-turut juara!`;
    adminToast.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      adminToast.classList.add('hidden');
    }, 5000);
  }
});

// Intermission & Sultan Socket Listeners for Admin
socket.on('event:intermissionStart', data => {
  if (adminIntermissionBadge) {
    adminIntermissionBadge.className = 'status-pill connecting';
    adminIntermissionBadge.textContent = 'SEDANG JEDA ISTIRAHAT 🔔';
  }
  if (adminIntermissionTimer) {
    adminIntermissionTimer.textContent = `${data.timeLeft || 30}s`;
  }
  if (data.dailyChampions && data.todayDayName) {
    renderAdminDailyChampionsList(data.dailyChampions, data.todayDayName);
  }
  if (data.topSpenders) {
    renderAdminSultanList(data.topSpenders);
  }
});

socket.on('event:intermissionTick', data => {
  if (adminIntermissionTimer) {
    adminIntermissionTimer.textContent = `${data.timeLeft}s`;
  }
});

socket.on('event:intermissionEnd', data => {
  if (adminIntermissionBadge) {
    adminIntermissionBadge.className = 'status-pill connected';
    adminIntermissionBadge.textContent = 'KUIS AKTIF 🟢';
  }
  if (adminIntermissionTimer) {
    adminIntermissionTimer.textContent = '-';
  }
});

socket.on('event:topSpendersUpdated', data => {
  if (data.topSpenders) {
    renderAdminSultanList(data.topSpenders);
  }
});

socket.on('event:topSpenderOvertake', data => {
  playCorrectChime();
  if (adminToast) {
    toastUser.textContent = `👑 @${data.nickname}`;
    toastMsg.textContent = `Membalap ke Rank #${data.newRank} Top Sultan (${data.totalCoins} 🪙)!`;
    adminToast.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      adminToast.classList.add('hidden');
    }, 4500);
  }
});

socket.on('event:dailyChampionsUpdated', data => {
  if (data.dailyChampions && data.todayDayName) {
    renderAdminDailyChampionsList(data.dailyChampions, data.todayDayName);
  }
});

btnSimLike.addEventListener('click', () => {
  socket.emit('sim:like', { count: 10 });
});

if (btnSimSendChat && simComment) {
  btnSimSendChat.addEventListener('click', () => {
    const comment = simComment.value.trim();
    const uname = (simUsername && simUsername.value.trim()) || 'penonton_ips';
    if (!comment) return;

    socket.emit('sim:chat', {
      uniqueId: uname.toLowerCase().replace(/\s+/g, '_'),
      nickname: uname,
      comment: comment
    });

    simComment.value = '';
  });

  simComment.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      btnSimSendChat.click();
    }
  });
}
