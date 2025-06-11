import type { APIRoute } from 'astro';
import { Database } from '../../db/database';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    try {
        const searchParams = url.searchParams;
        const postId = searchParams.get('postId');
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = parseInt(searchParams.get('perPage') || '5');

        if (!postId) {
            return new Response(JSON.stringify({ error: 'Post ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = await Database.getInstance();
        const result = await db.getComments(postId, page, perPage);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const { postId, author, content } = await request.json();

        if (!postId || !author || !content) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = await Database.getInstance();
        const commentId = await db.addComment(postId, author, content);

        return new Response(JSON.stringify({ id: commentId }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const PUT: APIRoute = async ({ request }) => {
    try {
        const { commentId } = await request.json();

        if (!commentId) {
            return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = await Database.getInstance();
        const result = await db.likeComment(commentId);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 