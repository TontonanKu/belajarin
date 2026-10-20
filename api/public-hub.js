const defaultChamps = {
  "Senin": [
    { "rank": 1, "uniqueId": "budi_geografi", "nickname": "Budi Geografi", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=budi_geografi", "score": 580 },
    { "rank": 2, "uniqueId": "siti_sejarah", "nickname": "Siti Sejarah", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=siti_sejarah", "score": 510 },
    { "rank": 3, "uniqueId": "fajar_juara", "nickname": "Fajar Juara", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=fajar_juara", "score": 460 }
  ],
  "Selasa": [
    { "rank": 1, "uniqueId": "sultan_penantang_793", "nickname": "🔥 Sultan Penantang Baru", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=sultan_penantang_793", "score": 37500 },
    { "rank": 2, "uniqueId": "sultan_bos_dermawan", "nickname": "👑 Sultan Bos Dermawan", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=sultan_bos_dermawan", "score": 5000 },
    { "rank": 3, "uniqueId": "sultan_tiktok", "nickname": "Sultan TikTok", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=sultan", "score": 2425 }
  ],
  "Rabu": [
    { "rank": 1, "uniqueId": "raka_sains", "nickname": "Raka Juara", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=raka_sains", "score": 590 }
  ],
  "Kamis": [
    { "rank": 1, "uniqueId": "maya_presisi", "nickname": "Maya Presisi", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=maya_presisi", "score": 640 }
  ],
  "Jumat": [
    { "rank": 1, "uniqueId": "alif_cendikia", "nickname": "Alif Cendikia", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=alif_cendikia", "score": 610 }
  ],
  "Sabtu": [
    { "rank": 1, "uniqueId": "doni_weekend", "nickname": "Doni Juara", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=doni_weekend", "score": 670 }
  ],
  "Minggu": [
    { "rank": 1, "uniqueId": "sultan_kuis", "nickname": "Bintang Minggu", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=bintang_minggu", "score": 720 }
  ]
};

const defaultSpenders = [
  { "uniqueId": "sultan_penantang_793", "nickname": "🔥 Sultan Penantang Baru", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=sultan_penantang_793", "totalCoins": 1500 },
  { "uniqueId": "sultan_raja_sawer", "nickname": "👑 Raja Sawer ID", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=raja_sawer", "totalCoins": 1250 },
  { "uniqueId": "juragan_koin99", "nickname": "⚡ Juragan Koin 99", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=juragan_koin", "totalCoins": 840 },
  { "uniqueId": "bunda_dermawan", "nickname": "🌸 Bunda Dermawan", "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=bunda_dermawan", "totalCoins": 520 }
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDayName = days[new Date().getDay()];

  let dailyChampions = defaultChamps;
  let topSpenders = defaultSpenders;

  try {
    const loadedChamps = require('../data/daily_champions.json');
    if (loadedChamps && typeof loadedChamps === 'object') {
      dailyChampions = loadedChamps;
    }
  } catch (e) {}

  try {
    const loadedSpenders = require('../data/top_spenders.json');
    if (Array.isArray(loadedSpenders)) {
      topSpenders = loadedSpenders;
    }
  } catch (e) {}

  return res.status(200).json({
    isLive: false,
    tiktokUser: '',
    currentSubject: {
      key: 'IPS',
      name: 'ILMU PENGETAHUAN SOSIAL',
      icon: '🌍',
      badge: 'SEJARAH & GEOGRAFI',
      color: '#0284c7'
    },
    subjectTimeLeft: 900,
    topSpenders: topSpenders.slice(0, 10),
    dailyChampions: dailyChampions,
    todayDayName: todayDayName
  });
};
