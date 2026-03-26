import { createClient } from 'redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();

  const refreshToken = await redis.get('bling_refresh_token');
  if (!refreshToken) {
    await redis.disconnect();
    return res.status(401).json({ error: 'Sem refresh token salvo' });
  }

  const credentials = Buffer.from(
    `${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`
  ).toString('base64');

  const r = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`
  });

  const data = await r.json();

  if (data.access_token) {
    await redis.set('bling_token', data.access_token);
    if (data.refresh_token) {
      await redis.set('bling_refresh_token', data.refresh_token);
    }
    await redis.disconnect();
    return res.json({ access_token: data.access_token });
  }

  await redis.disconnect();
  return res.status(401).json({ error: 'Falha ao renovar token', data });
}
