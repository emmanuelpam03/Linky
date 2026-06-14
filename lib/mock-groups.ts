import type { Group } from "@/types";

export const mockGroups: Group[] = [
  {
    id: "cs-project-team",
    name: "CS Project Team",
    lastMessage: "Lina: pushed the new build",
    timestamp: "Mon",
    icon: "code",
  },
  {
    id: "campus-band",
    name: "Campus Band",
    lastMessage: "Rehearsal moved to 6pm",
    timestamp: "Fri",
    icon: "music",
  },
  {
    id: "roomies",
    name: "Roomies",
    lastMessage: "Who's buying groceries?",
    timestamp: "Sun",
    icon: "home",
  },
];

export function getGroupById(id: string): Group | undefined {
  return mockGroups.find((g) => g.id === id);
}
