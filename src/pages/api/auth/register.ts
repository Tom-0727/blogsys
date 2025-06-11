import type { APIRoute } from 'astro';
import { Database } from '../../../db/database';
import jwt from 'jsonwebtoken';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password, username } = await request.json();
    const db = await Database.getInstance();

    // 验证用户输入
    if (!email || !password || !username) {
      return new Response(JSON.stringify({ error: '邮箱、密码和用户名不能为空' }), {
        status: 400,
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^@\s]+@[^@\s]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: '邮箱格式不正确' }), {
        status: 400,
      });
    }



    // 验证用户名长度
    if (username.length < 2 || username.length > 20) {
      return new Response(JSON.stringify({ error: '用户名长度需要在2-20个字符之间' }), {
        status: 400,
      });
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await db.findUserByEmail(email);
    if (existingUserByEmail) {
      return new Response(JSON.stringify({ error: '该邮箱已被注册' }), {
        status: 409,
      });
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await db.findUserByUsername(username);
    if (existingUserByUsername) {
      return new Response(JSON.stringify({ error: '该用户名已被使用' }), {
        status: 409,
      });
    }

    // 创建新用户
    const newUser = await db.createUser(email, password, username);

    // 生成 JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        username: newUser.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 设置 cookie 并返回响应
    const response = new Response(JSON.stringify({ 
      message: '注册成功',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      }
    }), {
      status: 201,
    });

    response.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
    });
  }
}; 