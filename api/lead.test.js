const fs = require('fs');
const path = require('path');
const assert = require('assert');

const handlerPath = path.join(__dirname, 'lead.js');
assert.ok(fs.existsSync(handlerPath), 'api/lead.js should exist');

const handler = require(handlerPath);

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

function validPayload() {
  return {
    lead_id: 'edq_test_confirmed',
    nome: 'Teste Confirmado',
    email: 'teste@example.com',
    telefone: '12999999999',
    answers: { p1: 'A', p12: 'B' },
  };
}

async function run() {
  const originalFetch = global.fetch;
  const originalEndpoint = process.env.APPS_SCRIPT_LEAD_ENDPOINT;

  try {
    process.env.APPS_SCRIPT_LEAD_ENDPOINT = 'https://example.test/apps-script';

    {
      const res = createResponse();
      await handler({ method: 'GET' }, res);
      assert.strictEqual(res.statusCode, 405);
      assert.deepStrictEqual(res.payload, { ok: false, error: 'Method not allowed' });
    }

    {
      const res = createResponse();
      await handler({ method: 'POST', body: { lead_id: '' } }, res);
      assert.strictEqual(res.statusCode, 400);
      assert.deepStrictEqual(res.payload, { ok: false, error: 'Invalid lead payload' });
    }

    {
      let forwarded = null;
      global.fetch = async (url, options) => {
        forwarded = { url, options };
        return {
          ok: true,
          json: async () => ({ ok: true, lead_id: 'edq_test_confirmed' }),
        };
      };

      const res = createResponse();
      await handler({ method: 'POST', body: validPayload() }, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.payload, { ok: true, lead_id: 'edq_test_confirmed' });
      assert.strictEqual(forwarded.url, 'https://example.test/apps-script');
      assert.strictEqual(forwarded.options.method, 'POST');
      assert.strictEqual(forwarded.options.headers['Content-Type'], 'text/plain;charset=utf-8');
      assert.deepStrictEqual(JSON.parse(forwarded.options.body), validPayload());
    }

    {
      global.fetch = async () => ({
        ok: true,
        json: async () => ({ ok: false, error: 'Sheet unavailable' }),
      });

      const res = createResponse();
      await handler({ method: 'POST', body: validPayload() }, res);
      assert.strictEqual(res.statusCode, 502);
      assert.deepStrictEqual(res.payload, { ok: false, error: 'Lead service unavailable' });
    }

    console.log('lead API checks passed');
  } finally {
    global.fetch = originalFetch;
    if (originalEndpoint === undefined) delete process.env.APPS_SCRIPT_LEAD_ENDPOINT;
    else process.env.APPS_SCRIPT_LEAD_ENDPOINT = originalEndpoint;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
