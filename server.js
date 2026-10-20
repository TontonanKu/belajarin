const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
let { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3050;
const DATA_DIR = path.join(__dirname, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const TOP_SPENDERS_FILE = path.join(DATA_DIR, 'top_spenders.json');
const DAILY_CHAMPIONS_FILE = path.join(DATA_DIR, 'daily_champions.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not initialize DATA_DIR:', e.message);
}

// Load Questions
let questions = [];
try {
  questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
} catch (e) {
  console.error('Failed to load questions.json', e);
  questions = [];
}

// Load Leaderboard (Current session points)
let leaderboard = {};
try {
  if (fs.existsSync(LEADERBOARD_FILE)) {
    leaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load leaderboard.json', e);
  leaderboard = {};
}

function saveLeaderboard() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save leaderboard', e);
  }
}

// Load Top Spenders (Permanent, NEVER resets)
let topSpenders = {};
try {
  if (fs.existsSync(TOP_SPENDERS_FILE)) {
    topSpenders = JSON.parse(fs.readFileSync(TOP_SPENDERS_FILE, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load top_spenders.json', e);
  topSpenders = {};
}

function saveTopSpenders() {
  try {
    fs.writeFileSync(TOP_SPENDERS_FILE, JSON.stringify(topSpenders, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save top_spenders', e);
  }
}

// Load Daily Champions (Top 5 per day: Senin - Minggu)
const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
function getTodayDayName() {
  const dayIdx = new Date().getDay();
  return INDONESIAN_DAYS[dayIdx];
}

let dailyChampions = {};
try {
  if (fs.existsSync(DAILY_CHAMPIONS_FILE)) {
    dailyChampions = JSON.parse(fs.readFileSync(DAILY_CHAMPIONS_FILE, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load daily_champions.json', e);
  dailyChampions = {};
}

function saveDailyChampions() {
  try {
    fs.writeFileSync(DAILY_CHAMPIONS_FILE, JSON.stringify(dailyChampions, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save daily_champions', e);
  }
}

function getTopSpenders(limit = 10) {
  return Object.values(topSpenders)
    .sort((a, b) => (b.totalCoins || 0) - (a.totalCoins || 0))
    .slice(0, limit);
}

function updateDailyChampionsWithCurrent() {
  const today = getTodayDayName();
  const liveTop = Object.values(leaderboard)
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (liveTop.length > 0) {
    if (!dailyChampions[today]) dailyChampions[today] = [];
    const merged = [...dailyChampions[today]];
    liveTop.forEach(player => {
      const existingIdx = merged.findIndex(c => c.uniqueId === player.uniqueId);
      if (existingIdx >= 0) {
        if (player.score > merged[existingIdx].score) {
          merged[existingIdx].score = player.score;
          merged[existingIdx].nickname = player.nickname || merged[existingIdx].nickname;
          merged[existingIdx].avatar = player.avatar || merged[existingIdx].avatar;
        }
      } else {
        merged.push({
          uniqueId: player.uniqueId,
          nickname: player.nickname,
          avatar: player.avatar,
          score: player.score
        });
      }
    });

    merged.sort((a, b) => b.score - a.score);
    dailyChampions[today] = merged.slice(0, 5).map((c, i) => ({
      rank: i + 1,
      uniqueId: c.uniqueId,
      nickname: c.nickname,
      avatar: c.avatar,
      score: c.score,
      badge: i === 0 ? 'Juara 1 Kelas' : (i === 1 ? 'Juara 2 Kelas' : (i === 2 ? 'Juara 3 Kelas' : `Top ${i + 1}`))
    }));
    saveDailyChampions();
  }
}

// Subject Catalog for 15-Minute Rotation Schedule (With Visual Props & Mascot Styles)
const SUBJECTS = [
  { 
    key: 'IPS', 
    name: 'ILMU PENGETAHUAN SOSIAL', 
    icon: '🌍', 
    badge: 'SEJARAH & GEOGRAFI', 
    color: '#0284c7', 
    themeClass: 'theme-ips',
    cornerIcon: '🌍',
    cornerMascotName: 'BOLA DUNIA & CANDI',
    doodle: 'sejarah nusantara, peta & budaya 🏛️'
  },
  { 
    key: 'IPA', 
    name: 'ILMU PENGETAHUAN ALAM', 
    icon: '🔬', 
    badge: 'BIOLOGI & SAINS', 
    color: '#059669', 
    themeClass: 'theme-ipa',
    cornerIcon: '🔬',
    cornerMascotName: 'MIKROSKOP & TABUNG KIMIA',
    doodle: 'eksperimen biologi & tata surya 🧪'
  },
  { 
    key: 'MTK', 
    name: 'MATEMATIKA', 
    icon: '📐', 
    badge: 'HITUNG CEPAT', 
    color: '#d97706', 
    themeClass: 'theme-mtk',
    cornerIcon: '📐',
    cornerMascotName: 'PENGGARIS & KALKULATOR',
    doodle: 'hitung cepat, geometri & logika angka 🔢'
  },
  { 
    key: 'BAHASA INDONESIA', 
    name: 'BAHASA INDONESIA', 
    icon: '📖', 
    badge: 'PERIBAHASA & SASTRA', 
    color: '#e11d48', 
    themeClass: 'theme-bahasa',
    cornerIcon: '📖',
    cornerMascotName: 'KAMUS & PENA BULU EMAS',
    doodle: 'peribahasa, puisi sastra & kata baku 🪶'
  },
  { 
    key: 'FISIKA', 
    name: 'FISIKA & TEKNOLOGI', 
    icon: '⚡', 
    badge: 'SAINS & HUKUM ALAM', 
    color: '#7c3aed', 
    themeClass: 'theme-fisika',
    cornerIcon: '⚡',
    cornerMascotName: 'KUMPARAN TESLA & ATOM',
    doodle: 'hukum alam, gravitasi & energi listrik ⚛️'
  },
  { 
    key: 'PJOK', 
    name: 'OLAHRAGA & KESEHATAN', 
    icon: '⚽', 
    badge: 'ATLETIK & KESEHATAN', 
    color: '#0891b2', 
    themeClass: 'theme-pjok',
    cornerIcon: '⚽',
    cornerMascotName: 'BOLA & PIALA JUARA',
    doodle: 'kebugaran, atletik & kesehatan jasmani 🏆'
  }
];

// Model Buaya Balapan (Crocodile River Derby)
const CROCODILES = [
  { id: 1, name: 'Kroko Muara', lane: 1, color: '#16a34a', emoji: '🐊', tag: 'Topi Pramuka 🏕️' },
  { id: 2, name: 'Kroko Rawa', lane: 2, color: '#ca8a04', emoji: '🐊', tag: 'Pelampung Bebek 🐥' },
  { id: 3, name: 'Kroko Darat', lane: 3, color: '#dc2626', emoji: '🐊', tag: 'Kacamata Hitam 😎' },
  { id: 4, name: 'Kroko Sungai', lane: 4, color: '#0284c7', emoji: '🐊', tag: 'Topi Wisuda 🎓' },
  { id: 5, name: 'Kroko Sultan', lane: 5, color: '#9333ea', emoji: '🐊', tag: 'Mahkota Emas 👑' }
];

// Game State
const gameState = {
  currentQuestion: null,
  questionIndex: 0,
  totalAnswered: 0,
  timerDuration: 25, // default 25 seconds per question
  timeLeft: 25,
  isPaused: false,
  activeCategory: 'ALL',
  currentSubjectIndex: 0,
  currentSubject: SUBJECTS[0], // Starts with IPS
  subjectTimeLeft: 900, // 15 menit per mapel = 900 detik
  completedSubjectsCount: 0, // Hitung jumlah mapel selesai (tiap 3 = Balap Buaya!)
  isIntermission: false, // Intermission scene between subjects
  intermissionDuration: 15, // 15 detik jeda per mapel
  intermissionTimeLeft: 0,
  upcomingSubject: null,
  isRaceActive: false, // Sesi Balapan Buaya
  raceData: null,
  lastFastestUserId: null, // Track streak penjawab tercepat
  fastestStreakCount: 0,
  hintVisible: false,
  roundWinners: [], // all users who answered correctly in current round
  activeUsers: new Map(), // userId -> lastActivity timestamp (to track active viewers)
  recentGuesses: [], // feed of recent guesses
  recentWinnerBanner: null, // banner notification
  targetGift: {
    name: 'Mawar',
    current: 0,
    target: 50,
    reward: '2x Double Poin Round'
  },
  isBossRound: false,
  bossMultiplier: 1,
  totalLikes: 0,
  tiktokUser: '',
  tiktokStatus: 'DISCONNECTED', // DISCONNECTED, CONNECTING, CONNECTED, ERROR
  tiktokError: null
};

// TikTok Live Connection
let tiktokLiveConnection = null;

function connectTikTok(username) {
  if (!username) return;
  username = username.replace(/^@/, '').trim();
  gameState.tiktokUser = username;
  gameState.tiktokStatus = 'CONNECTING';
  gameState.tiktokError = null;
  broadcastState();

  if (tiktokLiveConnection) {
    try {
      tiktokLiveConnection.disconnect();
    } catch (e) {}
  }

  try {
    tiktokLiveConnection = new WebcastPushConnection(username, {
      processInitialData: false,
      enableExtendedGiftInfo: true,
      requestPollingIntervalMs: 1000
    });

    tiktokLiveConnection.connect().then(state => {
      console.log(`[TikTok] Connected to room ID: ${state.roomId}`);
      gameState.tiktokStatus = 'CONNECTED';
      gameState.tiktokError = null;
      broadcastState();
    }).catch(err => {
      console.error('[TikTok] Connection error:', err);
      gameState.tiktokStatus = 'ERROR';
      gameState.tiktokError = err.message || 'Gagal terhubung ke TikTok Live';
      broadcastState();
    });

    // Chat Event
    tiktokLiveConnection.on('chat', data => {
      handleUserGuess({
        uniqueId: data.uniqueId,
        nickname: data.nickname || data.uniqueId,
        avatar: data.profilePictureUrl || getDefaultAvatar(data.uniqueId),
        comment: data.comment
      });
    });

    // Gift Event
    tiktokLiveConnection.on('gift', data => {
      if (data.giftType === 1 && !data.repeatEnd) {
        // Streak in progress, wait for end
        return;
      }
      handleUserGift({
        uniqueId: data.uniqueId,
        nickname: data.nickname || data.uniqueId,
        avatar: data.profilePictureUrl || getDefaultAvatar(data.uniqueId),
        giftName: data.giftName,
        diamondCount: data.diamondCount || 1,
        repeatCount: data.repeatCount || 1
      });
    });

    // Follow Event (Menyambut Penonton Baru Follow dengan Suara & Banner)
    tiktokLiveConnection.on('follow', data => {
      handleNewFollower({
        uniqueId: data.uniqueId,
        nickname: data.nickname || data.uniqueId,
        avatar: data.profilePictureUrl || getDefaultAvatar(data.uniqueId)
      });
    });

    // Like Event
    tiktokLiveConnection.on('like', data => {
      gameState.totalLikes = data.totalLikeCount || (gameState.totalLikes + (data.likeCount || 1));
      io.emit('event:like', {
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        likeCount: data.likeCount || 1,
        totalLikes: gameState.totalLikes
      });
    });

    tiktokLiveConnection.on('disconnected', () => {
      console.log('[TikTok] Disconnected');
      gameState.tiktokStatus = 'DISCONNECTED';
      broadcastState();
    });

    tiktokLiveConnection.on('error', err => {
      console.error('[TikTok] Runtime Error:', err);
    });

  } catch (err) {
    gameState.tiktokStatus = 'ERROR';
    gameState.tiktokError = err.message;
    broadcastState();
  }
}

function disconnectTikTok() {
  if (tiktokLiveConnection) {
    try {
      tiktokLiveConnection.disconnect();
    } catch (e) {}
    tiktokLiveConnection = null;
  }
  gameState.tiktokStatus = 'DISCONNECTED';
  broadcastState();
}

function handleNewFollower(follower) {
  console.log(`[Follower Baru] 👋 @${follower.nickname} baru saja follow!`);
  io.emit('event:newFollower', {
    uniqueId: follower.uniqueId,
    nickname: follower.nickname || follower.uniqueId,
    avatar: follower.avatar || getDefaultAvatar(follower.uniqueId),
    greetingText: `Selamat datang @${follower.nickname || follower.uniqueId}, terima kasih sudah follow kelas kita!`
  });
}

function getDefaultAvatar(seed) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed || 'user')}`;
}

// Question Filtering & Rotation by Active Subject
function getFilteredQuestions() {
  const currentKey = gameState.currentSubject ? gameState.currentSubject.key : 'IPS';
  let pool = questions.filter(q => q.subject === currentKey);
  if (gameState.activeCategory && gameState.activeCategory !== 'ALL') {
    const subPool = pool.filter(q => q.category === gameState.activeCategory);
    if (subPool.length > 0) pool = subPool;
  }
  if (!pool || pool.length === 0) pool = questions; // Fallback
  return pool;
}

function pickRandomQuestion() {
  const pool = getFilteredQuestions();
  if (pool.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

function nextQuestion() {
  const nextQ = pickRandomQuestion();
  gameState.currentQuestion = nextQ;
  gameState.questionIndex++;
  gameState.timeLeft = gameState.timerDuration;
  gameState.hintVisible = false;
  gameState.roundWinners = [];
  gameState.recentWinnerBanner = null;

  io.emit('game:newQuestion', {
    question: sanitizeQuestion(nextQ),
    displayAnswer: nextQ ? nextQ.displayAnswer : '',
    questionIndex: gameState.questionIndex,
    totalAnswered: gameState.totalAnswered,
    timeLeft: gameState.timeLeft,
    currentSubject: gameState.currentSubject,
    subjectTimeLeft: gameState.subjectTimeLeft,
    isBossRound: gameState.isBossRound,
    bossMultiplier: gameState.bossMultiplier
  });
}

function sanitizeQuestion(q) {
  if (!q) return null;
  return {
    id: q.id,
    subject: q.subject || (gameState.currentSubject ? gameState.currentSubject.key : 'IPS'),
    category: q.category,
    question: q.question,
    hint: q.hint,
    difficulty: q.difficulty,
    points: q.points * (gameState.bossMultiplier || 1)
  };
}

// Intermission / Scene Transition Between Subjects (15s Jeda Menampilkan Juara Kelas & Top Sultan)
function startIntermission(duration = 15) {
  gameState.isIntermission = true;
  gameState.isRaceActive = false;
  gameState.intermissionDuration = duration;
  gameState.intermissionTimeLeft = duration;

  const nextIdx = (gameState.currentSubjectIndex + 1) % SUBJECTS.length;
  gameState.upcomingSubject = SUBJECTS[nextIdx];

  // Simpan/rekap otomatis top 5 murid hari ini dari live leaderboard
  updateDailyChampionsWithCurrent();

  console.log(`[Jeda Mapel] 🔔 Istirahat & Ganti Scene (15s). Mapel Berikutnya: ${gameState.upcomingSubject.name}`);

  io.emit('event:intermissionStart', {
    duration,
    timeLeft: duration,
    previousSubject: gameState.currentSubject,
    nextSubject: gameState.upcomingSubject,
    dailyChampions: dailyChampions,
    todayDayName: getTodayDayName(),
    topSpenders: getTopSpenders(5),
    currentLeaderboard: getTopLeaderboard(5),
    completedSubjectsCount: gameState.completedSubjectsCount
  });
}

// Sesi Balapan Buaya Sungai (Crocodile River Derby) - Setiap 3 Mata Pelajaran Selesai
function startCrocodileRace() {
  gameState.isRaceActive = true;
  gameState.isIntermission = false;

  // Pilih pemenang secara acak
  const winnerIdx = Math.floor(Math.random() * CROCODILES.length);
  const winner = CROCODILES[winnerIdx];

  const nextIdx = (gameState.currentSubjectIndex + 1) % SUBJECTS.length;
  gameState.upcomingSubject = SUBJECTS[nextIdx];

  console.log(`[Balap Buaya] 🐊 Memulai Sesi Balapan Buaya! Pemenang acak: ${winner.name} (Lane #${winner.lane})`);

  gameState.raceData = {
    duration: 16,
    crocodiles: CROCODILES,
    winnerId: winner.id,
    winner: winner,
    nextSubject: gameState.upcomingSubject
  };

  io.emit('event:raceStart', gameState.raceData);

  // Setelah balapan selesai (17 detik), otomatis langsung ganti mata pelajaran baru!
  setTimeout(() => {
    if (gameState.isRaceActive) {
      endIntermission();
    }
  }, 17500);
}

function endIntermission() {
  gameState.isIntermission = false;
  gameState.isRaceActive = false;
  gameState.intermissionTimeLeft = 0;
  gameState.currentSubjectIndex = (gameState.currentSubjectIndex + 1) % SUBJECTS.length;
  gameState.currentSubject = SUBJECTS[gameState.currentSubjectIndex];
  gameState.subjectTimeLeft = 900; // Reset 15 Menit mata pelajaran baru (900 detik)
  const newSubj = gameState.currentSubject;
  gameState.upcomingSubject = null;

  console.log(`[Jeda Mapel Selesai] 🔔 Masuk Kelas Baru: ${newSubj.name} (15 Menit)`);

  io.emit('event:intermissionEnd', {
    currentSubject: newSubj,
    subjectTimeLeft: gameState.subjectTimeLeft
  });

  io.emit('event:subjectChanged', {
    subject: newSubj,
    subjectTimeLeft: gameState.subjectTimeLeft
  });

  nextQuestion();
}

// Normalizer for answer checking
function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // replace symbols with space
    .replace(/\s+/g, ' ')
    .trim();
}

function checkAnswer(guess, acceptedAnswers) {
  if (!guess || !acceptedAnswers) return false;
  const cleanGuess = normalizeText(guess);
  if (!cleanGuess) return false;

  for (const rawAns of acceptedAnswers) {
    const cleanAns = normalizeText(rawAns);
    // Exact match
    if (cleanGuess === cleanAns) return true;
    
    // Check if cleanGuess contains the key answer as a distinct word or boundary
    const escaped = cleanAns.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
    if (regex.test(cleanGuess)) return true;
  }
  return false;
}

// Handle User Chat / Guess
function handleUserGuess(user) {
  const now = Date.now();
  gameState.activeUsers.set(user.uniqueId, now);

  // Clean old active users (>60s)
  for (const [uid, time] of gameState.activeUsers.entries()) {
    if (now - time > 60000) gameState.activeUsers.delete(uid);
  }

  if (!gameState.currentQuestion || gameState.isPaused) return;

  const isCorrect = checkAnswer(user.comment, gameState.currentQuestion.answers);
  const alreadyWonThisRound = gameState.roundWinners.includes(user.uniqueId);

  // User stats in leaderboard
  if (!leaderboard[user.uniqueId]) {
    leaderboard[user.uniqueId] = {
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      avatar: user.avatar,
      score: 0,
      combo: 0,
      correctCount: 0,
      lastCorrectTime: 0
    };
  } else {
    // Keep avatar & nickname fresh
    leaderboard[user.uniqueId].nickname = user.nickname || leaderboard[user.uniqueId].nickname;
    leaderboard[user.uniqueId].avatar = user.avatar || leaderboard[user.uniqueId].avatar;
  }

  const player = leaderboard[user.uniqueId];

  let pointsEarned = 0;
  if (isCorrect && !alreadyWonThisRound) {
    gameState.roundWinners.push(user.uniqueId);
    player.correctCount++;
    player.combo++;

    // Calculate points
    const basePts = (gameState.currentQuestion.points || 10) * gameState.bossMultiplier;
    // Speed bonus: only if answered first
    const isFirst = gameState.roundWinners.length === 1;
    const speedBonus = isFirst ? Math.round(basePts * 0.5) : 0;
    // Combo bonus (up to +10 extra points)
    const comboBonus = Math.min(player.combo * 2, 10);

    pointsEarned = basePts + speedBonus + comboBonus;
    player.score += pointsEarned;
    player.lastCorrectTime = now;
    saveLeaderboard();

    if (isFirst) {
      gameState.totalAnswered++;

      // Cek streak juara 1 tercepat beruntun
      if (gameState.lastFastestUserId === player.uniqueId) {
        gameState.fastestStreakCount = (gameState.fastestStreakCount || 1) + 1;
      } else {
        gameState.lastFastestUserId = player.uniqueId;
        gameState.fastestStreakCount = 1;
      }

      // Apresiasi jika tercepat beruntun hingga 3x
      if (gameState.fastestStreakCount === 3) {
        console.log(`[Streak Tercepat 3x] ⚡ @${player.nickname} 3x berturut-turut!`);
        io.emit('event:fastestStreak3x', {
          uniqueId: player.uniqueId,
          nickname: player.nickname,
          avatar: player.avatar,
          streakCount: gameState.fastestStreakCount,
          message: `HATTRICK TERCEPAT 3X! @${player.nickname} menjawab tercepat 3 soal berturut-turut! Luar biasa pintarnya!`
        });
      }
    }

    // Banner notification (showing round position: #1 TERCEPAT, #2, #3, dst)
    gameState.recentWinnerBanner = {
      uniqueId: player.uniqueId,
      nickname: player.nickname,
      avatar: player.avatar,
      pointsEarned,
      combo: player.combo,
      isFirst,
      winnerOrder: gameState.roundWinners.length,
      rank: getPlayerRank(player.uniqueId)
    };

    io.emit('game:correctAnswer', {
      winner: gameState.recentWinnerBanner,
      correctAnswer: gameState.currentQuestion.displayAnswer,
      leaderboard: getTopLeaderboard(10)
    });

    // NOTE: Waktu TIDAK dipotong! Semua orang bisa terus menebak sampai tenggat waktu 0 detik!
  } else if (!isCorrect) {
    // Wrong guess
  }

  // Push to recent guesses feed (keep last 15)
  const guessEntry = {
    id: Math.random().toString(36).substr(2, 9),
    uniqueId: user.uniqueId,
    nickname: user.nickname,
    avatar: user.avatar,
    comment: user.comment,
    isCorrect,
    pointsEarned,
    winnerOrder: isCorrect ? gameState.roundWinners.length : 0,
    time: now
  };

  gameState.recentGuesses.unshift(guessEntry);
  if (gameState.recentGuesses.length > 20) {
    gameState.recentGuesses.pop();
  }

  io.emit('game:newGuess', {
    guess: guessEntry,
    activeUserCount: gameState.activeUsers.size
  });
}

function handleUserGift(gift) {
  // Hitung koin: 1 Koin/Diamond = +20 DETIK!
  const coins = Math.max(1, (gift.diamondCount || 1) * (gift.repeatCount || 1));
  const bonusSeconds = coins * 20;

  // PERBAIKAN BUG: Tambahkan bonus detik ke WAKTU MAPEL / LIVE (menunda end live),
  // BUKAN ke waktu soal kuis individual (gameState.timeLeft)!
  gameState.subjectTimeLeft += bonusSeconds;

  // Add to target gift
  gameState.targetGift.current += coins;

  // ==========================================
  // TOP SPENDER TRACKING (PERMANEN, NEVER RESETS)
  // ==========================================
  const prevSpenders = getTopSpenders(10);
  const prevRankIdx = prevSpenders.findIndex(s => s.uniqueId === gift.uniqueId);
  const prevRank = prevRankIdx >= 0 ? prevRankIdx + 1 : null;

  if (!topSpenders[gift.uniqueId]) {
    topSpenders[gift.uniqueId] = {
      uniqueId: gift.uniqueId,
      nickname: gift.nickname || gift.uniqueId,
      avatar: gift.avatar || getDefaultAvatar(gift.uniqueId),
      totalCoins: 0,
      lastGiftName: gift.giftName || 'Gift',
      lastGiftTime: Date.now()
    };
  }

  topSpenders[gift.uniqueId].totalCoins += coins;
  topSpenders[gift.uniqueId].lastGiftName = gift.giftName || 'Gift';
  topSpenders[gift.uniqueId].lastGiftTime = Date.now();
  topSpenders[gift.uniqueId].nickname = gift.nickname || topSpenders[gift.uniqueId].nickname;
  topSpenders[gift.uniqueId].avatar = gift.avatar || topSpenders[gift.uniqueId].avatar;
  saveTopSpenders();

  const newSpenders = getTopSpenders(10);
  const newRankIdx = newSpenders.findIndex(s => s.uniqueId === gift.uniqueId);
  const newRank = newRankIdx >= 0 ? newRankIdx + 1 : null;

  let overtakeInfo = null;
  // Deteksi balap peringkat Top Spender
  if (newRank !== null) {
    if (prevRank === null || newRank < prevRank) {
      // User berhasil membalap peringkat!
      const overtakenTarget = (prevRank !== null && prevSpenders[newRank - 1])
        ? prevSpenders[newRank - 1]
        : (newSpenders[newRank] || null);

      overtakeInfo = {
        uniqueId: gift.uniqueId,
        nickname: topSpenders[gift.uniqueId].nickname,
        avatar: topSpenders[gift.uniqueId].avatar,
        oldRank: prevRank || '>10',
        newRank: newRank,
        totalCoins: topSpenders[gift.uniqueId].totalCoins,
        overtakenNickname: overtakenTarget ? overtakenTarget.nickname : null
      };

      console.log(`[Top Spender Overtake] 👑 ${overtakeInfo.nickname} membalap ke Peringkat #${newRank} (${overtakeInfo.totalCoins} koin)!`);
      io.emit('event:topSpenderOvertake', overtakeInfo);
    }
  }
  
  // Award score to gifter in session leaderboard
  if (!leaderboard[gift.uniqueId]) {
    leaderboard[gift.uniqueId] = {
      uniqueId: gift.uniqueId,
      nickname: gift.nickname,
      avatar: gift.avatar,
      score: 0,
      combo: 0,
      correctCount: 0,
      lastCorrectTime: 0
    };
  }
  const giftPoints = coins * 25;
  leaderboard[gift.uniqueId].score += giftPoints;
  saveLeaderboard();

  // Check if target gift reached -> triggers Boss Round
  let triggeredBoss = false;
  if (gameState.targetGift.current >= gameState.targetGift.target) {
    gameState.isBossRound = true;
    gameState.bossMultiplier = 2;
    gameState.targetGift.current = 0;
    triggeredBoss = true;
  }

  io.emit('event:giftAddedTime', {
    sender: gift.nickname || gift.uniqueId,
    avatar: gift.avatar,
    giftName: gift.giftName || 'Mawar',
    coins,
    bonusSeconds,
    newTimeLeft: gameState.timeLeft,
    newSubjectTimeLeft: gameState.subjectTimeLeft, // Sisa waktu live bertambah!
    targetGift: gameState.targetGift,
    isBossRound: gameState.isBossRound,
    triggeredBoss,
    leaderboard: getTopLeaderboard(10),
    topSpenders: getTopSpenders(5),
    overtakeInfo
  });

  io.emit('event:topSpendersUpdated', {
    topSpenders: getTopSpenders(10)
  });
}

function getPlayerRank(uniqueId) {
  const sorted = Object.values(leaderboard).sort((a, b) => b.score - a.score);
  const index = sorted.findIndex(p => p.uniqueId === uniqueId);
  return index >= 0 ? index + 1 : '-';
}

function getTopLeaderboard(limit = 10) {
  return Object.values(leaderboard)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function broadcastState() {
  io.emit('game:syncState', {
    currentQuestion: sanitizeQuestion(gameState.currentQuestion),
    displayAnswer: gameState.currentQuestion ? gameState.currentQuestion.displayAnswer : '',
    questionIndex: gameState.questionIndex,
    totalAnswered: gameState.totalAnswered,
    timerDuration: gameState.timerDuration,
    timeLeft: gameState.timeLeft,
    currentSubject: gameState.currentSubject,
    subjectTimeLeft: gameState.subjectTimeLeft,
    completedSubjectsCount: gameState.completedSubjectsCount,
    allSubjects: SUBJECTS,
    crocodiles: CROCODILES,
    isRaceActive: gameState.isRaceActive,
    isIntermission: gameState.isIntermission,
    intermissionDuration: gameState.intermissionDuration,
    intermissionTimeLeft: gameState.intermissionTimeLeft,
    upcomingSubject: gameState.upcomingSubject,
    dailyChampions: dailyChampions,
    todayDayName: getTodayDayName(),
    topSpenders: getTopSpenders(10),
    isPaused: gameState.isPaused,
    activeCategory: gameState.activeCategory,
    hintVisible: gameState.hintVisible,
    targetGift: gameState.targetGift,
    isBossRound: gameState.isBossRound,
    bossMultiplier: gameState.bossMultiplier,
    totalLikes: gameState.totalLikes,
    activeUserCount: gameState.activeUsers.size,
    tiktokUser: gameState.tiktokUser,
    tiktokStatus: gameState.tiktokStatus,
    tiktokError: gameState.tiktokError,
    leaderboard: getTopLeaderboard(10),
    recentGuesses: gameState.recentGuesses.slice(0, 10),
    recentWinnerBanner: gameState.recentWinnerBanner
  });
}

// 1-Second Game Loop & 15-Minute Subject Rotation Timer (Only in local streaming mode)
if (!process.env.VERCEL) {
  setInterval(() => {
    // Jika sedang sesi Balap Buaya, jeda timer soal kuis
    if (gameState.isRaceActive) return;

    // 1. Intermission Tick (Jeda Pergantian Mata Pelajaran - 15 detik)
    if (gameState.isIntermission) {
      if (gameState.intermissionTimeLeft > 0) {
        gameState.intermissionTimeLeft--;
        io.emit('event:intermissionTick', {
          timeLeft: gameState.intermissionTimeLeft,
          duration: gameState.intermissionDuration,
          nextSubject: gameState.upcomingSubject
        });
      } else {
        endIntermission();
      }
      return;
    }

    if (gameState.isPaused || !gameState.currentQuestion) return;

    // 2. 15-Minute Subject Schedule Countdown (900 detik)
    if (gameState.subjectTimeLeft > 0) {
      gameState.subjectTimeLeft--;
    } else {
      // 15 Menit telah selesai!
      gameState.completedSubjectsCount++;
      console.log(`[Jadwal Mapel] 15 Menit selesai. Total mapel selesai: ${gameState.completedSubjectsCount}`);

      // Setiap 3 mapel selesai -> Masuk ke Sesi Balapan Buaya!
      if (gameState.completedSubjectsCount % 3 === 0) {
        startCrocodileRace();
      } else {
        startIntermission(15);
      }
      return;
    }

    // 3. Question Timer Countdown
    if (gameState.timeLeft > 0) {
      gameState.timeLeft--;

      // Auto reveal hint halfway through
      if (gameState.timeLeft <= Math.floor(gameState.timerDuration / 2) && !gameState.hintVisible) {
        gameState.hintVisible = true;
        io.emit('game:hintRevealed', { hint: gameState.currentQuestion.hint });
      }

      io.emit('game:tick', {
        timeLeft: gameState.timeLeft,
        subjectTimeLeft: gameState.subjectTimeLeft,
        activeUserCount: gameState.activeUsers.size
      });
    } else {
      // Time's up for current question
      io.emit('game:timeUp', {
        correctAnswer: gameState.currentQuestion.displayAnswer,
        roundWinnersCount: gameState.roundWinners.length
      });

      // Reset boss round if active
      if (gameState.isBossRound) {
        gameState.isBossRound = false;
        gameState.bossMultiplier = 1;
      }

      // Wait 3.5 seconds for display then switch question
      setTimeout(() => {
        nextQuestion();
      }, 3500);
    }
  }, 1000);
}

// Express Routes & Static Assets
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Admin Security PIN Configuration
const ADMIN_PIN_FILE = path.join(DATA_DIR, 'admin_pin.json');
let adminPin = 'akuganteng12'; // Default PIN Streamer (bisa diubah kapan saja)
try {
  if (fs.existsSync(ADMIN_PIN_FILE)) {
    const data = JSON.parse(fs.readFileSync(ADMIN_PIN_FILE, 'utf8'));
    if (data.pin) adminPin = data.pin.toString();
  } else {
    fs.writeFileSync(ADMIN_PIN_FILE, JSON.stringify({ pin: adminPin }, null, 2), 'utf8');
  }
} catch (e) {
  console.error('Error loading admin pin:', e);
}

// User Suggestions & Feedback Storage
const SUGGESTIONS_FILE = path.join(DATA_DIR, 'suggestions.json');
let suggestions = [];
try {
  if (fs.existsSync(SUGGESTIONS_FILE)) {
    suggestions = JSON.parse(fs.readFileSync(SUGGESTIONS_FILE, 'utf8'));
  }
} catch (e) {
  suggestions = [];
}

app.post('/api/admin/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ success: false, message: 'PIN wajib diisi!' });
  if (pin.toString() === adminPin.toString()) {
    return res.json({ success: true, message: 'Akses Diterima! Selamat datang Guru/Streamer.' });
  } else {
    return res.status(401).json({ success: false, message: 'PIN Salah! Akses ditolak.' });
  }
});

app.post('/api/admin/change-pin', (req, res) => {
  const { oldPin, newPin } = req.body;
  if (oldPin !== adminPin) {
    return res.status(401).json({ success: false, message: 'PIN Lama salah!' });
  }
  if (!newPin || newPin.toString().length < 4) {
    return res.status(400).json({ success: false, message: 'PIN Baru minimal 4 karakter!' });
  }
  adminPin = newPin.toString();
  try {
    fs.writeFileSync(ADMIN_PIN_FILE, JSON.stringify({ pin: adminPin }, null, 2), 'utf8');
  } catch (e) {}
  return res.json({ success: true, message: 'PIN Streamer berhasil diubah!' });
});

// Suggestions / Feedback API
app.post('/api/suggestions', (req, res) => {
  const { name, tiktokUsername, category, message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Pesan saran atau ide soal tidak boleh kosong!' });
  }
  const newSugg = {
    id: Date.now().toString(),
    name: name ? name.trim() : 'Murid Anonim',
    tiktokUsername: tiktokUsername ? tiktokUsername.trim().replace(/^@/, '') : '',
    category: category || 'IPS',
    message: message.trim(),
    createdAt: new Date().toISOString()
  };
  suggestions.unshift(newSugg);
  if (suggestions.length > 100) suggestions = suggestions.slice(0, 100);
  try {
    fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2), 'utf8');
  } catch (e) {}
  
  res.json({ success: true, message: 'Terima kasih! Ide soal atau saran kamu berhasil dikirim!' });
});

app.get('/api/suggestions', (req, res) => {
  res.json(suggestions);
});

// Public Hub Status for Visitors
app.get('/api/public-hub', (req, res) => {
  res.json({
    isLive: gameState.tiktokStatus === 'CONNECTED',
    tiktokUser: gameState.tiktokUser || '',
    currentSubject: gameState.currentSubject,
    subjectTimeLeft: gameState.subjectTimeLeft,
    completedSubjectsCount: gameState.completedSubjectsCount,
    topSpenders: getTopSpenders(10),
    dailyChampions: dailyChampions,
    todayDayName: getTodayDayName(),
    leaderboard: getTopLeaderboard(10)
  });
});

app.get('/api/state', (req, res) => {
  res.json({
    gameState: {
      ...gameState,
      currentQuestion: sanitizeQuestion(gameState.currentQuestion),
      leaderboard: getTopLeaderboard(10),
      topSpenders: getTopSpenders(10),
      todayDayName: getTodayDayName(),
      dailyChampions: dailyChampions
    }
  });
});

app.get('/api/questions', (req, res) => {
  res.json(questions);
});

app.get('/api/champions', (req, res) => {
  res.json({
    today: getTodayDayName(),
    dailyChampions: dailyChampions,
    topSpenders: getTopSpenders(20)
  });
});

// Socket.io Connection
io.on('connection', socket => {
  // Send initial full state
  socket.emit('game:syncState', {
    currentQuestion: sanitizeQuestion(gameState.currentQuestion),
    displayAnswer: gameState.currentQuestion ? gameState.currentQuestion.displayAnswer : '',
    questionIndex: gameState.questionIndex,
    totalAnswered: gameState.totalAnswered,
    timerDuration: gameState.timerDuration,
    timeLeft: gameState.timeLeft,
    currentSubject: gameState.currentSubject,
    subjectTimeLeft: gameState.subjectTimeLeft,
    allSubjects: SUBJECTS,
    isIntermission: gameState.isIntermission,
    intermissionDuration: gameState.intermissionDuration,
    intermissionTimeLeft: gameState.intermissionTimeLeft,
    upcomingSubject: gameState.upcomingSubject,
    dailyChampions: dailyChampions,
    todayDayName: getTodayDayName(),
    topSpenders: getTopSpenders(10),
    isPaused: gameState.isPaused,
    activeCategory: gameState.activeCategory,
    hintVisible: gameState.hintVisible,
    targetGift: gameState.targetGift,
    isBossRound: gameState.isBossRound,
    bossMultiplier: gameState.bossMultiplier,
    totalLikes: gameState.totalLikes,
    activeUserCount: gameState.activeUsers.size,
    tiktokUser: gameState.tiktokUser,
    tiktokStatus: gameState.tiktokStatus,
    tiktokError: gameState.tiktokError,
    leaderboard: getTopLeaderboard(10),
    recentGuesses: gameState.recentGuesses.slice(0, 10),
    recentWinnerBanner: gameState.recentWinnerBanner
  });

  // Admin Controls
  socket.on('admin:connectTikTok', data => {
    connectTikTok(data.username);
  });

  socket.on('admin:disconnectTikTok', () => {
    disconnectTikTok();
  });

  socket.on('admin:nextQuestion', () => {
    nextQuestion();
  });

  socket.on('admin:togglePause', () => {
    gameState.isPaused = !gameState.isPaused;
    broadcastState();
  });

  socket.on('admin:revealHint', () => {
    gameState.hintVisible = true;
    io.emit('game:hintRevealed', { hint: gameState.currentQuestion ? gameState.currentQuestion.hint : '' });
  });

  socket.on('admin:setCategory', data => {
    gameState.activeCategory = data.category || 'ALL';
    nextQuestion();
  });

  socket.on('admin:setSubject', data => {
    const found = SUBJECTS.find(s => s.key === data.subjectKey);
    if (found) {
      gameState.currentSubject = found;
      gameState.currentSubjectIndex = SUBJECTS.indexOf(found);
      gameState.subjectTimeLeft = 900; // Reset 15 Menit
      io.emit('event:subjectChanged', {
        subject: gameState.currentSubject,
        subjectTimeLeft: gameState.subjectTimeLeft
      });
      nextQuestion();
    }
  });

  // Ganti Mapel dengan Jeda Scene Juara Kelas & Top Sultan (15 Detik)
  socket.on('admin:nextSubject', () => {
    gameState.completedSubjectsCount++;
    if (gameState.completedSubjectsCount % 3 === 0) {
      startCrocodileRace();
    } else {
      startIntermission(15);
    }
  });

  // Trigger manual scene jeda
  socket.on('admin:startIntermission', data => {
    startIntermission(data && data.duration ? parseInt(data.duration, 10) : 15);
  });

  // Trigger manual Sesi Balap Buaya
  socket.on('admin:startRace', () => {
    startCrocodileRace();
  });

  // Akhiri jeda secara instan & masuk kelas
  socket.on('admin:endIntermission', () => {
    if (gameState.isIntermission || gameState.isRaceActive) {
      endIntermission();
    }
  });

  // Simpan / update rekap juara kelas hari ini
  socket.on('admin:saveDailyChampions', () => {
    updateDailyChampionsWithCurrent();
    io.emit('event:dailyChampionsUpdated', {
      dailyChampions: dailyChampions,
      todayDayName: getTodayDayName()
    });
  });

  socket.on('admin:setTimerDuration', data => {
    const dur = parseInt(data.duration, 10);
    if (dur >= 10 && dur <= 60) {
      gameState.timerDuration = dur;
      gameState.timeLeft = dur;
      broadcastState();
    }
  });

  // Reset sesi leaderboard (CATATAN: Top Spender TIDAK DI-RESET! Tetap abadi)
  socket.on('admin:resetLeaderboard', () => {
    leaderboard = {};
    saveLeaderboard();
    io.emit('game:leaderboardUpdated', { leaderboard: [] });
  });

  // Simulator / Test Events
  socket.on('sim:chat', data => {
    handleUserGuess({
      uniqueId: data.uniqueId || 'sim_user',
      nickname: data.nickname || data.uniqueId || 'Siswa IPS',
      avatar: data.avatar || getDefaultAvatar(data.uniqueId || 'user'),
      comment: data.comment
    });
  });

  socket.on('sim:correctAnswer', data => {
    if (!gameState.currentQuestion) return;
    const sampleAnswer = gameState.currentQuestion.answers[0];
    const testUsers = ['budi_geografi', 'siti_sejarah', 'andi_budaya', 'mega_ips', 'fajar_juara'];
    const pickUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    handleUserGuess({
      uniqueId: pickUser,
      nickname: pickUser.replace('_', ' ').toUpperCase(),
      avatar: getDefaultAvatar(pickUser),
      comment: sampleAnswer
    });
  });

  socket.on('sim:gift', data => {
    handleUserGift({
      uniqueId: data.uniqueId || 'sultan_tiktok',
      nickname: data.nickname || 'Sultan TikTok',
      avatar: getDefaultAvatar('sultan'),
      giftName: data.giftName || 'Mawar',
      diamondCount: data.diamondCount || 1,
      repeatCount: data.repeatCount || 1
    });
  });

  // Simulator Khusus Top Spender & Balap Takhta Sultan
  socket.on('sim:sultanGift', data => {
    const coins = data.coins || 100;
    const uid = data.uniqueId || 'sultan_penantang';
    const nick = data.nickname || '👑 Calon Raja Sawer';
    handleUserGift({
      uniqueId: uid,
      nickname: nick,
      avatar: getDefaultAvatar(uid),
      giftName: data.giftName || 'Singa / Paus',
      diamondCount: coins,
      repeatCount: 1
    });
  });

  socket.on('sim:like', data => {
    const count = data.count || 5;
    gameState.totalLikes += count;
    io.emit('event:like', {
      uniqueId: 'sim_fan',
      nickname: 'Simulated Fan',
      likeCount: count,
      totalLikes: gameState.totalLikes
    });
  });

  // Simulator Follower Baru (Disambut Suara TTS & Banner)
  socket.on('sim:follow', data => {
    const testFollowers = [
      { id: 'budi_santoso', name: 'Budi Santoso' },
      { id: 'clara_cendikia', name: 'Clara Cendikia' },
      { id: 'dewi_nusantara', name: 'Dewi Nusantara' },
      { id: 'fajar_gemilang', name: 'Fajar Gemilang' },
      { id: 'siti_juara', name: 'Siti Juara' }
    ];
    const picked = testFollowers[Math.floor(Math.random() * testFollowers.length)];
    handleNewFollower({
      uniqueId: (data && data.uniqueId) || picked.id,
      nickname: (data && data.nickname) || picked.name,
      avatar: (data && data.avatar) || getDefaultAvatar(picked.id)
    });
  });

  // Simulator Apresiasi Hattrick Tercepat 3x
  socket.on('sim:fastestStreak3x', data => {
    const nick = (data && data.nickname) || 'FAJAR JUARA ⚡';
    io.emit('event:fastestStreak3x', {
      uniqueId: 'fajar_juara',
      nickname: nick,
      avatar: getDefaultAvatar('fajar_juara'),
      streakCount: 3,
      message: `HATTRICK TERCEPAT 3X! @${nick} berhasil menjawab tercepat 3 soal berturut-turut! Luar biasa pintarnya!`
    });
  });
});

// Start initial question (Only in local streaming mode)
if (!process.env.VERCEL) {
  nextQuestion();
}

function startServer(port) {
  server.listen(port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 KUIS IPS TIKTOK LIVE SERVER RUNNING!`);
    console.log(`📺 Overlay (OBS Studio / Browser): http://localhost:${port}/overlay.html`);
    console.log(`🎛️ Admin & Simulator Dashboard:   http://localhost:${port}/admin.html`);
    console.log(`🏠 Homepage & Quick Launcher:    http://localhost:${port}`);
    console.log(`=======================================================`);
  }).on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Warning] Port ${port} sedang digunakan. Mencoba port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

module.exports = app;

if (!process.env.VERCEL && require.main === module) {
  startServer(DEFAULT_PORT);
}
