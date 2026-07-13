import type { Challenge } from '@/features/challenges/types';

export type ChallengeStoreState = {
  challenges: Challenge[];
};

export const initialChallengeStoreState: ChallengeStoreState = {
  challenges: [],
};
