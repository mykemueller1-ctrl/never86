# Hunter UTM links — tracked /audit URLs

Campaign: `100_statement_audit` (matches social pack)

Base: `https://www.never86.ai/audit`

---

## Builder

```
https://www.never86.ai/audit?utm_source=SOURCE&utm_medium=hunter&utm_campaign=100_statement_audit&utm_content=CONTENT_ID
```

| Param | Values |
|---|---|
| `utm_source` | `reddit` · `facebook` · `x` · `tiktok` · `linkedin` |
| `utm_medium` | `hunter` (human-sent reply) · `organic` (Myke post) |
| `utm_campaign` | `100_statement_audit` |
| `utm_content` | `{platform}_{context}_{YYYYMMDD}_{n}` |

---

## Examples

**Reddit r/restaurantowners, lead 1, Aug 25:**
```
https://www.never86.ai/audit?utm_source=reddit&utm_medium=hunter&utm_campaign=100_statement_audit&utm_content=reddit_restaurantowners_20260825_1
```

**Facebook ROMG:**
```
https://www.never86.ai/audit?utm_source=facebook&utm_medium=hunter&utm_campaign=100_statement_audit&utm_content=facebook_romg_20260825_1
```

**X hunter reply:**
```
https://www.never86.ai/audit?utm_source=x&utm_medium=hunter&utm_campaign=100_statement_audit&utm_content=x_hunter_20260825_1
```

**TikTok comment (brand account bio often easier — use same utm_content in bio link):**
```
https://www.never86.ai/audit?utm_source=tiktok&utm_medium=hunter&utm_campaign=100_statement_audit&utm_content=tiktok_comment_20260825_1
```

---

## Brand posts (GTM — not hunter)

Use full table in `docs/launch/100-statement-social-pack.md` for Myke LinkedIn, 515, Community Tap, etc.

---

## Code helper

`src/lib/hunterUtm.ts` → `buildHunterAuditUrl({ source, contentId })`
