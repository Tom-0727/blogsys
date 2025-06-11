// src/consts.ts - Global constants for the blog
export const SITE_TITLE = 'Tom\'s Blog';
export const SITE_DESCRIPTION = 'Where AI technology meets business and curious minds meet each other.';
export const SITE_AUTHOR = 'Tom';
export const SITE_KEYWORDS = ['blog', 'technology', 'business', 'Agent', 'AI'];

// User roles
export const USER_ROLES = ['user', 'admin', 'editor'] as const;
export type UserRole = typeof USER_ROLES[number];

// Comment status options
export const COMMENT_STATUSES = ['enabled', 'disabled', 'moderated'] as const;

// Social media links
export const SOCIAL_LINKS = {
  github: 'https://github.com/Tom-0727',
};

// Blog categories
export const FEATURED_CATEGORIES = [
  'AI Technology',
  'Agent',
  'Business',
];

// Content config
export const POSTS_PER_PAGE = 6;