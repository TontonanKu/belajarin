const fs = require('fs');
const path = require('path');

let latestLiveStatus = {
  isLive: false,
  tiktokUser: '',
  currentSubject: {
    key: 'IPS',
    name: 'ILMU PENGETAHUAN SOSIAL',
    icon: '🌍',
    badge: 'SEJARAH & GEOGRAFI',
    color: '#0284c7'
  },
  subjectTimeLeft: 900
};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDayName = days[new Date().getDay()];

  let dailyChampions = {};
  let topSpenders = [];

  try {
    const dailyPath = path.join(process.cwd(), 'data', 'daily_champions.json');
    if (fs.existsSync(dailyPath)) {
      dailyChampions = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
    }
  } catch (e) {}

  try {
    const spendersPath = path.join(process.cwd(), 'data', 'top_spenders.json');
    if (fs.existsSync(spendersPath)) {
      topSpenders = JSON.parse(fs.readFileSync(spendersPath, 'utf8'));
    }
  } catch (e) {}

  return res.status(200).json({
    isLive: latestLiveStatus.isLive,
    tiktokUser: latestLiveStatus.tiktokUser,
    currentSubject: latestLiveStatus.currentSubject,
    subjectTimeLeft: latestLiveStatus.subjectTimeLeft,
    topSpenders: topSpenders.slice(0, 10),
    dailyChampions: dailyChampions,
    todayDayName: todayDayName
  });
};
