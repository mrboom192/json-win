import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
    image: image().optional(),
    imageAlt: z.string().default(''),
  }),
});
export const collections = { posts };
