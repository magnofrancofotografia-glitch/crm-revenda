export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path, ...params } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const qs = new URLSearchParams(params).toString();
  const url = `https://api.bling.com.br/Api/v3/${path}${qs ? '?' + qs : ''}`;

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });

  const data = await r.json();
  return res.status(r.status).json(data);
}
