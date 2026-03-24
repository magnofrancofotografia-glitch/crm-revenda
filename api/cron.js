import { createClient } from 'redis';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();

  const token = await redis.get('bling_token');
  if (!token) {
    await redis.disconnect();
    return res.json({ ok: false, msg: 'Sem token Bling salvo' });
  }

  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const dataInicio = ontem.toISOString().substring(0, 10);

  let pedidos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const r = await fetch(`https://api.bling.com.br/Api/v3/pedidos/vendas?pagina=${page}&limite=100&dataInicio=${dataInicio}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    const items = data.data || [];
    pedidos = [...pedidos, ...items];
    hasMore = items.length === 100;
    page++;
    await new Promise(r => setTimeout(r, 400));
  }

  const atual = JSON.parse(await redis.get('crm_pedidos') || '[]');
  const ids = new Set(atual.map(p => p.id));
  const novos = pedidos.filter(p => !ids.has(p.id));
  await redis.set('crm_pedidos', JSON.stringify([...atual, ...novos]));
  await redis.disconnect();

  return res.json({ ok: true, novos: novos.length });
}
