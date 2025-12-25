export interface Env {
  DEAD_DROP: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === 'POST' && pathname === '/store') {
      try {
        const contentType = request.headers.get('content-type') || '';
        let body: any;
        if (contentType.includes('application/json')) {
          body = await request.json();
        } else {
          const text = await request.text();
          body = { message: text };
        }
        const message = body?.message;
        if (!message || typeof message !== 'string') {
          return new Response(JSON.stringify({ error: 'missing message' }), { status: 400, headers: { 'content-type': 'application/json' } });
        }

        const id = crypto.randomUUID();
        await env.DEAD_DROP.put(id, message, { expirationTtl: 3600 });

        return new Response(JSON.stringify({ id, ttl_seconds: 3600 }), { status: 201, headers: { 'content-type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'invalid body' }), { status: 400, headers: { 'content-type': 'application/json' } });
      }
    }

    if (request.method === 'GET' && pathname.startsWith('/read/')) {
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      if (!id) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400, headers: { 'content-type': 'application/json' } });

      const message = await env.DEAD_DROP.get(id);
      if (message === null) {
        return new Response(JSON.stringify({ error: 'not found or already read' }), { status: 404, headers: { 'content-type': 'application/json' } });
      }

      await env.DEAD_DROP.delete(id);
      return new Response(JSON.stringify({ message }), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    return new Response('Not Found', { status: 404 });
  }
};
