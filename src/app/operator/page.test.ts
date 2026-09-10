import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ operatorId: 1000042 }));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(), cache: (fn: unknown) => fn }));
vi.mock('@/lib/readOperatorSession', () => ({ readOperatorSession: async () => ({ email: 'manager@example.com', operatorId: state.operatorId }) }));
vi.mock('@/lib/personAuth', () => ({ listAccessibleSeats: async () => [
  { operatorId: 1000000, restaurantName: 'Community Tap' },
  { operatorId: 1000042, restaurantName: 'New American Grill' },
] }));
vi.mock('@/components/FreeOperatorPhone', () => ({ SimpleOwnerDemo: () => null }));
vi.mock('@/components/OperatorStoreSwitcher', () => ({ default: () => null }));
import { generateMetadata } from './page';

describe('selected restaurant identity for a shared manager email', () => {
  beforeEach(() => { state.operatorId = 1000042; });
  it('uses Max’s selected membership even when the same email can open Community', async () => {
    expect((await generateMetadata()).title).toBe("New American Grill | Never 86'd");
  });
  it('uses Community only when its operator is selected', async () => {
    state.operatorId = 1000000;
    expect((await generateMetadata()).title).toBe("Community Tap | Never 86'd");
  });
  it('does not fall back to another restaurant for an unknown membership', async () => {
    state.operatorId = 1000999;
    expect((await generateMetadata()).title).toBe("Owner seat | Never 86'd");
  });
});
