<!-- markdownlint-disable-file MD033 MD041 -->
<h1 align="center">cmpt-markmap | FixIt</h1>

![cmpt-markmap](https://github.com/user-attachments/assets/9e4f715f-4044-467a-a577-53a666c23a63)

<div align="center" class="ignore">
  <p>一个为 FixIt 主题提供 <a href="https://markmap.js.org/">markmap</a> 思维导图支持的 Hugo 组件。</p>
  简体中文 |
  <a href="https://fixit.lruihao.cn/zh-cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=chinese_traditional">繁體中文</a> |
  <a href="/README.en.md">English</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=french">Français</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=russian">Русский язык</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=spanish">Español</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=hindi">हिन्दी</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=deutsch">deutsch</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=korean">한국어</a> |
  <a href="https://fixit.lruihao.cn/ecosystem/hugo-fixit/cmpt-markmap/?lang=japanese">しろうと</a>
</div>

## 特性

- 支持在任意 Markdown 文件中通过**代码块**嵌入 markmap 思维导图，可自定义高度
- 提供专属 `markmap` **页面布局**，左侧显示文章内容，右侧展示思维导图，可拖拽调整面板宽度
- 自定义工具栏，支持**全屏**模式
- 与 FixIt 主题**深色模式**无缝集成

## 要求

- FixIt v1.0.0 或更高版本

> [!NOTE]
> 依赖 FixIt v1.0.0 是因为用到了 `function/snake2camel.html`，用于将主题配置文件 / 页面 Front Matter 中的 `snake_case` 选项转换为 markmap 所需的 `camelCase`。若你使用的是 FixIt v0.4.5，也可以通过将 FixIt 中的 `layouts/_partials/function/snake2camel.html` 复制到自己的项目中来使用本组件。

## 安装组件

安装方式与 [安装主题](https://fixit.lruihao.cn/zh-cn/documentation/installation/) 相同，有多种安装方式，任选一种即可，这里介绍两种主流方式。

### 作为 Hugo 模块安装

首先确保你的项目本身是一个 [Hugo 模块](https://gohugo.io/hugo-modules/use-modules/#initialize-a-new-module)。

然后将此主题组件添加到你的 `hugo.toml` 配置文件中：

```toml
[module]

[[module.imports]]
path = "github.com/hugo-fixit/FixIt"

[[module.imports]]
path = "github.com/hugo-fixit/cmpt-markmap"
```

在 Hugo 的第一次启动时，它将下载所需的文件。

要更新到模块的最新版本，请运行：

```bash
hugo mod get -u
hugo mod tidy
```

### 作为 Git 子模块安装

将 [FixIt](https://github.com/hugo-fixit/FixIt) 和此 git 存储库克隆到你的主题文件夹中，并将其作为网站目录的子模块添加。

```bash
git submodule add https://github.com/hugo-fixit/FixIt.git themes/FixIt
git submodule add https://github.com/hugo-fixit/cmpt-markmap.git themes/cmpt-markmap
```

接下来编辑项目的 `hugo.toml` 并将此主题组件添加到你的主题中：

```toml
theme = ["FixIt", "cmpt-markmap"]
```

## 配置

为了通过 FixIt 主题开放的 [自定义块](https://fixit.lruihao.cn/references/blocks/) 将 `cmpt-markmap.fixit.html` 注入到 `custom-assets` 中，你需要填写以下必要配置：

```toml
[params]

[params.customPartials]
# ... other partials
assets = [
  "inject/cmpt-markmap.fixit.html",
]
# ... other partials
```

### markmap 选项

- 主题配置文件和页面 Front Matter 中使用 `snake_case`。
- 扩展 `markmap` 代码块内的  Front Matter 使用 `camelCase`（与 markmap 官方文档一致）。

全局默认配置：

```toml
[params]

# Markmap configuration for layout (in snake_case)
# https://markmap.js.org/docs/json-options#option-list
[params.markmap]
color_freeze_level = 0
```

## 用法

### 扩展代码块

在任意 Markdown 文件中，以 `markmap` 为语言标识使用围栏代码块，支持 `height` 属性（默认 `24rem`）：

````markdown
```markmap
# 根节点

## 分支一

## 分支二
```
````

或者带有 Front Matter 配置：

````markdown
```markmap {height="400px"}
---
title: 根节点
markmap:
  colorFreezeLevel: 2
---

## 分支一

## 分支二
```
````

### 页面布局

在页面 Front Matter 中设置 `layout: markmap`，即可启用专属的分栏思维导图页面布局：

```markdown
---
title: 我的思维导图
layout: markmap
markmap:
  color_freeze_level: 2
---

## 分支一

## 分支二
```

## 参考

- [markmap 完整用法示例](markmap.md)
- [markmap 官网](https://markmap.js.org/)
- [开发主题组件 | FixIt](https://fixit.lruihao.cn/contributing/components/)
- [如何开发 Hugo 主题组件 | FixIt](https://fixit.lruihao.cn/components/dev-component/)
