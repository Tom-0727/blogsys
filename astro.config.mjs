// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 自定义插件来处理content图片路径
function contentImageRewritePlugin() {
	return {
		name: 'content-image-rewrite',
		transform(code, id) {
			// 只处理content目录中的markdown文件
			if (id.includes('src/content/tom_blogs') && id.endsWith('.md')) {
				// 获取文件相对于tom_blogs的路径
				const relativePath = id.replace(/.*src\/content\/tom_blogs\//, '').replace('.md', '');
				const articleDir = dirname(relativePath);
				
				// 替换相对图片路径
				const transformedCode = code.replace(
					/src=["']\.\/imgs\/([^"']+)["']/g,
					`src="/content-images/tom_blogs/${articleDir}/imgs/$1"`
				);
				
				return transformedCode;
			}
			return code;
		}
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://tom-blogs.top',
	integrations: [mdx(), sitemap()],
	output: 'server',
	adapter: node({
		mode: 'standalone'
	}),
	markdown: {
		remarkPlugins: [],
		rehypePlugins: [],
	},
	vite: {
		plugins: [contentImageRewritePlugin()],
		define: {
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		},
		server: {
			fs: {
				// 允许访问content目录中的文件
				allow: ['..']
			}
		},
		// 配置静态资源处理
		assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.gif', '**/*.svg', '**/*.webp'],
		// 添加alias来处理content中的图片路径
		resolve: {
			alias: {
				'/content-images': resolve(__dirname, 'src/content')
			}
		}
	}
});
