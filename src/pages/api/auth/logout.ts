import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 验证用户是否已登录（简单的安全检查）
    const token = cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: '未登录' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 验证token有效性
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Token无效' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 清除 cookie
    const response = new Response(JSON.stringify({ message: '登出成功' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    // 设置更兼容的cookie清除策略
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'token=',
      'HttpOnly',
      'Path=/',
      'Max-Age=0',
      isProduction ? 'Secure' : '',
      'SameSite=Lax', // 改为Lax以提高兼容性
    ].filter(Boolean).join('; ');

    response.headers.set('Set-Cookie', cookieOptions);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: '登出失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}; 