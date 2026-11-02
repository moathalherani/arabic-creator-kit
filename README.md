<div align="center">

# Arabic Creator Kit

**Open-source tools for Arabic content creators and the developers who build for them.**

أدوات مفتوحة المصدر لصنّاع المحتوى العرب وللمبرمجين اللي بيبنولهم.

[![CI](https://github.com/moathalherani/arabic-creator-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/moathalherani/arabic-creator-kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

| | What | Install |
| --- | --- | --- |
| 🎣 [`arabic-hooks`](packages/arabic-hooks) | Arabic + English video hooks, fill-in templates and a hook scorer | `npm i arabic-hooks` |
| 🔎 [`arabic-seo`](packages/arabic-seo) | Arabic slugs, hreflang, safe JSON-LD, digit and tashkeel fixes | `npm i arabic-seo` |
| 💬 [`arabic-captions`](packages/arabic-captions) | SRT/VTT → keyword captions for Reels with correct RTL, ASS for ffmpeg | `npx arabic-captions talk.srt` |
| 🧠 [`skills/`](skills) | Claude Skills for Arabic hooks, reel scripts, LinkedIn posts, YouTube titles and captions | see below |

All packages: zero dependencies, Node 18+, ES modules with TypeScript types.

## Try it in 10 seconds / جرّبها

```bash
npx arabic-hooks                       # random Arabic hook
npx arabic-hooks score "مرحبا يا جماعة اليوم رح نحكي"   # score your opening line
npx arabic-captions talk.srt -f ass -o talk.ass       # short keyword captions
```

```js
import { slugify, hreflangHtml } from "arabic-seo";
slugify("دليل تطبيقات BYD الكامل ٢٠٢٦"); // "دليل-تطبيقات-byd-الكامل-2026"
```

## Claude Skills

| Skill | Use it for |
| --- | --- |
| [`arabic-hook-writer`](skills/arabic-hook-writer/SKILL.md) | 5 hooks in your dialect, scored and improved |
| [`arabic-reel-script`](skills/arabic-reel-script/SKILL.md) | A timed, ready-to-shoot reel script with on-screen text and B-roll |
| [`arabic-linkedin-post`](skills/arabic-linkedin-post/SKILL.md) | A LinkedIn post from a real work story |
| [`arabic-youtube-titles`](skills/arabic-youtube-titles/SKILL.md) | Searchable titles, thumbnail text and a description |
| [`arabic-keyword-captions`](skills/arabic-keyword-captions/SKILL.md) | Keyword captions burned into your video |

**Install**

- **Claude app** (web, desktop): zip a skill folder (for example `arabic-hook-writer/`) and upload it under Settings → Capabilities → Skills.
- **Claude Code**: copy the folders into `~/.claude/skills/` (all projects) or `.claude/skills/` (one project).

```bash
git clone https://github.com/moathalherani/arabic-creator-kit
cp -r arabic-creator-kit/skills/* ~/.claude/skills/
```

Then ask, in any dialect: «اكتبلي 5 هوكس لفيديو عن السيارات الكهربائية».

## Why

Most creator tools are built for English. Arabic adds right-to-left text mixed with English brand names, Arabic-Indic digits, tashkeel, many dialects, and URLs that tools mangle. This kit packages the fixes we use every day on [moathalherani.com](https://moathalherani.com) and in our Reels, so nobody has to rebuild them.

## Contributing / ساهم

The quickest way to help: **add hooks in your dialect** (Egyptian, Gulf, Syrian, Maghrebi, Fusha). See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and ideas are welcome in Arabic or English.

## License

MIT © [Eng. Moath Alherani (المهندس معاذ الهريني)](https://moathalherani.com) · collab@moathalherani.com
