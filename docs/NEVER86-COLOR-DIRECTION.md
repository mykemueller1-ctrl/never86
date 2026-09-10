# Selected Never86’d color direction

The selected core is charcoal #25262A, warm ivory #F8F6F2 and ember orange #B84322. Slate blue supports information and saved drafts. Amber marks review. Brick red identifies invalid inputs. The visual reference is `/demo/brand`; the operator demo remains `/demo/operator`.

This is a deliberate refinement of the existing warm direction. It uses the same Inter family for headings, controls and tabular prices. It does not introduce a trend driven font or a new dependency. Primary actions remain orange, while signed price changes have distinct review or information treatments. Words and numbers carry the meaning alongside the color.

The input outline was strengthened from #C9C3BA to #8B8177: contrast against white moves from 1.75:1 to 3.82:1. Light and dark surfaces have separate keyboard focus colors. Input errors now use red text, a red border and correction wording. Static decorative panel dividers can remain quiet.

## Research and judgment

[Adobe’s 2026 design outlook](https://www.adobe.com/express/learn/blog/design-trends-2026) includes a warm, personal visual direction and local character. That supports the chosen tone, but it does not prove that a specific hue will convert restaurant operators.

[Nielsen Norman Group’s visual hierarchy guidance](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) supports a small palette with differences in contrast, size and grouping that guide attention. [Carbon’s color overview](https://carbondesignsystem.com/elements/color/overview/) provides a useful model for named color roles and interaction states. We applied those principles to the existing Never86 colors rather than copying another brand’s palette.

[W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) informed the checks: normal text pairings target at least 4.5:1; necessary control boundaries and focus indicators target at least 3:1 against adjacent colors. Exact calculations are compared before rounding. This is a focused contrast check, not full WCAG certification.

## Verified token pairings

See `marketing/never86-brand-colors.json` for the tokens, use rules, source links and ten computed contrast checks. Main text on ivory is 14.00:1; white text on the primary orange is 5.43:1; review text on pale amber is 5.88:1. The brand reference includes examples for marketing and the operator desk.

Ten minute activation and conversion still require observed operator tests. Color is one part of that work.

Voice review: direct wording and a concrete price example replace abstract design promises.
Voice review: unsupported claims of universally best colors or guaranteed conversion are omitted.
