const DEFAULT_APPS_SCRIPT_ENDPOINT =
  'https://script.google.com/macros/s/AKfycby4Hy5U63csfB0bv1u1GsDWk4yOLYAhJg1UxwMmm5GD6PI2qn5sdC8nMatHcYmiblpQ/exec';

function parseBody(body) {
  if (typeof body === 'string') return JSON.parse(body);
  return body || {};
}

function isValidPayload(payload) {
  return Boolean(
    payload &&
      String(payload.lead_id || '').trim() &&
      String(payload.nome || '').trim() &&
      String(payload.email || '').trim() &&
      String(payload.telefone || '').trim()
  );
}

module.exports = async function leadHandler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let payload;
  try {
    payload = parseBody(req.body);
  } catch (error) {
    return res.status(400).json({ ok: false, error: 'Invalid lead payload' });
  }

  if (!isValidPayload(payload)) {
    return res.status(400).json({ ok: false, error: 'Invalid lead payload' });
  }

  const endpoint = process.env.APPS_SCRIPT_LEAD_ENDPOINT || DEFAULT_APPS_SCRIPT_ENDPOINT;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok || !result || result.ok !== true) {
      throw new Error('Downstream lead capture failed');
    }

    const confirmation = {
      ok: true,
      lead_id: result.lead_id || payload.lead_id,
    };
    if (result.duplicate === true) confirmation.duplicate = true;

    return res.status(200).json(confirmation);
  } catch (error) {
    return res.status(502).json({ ok: false, error: 'Lead service unavailable' });
  }
};
