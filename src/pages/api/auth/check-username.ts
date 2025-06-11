import type { APIRoute } from 'astro';
import { Database } from '../../../db/database';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const username = url.searchParams.get('username');
    
    if (!username) {
      return new Response(JSON.stringify({ error: '用户名参数缺失' }), {
        status: 400,
      });
    }

    if (username.length < 2 || username.length > 20) {
      return new Response(JSON.stringify({ 
        available: false, 
        message: '用户名长度需要在2-20个字符之间' 
      }), {
        status: 200,
      });
    }

    const db = await Database.getInstance();
    const existingUser = await db.findUserByUsername(username);

    return new Response(JSON.stringify({
      available: !existingUser,
      message: existingUser ? '该用户名已被使用' : '用户名可用'
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Check username error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
    });
  }
}; 