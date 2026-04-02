<!-- markdownlint-disable-file MD033 MD041 -->
<h1 align="center">cmpt-markmap | FixIt</h1>

![cmpt-markmap](https://github.com/user-attachments/assets/9e4f715f-4044-467a-a577-53a666c23a63)

<div align="center" class="ignore">
  <p>A Hugo component that brings <a href="https://markmap.js.org/">markmap</a> mind map support to the FixIt theme.</p>
  <a href="/README.md">简体中文</a> |
  <a href="https://fixit.lruihao.cn/zh-cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=chinese_traditional">繁體中文</a> |
  English |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=french">Français</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=russian">Русский язык</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=spanish">Español</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=hindi">हिन्दी</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=deutsch">deutsch</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=korean">한국어</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=japanese">しろうと</a>
</div>

## Features

- Embed markmap mind maps anywhere via **code blocks** in Markdown, with configurable height
- Dedicated `markmap` **page layout** with a resizable split pane — article on the left, mind map on the right
- Custom toolbar with **fullscreen** support
- Seamlessly integrates with the FixIt theme's **dark mode**

## Requirements

- FixIt v1.0.0 or later.

> [!NOTE]
> This component uses `function/snake2camel.html` to convert `snake_case` options (theme config / page front matter) to the `camelCase` options required by markmap. If you are using FixIt v0.4.5, you can still use this component by copying `layouts/_partials/function/snake2camel.html` from FixIt into your own project.

## Install Component

The installation method is the same as [installing a theme](https://fixit.lruihao.cn/documentation/installation/). There are several ways to install, choose one, Here are two mainstream ways.

### Install as Hugo Module

First make sure that your project itself is a [Hugo module](https://gohugo.io/hugo-modules/use-modules/#initialize-a-new-module).

Then add this theme component to your `hugo.toml` configuration file:

```toml
[module]

[[module.imports]]
path = "github.com/hugo-fixit/FixIt"

[[module.imports]]
path = "github.com/hugo-fixit/cmpt-markmap"
```

On the first start of Hugo it will download the required files.

To update to the latest version of the module run:

```bash
hugo mod get -u
hugo mod tidy
```

### Install as Git Submodule

Clone [FixIt](https://github.com/hugo-fixit/FixIt) and this git repository into your theme folder and add it as submodules of your website directory.

```bash
git submodule add https://github.com/hugo-fixit/FixIt.git themes/FixIt
git submodule add https://github.com/hugo-fixit/cmpt-markmap.git themes/cmpt-markmap
```

Next edit `hugo.toml` of your project and add this theme component to your themes:

```toml
theme = ["FixIt", "cmpt-markmap"]
```

## Configuration

In order to inject the partial `{xxx}.fixit.html` into the `custom-assets` through the [custom block](https://fixit.lruihao.cn/references/blocks/) opened by the FixIt theme, you need to fill in the following necessary configurations:

```toml
[params]

[params.customPartials]
# ... other partials
assets = [
  "inject/cmpt-markmap.fixit.html",
]
# ... other partials
```

### markmap Options

- In the theme config file and page front matter, use snake_case.
- In the front matter inside an extended `markmap` code block, use camelCase (same as the official markmap docs).

Global default configuration:

```toml
[params]

# Markmap configuration for layout (in snake_case)
# https://markmap.js.org/docs/json-options#option-list
[params.markmap]
color_freeze_level = 0
```

## Usage

### Extended Code Block

Use a fenced code block with the `markmap` language identifier in any Markdown file. Supports an optional `height` attribute (default `24rem`):

````markdown
```markmap
# Root

## Branch 1

## Branch 2
```
````

Or with front matter configuration:

````markdown
```markmap {height="400px"}
---
title: Root
markmap:
  colorFreezeLevel: 2
---

## Branch 1

## Branch 2
```
````

### Page Layout

Set `layout: markmap` in the page Front Matter to enable the dedicated split-pane mind map layout:

```markdown
---
title: My Mind Map
layout: markmap
---

## Branch 1

## Branch 2
```

## References

- [Full Usage Example](markmap.md)
- [markmap Official Website](https://markmap.js.org/)
- [Develop Theme Components | FixIt](https://fixit.lruihao.cn/contributing/components/)
- [How to Develop a Hugo Theme Component | FixIt](https://fixit.lruihao.cn/components/dev-component/)
