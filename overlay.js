/* ========================================================
   MODERN KUIS IPS TIKTOK LIVE STREAM OVERLAY SCRIPT
   Web Audio SFX Engine, Canvas Confetti & Socket.IO Client
   ======================================================== */

// Connect to WebSocket Server
const socket = io();

// Audio Synthesizer State (Web Audio API)
let audioCtx = null;
let isAudioMuted = false;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const banner = document.getElementById('audioUnlockBanner');
  if (banner) banner.classList.add('hidden');
}

// Sound Generators with Punchy Arcade Tones
function playTone(freq, type = 'triangle', duration = 0.15, gainVal = 0.35, startTime = 0) {
  if (isAudioMuted) return;
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
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

// Chime for correct answer (C5 -> E5 -> G5 -> C6 arpeggio)
function playCorrectChime() {
  initAudio();
  playTone(523.25, 'triangle', 0.14, 0.40, 0.00); // C5
  playTone(659.25, 'triangle', 0.14, 0.45, 0.08); // E5
  playTone(783.99, 'triangle', 0.18, 0.50, 0.16); // G5
  playTone(1046.50, 'sine',    0.45, 0.60, 0.24); // C6
}

// Tick for countdown warning
function playTick(isDanger = false) {
  const freq = isDanger ? 880 : 520;
  playTone(freq, 'sine', 0.06, isDanger ? 0.25 : 0.15);
}

// Fanfare for Gifts & Boss Round
function playFanfare() {
  initAudio();
  playTone(587.33, 'triangle', 0.15, 0.4, 0.00); // D5
  playTone(587.33, 'triangle', 0.15, 0.4, 0.10); // D5
  playTone(587.33, 'triangle', 0.15, 0.4, 0.20); // D5
  playTone(880.00, 'sine',     0.55, 0.5, 0.30); // A5
}

// School Bell chime (Westminster tone sequence: E5 -> G5 -> F5 -> C5)
function playSchoolBell() {
  initAudio();
  playTone(659.25, 'sine', 0.35, 0.45, 0.00); // E5
  playTone(783.99, 'sine', 0.35, 0.45, 0.30); // G5
  playTone(698.46, 'sine', 0.35, 0.45, 0.60); // F5
  playTone(523.25, 'sine', 0.70, 0.50, 0.90); // C5
}

// Overtake Fanfare (Celebrating a Sultan passing another)
function playOvertakeFanfare() {
  initAudio();
  playTone(523.25, 'triangle', 0.12, 0.45, 0.00); // C5
  playTone(659.25, 'triangle', 0.12, 0.45, 0.09); // E5
  playTone(783.99, 'triangle', 0.12, 0.50, 0.18); // G5
  playTone(1046.50, 'sine',    0.50, 0.55, 0.27); // C6
}

// Indonesian Text-to-Speech (TTS Engine)
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
  if (isAudioMuted || !('speechSynthesis' in window)) return;
  try {
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

// Whoosh for New Question
function playWhoosh() {
  if (isAudioMuted) return;
  initAudio();
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.exponentialRampToValueAtTime(850, t + 0.15);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch (e) {}
}

// Audio Toggle Button
const audioBtn = document.getElementById('audioBtn');
const audioIcon = document.getElementById('audioIcon');
audioBtn.addEventListener('click', () => {
  initAudio();
  isAudioMuted = !isAudioMuted;
  audioIcon.innerHTML = isAudioMuted 
    ? `<svg class="modern-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`
    : `<svg class="modern-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
  audioBtn.style.opacity = isAudioMuted ? '0.5' : '1';
});

// Category Icons Mapping
const CATEGORY_ICONS = {
  'GEOGRAFI': '🌍',
  'SEJARAH': '📜',
  'BUDAYA': '🎭',
  'EKONOMI & SOSIAL': '⚖️',
  'ALL': '🌐'
};

// DOM Elements
const categoryBadge = document.getElementById('categoryBadge');
const categoryName = document.getElementById('categoryName');
const catIcon = document.getElementById('catIcon');
const diffBadge = document.getElementById('diffBadge');
const bossBadge = document.getElementById('bossBadge');

const timerNumber = document.getElementById('timerNumber');
const radialProgress = document.getElementById('radialProgress');
const CIRCLE_CIRCUMFERENCE = 264; // 2 * PI * 42

const giftTargetName = document.getElementById('giftTargetName');
const giftCurrent = document.getElementById('giftCurrent');
const giftTargetMax = document.getElementById('giftTargetMax');
const giftProgressFill = document.getElementById('giftProgressFill');

const activeViewersCount = document.getElementById('activeViewersCount');
const totalSolvedCount = document.getElementById('totalSolvedCount');

const questionNumber = document.getElementById('questionNumber');
const questionPoints = document.getElementById('questionPoints');
const questionText = document.getElementById('questionText');

const hintBox = document.getElementById('hintBox');
const hintText = document.getElementById('hintText');

const answerRevealBanner = document.getElementById('answerRevealBanner');
const revealedAnswerText = document.getElementById('revealedAnswerText');

const winnerBanner = document.getElementById('winnerBanner');
const winnerAvatar = document.getElementById('winnerAvatar');
const winnerName = document.getElementById('winnerName');
const winnerCombo = document.getElementById('winnerCombo');
const winnerPoints = document.getElementById('winnerPoints');
const winnerOrderTag = document.getElementById('winnerOrderTag');

const subjBadge = document.getElementById('subjBadge');
const subjIcon = document.getElementById('subjIcon');
const subjName = document.getElementById('subjName');
const subjTimeLeft = document.getElementById('subjTimeLeft');
const subjectMainTitle = document.getElementById('subjectMainTitle');
const doodleSubjectSub = document.getElementById('doodleSubjectSub');
const bonusTimeToast = document.getElementById('bonusTimeToast');
const subjectChangeModal = document.getElementById('subjectChangeModal');
const announcementSubject = document.getElementById('announcementSubject');

const chatFeed = document.getElementById('chatFeed');
const leaderboardList = document.getElementById('leaderboardList');

const tiktokUserDisplay = document.getElementById('tiktokUserDisplay');
const connDot = document.getElementById('connDot');

// Top Sultan Strip Pill Elements
const topSultanStripPill = document.getElementById('topSultanStripPill');
const stripSultanName = document.getElementById('stripSultanName');
const stripSultanCoins = document.getElementById('stripSultanCoins');

// Top Spender Overtake Toast Elements
const overtakeToast = document.getElementById('overtakeToast');
const overtakeAvatar = document.getElementById('overtakeAvatar');
const overtakeName = document.getElementById('overtakeName');
const overtakeRank = document.getElementById('overtakeRank');
const overtakeCoins = document.getElementById('overtakeCoins');

// Intermission Scene Elements
const intermissionScene = document.getElementById('intermissionScene');
const intermissionNextBadge = document.getElementById('intermissionNextBadge');
const intermissionNextIcon = document.getElementById('intermissionNextIcon');
const intermissionNextName = document.getElementById('intermissionNextName');
const intermissionCountdown = document.getElementById('intermissionCountdown');
const dayTabsRow = document.getElementById('dayTabsRow');
const dailyChampionsRoster = document.getElementById('dailyChampionsRoster');
const sultanSpendersRoster = document.getElementById('sultanSpendersRoster');

let dailyChampionsData = {};
let topSpendersData = [];
let activeDayTab = 'Senin';
let overtakeToastTimeout = null;
let dayCyclingInterval = null;

// Subject Corner Mascot Prop Elements
const subjectCornerProp = document.getElementById('subjectCornerProp');
const propStampEmoji = document.getElementById('propStampEmoji');
const propStampLabel = document.getElementById('propStampLabel');

// Follower Greeting Elements
const followerGreetingBanner = document.getElementById('followerGreetingBanner');
const fgbAvatar = document.getElementById('fgbAvatar');
const fgbName = document.getElementById('fgbName');
let followerGreetingTimeout = null;

// Hattrick 3x Streak Elements
const hattrickBanner = document.getElementById('hattrickBanner');
const hattrickAvatar = document.getElementById('hattrickAvatar');
const hattrickName = document.getElementById('hattrickName');
let hattrickTimeout = null;

// Crocodile Race Elements
const crocodileRaceScene = document.getElementById('crocodileRaceScene');
const riverTrackContainer = document.getElementById('riverTrackContainer');
const raceCountdown = document.getElementById('raceCountdown');
const raceWinnerModal = document.getElementById('raceWinnerModal');
const raceWinnerName = document.getElementById('raceWinnerName');
const raceWinnerTag = document.getElementById('raceWinnerTag');
let raceAnimInterval = null;
let raceSecondsInterval = null;

const audioUnlockBanner = document.getElementById('audioUnlockBanner');

let currentActiveAnswer = '';
let totalDuration = 20;
let winnerBannerTimeout = null;

// Audio Unlock Banner Click
if (audioUnlockBanner) {
  audioUnlockBanner.addEventListener('click', () => {
    initAudio();
    playCorrectChime();
    audioUnlockBanner.classList.add('hidden');
  });
}

// ========================================================
// SOCKET.IO LISTENERS
// ========================================================

// 1. Initial State Sync
socket.on('game:syncState', data => {
  totalDuration = data.timerDuration || 25;
  totalSolvedCount.textContent = data.totalAnswered || 0;
  activeViewersCount.textContent = data.activeUserCount || 0;

  updateTikTokStatus(data.tiktokStatus, data.tiktokUser);
  updateTargetGift(data.targetGift);
  updateBossMode(data.isBossRound);
  updateSubjectDisplay(data.currentSubject, data.subjectTimeLeft);

  if (data.dailyChampions) dailyChampionsData = data.dailyChampions;
  if (data.topSpenders) {
    topSpendersData = data.topSpenders;
    renderTopSultanStrip(topSpendersData);
  }

  // Intermission Scene Handler
  if (data.isIntermission) {
    openIntermissionScene(data);
  } else {
    if (intermissionScene) intermissionScene.classList.add('hidden');
    if (dayCyclingInterval) clearInterval(dayCyclingInterval);
  }

  if (data.currentQuestion) {
    renderQuestion(data.currentQuestion, data.questionIndex);
    if (overlayAnswerHint) {
      overlayAnswerHint.textContent = data.displayAnswer || (data.currentQuestion && data.currentQuestion.hint) || '...';
    }
  }

  updateTimer(data.timeLeft, totalDuration);

  if (data.hintVisible && data.currentQuestion) {
    showHint(data.currentQuestion.hint);
  } else {
    hintBox.classList.remove('visible');
  }

  renderLeaderboard(data.leaderboard || []);

  if (data.recentGuesses && data.recentGuesses.length > 0) {
    chatFeed.innerHTML = '';
    // Reverse array so oldest is inserted first, newest ends at top
    [...data.recentGuesses].reverse().forEach(g => appendChatMessage(g));
  }
});

// 2. New Question
socket.on('game:newQuestion', data => {
  playWhoosh();
  totalDuration = data.timeLeft || 25;
  totalSolvedCount.textContent = data.totalAnswered;
  
  answerRevealBanner.classList.add('hidden');
  hintBox.classList.remove('visible');
  winnerBanner.classList.add('hidden');
  
  updateBossMode(data.isBossRound);
  updateSubjectDisplay(data.currentSubject, data.subjectTimeLeft);
  renderQuestion(data.question, data.questionIndex);
  updateTimer(data.timeLeft, totalDuration);
  if (overlayAnswerHint) {
    overlayAnswerHint.textContent = data.displayAnswer || '...';
  }
});

// 3. Timer Tick
socket.on('game:tick', data => {
  updateTimer(data.timeLeft, totalDuration);
  updateSubjectTimer(data.subjectTimeLeft);
  activeViewersCount.textContent = data.activeUserCount || 0;

  // Sound warning & Voice alert for last 5 seconds
  if (data.timeLeft === 5) {
    playTick(true);
    speakIndonesian("Lima detik lagi, ayo cepat jawab!");
  } else if (data.timeLeft < 5 && data.timeLeft > 0) {
    playTick(data.timeLeft <= 2);
  }
});

// 4. Timer Hurry (grace period after 1st winner)
socket.on('game:timerHurry', data => {
  updateTimer(data.timeLeft, totalDuration);
  radialProgress.classList.add('danger');
});

// 5. Hint Revealed
socket.on('game:hintRevealed', data => {
  showHint(data.hint);
});

// 6. Time Up (Round ended)
socket.on('game:timeUp', data => {
  revealedAnswerText.textContent = data.correctAnswer;
  answerRevealBanner.classList.remove('hidden');
});

// 7. Correct Answer (Winner celebration!)
socket.on('game:correctAnswer', data => {
  playCorrectChime();
  triggerConfetti();

  const w = data.winner;
  winnerName.textContent = `@${w.nickname || w.uniqueId}`;
  winnerAvatar.src = w.avatar;
  winnerPoints.textContent = w.pointsEarned;
  winnerCombo.textContent = `🔥 ${w.combo}x COMBO`;

  if (winnerOrderTag) {
    if (w.isFirst || w.winnerOrder === 1) {
      winnerOrderTag.textContent = '⚡ TERCEPAT #1';
      winnerOrderTag.style.background = '#059669';
    } else {
      winnerOrderTag.textContent = `✓ BENAR #${w.winnerOrder || 2}`;
      winnerOrderTag.style.background = '#2563eb';
    }
  }
  
  winnerBanner.classList.remove('hidden');

  // Clear previous hide timer
  if (winnerBannerTimeout) clearTimeout(winnerBannerTimeout);
  winnerBannerTimeout = setTimeout(() => {
    winnerBanner.classList.add('hidden');
  }, 4500);

  if (data.leaderboard) {
    renderLeaderboard(data.leaderboard);
  }
});

// 8. New Chat Guess
socket.on('game:newGuess', data => {
  appendChatMessage(data.guess);
  if (data.activeUserCount !== undefined) {
    activeViewersCount.textContent = data.activeUserCount;
  }
});

// 9. Gift Added Points Event (1 Koin = +100 Poin Pemain!)
socket.on('event:giftAddedTime', data => {
  playFanfare();
  triggerConfetti(1.5);
  
  updateTargetGift(data.targetGift);

  if (bonusTimeToast) {
    const pts = data.giftPoints || (data.coins * 100);
    bonusTimeToast.textContent = `+${pts} POIN! (${data.coins} 🪙)`;
    bonusTimeToast.classList.remove('hidden');
    setTimeout(() => {
      bonusTimeToast.classList.add('hidden');
    }, 3500);
  }

  if (data.triggeredBoss) {
    updateBossMode(true);
  }

  if (data.leaderboard) {
    renderLeaderboard(data.leaderboard);
  }
});

// 10. Subject Changed Event (Setiap 1 Jam)
socket.on('event:subjectChanged', data => {
  playFanfare();
  triggerConfetti(2);
  updateSubjectDisplay(data.subject, data.subjectTimeLeft);

  if (subjectChangeModal && announcementSubject) {
    announcementSubject.textContent = data.subject.name;
    subjectChangeModal.classList.remove('hidden');
    setTimeout(() => {
      subjectChangeModal.classList.add('hidden');
    }, 4500);
  }
});

// 11. Legacy Gift Event Fallback
socket.on('event:gift', data => {
  updateTargetGift(data.targetGift);
  if (data.leaderboard) {
    renderLeaderboard(data.leaderboard);
  }
});

// 12. Like Event
socket.on('event:like', data => {
  spawnFloatingHeart();
});

// 13. Leaderboard Update
socket.on('game:leaderboardUpdated', data => {
  renderLeaderboard(data.leaderboard || []);
});

// 14. Intermission Start (Pergantian Mapel & Juara Kelas Scene)
socket.on('event:intermissionStart', data => {
  openIntermissionScene(data);
  triggerConfetti(2);
});

// 15. Intermission Countdown Tick
socket.on('event:intermissionTick', data => {
  if (intermissionCountdown) {
    intermissionCountdown.textContent = `${data.timeLeft}s`;
  }
});

// 16. Intermission End (Kelas Baru Dimulai)
socket.on('event:intermissionEnd', data => {
  closeIntermissionScene();
});

// 17. Top Spender Overtake (Takhta Sultan Dibalap!)
socket.on('event:topSpenderOvertake', data => {
  showOvertakeToast(data);
});

// 18. Top Spenders Updated
socket.on('event:topSpendersUpdated', data => {
  topSpendersData = data.topSpenders || [];
  renderTopSultanStrip(topSpendersData);
  renderSultanSpendersRoster(topSpendersData);
});

// 19. Daily Champions Updated
socket.on('event:dailyChampionsUpdated', data => {
  dailyChampionsData = data.dailyChampions || {};
  renderDailyChampionsRoster(activeDayTab);
});

// 20. New Follower Event (Disambut Suara TTS & Popup Banner)
socket.on('event:newFollower', data => {
  showFollowerGreeting(data);
});

// 21. Fastest Streak 3x Event (Apresiasi Hattrick Juara Kelas)
socket.on('event:fastestStreak3x', data => {
  showHattrickAppreciation(data);
});

// 22. Crocodile River Derby Race Event (Setiap 3 Mapel Selesai)
socket.on('event:raceStart', data => {
  startCrocodileRaceAnimation(data);
});

// ========================================================
// RENDER FUNCTIONS & HELPERS
// ========================================================

function formatTime(sec) {
  if (sec === undefined || sec === null || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateSubjectDisplay(subj, timeLeft) {
  if (!subj) return;
  if (subjIcon) subjIcon.textContent = subj.icon || '📚';
  if (subjName) subjName.textContent = 'MAPEL: ' + (subj.key || 'IPS');
  if (subjectMainTitle) subjectMainTitle.textContent = subj.name || 'ILMU PENGETAHUAN SOSIAL';
  if (subjTimeLeft && timeLeft !== undefined) subjTimeLeft.textContent = formatTime(timeLeft);
  if (doodleSubjectSub) doodleSubjectSub.textContent = `kelas live: ${subj.doodle || subj.badge || 'belajar interaktif'} ✏️`;

  // Dynamic Theme Class on Container
  const container = document.querySelector('.overlay-container');
  if (container) {
    container.classList.remove('theme-ips', 'theme-ipa', 'theme-mtk', 'theme-bahasa', 'theme-fisika', 'theme-pjok');
    if (subj.themeClass) container.classList.add(subj.themeClass);
  }

  // Dynamic Corner Props based on Subject (Matching TikTok Live Quiz Reference)
  const cpTL = document.getElementById('cornerPropTL');
  const cpTR = document.getElementById('cornerPropTR');
  const cpBL = document.getElementById('cornerPropBL');
  const cpBR = document.getElementById('cornerPropBR');
  if (subj.key === 'MTK') {
    if (cpTL) cpTL.textContent = 'π';
    if (cpTR) cpTR.textContent = '√x';
    if (cpBL) cpBL.textContent = 'Σ';
    if (cpBR) cpBR.textContent = '÷';
  } else if (subj.key === 'IPA') {
    if (cpTL) cpTL.textContent = '🔬';
    if (cpTR) cpTR.textContent = '🧪';
    if (cpBL) cpBL.textContent = '🧬';
    if (cpBR) cpBR.textContent = '⚛️';
  } else if (subj.key === 'BAHASA') {
    if (cpTL) cpTL.textContent = '📖';
    if (cpTR) cpTR.textContent = '✍️';
    if (cpBL) cpBL.textContent = '📚';
    if (cpBR) cpBR.textContent = '🗣️';
  } else {
    // Default IPS
    if (cpTL) cpTL.textContent = '🌍';
    if (cpTR) cpTR.textContent = '📜';
    if (cpBL) cpBL.textContent = '🏛️';
    if (cpBR) cpBR.textContent = '🗺️';
  }

  // Dynamic Corner Mascot Prop
  if (propStampEmoji) propStampEmoji.textContent = subj.cornerIcon || subj.icon || '🌍';
  if (propStampLabel) propStampLabel.textContent = subj.cornerMascotName || subj.key;
}

function updateSubjectTimer(timeLeft) {
  if (subjTimeLeft && timeLeft !== undefined) {
    subjTimeLeft.textContent = formatTime(timeLeft);
  }
}

function renderQuestion(q, idx) {
  if (!q) return;
  questionNumber.textContent = idx || 1;
  questionPoints.textContent = q.points;
  questionText.textContent = q.question;

  const cat = q.category || 'GEOGRAFI';
  categoryName.textContent = cat;
  catIcon.textContent = CATEGORY_ICONS[cat] || '🌍';
  diffBadge.textContent = (q.difficulty || 'SEDANG').toUpperCase();
  hintText.textContent = q.hint || 'Petunjuk segera hadir...';
}

function showHint(hint) {
  if (!hint) return;
  hintText.textContent = hint;
  hintBox.classList.add('visible');
}

function updateTimer(timeLeft, max) {
  timerNumber.textContent = Math.max(0, timeLeft);

  const pct = Math.max(0, Math.min(1, timeLeft / (max || 20)));
  const offset = CIRCLE_CIRCUMFERENCE * (1 - pct);
  radialProgress.style.strokeDashoffset = offset;

  radialProgress.classList.remove('warning', 'danger');
  if (timeLeft <= 4) {
    radialProgress.classList.add('danger');
  } else if (timeLeft <= 8) {
    radialProgress.classList.add('warning');
  }
}

function updateTargetGift(tg) {
  if (!tg) return;
  giftTargetName.textContent = tg.name;
  giftCurrent.textContent = tg.current;
  giftTargetMax.textContent = tg.target;
  const pct = Math.min(100, (tg.current / tg.target) * 100);
  giftProgressFill.style.width = `${pct}%`;
}

function updateBossMode(isBoss) {
  if (isBoss) {
    bossBadge.classList.remove('hidden');
  } else {
    bossBadge.classList.add('hidden');
  }
}

function updateTikTokStatus(status, user) {
  connDot.className = 'conn-dot';
  if (status === 'CONNECTED') {
    connDot.classList.add('connected');
    tiktokUserDisplay.textContent = `TikTok: @${user} (Aktif)`;
  } else if (status === 'CONNECTING') {
    connDot.classList.add('connecting');
    tiktokUserDisplay.textContent = `TikTok: Menghubungkan...`;
  } else if (status === 'ERROR') {
    connDot.classList.add('error');
    tiktokUserDisplay.textContent = `TikTok: Gagal Terhubung`;
  } else {
    tiktokUserDisplay.textContent = `TikTok: Belum Terhubung`;
  }
}

function formatScoreBadge(score) {
  if (!score || score <= 0) return '0 PTS';
  if (score >= 10000) {
    return (score / 1000).toFixed(1) + 'k PTS';
  }
  return score.toLocaleString('id-ID') + ' PTS';
}

function appendChatMessage(g) {
  const emptyState = chatFeed.querySelector('.chat-empty-state');
  if (emptyState) emptyState.remove();

  const item = document.createElement('div');
  item.className = `chat-item ${g.isCorrect ? 'correct' : ''}`;

  let tagHtml = '';
  if (g.isCorrect) {
    if (g.winnerOrder === 1) {
      tagHtml = `<span class="chat-tag correct">⚡ #1 (+${g.pointsEarned})</span>`;
    } else if (g.winnerOrder > 1) {
      tagHtml = `<span class="chat-tag correct">✓ #${g.winnerOrder} (+${g.pointsEarned})</span>`;
    } else {
      tagHtml = `<span class="chat-tag correct">✓ (+${g.pointsEarned})</span>`;
    }
  } else {
    tagHtml = `<span class="chat-tag wrong">✗ SALAH</span>`;
  }

  item.innerHTML = `
    <img src="${g.avatar}" class="chat-avatar" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=fallback'">
    <div class="chat-bubble-body">
      <div class="chat-bubble-header">
        <span class="chat-user">@${escapeHtml(g.nickname || g.uniqueId)}</span>
        ${tagHtml}
      </div>
      <div class="chat-guess">${escapeHtml(g.comment)}</div>
    </div>
  `;

  chatFeed.insertBefore(item, chatFeed.firstChild);

  // Keep max 15 items in DOM
  while (chatFeed.children.length > 15) {
    chatFeed.removeChild(chatFeed.lastChild);
  }
}

function renderLeaderboard(list) {
  if (!list || list.length === 0) {
    leaderboardList.innerHTML = `<div class="rank-empty-state">Belum ada skor</div>`;
    return;
  }

  leaderboardList.innerHTML = '';
  list.forEach((player, idx) => {
    const rank = idx + 1;
    let rankClass = '';
    let rankBadge = rank;

    if (rank === 1) { rankClass = 'top-1'; rankBadge = '🥇'; }
    else if (rank === 2) { rankClass = 'top-2'; rankBadge = '🥈'; }
    else if (rank === 3) { rankClass = 'top-3'; rankBadge = '🥉'; }

    let crownBadge = rank === 1 ? `<span style="font-size: 9px; margin-right: 2px;">👑</span>` : '';
    const streakHtml = player.combo > 1 ? `<span class="rank-streak">🔥 ${player.combo}x STREAK</span>` : '';

    const row = document.createElement('div');
    row.className = `rank-item ${rankClass}`;
    row.innerHTML = `
      <span class="rank-num">${rankBadge}</span>
      <img src="${player.avatar}" class="rank-avatar" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=fallback'">
      <div class="rank-name-box">
        <span class="rank-name">${crownBadge}@${escapeHtml(player.nickname || player.uniqueId)}</span>
        ${streakHtml}
      </div>
      <span class="rank-score">${formatScoreBadge(player.score)}</span>
    `;
    leaderboardList.appendChild(row);
  });
}

// Render Top Sultan Pill in header strip
function renderTopSultanStrip(spenders) {
  if (!topSultanStripPill) return;
  if (!spenders || spenders.length === 0) {
    topSultanStripPill.classList.add('hidden');
    return;
  }
  topSultanStripPill.classList.remove('hidden');
  const top1 = spenders[0];
  if (stripSultanName) stripSultanName.textContent = `@${top1.nickname || top1.uniqueId}`;
  if (stripSultanCoins) stripSultanCoins.textContent = `${(top1.totalCoins || 0).toLocaleString()} 🪙`;
}

// Show Top Spender Overtake Toast (Dibalap!)
function showOvertakeToast(info) {
  if (!overtakeToast || !info) return;
  playOvertakeFanfare();
  triggerConfetti(2);

  if (overtakeAvatar) overtakeAvatar.src = info.avatar || getDefaultAvatar(info.uniqueId);
  if (overtakeName) overtakeName.textContent = `@${info.nickname || info.uniqueId}`;
  if (overtakeRank) overtakeRank.textContent = `Rank #${info.newRank}`;
  if (overtakeCoins) overtakeCoins.textContent = (info.totalCoins || 0).toLocaleString();

  overtakeToast.classList.remove('hidden');

  if (overtakeToastTimeout) clearTimeout(overtakeToastTimeout);
  overtakeToastTimeout = setTimeout(() => {
    overtakeToast.classList.add('hidden');
  }, 5000);
}

// Render Daily Champions Roster for given day
function renderDailyChampionsRoster(day) {
  if (!dailyChampionsRoster) return;
  activeDayTab = day || 'Senin';

  // Highlight active tab
  if (dayTabsRow) {
    const tabs = dayTabsRow.querySelectorAll('.day-tab-btn');
    tabs.forEach(tab => {
      const tabDay = tab.getAttribute('data-day');
      if (tabDay === activeDayTab) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  const list = (dailyChampionsData && dailyChampionsData[activeDayTab]) ? dailyChampionsData[activeDayTab] : [];
  if (list.length === 0) {
    dailyChampionsRoster.innerHTML = `<div class="rank-empty-state">Belum ada catatan juara untuk hari ${activeDayTab}</div>`;
    return;
  }

  dailyChampionsRoster.innerHTML = '';
  list.forEach((champ, idx) => {
    const rank = champ.rank || (idx + 1);
    let rankBadge = rank;
    let cardClass = '';
    if (rank === 1) { rankBadge = '🥇'; cardClass = 'rank-1'; }
    else if (rank === 2) { rankBadge = '🥈'; cardClass = 'rank-2'; }
    else if (rank === 3) { rankBadge = '🥉'; cardClass = 'rank-3'; }

    const item = document.createElement('div');
    item.className = `champ-card ${cardClass}`;
    item.innerHTML = `
      <span class="champ-rank-badge">${rankBadge}</span>
      <img src="${champ.avatar}" class="champ-avatar" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=fallback'">
      <div class="champ-info">
        <div class="champ-name">${rank === 1 ? '👑 ' : ''}@${escapeHtml(champ.nickname || champ.uniqueId)}</div>
        <span class="champ-badge-lbl">${champ.badge || (rank === 1 ? 'Juara 1 Kelas' : `Top ${rank}`)}</span>
      </div>
      <span class="champ-score">${champ.score || 0} PTS</span>
    `;
    dailyChampionsRoster.appendChild(item);
  });
}

// Render Sultan Spenders Roster (Hall of Fame, never resets)
function renderSultanSpendersRoster(spenders) {
  if (!sultanSpendersRoster) return;
  const list = spenders || topSpendersData || [];

  if (list.length === 0) {
    sultanSpendersRoster.innerHTML = `<div class="rank-empty-state">Belum ada Sultan Donatur</div>`;
    return;
  }

  sultanSpendersRoster.innerHTML = '';
  list.slice(0, 5).forEach((sultan, idx) => {
    const rank = idx + 1;
    let rankBadge = `#${rank}`;
    let cardClass = '';
    let roleText = 'Pendukung Kelas';

    if (rank === 1) {
      rankBadge = '🥇';
      cardClass = 'sultan-1';
      roleText = '👑 SULTAN AGUNG';
    } else if (rank === 2) {
      rankBadge = '🥈';
      roleText = '⚡ SULTAN UTAMA';
    } else if (rank === 3) {
      rankBadge = '🥉';
      roleText = '⭐ SULTAN MUDA';
    }

    const item = document.createElement('div');
    item.className = `sultan-card ${cardClass}`;
    item.innerHTML = `
      <span class="sultan-rank-badge">${rankBadge}</span>
      <img src="${sultan.avatar}" class="sultan-avatar" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=fallback'">
      <div class="sultan-info">
        <div class="sultan-name-text">@${escapeHtml(sultan.nickname || sultan.uniqueId)}</div>
        <span class="sultan-role">${roleText}</span>
      </div>
      <div class="sultan-coins-box">
        <span>🪙 ${(sultan.totalCoins || 0).toLocaleString()}</span>
      </div>
    `;
    sultanSpendersRoster.appendChild(item);
  });
}

// Open Intermission Break Scene
function openIntermissionScene(data) {
  if (!intermissionScene) return;
  playSchoolBell();

  if (data.dailyChampions) dailyChampionsData = data.dailyChampions;
  if (data.topSpenders) {
    topSpendersData = data.topSpenders;
    renderTopSultanStrip(topSpendersData);
  }

  if (intermissionCountdown) {
    intermissionCountdown.textContent = `${data.timeLeft || 15}s`;
  }

  if (data.nextSubject) {
    if (intermissionNextIcon) intermissionNextIcon.textContent = data.nextSubject.icon || '📚';
    if (intermissionNextName) intermissionNextName.textContent = data.nextSubject.name || data.nextSubject.key;
  }

  activeDayTab = data.todayDayName || 'Senin';
  renderDailyChampionsRoster(activeDayTab);
  renderSultanSpendersRoster(topSpendersData);

  intermissionScene.classList.remove('hidden');

  // Auto-cycle through days of the week every 5 seconds so live audience sees all days!
  if (dayCyclingInterval) clearInterval(dayCyclingInterval);
  const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  let currentIdx = daysList.indexOf(activeDayTab);
  if (currentIdx === -1) currentIdx = 0;

  dayCyclingInterval = setInterval(() => {
    currentIdx = (currentIdx + 1) % daysList.length;
    renderDailyChampionsRoster(daysList[currentIdx]);
  }, 5000);
}

// Close Intermission Scene
function closeIntermissionScene() {
  if (intermissionScene) intermissionScene.classList.add('hidden');
  if (dayCyclingInterval) clearInterval(dayCyclingInterval);
  playSchoolBell();
}

// Show Follower Greeting Banner & TTS Voice
function showFollowerGreeting(data) {
  if (!followerGreetingBanner) return;
  playCorrectChime();
  if (fgbAvatar) fgbAvatar.src = data.avatar || getDefaultAvatar(data.uniqueId);
  if (fgbName) fgbName.textContent = `@${data.nickname || data.uniqueId}`;
  followerGreetingBanner.classList.remove('hidden');

  speakIndonesian(data.greetingText || `Selamat datang @${data.nickname || data.uniqueId}, terima kasih sudah follow kelas kita!`);

  if (followerGreetingTimeout) clearTimeout(followerGreetingTimeout);
  followerGreetingTimeout = setTimeout(() => {
    followerGreetingBanner.classList.add('hidden');
  }, 5000);
}

// Show Hattrick 3x Fastest Streak Banner & TTS Voice Appreciation
function showHattrickAppreciation(data) {
  if (!hattrickBanner) return;
  playFanfare();
  triggerConfetti(2.5);

  if (hattrickAvatar) hattrickAvatar.src = data.avatar || getDefaultAvatar(data.uniqueId);
  if (hattrickName) hattrickName.textContent = `@${data.nickname || data.uniqueId}`;
  hattrickBanner.classList.remove('hidden');

  speakIndonesian(`Luar biasa pintarnya, ${data.nickname || data.uniqueId} berhasil menjawab tercepat 3 kali berturut-turut! Hattrick juara kelas!`);

  if (hattrickTimeout) clearTimeout(hattrickTimeout);
  hattrickTimeout = setTimeout(() => {
    hattrickBanner.classList.add('hidden');
  }, 6500);
}

// Sesi Balapan Buaya Sungai (Crocodile River Derby) Animation
function startCrocodileRaceAnimation(data) {
  if (!crocodileRaceScene || !riverTrackContainer) return;
  playFanfare();
  triggerConfetti(1.5);

  speakIndonesian("Sesi Balap Buaya Sungai dimulai! Ketik tagar satu sampai lima untuk dukung jagoanmu!");

  crocodileRaceScene.classList.remove('hidden');
  if (raceWinnerModal) raceWinnerModal.classList.add('hidden');
  if (intermissionScene) intermissionScene.classList.add('hidden');

  const crocs = data.crocodiles || [
    { id: 1, name: 'Kroko Muara', lane: 1, color: '#16a34a', emoji: '🐊', tag: 'Topi Pramuka' },
    { id: 2, name: 'Kroko Rawa', lane: 2, color: '#ca8a04', emoji: '🐊', tag: 'Pelampung Bebek' },
    { id: 3, name: 'Kroko Darat', lane: 3, color: '#dc2626', emoji: '🐊', tag: 'Kacamata Hitam' },
    { id: 4, name: 'Kroko Sungai', lane: 4, color: '#0284c7', emoji: '🐊', tag: 'Topi Wisuda' },
    { id: 5, name: 'Kroko Sultan', lane: 5, color: '#9333ea', emoji: '🐊', tag: 'Mahkota Emas' }
  ];

  riverTrackContainer.innerHTML = '';
  const positions = {};

  crocs.forEach(c => {
    positions[c.id] = 5; // Mulai dari 5%
    const laneDiv = document.createElement('div');
    laneDiv.className = 'croc-lane';
    laneDiv.innerHTML = `
      <span class="lane-badge" style="background:${c.color};">#${c.lane}</span>
      <div class="croc-runner" id="crocRunner_${c.id}" style="left: 36px;">
        <div class="croc-avatar-wrap" style="background: ${c.color}20; border-color: ${c.color};">
          ${c.emoji}
        </div>
        <div class="croc-info-bubble">
          <div class="croc-name">${c.name}</div>
          <div class="croc-tag">${c.tag}</div>
        </div>
      </div>
    `;
    riverTrackContainer.appendChild(laneDiv);
  });

  let timeLeft = data.duration || 16;
  if (raceCountdown) raceCountdown.textContent = `${timeLeft}s`;

  if (raceSecondsInterval) clearInterval(raceSecondsInterval);
  raceSecondsInterval = setInterval(() => {
    timeLeft--;
    if (raceCountdown) raceCountdown.textContent = `${Math.max(0, timeLeft)}s`;
    if (timeLeft <= 0) clearInterval(raceSecondsInterval);
  }, 1000);

  if (raceAnimInterval) clearInterval(raceAnimInterval);
  const winnerId = (data.winner && data.winner.id) || (data.winnerId || 1);

  raceAnimInterval = setInterval(() => {
    crocs.forEach(c => {
      const runner = document.getElementById(`crocRunner_${c.id}`);
      if (!runner) return;
      
      const isWinner = c.id === winnerId;
      const boost = isWinner ? (Math.random() * 6 + 4.5) : (Math.random() * 5 + 2);
      positions[c.id] = Math.min(positions[c.id] + boost, isWinner ? 86 : 76);
      
      runner.style.left = `calc(${positions[c.id]}% - 20px)`;
    });

    if (positions[winnerId] >= 85) {
      clearInterval(raceAnimInterval);
      triggerConfetti(3);
      if (raceWinnerModal) {
        if (raceWinnerName) raceWinnerName.textContent = `🐊 ${data.winner.name} (#${data.winner.lane})`;
        if (raceWinnerTag) raceWinnerTag.textContent = data.winner.tag || 'Juara 1 Balapan';
        raceWinnerModal.classList.remove('hidden');
      }
      speakIndonesian(`Pemenang balapan buaya adalah ${data.winner.name}! Selamat kepada para pendukung!`);

      setTimeout(() => {
        if (crocodileRaceScene) crocodileRaceScene.classList.add('hidden');
      }, 3500);
    }
  }, 700);
}

// Day Tab Click Handlers
if (dayTabsRow) {
  dayTabsRow.addEventListener('click', e => {
    const btn = e.target.closest('.day-tab-btn');
    if (!btn) return;
    const day = btn.getAttribute('data-day');
    if (day) {
      if (dayCyclingInterval) clearInterval(dayCyclingInterval); // Pause auto-cycle on manual click
      renderDailyChampionsRoster(day);
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Confetti Particle Burst
function triggerConfetti(multiplier = 1) {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 50 * multiplier,
      spread: 70,
      origin: { y: 0.45 },
      colors: ['#00f2fe', '#10b981', '#fbbf24', '#f43f5e', '#8b5cf6']
    });
  }
}

// Floating Hearts for Likes
function spawnFloatingHeart() {
  const heart = document.createElement('div');
  heart.textContent = ['❤️', '💖', '✨', '🔥'][Math.floor(Math.random() * 4)];
  heart.style.position = 'absolute';
  heart.style.right = `${20 + Math.random() * 40}px`;
  heart.style.bottom = `${40 + Math.random() * 30}px`;
  heart.style.fontSize = `${16 + Math.random() * 12}px`;
  heart.style.pointerEvents = 'none';
  heart.style.zIndex = '999';
  heart.style.transition = 'all 1.8s ease-out';
  heart.style.transform = 'translateY(0) scale(1)';
  heart.style.opacity = '1';

  document.body.appendChild(heart);

  requestAnimationFrame(() => {
    heart.style.transform = `translate(${-(Math.random() * 60)}px, -${150 + Math.random() * 100}px) scale(1.4)`;
    heart.style.opacity = '0';
  });

  setTimeout(() => {
    heart.remove();
  }, 1900);
}

// Click anywhere to initialize Audio Context (browser auto-play policy)
window.addEventListener('click', () => {
  initAudio();
}, { once: true });
