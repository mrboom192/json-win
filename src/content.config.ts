import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postCollection = (base: string) =>
  defineCollection({
    loader: glob({ pattern: "**/*.md", base }),
    schema: ({ image }) =>
      z.object({
        title: z.string().min(1),
        date: z.coerce.date(),
        description: z.string().optional(),
        color: z
          .string()
          .regex(
            /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
            "Use a hex color such as #FFF",
          )
          .default("#FFF"),
        draft: z.boolean().default(false),
        image: image().optional(),
        imageAlt: z.string().default(""),
        titleModel: z.string().optional(),
        titleModelRotation: z.number().finite().default(0),
        titleModelZoom: z.number().finite().min(0.25).max(4).default(1),
        titleModelWireframe: z.boolean().default(false),
        titleModelWireframeStyle: z
          .enum(["triangles", "quads"])
          .default("triangles"),
      }),
  });

export const collections = {
  blogs: postCollection("./src/content/blogs"),
  notes: postCollection("./src/content/notes"),
};
