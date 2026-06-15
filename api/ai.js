export const config = { runtime: 'edge' };

const GATEWAY_URL = 'https://gateway.dahono.com/v1/chat/completions';
const MODEL = 'dahono/claude-opus-4.8-thinking-free';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGateway(apiKey, body, attempt) {
  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: body.messages,
      stream: body.stream || false,
      max_tokens: 512,
    }),
  });

  if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < MAX_RETRIES) {
    await sleep(RETRY_DELAY_MS * attempt);
    return callGateway(apiKey, body, attempt + 1);
  }

  return res;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.DAHONO_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upstream = await callGateway(apiKey, body, 1);

  if (!upstream.ok) {
    const rawText = await upstream.text();
    let detail = rawText;
    try {
      const parsed = JSON.parse(rawText);
      detail = parsed?.error?.message || rawText;
    } catch {}

    if (upstream.status === 502 || upstream.status === 503 || upstream.status === 504) {
      return new Response(JSON.stringify({ error: 'The AI gateway is temporarily unavailable. Please try again in a moment.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Gateway error (${upstream.status})`, detail }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (body.stream) {
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  const data = await upstream.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
