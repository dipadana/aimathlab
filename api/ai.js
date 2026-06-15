export const config = { runtime: 'edge' };

const GATEWAY_URL = 'https://gateway.dahono.com/v1/chat/completions';
const MODEL = 'dahono/ai-chat';

async function callGateway(apiKey, messages, stream) {
  return fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages, stream, max_tokens: 512 }),
  });
}

function errorSSE(message) {
  return `data: ${JSON.stringify({ error: message })}\n\n`;
}

function upstreamErrorResponse(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
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

  const useStream = body.stream === true;
  const upstream = await callGateway(apiKey, body.messages, useStream);

  if (!upstream.ok) {
    const status = upstream.status;
    const messages = {
      401: 'API key is invalid or has been revoked.',
      402: 'Insufficient credit balance on the AI gateway.',
      404: 'The requested model is not available.',
      429: 'Rate limit exceeded. Please wait a moment and try again.',
    };
    const msg = messages[status] || 'The AI gateway is temporarily unavailable. Please try again.';
    return upstreamErrorResponse(msg);
  }

  if (!useStream) {
    const data = await upstream.json();
    if (data.error) {
      return upstreamErrorResponse('The AI gateway is temporarily unavailable. Please try again.');
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let settled = false;

  const transform = new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });

      if (settled) {
        controller.enqueue(chunk);
        return;
      }

      const lines = text.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') { settled = true; break; }
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            controller.enqueue(encoder.encode(
              errorSSE('The AI gateway is temporarily unavailable. Please try again.')
            ));
            controller.terminate();
            return;
          }
          if (parsed.choices?.[0]?.delta?.content !== undefined) {
            settled = true;
          }
        } catch {}
      }

      controller.enqueue(chunk);
    },
  });

  upstream.body.pipeTo(transform.writable).catch(() => {});

  return new Response(transform.readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
