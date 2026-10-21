import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    // 기존 블로그 주소와 맞추기 위해 파일명을 그대로 slug로 사용
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['DataScience', 'Book', 'Life']),
    // 기존 글 중 `image:`가 비어 있는 경우가 있어 null 허용
    image: z.string().nullish(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { posts };
