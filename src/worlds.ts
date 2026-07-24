export const WORLD_IDS = ['forest', 'workshop', 'word', 'number', 'space', 'music'] as const;

export type WorldId = typeof WORLD_IDS[number];

export interface WorldDefinition {
  id: WorldId;
  name: string;
  subject: string;
}

export const WORLDS: readonly WorldDefinition[] = [
  { id: 'forest', name: 'Forest World', subject: 'Ecosystems and nature' },
  { id: 'workshop', name: 'Workshop World', subject: 'Machines and cause-effect' },
  { id: 'word', name: 'Word World', subject: 'Literacy and language' },
  { id: 'number', name: 'Number World', subject: 'Patterns, counting, and logic' },
  { id: 'space', name: 'Space World', subject: 'Planets, gravity, and science' },
  { id: 'music', name: 'Music World', subject: 'Rhythm and sequencing' },
];

export function isWorldId(value: unknown): value is WorldId {
  return typeof value === 'string' && WORLD_IDS.includes(value as WorldId);
}

export function getWorld(id: WorldId): WorldDefinition {
  return WORLDS.find((world) => world.id === id) ?? WORLDS[0];
}
