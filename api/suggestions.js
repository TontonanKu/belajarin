module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { message } = req.body || {};
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Pesan saran atau ide soal tidak boleh kosong!' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Terima kasih! Ide soal atau saran kamu berhasil dikirim!' 
    });
  }

  return res.status(200).json([]);
};
