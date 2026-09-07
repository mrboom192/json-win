// @ts-check
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({
    // Generate static images for prerendered pages during the build.
    imageService: "compile",
  }),
  markdown: {
    shikiConfig: {
      theme: "ayu-light",
    },
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
});
