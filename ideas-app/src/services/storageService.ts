import * as FileSystem from 'expo-file-system';
import { Idea } from '../types';

const IDEAS_FILE = FileSystem.documentDirectory + 'ideas.json';
const SETTINGS_FILE = FileSystem.documentDirectory + 'settings.json';

async function ensureFileExists(path: string, defaultContent: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(path, defaultContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }
}

// IDEAS

export async function loadIdeas(): Promise<Idea[]> {
  await ensureFileExists(IDEAS_FILE, '[]');
  const content = await FileSystem.readAsStringAsync(IDEAS_FILE, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return JSON.parse(content) as Idea[];
}

export async function saveIdeas(ideas: Idea[]): Promise<void> {
  await FileSystem.writeAsStringAsync(IDEAS_FILE, JSON.stringify(ideas, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function getIdeaById(id: string): Promise<Idea | null> {
  const ideas = await loadIdeas();
  return ideas.find((i) => i.id === id) ?? null;
}

export async function addIdea(idea: Idea): Promise<void> {
  const ideas = await loadIdeas();
  ideas.unshift(idea);
  await saveIdeas(ideas);
}

export async function updateIdea(updated: Idea): Promise<void> {
  const ideas = await loadIdeas();
  const idx = ideas.findIndex((i) => i.id === updated.id);
  if (idx !== -1) {
    ideas[idx] = updated;
    await saveIdeas(ideas);
  }
}

export async function deleteIdea(id: string): Promise<void> {
  const ideas = await loadIdeas();
  await saveIdeas(ideas.filter((i) => i.id !== id));
}

export async function searchIdeas(query: string): Promise<Idea[]> {
  const ideas = await loadIdeas();
  const q = query.toLowerCase();
  return ideas.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.tags.some((t) => t.toLowerCase().includes(q))
  );
}

// SETTINGS

export interface AppSettings {
  anthropicApiKey: string;
  notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey: '',
  notificationsEnabled: true,
};

export async function loadSettings(): Promise<AppSettings> {
  await ensureFileExists(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  const content = await FileSystem.readAsStringAsync(SETTINGS_FILE, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return { ...DEFAULT_SETTINGS, ...JSON.parse(content) } as AppSettings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(settings, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}
