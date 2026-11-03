# arabic-creator-mcp

An [MCP](https://modelcontextprotocol.io) server that gives Claude Desktop, Claude Code, Cursor and other MCP clients the [Arabic Creator Kit](https://github.com/moathalherani/arabic-creator-kit) tools.

Ask *«صمملي ريل عن أخطاء الهوك»* and you get back a link that opens the free [Motion Studio](https://moathalherani.github.io/arabic-creator-kit/motion/) with the scenes, text and style ready. Add your video and SRT captions there, and download an MP4.

## Tools

| Tool | What it does |
| --- | --- |
| `design_reel` | Designs a reel as motion-graphics scenes from 18 templates, and returns a Motion Studio link |
| `score_hook` | Scores the first line of a video out of 100, with tips |
| `find_hooks` | Proven hooks by category and dialect (Jordanian, Egyptian, Gulf, Syrian, Maghrebi, MSA) |
| `keyword_captions` | SRT or VTT → short keyword captions for Reels, as SRT with the keyword to color |
| `amount_in_words` | A money amount in Arabic words for invoices and cheques (AED, SAR, JOD, EGP…) |
| `check_post` | Length, hashtag and mention limits, hidden characters and the "…more" preview per platform |

## Add it

**Claude Desktop:** open Settings → Developer → Edit Config, and add:

```json
{
  "mcpServers": {
    "arabic-creator-kit": { "command": "npx", "args": ["-y", "arabic-creator-mcp"] }
  }
}
```

Restart Claude Desktop. The tools show up under the tools icon in a new chat.

**Claude Code:**

```sh
claude mcp add arabic-creator-kit -- npx -y arabic-creator-mcp
```

**Cursor, VS Code and other clients:** use the same command, `npx -y arabic-creator-mcp`, as a stdio server.

The server needs Node 18 or newer, runs on your machine, and sends nothing anywhere. The Motion Studio link carries the design in the URL itself.

## Use it from code

```js
import { designLink } from "arabic-creator-mcp";

const { url } = designLink({
  scenes: [
    { template: "hook", text: "3 ثواني بتقرر إذا الناس بتكمل", keyword: "3" },
    { template: "follow" },
  ],
  style: { background: "grid-dark", accent: "#C6F432" },
});
```

MIT © Eng. Moath Alherani
