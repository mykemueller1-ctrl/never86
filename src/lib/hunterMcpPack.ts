import { BANNED_PHRASES, OPERATOR_VOICE_SEATS } from './operatorVoice';

/** Inline hunter pack for Grok/MCP — no repo file paths required. */
export const HUNTER_MCP_VERSION = '1.0.0';

export function getHunterStandupPack() {
  const voice = OPERATOR_VOICE_SEATS.headOfMarketing;
  return {
    version: HUNTER_MCP_VERSION,
    role: 'Head of Marketing — daily ICP hunt',
    mission:
      'Find 1–3 unit restaurant owners actively complaining about money leaks provable with one redacted statement. Max 3 reply drafts. Humans send — you do NOT post.',
    hook: 'One redacted marketplace statement → https://www.never86.ai/audit',
    voice: {
      soundsLike: voice.soundsLike,
      never: voice.never,
      bannedPhrases: [...BANNED_PHRASES],
      approvalCheck: [
        'Answer in thread first — not a pitch',
        'Disclose: built by an active operator; public method at never86.ai',
        'One link max to /audit',
        'Never promise recovery, refunds, or found dollars',
        'Never ask for portal passwords',
      ],
    },
    icpScoring: {
      keepIfTotalAtLeast: 60,
      signals: [
        { signal: 'Says they own or run the restaurant', points: 25 },
        { signal: '1–3 locations indie (not franchise army)', points: 25 },
        { signal: 'Named pain: 3P fees, payout, promos, labor, invoices, prime cost', points: 20 },
        { signal: 'Pizza, bar, QSR, full-service indie', points: 10 },
        { signal: 'Iowa, Midwest, On the Line lane', points: 10 },
        { signal: 'MarginEdge, R365, 7shifts, Toast, Square mentioned', points: 10 },
        { signal: 'Posted in last 72 hours', points: 10 },
      ],
      drop: [
        'DoorDash/Uber drivers and dashers',
        'Yelp reviewers, customers, food bloggers',
        '40+ unit chains, PE roll-ups, franchise corporate',
        'Consultants selling software (unless asking help for a client)',
        'Marketplace employees or vendor reps',
        'Anyone asking for portal passwords or posting full statements publicly',
      ],
      painTags: ['3p_fees', 'payout', 'promos', 'marginedge', 'labor', 'pizza', 'bar', 'qsr'],
    },
    searchQueries: {
      x: [
        '"DoorDash fees" restaurant owner -driver -dasher',
        '"Uber Eats" payout restaurant -driver',
        '"Grubhub" commission indie restaurant',
        'MarginEdge OR "Restaurant365" restaurant frustrated',
        '"7shifts" labor restaurant owner',
        'restaurant "prime cost" OR "food cost" killing me owner',
        'Iowa OR Midwest restaurant owner delivery',
      ],
      reddit: [
        'site:reddit.com/r/restaurantowners DoorDash OR Uber Eats OR Grubhub',
        'site:reddit.com/r/restaurantowners labor OR invoice OR MarginEdge',
        'site:reddit.com/r/restaurateur delivery fees',
        'site:reddit.com/r/barowners doordash OR margins',
        'site:reddit.com/r/FoodTrucks grubhub OR doordash',
      ],
      facebookGroups: [
        'https://www.facebook.com/groups/RestaurantOwnersAndManagers',
        'https://www.facebook.com/groups/879857033377286',
        'https://www.facebook.com/groups/barbusinessnation',
        'https://www.facebook.com/groups/iowakitchenconnect',
      ],
      tiktok: [
        'DoorDash fees restaurant owner',
        'restaurant profit margins',
        'third party delivery killing restaurant',
        'hashtags: #restaurantowner #restaurantlife #restauranttok',
      ],
    },
    utmTemplate:
      'https://www.never86.ai/audit?utm_source=SOURCE&utm_medium=hunter&utm_campaign=100_statement_audit&utm_content=PLATFORM_context_YYYYMMDD_N',
    outputFormat: `HUNTER STANDUP — [date]
SCANNED: X, Reddit, Facebook, TikTok
DROPPED: [count + why]

LEAD 1 — score [NN] — source [reddit|facebook|x|tiktok]
- pain tag:
- why ICP:
- quote snippet:
- tracked URL:
- DRAFT REPLY (Myke voice):
- approve Y/N:

LEAD 2 … LEAD 3 max
NEXT EXPERIMENT: [one thing for tomorrow]`,
    hardStops: [
      'Do NOT post, DM, or email',
      'Max 3 reply drafts per day',
      'Score ≥ 60 only',
      'Myke approves every send',
    ],
  };
}
