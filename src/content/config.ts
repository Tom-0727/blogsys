import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tom_blogs = defineCollection({
	loader: glob({ 
		pattern: ['**/*.md', '!**/template.md', '!**/README.md'], 
		base: './src/content/tom_blogs'
	}),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		// Categories array in frontmatter
		categories: z.array(z.string()).optional(),
	}),
});

export const collections = { 
	tom_blogs: tom_blogs 
};
