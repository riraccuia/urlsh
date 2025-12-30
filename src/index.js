import { IPMatcher } from './ip-matcher.js';
import { UrlStore } from './url-store.js';
import { ROUTES } from './common.js';

export { UrlStore };

export default {
  async fetch(request, env, ctx) {
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For')?.split(',')[0] || 
                     'unknown';
    
    const path = new URL(request.url).pathname;
    const method = request.method;
    
    // Determine if this is an admin route
    const isAdminRoute = (method === 'POST' && path === ROUTES.CREATE) ||
                        (method === 'GET' && path === ROUTES.LIST) ||
                        (method === 'POST' && path === ROUTES.FLUSH);
    
    // Initialize IP matchers if needed
    if (!env._adminIPMatcher) {
      env._adminIPMatcher = new IPMatcher(env.ADMIN_ALLOWED_IPS);
    }
    if (!env._publicIPMatcher) {
      env._publicIPMatcher = new IPMatcher(env.PUBLIC_ALLOWED_IPS);
    }
    
    const id = env.URL_STORE.idFromName('singleton');
    const obj = env.URL_STORE.get(id);
    
    // Check admin routes
    if (isAdminRoute) {
      if (!env._adminIPMatcher.isAllowed(clientIP)) {
        return new Response('Forbidden', { status: 403 });
      }
      return obj.fetch(request);
    }
    
    // Check public routes (short URL consumption)
    if (!env._publicIPMatcher.isAllowed(clientIP)) {
      return new Response('Forbidden', { status: 403 });
    }

    return obj.fetch(request);
  }
};
