/// <reference types="jest" />

import { useChallengeStore } from '@/stores/challengeStore';

describe('challenge store numeric history', () => {
  it('updates numeric status when progress reaches target and returns to active after deletion', () => {
    const challenge = useChallengeStore.getState().addChallenge({
      type: 'numeric',
      title: 'Тестовый числовой челлендж',
      durationDays: 10,
      targetValue: 100,
      unit: 'раз',
    });

    useChallengeStore.getState().addNumericProgress(challenge.id, 120);

    expect(
      useChallengeStore.getState().challenges.find((item) => item.id === challenge.id)?.status,
    ).toBe('completed');

    const entryId = useChallengeStore.getState().numericEntriesByChallengeId[challenge.id][0].id;
    useChallengeStore.getState().deleteNumericProgressEntry(challenge.id, entryId);

    expect(
      useChallengeStore.getState().challenges.find((item) => item.id === challenge.id)?.status,
    ).toBe('active');
  });
});
