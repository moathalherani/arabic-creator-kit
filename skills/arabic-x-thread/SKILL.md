---
name: arabic-x-thread
description: Write an Arabic thread for X (Twitter) or Threads from an idea, a video or an article, with a strong first post, one point per post and every post within the character limit. Use when someone asks for a thread, "ثريد", "تغريدات", or to turn content into posts for X or Threads.
---

# Arabic thread

The first post decides everything. Each next post must make sense alone, because people see them out of order.

## Gather

- Topic and the one takeaway.
- Source material (their video transcript, article, notes) and real numbers with sources.
- Platform: X (280 weighted characters per post on free accounts) or Threads (500).
- Dialect or light Fusha.

## Structure (5 to 10 posts)

1. **Post 1**: the hook + a reason to read the thread (a number of points, a result). No link here.
2. **Posts 2 to N-1**: one point each: a claim, then an example or proof. Use line breaks for air.
3. **Last post**: summary in one line + one CTA (follow, reply, or the link to the full video or article).

## Rules

- Check every post's length. If the `arabic-social` package is available: `checkPost(post, "x")` (it counts URLs as 23 and emoji as 2) or `checkPost(post, "threads")`.
- No numbering like "1/" if the creator dislikes it; otherwise keep it consistent.
- English names in English letters; digits 0-9.
- Cite sources for numbers in the post or a reply.
- No dashes or slashes in the first line.
- Avoid more than 1 or 2 hashtags; none is often better on X.

## Output

The posts in order, each with its character count, then 2 alternative first posts.
