import { create } from 'zustand';

import type {
  Challenge,
  ChallengeStatus,
  ChallengeType,
  DailyChallengeData,
  DailyProgressEntry,
  DailyProgressStatus,
  NumericChallengeData,
  NumericProgressEntry,
  ProjectNode,
} from '@/features/challenges/types';
import { toDateKey } from '@/utils/dates';

type BaseChallengeInput = {
  type: ChallengeType;
  title: string;
  description?: string;
  durationDays: number;
};

export type AddChallengeInput =
  | (BaseChallengeInput & {
      type: 'numeric';
      targetValue: number;
      unit: string;
    })
  | (BaseChallengeInput & {
      type: 'daily';
      dailyActionText: string;
    })
  | (BaseChallengeInput & {
      type: 'project';
    });

export type ChallengeStoreState = {
  challenges: Challenge[];
  numericDataByChallengeId: Record<string, NumericChallengeData>;
  numericEntriesByChallengeId: Record<string, NumericProgressEntry[]>;
  dailyDataByChallengeId: Record<string, DailyChallengeData>;
  dailyEntriesByChallengeId: Record<string, DailyProgressEntry[]>;
  projectNodesByChallengeId: Record<string, ProjectNode[]>;
  addChallenge: (input: AddChallengeInput) => Challenge;
  getChallengeById: (id: string) => Challenge | undefined;
  updateChallenge: (id: string, updates: Partial<Omit<Challenge, 'id'>>) => void;
  deleteChallenge: (id: string) => void;
  addNumericProgress: (challengeId: string, value: number) => void;
  markDailyDay: (challengeId: string, date: string, status: DailyProgressStatus) => void;
  addProjectStage: (challengeId: string, title: string) => void;
  addProjectStep: (challengeId: string, stageId: string, title: string) => void;
  toggleProjectStep: (challengeId: string, nodeId: string) => void;
};

const today = toDateKey(new Date());
const now = new Date().toISOString();

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

function createChallengeBase(
  id: string,
  type: ChallengeType,
  title: string,
  description: string | undefined,
  durationDays: number,
  status: ChallengeStatus = 'active',
): Challenge {
  return {
    id,
    type,
    title,
    description,
    startDate: today,
    durationDays,
    endDate: addDays(today, Math.max(durationDays - 1, 0)),
    status,
    createdAt: now,
    updatedAt: now,
  };
}

const demoNumericId = 'demo-numeric';
const demoDailyId = 'demo-daily';
const demoProjectId = 'demo-project';
const demoStagePlanningId = 'demo-stage-planning';
const demoStageInterfaceId = 'demo-stage-interface';

const initialChallenges: Challenge[] = [
  createChallengeBase(demoNumericId, 'numeric', '1000 отжиманий', 'Набрать общий объем за месяц.', 30),
  createChallengeBase(
    demoDailyId,
    'daily',
    'Читать каждый день',
    'Поддерживать ежедневную привычку чтения.',
    14,
  ),
  createChallengeBase(
    demoProjectId,
    'project',
    'Создать приложение',
    'Разбить большой проект на этапы и шаги.',
    30,
  ),
];

const initialNumericData: Record<string, NumericChallengeData> = {
  [demoNumericId]: {
    id: 'demo-numeric-data',
    challengeId: demoNumericId,
    targetValue: 1000,
    unit: 'отжиманий',
  },
};

const initialNumericEntries: Record<string, NumericProgressEntry[]> = {
  [demoNumericId]: [
    {
      id: 'demo-numeric-entry-1',
      challengeId: demoNumericId,
      date: today,
      value: 120,
      createdAt: now,
      updatedAt: now,
    },
  ],
};

const initialDailyData: Record<string, DailyChallengeData> = {
  [demoDailyId]: {
    id: 'demo-daily-data',
    challengeId: demoDailyId,
    dailyActionText: 'Прочитать хотя бы 5 страниц',
  },
};

const initialDailyEntries: Record<string, DailyProgressEntry[]> = {
  [demoDailyId]: [
    {
      id: 'demo-daily-entry-1',
      challengeId: demoDailyId,
      date: today,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    },
  ],
};

const initialProjectNodes: Record<string, ProjectNode[]> = {
  [demoProjectId]: [
    {
      id: demoStagePlanningId,
      challengeId: demoProjectId,
      parentId: null,
      title: 'Продумать продукт',
      nodeType: 'stage',
      isCompleted: false,
      orderIndex: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-step-prd',
      challengeId: demoProjectId,
      parentId: demoStagePlanningId,
      title: 'Написать PRD',
      nodeType: 'step',
      isCompleted: true,
      orderIndex: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-step-scope',
      challengeId: demoProjectId,
      parentId: demoStagePlanningId,
      title: 'Определить MVP',
      nodeType: 'step',
      isCompleted: false,
      orderIndex: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: demoStageInterfaceId,
      challengeId: demoProjectId,
      parentId: null,
      title: 'Собрать интерфейс',
      nodeType: 'stage',
      isCompleted: false,
      orderIndex: 1,
      createdAt: now,
      updatedAt: now,
    },
  ],
};

export const useChallengeStore = create<ChallengeStoreState>((set, get) => ({
  challenges: initialChallenges,
  numericDataByChallengeId: initialNumericData,
  numericEntriesByChallengeId: initialNumericEntries,
  dailyDataByChallengeId: initialDailyData,
  dailyEntriesByChallengeId: initialDailyEntries,
  projectNodesByChallengeId: initialProjectNodes,

  addChallenge: (input) => {
    const id = createId(input.type);
    const timestamp = new Date().toISOString();
    const challenge = {
      ...createChallengeBase(
        id,
        input.type,
        input.title,
        input.description,
        input.durationDays,
      ),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    set((state) => {
      const nextState: Partial<ChallengeStoreState> = {
        challenges: [challenge, ...state.challenges],
      };

      if (input.type === 'numeric') {
        nextState.numericDataByChallengeId = {
          ...state.numericDataByChallengeId,
          [id]: {
            id: createId('numeric-data'),
            challengeId: id,
            targetValue: input.targetValue,
            unit: input.unit,
          },
        };
        nextState.numericEntriesByChallengeId = {
          ...state.numericEntriesByChallengeId,
          [id]: [],
        };
      }

      if (input.type === 'daily') {
        nextState.dailyDataByChallengeId = {
          ...state.dailyDataByChallengeId,
          [id]: {
            id: createId('daily-data'),
            challengeId: id,
            dailyActionText: input.dailyActionText,
          },
        };
        nextState.dailyEntriesByChallengeId = {
          ...state.dailyEntriesByChallengeId,
          [id]: [],
        };
      }

      if (input.type === 'project') {
        nextState.projectNodesByChallengeId = {
          ...state.projectNodesByChallengeId,
          [id]: [],
        };
      }

      return nextState;
    });

    return challenge;
  },

  getChallengeById: (id) => get().challenges.find((challenge) => challenge.id === id),

  updateChallenge: (id, updates) => {
    set((state) => ({
      challenges: state.challenges.map((challenge) =>
        challenge.id === id
          ? { ...challenge, ...updates, updatedAt: new Date().toISOString() }
          : challenge,
      ),
    }));
  },

  deleteChallenge: (id) => {
    set((state) => {
      const { [id]: _numericData, ...numericDataByChallengeId } = state.numericDataByChallengeId;
      const { [id]: _numericEntries, ...numericEntriesByChallengeId } =
        state.numericEntriesByChallengeId;
      const { [id]: _dailyData, ...dailyDataByChallengeId } = state.dailyDataByChallengeId;
      const { [id]: _dailyEntries, ...dailyEntriesByChallengeId } = state.dailyEntriesByChallengeId;
      const { [id]: _projectNodes, ...projectNodesByChallengeId } = state.projectNodesByChallengeId;

      return {
        challenges: state.challenges.filter((challenge) => challenge.id !== id),
        numericDataByChallengeId,
        numericEntriesByChallengeId,
        dailyDataByChallengeId,
        dailyEntriesByChallengeId,
        projectNodesByChallengeId,
      };
    });
  },

  addNumericProgress: (challengeId, value) => {
    const timestamp = new Date().toISOString();
    const entry: NumericProgressEntry = {
      id: createId('numeric-entry'),
      challengeId,
      date: toDateKey(new Date()),
      value,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    set((state) => ({
      numericEntriesByChallengeId: {
        ...state.numericEntriesByChallengeId,
        [challengeId]: [...(state.numericEntriesByChallengeId[challengeId] ?? []), entry],
      },
    }));
  },

  markDailyDay: (challengeId, date, status) => {
    const timestamp = new Date().toISOString();

    set((state) => {
      const entries = state.dailyEntriesByChallengeId[challengeId] ?? [];
      const existingEntry = entries.find((entry) => entry.date === date);
      const nextEntries = existingEntry
        ? entries.map((entry) =>
            entry.date === date ? { ...entry, status, updatedAt: timestamp } : entry,
          )
        : [
            ...entries,
            {
              id: createId('daily-entry'),
              challengeId,
              date,
              status,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ];

      return {
        dailyEntriesByChallengeId: {
          ...state.dailyEntriesByChallengeId,
          [challengeId]: nextEntries,
        },
      };
    });
  },

  addProjectStage: (challengeId, title) => {
    const timestamp = new Date().toISOString();

    set((state) => {
      const nodes = state.projectNodesByChallengeId[challengeId] ?? [];
      const stage: ProjectNode = {
        id: createId('stage'),
        challengeId,
        parentId: null,
        title,
        nodeType: 'stage',
        isCompleted: false,
        orderIndex: nodes.filter((node) => node.parentId === null).length,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      return {
        projectNodesByChallengeId: {
          ...state.projectNodesByChallengeId,
          [challengeId]: [...nodes, stage],
        },
      };
    });
  },

  addProjectStep: (challengeId, stageId, title) => {
    const timestamp = new Date().toISOString();

    set((state) => {
      const nodes = state.projectNodesByChallengeId[challengeId] ?? [];
      const step: ProjectNode = {
        id: createId('step'),
        challengeId,
        parentId: stageId,
        title,
        nodeType: 'step',
        isCompleted: false,
        orderIndex: nodes.filter((node) => node.parentId === stageId).length,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      return {
        projectNodesByChallengeId: {
          ...state.projectNodesByChallengeId,
          [challengeId]: [...nodes, step],
        },
      };
    });
  },

  toggleProjectStep: (challengeId, nodeId) => {
    set((state) => ({
      projectNodesByChallengeId: {
        ...state.projectNodesByChallengeId,
        [challengeId]: (state.projectNodesByChallengeId[challengeId] ?? []).map((node) =>
          node.id === nodeId && node.nodeType === 'step'
            ? { ...node, isCompleted: !node.isCompleted, updatedAt: new Date().toISOString() }
            : node,
        ),
      },
    }));
  },
}));
