export interface Alert {
  id: string;
  enabled: boolean;
  scheduledDate: string; // ISO 8601
  message: string;
  stopped: boolean;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  implemented: boolean;
  alerts: Alert[];
  aiInsights?: string;
  insightsGeneratedAt?: string;
}

export type RootStackParamList = {
  Home: undefined;
  AddIdea: undefined;
  EditIdea: { ideaId: string };
  IdeaDetail: { ideaId: string };
  AlertSettings: { ideaId: string };
  Settings: undefined;
};
