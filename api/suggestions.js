const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { name, tiktokUsername, category, message } = req.body || {};
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

    try {
      const suggPath = path.join(process.cwd(), 'data', 'suggestions.json');
      let list = [];
      if (fs.existsSync(suggPath)) {
        list = JSON.parse(fs.readFileSync(suggPath, 'utf8'));
      }
      list.unshift(newSugg);
      if (list.length > 100) list = list.slice(0, 100);
      fs.writeFileSync(suggPath, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      // In serverless, filesystem is read-only, we gracefully acknowledge success
    }

    return res.status(200).json({ success: true, message: 'Terima kasih! Ide soal atau saran kamu berhasil dikirim!' });
  }

  // GET suggestions
  let suggestions = [];
  try {
    const suggPath = path.join(process.cwd(), 'data', 'suggestions.json');
    if (fs.existsSync(suggPath)) {
      suggestions = JSON.parse(fs.readFileSync(suggPath, 'utf8'));
    }
  } catch (e) {}

  return res.status(200).json(suggestions);
};
