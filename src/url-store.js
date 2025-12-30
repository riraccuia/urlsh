import { ROUTES, generateShortCode } from './common.js';

export class UrlStore {
  constructor(state, env) {
    this.state = state;
    this.urlMap = null;
    this.codeLength = env.SHORT_CODE_LENGTH;
  }

  async init() {
    if (this.urlMap !== null) return;
    const stored = await this.state.storage.get('urlMap');
    this.urlMap = stored ? new Map(stored) : new Map();
  }

  async handleCreate(request, codeLength = this.codeLength) {
    await this.init();
    const data = await request.json();
    if (!data.url || typeof data.url !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    let code = generateShortCode(codeLength);
    while (this.urlMap.has(code)) {
      code = generateShortCode(codeLength);
    }
    this.urlMap.set(code, data.url);
    await this.state.storage.put('urlMap', Array.from(this.urlMap.entries()));
    return new Response(JSON.stringify({ code, url: data.url }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async handleList() {
    await this.init();
    const urls = Array.from(this.urlMap.entries()).map(([code, url]) => ({ code, url }));
    return new Response(JSON.stringify(urls), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async handleFlush() {
    await this.init();
    this.urlMap.clear();
    await this.state.storage.delete('urlMap');
    return new Response(JSON.stringify({ message: 'All URLs cleared' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async handleRedirect(code) {
    await this.init();
    const url = this.urlMap.get(code);
    if (!url) {
      return new Response('Forbidden', { status: 403 });
    }
    return Response.redirect(url, 302);
  }

  async fetch(request) {
    const method = request.method;
    const path = new URL(request.url).pathname;

    if (method === 'POST' && path === ROUTES.CREATE) return this.handleCreate(request);
    if (method === 'GET' && path === ROUTES.LIST) return this.handleList();
    if (method === 'POST' && path === ROUTES.FLUSH) return this.handleFlush();
    if (method === 'GET' && path.length > 1) return this.handleRedirect(path.slice(1));

    return new Response('Not Found', { status: 404 });
  }
}

