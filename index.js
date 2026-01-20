import { handleStore } from './src/store.js';
import { handleSubscribe } from './src/subscribe.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/store')) {
      return handleStore(request, env);
    } else if (url.pathname === '/subscribe') {
      return handleSubscribe(request, env);
    } else {
      // 提供静态文件服务
      return env.ASSETS.fetch(request);
    }
  },
};