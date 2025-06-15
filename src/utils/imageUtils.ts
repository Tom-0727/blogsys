// src/utils/imageUtils.ts - 处理content目录中的图片路径
import { join, dirname, relative } from 'path';

/**
 * 将content文章中的相对图片路径转换为可访问的URL路径
 * @param imagePath 原始图片路径 (如: "./imgs/image.jpg")
 * @param articleId 文章ID (如: "tech_news/2025/602")
 * @returns 转换后的图片URL路径
 */
export function resolveContentImagePath(imagePath: string, articleId: string): string {
  // 如果已经是绝对路径或外部链接，直接返回
  if (imagePath.startsWith('/') || imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // 处理相对路径
  if (imagePath.startsWith('./')) {
    // 获取文章所在目录
    const articleDir = dirname(articleId);
    // 转换为content-images路径
    const resolvedPath = join(articleDir, imagePath.replace('./', ''));
    return `/content-images/tom_blogs/${resolvedPath}`;
  }
  
  return imagePath;
}

/**
 * 处理markdown内容中的图片路径
 * @param content markdown内容
 * @param articleId 文章ID
 * @returns 处理后的markdown内容
 */
export function processImagePaths(content: string, articleId: string): string {
  // 匹配img标签中的src属性
  const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
  
  return content.replace(imgRegex, (match, beforeSrc, srcPath, afterSrc) => {
    const newPath = resolveContentImagePath(srcPath, articleId);
    return `<img ${beforeSrc}src="${newPath}"${afterSrc}>`;
  });
}

/**
 * 处理markdown格式的图片引用
 * @param content markdown内容
 * @param articleId 文章ID
 * @returns 处理后的markdown内容
 */
export function processMarkdownImages(content: string, articleId: string): string {
  // 匹配markdown格式的图片 ![alt](src)
  const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  return content.replace(markdownImgRegex, (match, alt, srcPath) => {
    const newPath = resolveContentImagePath(srcPath, articleId);
    return `![${alt}](${newPath})`;
  });
} 