export type ChallengeType = 'numeric' | 'daily' | 'project';

export type ChallengeStatus = 'active' | 'completed' | 'archived';

export type Challenge = {
  id: string;
  type: ChallengeType;
  title: string;
  description?: string;
  startDate: string;
  durationDays: number;
  endDate: string;
  status: ChallengeStatus;
  createdAt: string;
  updatedAt: string;
};

export type NumericChallengeData = {
  id: string;
  challengeId: string;
  targetValue: number;
  unit: string;
};

export type NumericProgressEntry = {
  id: string;
  challengeId: string;
  date: string;
  value: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyChallengeData = {
  id: string;
  challengeId: string;
  dailyActionText: string;
};

export type DailyProgressStatus = 'completed' | 'missed' | 'empty';

export type DailyProgressEntry = {
  id: string;
  challengeId: string;
  date: string;
  status: DailyProgressStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectNodeType = 'stage' | 'step';

export type ProjectNode = {
  id: string;
  challengeId: string;
  parentId?: string | null;
  title: string;
  description?: string;
  nodeType: ProjectNodeType;
  isCompleted: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};
