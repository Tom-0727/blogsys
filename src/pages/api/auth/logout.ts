import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async () => {
  // 清除 cookie
  const response = new Response(JSON.stringify({ message: '登出成功' }), {
    status: 200,
  });

  response.headers.set('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');

  return response;
}; 