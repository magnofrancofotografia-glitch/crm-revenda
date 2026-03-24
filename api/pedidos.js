import { createClient } from 'redis';

const VENDEDORAS = ['15596301828', '15596417799'];
const getRedis = () => createClient({ url: process.env.REDIS_URL });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getRedis();
  await redis.connect();

  if (req.method === 'POST') {
    const { pedidos, meta, saveToken, clear } = req.body;

    if (saveToken) {
      await redis.set('bling_token', saveToken);
      await redis.disconnect();
      return res.json({ ok: true });
    }

    if (clear) {
      await redis.set('crm_pedidos', '[]');
      await redis.set('crm_meta', '[]');
      await redis.disconnect();
      return res.json({ ok: true });
    }

    // Filtrar só Talita e Kauane
    const filtrados = pedidos.filter(p => 
      p.vendedor && VENDEDORAS.includes(String(p.vendedor.id))
    );

    const atual = JSON.parse(await redis.get('crm_pedidos') || '[]');
    const ids = new Set(atual.map(p => p.id));
    const novos = filtrados.filter(p => !ids.has(p.id));
    const merged = [...atual, ...novos];
    await redis.set('crm_pedidos', JSON.stringify(merged));

    const metas = JSON.parse(await redis.get('crm_meta') || '[]');
    metas.push({ ...meta, novos: novos.length, total: merged.length });
    await redis.set('crm_meta', JSON.stringify(metas));

    await redis.disconnect();
    return res.json({ ok: true, total: merged.length, novos: novos.length });
  }

  if (req.method === 'GET') {
    const pedidos = JSON.parse(await redis.get('crm_pedidos') || '[]');
    const meta = JSON.parse(await redis.get('crm_meta') || '[]');
    await redis.disconnect();
    return res.json({ pedidos, meta });
  }

  await redis.disconnect();
  res.status(405).end();
}
