export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.body;
  const credentials = Buffer.from('0edffe70d990fa2a74b40d5fa9ea067598a74259:dbf50a8a7c1e4c247569de2b42227ead733be2b260c11d9b422ccaed08be').toString('base64');

  const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: `grant_type=authorization_code&code=${code}`
  });

  const data = await response.json();
  res.status(200).json(data);
}
