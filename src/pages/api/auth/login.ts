import type { APIRoute } from 'astro';
import { Database } from '../../../db/database';
import jwt from 'jsonwebtoken';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password } = await request.json();
    const db = await Database.getInstance();

    // 验证用户输入
    if (!email || !password) {
      return new Response(JSON.stringify({ error: '邮箱和密码不能为空' }), {
        status: 400,
      });
    }

    // 查找用户
    const user = await db.findUserByEmail(email);
    if (!user) {
      return new Response(JSON.stringify({ error: '用户不存在' }), {
        status: 401,
      });
    }

    // 验证密码
    const isValid = await db.verifyPassword(user, password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: '密码错误' }), {
        status: 401,
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 设置 cookie
    const response = new Response(JSON.stringify({ 
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    }), {
      status: 200,
    });

    response.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
    });
  }
}; 