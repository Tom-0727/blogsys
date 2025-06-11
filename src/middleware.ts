import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // 只对API路由应用CORS头
  if (context.url.pathname.startsWith('/api/')) {
    const res = await next();
    
    // 设置CORS头
    res.headers.set('Access-Control-Allow-Origin', context.url.origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // 处理预检请求
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: res.headers,
      });
    }
    
    return res;
  }
  
  return next();
}); 