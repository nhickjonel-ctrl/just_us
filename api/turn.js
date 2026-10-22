// Vercel serverless function: creates short-lived Cloudflare TURN credentials for each call.
// Needs two environment variables in Vercel: CF_TURN_KEY_ID and CF_TURN_API_TOKEN.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = process.env.CF_TURN_KEY_ID;
  const token = process.env.CF_TURN_API_TOKEN;
  if (!id || !token) return res.status(500).json({ error: 'TURN not configured' });
  try {
    const r = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + id + '/credentials/generate-ice-servers', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: 86400 })
    });
    if (!r.ok) return res.status(502).json({ error: 'Cloudflare returned ' + r.status });
    const data = await r.json();
    const list = Array.isArray(data.iceServers) ? data.iceServers : (data.iceServers ? [data.iceServers] : []);
    return res.status(200).json({ iceServers: list });
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach Cloudflare' });
  }
};