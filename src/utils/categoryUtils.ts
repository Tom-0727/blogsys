// src/utils/categoryUtils.ts - Utilities for category management and filtering
import { getCollection } from 'astro:content';
import { COMMENT_STATUSES } from '../consts';

// Type for comment statuses
type CommentStatus = typeof COMMENT_STATUSES[number];

/**
 * Slugify a string (convert to URL-friendly format)
 * @param text The string to slugify
 * @returns A URL-friendly version of the string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Format a category name (capitalize, replace hyphens, etc.)
 * @param categorySlug The category slug from folder name
 * @returns Formatted category name
 */
export function formatCategoryName(categorySlug: string): string {
  return categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get all unique categories from blog posts (from frontmatter only)
 * @returns Array of category objects with name and count
 */
export async function getAllCategories() {
  const posts = await getCollection('blog');
  const categoriesMap = new Map<string, number>();
  
  // Add 'All Posts' category
  categoriesMap.set('All Posts', posts.length);
  
  // Add 'Uncategorized' category
  categoriesMap.set('Uncategorized', 0);
  
  posts.forEach(post => {
    // 检查文件是否在根目录下
    const isInRoot = !post.id.includes('/');
    
    if (isInRoot) {
      // 如果在根目录，计入未分类
      const count = categoriesMap.get('Uncategorized') || 0;
      categoriesMap.set('Uncategorized', count + 1);
    } else {
      // 如果在子目录，使用 frontmatter 中的分类
      const categories = post.data.categories || [];
      categories.forEach(category => {
        if (!category) return;
        
        const count = categoriesMap.get(category) || 0;
        categoriesMap.set(category, count + 1);
      });
    }
  });
  
  // Convert map to array of objects with slug
  return Array.from(categoriesMap.entries())
    .map(([name, count]) => ({
      name,
      slug: slugify(name),
      count
    }))
    .sort((a, b) => {
      // Always put 'All Posts' first
      if (a.name === 'All Posts') return -1;
      if (b.name === 'All Posts') return 1;
      // Then put 'Uncategorized' second
      if (a.name === 'Uncategorized') return -1;
      if (b.name === 'Uncategorized') return 1;
      // Then sort by count (most popular first)
      return b.count - a.count;
    });
}

/**
 * Get posts by category
 * @param category The category name or slug
 * @returns Array of posts in the specified category
 */
export async function getPostsByCategory(category: string) {
  const allPosts = await getCollection('blog');
  
  // If category is 'all' or 'all-posts', return all posts
  if (category === 'all' || category === 'all-posts') {
    return allPosts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  }
  
  const categoryLower = category.toLowerCase();
  
  // Special handling for Uncategorized posts
  if (categoryLower === 'uncategorized') {
    return allPosts
      .filter(post => {
        // 检查文件是否在根目录下（不在任何子文件夹中）
        const isInRoot = !post.id.includes('/');
        return isInRoot;
      })
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  }
  
  return allPosts.filter(post => {
    // Only check categories from frontmatter
    const postCategories = post.data.categories || [];
    
    return postCategories.some(cat => 
      slugify(cat) === categoryLower || cat.toLowerCase() === categoryLower
    );
  }).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Get related posts based on categories
 * @param currentSlug The slug of the current post to exclude
 * @param categories Array of categories to find related posts
 * @param limit Maximum number of posts to return
 * @returns Array of related posts
 */
export async function getRelatedPosts(currentSlug: string, categories: string[] = [], limit: number = 3) {
  const allPosts = await getCollection('blog');
  
  // Filter out the current post and find posts with matching categories
  const related = allPosts
    .filter(post => post.slug !== currentSlug)
    .map(post => {
      // Only use categories from frontmatter
      const postCategories = post.data.categories || [];
      
      // Count how many categories match
      const matchCount = categories.filter(category => 
        postCategories.includes(category)
      ).length;
      
      return { post, matchCount };
    })
    .filter(item => item.matchCount > 0) // Only include posts with at least one matching category
    .sort((a, b) => {
      // Sort by match count, then by publish date if match counts are equal
      if (b.matchCount === a.matchCount) {
        return b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf();
      }
      return b.matchCount - a.matchCount;
    })
    .slice(0, limit) // Limit to specified number
    .map(item => item.post);
    
  return related;
}

/**
 * Get the comment status for a post
 * @param postId The post slug or ID
 * @returns The comment status (enabled, disabled, etc)
 */
export function getCommentStatus(_postId: string): CommentStatus {
  // In a real app, this would check a database or config
  // For now, we'll return enabled for all posts
  return "enabled";
}

/**
 * Count comments for a post
 * @param postId The post slug or ID
 * @returns The number of comments on the post
 */
export async function getCommentCount(postId: string): Promise<number> {
  // In a real app, this would query a database
  // For now get comments from localStorage for the specific post
  if (typeof window !== 'undefined') {
    const comments = JSON.parse(localStorage.getItem(`comments-${postId}`) || '[]');
    return comments.length;
  }
  return 0;
}