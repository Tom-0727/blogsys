import { defineMiddleware } from 'astro:middleware';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const onRequest = defineMiddleware(async (context, next) => {
  // 处理blog路径下的图片请求，映射到content目录
  if (context.url.pathname.includes('/imgs/') && context.url.pathname.startsWith('/blog/')) {
    try {
      // 请求路径: /blog/tech_news/2025/602/imgs/image.jpg
      // 需要映射到: src/content/tom_blogs/tech_news/2025/imgs/image.jpg
      const pathParts = context.url.pathname.split('/');
      const blogIndex = pathParts.indexOf('blog');
      
      if (blogIndex >= 0 && blogIndex < pathParts.length - 1) {
        // 找到 imgs 的位置
        const imgsIndex = pathParts.indexOf('imgs');
        if (imgsIndex > 0) {
          // 重构路径：去掉文章ID部分，保留目录结构
          // ['', 'blog', 'tech_news', '2025', '602', 'imgs', 'image.jpg']
          // 变为: tech_news/2025/imgs/image.jpg
          const beforeImgs = pathParts.slice(blogIndex + 1, imgsIndex);
          const afterImgs = pathParts.slice(imgsIndex);
          
          // 移除最后一个目录（通常是文章ID）
          if (beforeImgs.length > 0) {
            beforeImgs.pop();
          }
          
          const contentPath = [...beforeImgs, ...afterImgs].join('/');
          const fullPath = join(process.cwd(), 'src', 'content', 'tom_blogs', contentPath);
          
          console.log('Trying to serve image:', fullPath);
          
          // 检查文件是否存在
          if (existsSync(fullPath)) {
            const fileBuffer = await readFile(fullPath);
            
            // 根据文件扩展名设置MIME类型
            const ext = fullPath.split('.').pop()?.toLowerCase();
            const mimeTypes = {
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'png': 'image/png',
              'gif': 'image/gif',
              'svg': 'image/svg+xml',
              'webp': 'image/webp'
            };
            
            const contentType = mimeTypes[ext as keyof typeof mimeTypes] || 'application/octet-stream';
            
            return new Response(fileBuffer, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000', // 1年缓存
              },
            });
          } else {
            console.log('Image file not found:', fullPath);
          }
        }
      }
    } catch (error) {
      console.error('Error serving blog image:', error);
    }
    
    // 如果文件不存在或出错，返回404
    return new Response('Image not found', { status: 404 });
  }
  
  // 处理content目录中的图片请求（备用方案）
  if (context.url.pathname.startsWith('/content-images/')) {
    try {
      // 将URL路径转换为文件系统路径
      const filePath = context.url.pathname.replace('/content-images/', '');
      const fullPath = join(process.cwd(), 'src', 'content', filePath);
      
      // 检查文件是否存在
      if (existsSync(fullPath)) {
        const fileBuffer = await readFile(fullPath);
        
        // 根据文件扩展名设置MIME类型
        const ext = filePath.split('.').pop()?.toLowerCase();
        const mimeTypes = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'svg': 'image/svg+xml',
          'webp': 'image/webp'
        };
        
        const contentType = mimeTypes[ext as keyof typeof mimeTypes] || 'application/octet-stream';
        
        return new Response(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000', // 1年缓存
          },
        });
      }
    } catch (error) {
      console.error('Error serving content image:', error);
    }
    
    // 如果文件不存在或出错，返回404
    return new Response('Image not found', { status: 404 });
  }
  
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