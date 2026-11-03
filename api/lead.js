export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  if (req.headers.origin !== origin) return res.status(403).json({ error: 'Submit from the Nature’s Bazaar website.' });
  if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).json({ error: 'Invalid submission.' });
  const webhook = process.env.GHL_WEBHOOK_URL;
  if (!webhook) return res.status(503).json({ error: 'Inquiries are temporarily unavailable.' });
  const body = req.body;
  const field = (key, max) => typeof body?.[key] === 'string' ? body[key].trim().slice(0, max) : '';
  const name = field('name', 120), email = field('email', 254), phone = field('phone', 40);
  const interest = field('interest', 80), message = field('message', 1500), link = field('link', 300);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !['Product / brand request', 'Opening updates', 'Supplier inquiry', 'Team opportunity', 'Other inquiry'].includes(interest))
    return res.status(400).json({ error: 'Check the required fields.' });
  if (link) { try { if (!['http:', 'https:'].includes(new URL(link).protocol)) throw new Error(); } catch { return res.status(400).json({ error: 'Enter a valid website link.' }); } }
  let page;
  try { page = new URL(field('page_url', 500)); } catch { return res.status(400).json({ error: 'Invalid page.' }); }
  if (page.origin !== origin) return res.status(400).json({ error: 'Invalid page.' });
  try {
    const response = await fetch(webhook, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, interest, message, link, brand: 'Nature’s Bazaar', form_name: 'Website inquiry', page_url: page.href }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Delivery failed');
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Could not send your inquiry. Please try again.' });
  }
}

