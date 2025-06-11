import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

export interface User {
    id: number;
    email: string;
    username: string;
    created_at: Date;
    updated_at: Date;
}

export interface Comment {
    id: number;
    post_id: string;
    content: string;
    author: string;
    date: Date;
    likes: number;
}

export class Database {
    private static instance: Database;
    private db: any;

    private constructor() {}

    public static async getInstance(): Promise<Database> {
        if (!Database.instance) {
            Database.instance = new Database();
            await Database.instance.initialize();
        }
        return Database.instance;
    }

    private async initialize() {
        // 确保数据库目录存在
        const dbDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // 打开数据库连接
        this.db = await open({
            filename: path.join(dbDir, 'blog.db'),
            driver: sqlite3.Database
        });

        // 初始化数据库表
        const schema = fs.readFileSync(path.join(process.cwd(), 'src/db/schema.sql'), 'utf8');
        await this.db.exec(schema);
    }

    // 用户管理方法
    async createUser(email: string, password: string, username: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await this.db.run(
            'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
            [email, hashedPassword, username]
        );
        const user = await this.findUserById(result.lastID);
        if (!user) throw new Error('Failed to create user');
        return user;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    async findUserById(id: number): Promise<User | null> {
        return await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
    }

    async findUserByUsername(username: string): Promise<User | null> {
        return await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
    }

    async verifyPassword(user: User, password: string): Promise<boolean> {
        const result = await this.db.get(
            'SELECT password_hash FROM users WHERE id = ?',
            [user.id]
        );
        return bcrypt.compare(password, result.password_hash);
    }

    async updateUser(id: number, data: Partial<User>): Promise<User> {
        const updates = Object.entries(data)
            .filter(([key]) => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
            .map(([key], index) => `${key} = $${index + 2}`)
            .join(', ');
        
        const values = Object.values(data);
        await this.db.run(
            `UPDATE users SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [id, ...values]
        );
        const user = await this.findUserById(id);
        if (!user) throw new Error('User not found');
        return user;
    }

    async deleteUser(id: number): Promise<boolean> {
        const result = await this.db.run('DELETE FROM users WHERE id = ?', [id]);
        return result.changes > 0;
    }

    // 评论管理方法
    async getComments(postId: string, page: number = 1, perPage: number = 5) {
        const offset = (page - 1) * perPage;
        const comments = await this.db.all(
            'SELECT * FROM comments WHERE post_id = ? ORDER BY date DESC LIMIT ? OFFSET ?',
            [postId, perPage, offset]
        );
        const total = await this.db.get(
            'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
            [postId]
        );
        return {
            comments,
            total: total.count,
            page,
            perPage
        };
    }

    async addComment(postId: string, author: string, content: string) {
        const result = await this.db.run(
            'INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)',
            [postId, author, content]
        );
        return result.lastID;
    }

    async likeComment(commentId: number) {
        await this.db.run(
            'UPDATE comments SET likes = likes + 1 WHERE id = ?',
            [commentId]
        );
        return await this.db.get(
            'SELECT likes FROM comments WHERE id = ?',
            [commentId]
        );
    }

    async deleteComment(commentId: number): Promise<boolean> {
        const result = await this.db.run('DELETE FROM comments WHERE id = ?', [commentId]);
        return result.changes > 0;
    }
} 