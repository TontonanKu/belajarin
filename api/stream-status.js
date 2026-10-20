let liveStatus = {
  isLive: false,
  tiktokUser: '',
  updatedAt: 0
};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { isLive, tiktokUser } = req.body || {};
    liveStatus = {
      isLive: !!isLive,
      tiktokUser: tiktokUser || '',
      updatedAt: Date.now()
    };
    return res.status(200).json({ success: true, liveStatus });
  }

  // Auto-expire after 2 minutes if no ping received from laptop
  const isExpired = Date.now() - liveStatus.updatedAt > 120000;
  return res.status(200).json({
    isLive: isExpired ? false : liveStatus.isLive,
    tiktokUser: isExpired ? '' : liveStatus.tiktokUser
  });
};
