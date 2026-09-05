# Writing posts

Add Markdown files to `src/content/posts/`. Astro automatically lists published
posts on the homepage, newest first, and creates `/posts/<filename>/` pages.
Nested folders are supported. New posts appear during development; rebuild and
redeploy to update the live site.

```md
---
title: My post
date: 2026-09-05
description: A short description for search engines.
draft: false
---

## Intro

Your Markdown content goes here.
```

Only `title` and `date` are required. `draft: true` hides a post from both the
homepage and generated routes. `first-post.md` is an unpublished starter.

To add a header image beside the title, put an image next to the Markdown file
and include these optional frontmatter fields:

```yaml
image: ./my-image.png
imageAlt: A description of the image
```

Use standard Markdown images inside the article: `![Description](./my-image.png)`.
Headings, lists, links, code blocks, quotes, and tables have shared post styles.
No layout field or manual homepage edits are needed.

This uses [Astro content collections](https://docs.astro.build/en/guides/content-collections/).
