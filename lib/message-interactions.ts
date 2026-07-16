export type ReactionSummary = {
  reaction: string;
  count: number;
  reactedByUser?: boolean;
};

export function buildReactionSummary(
  reactions: Array<{
    reaction: string;
    count?: number;
    reactedByUser?: boolean;
    userId?: string;
  }> | undefined,
  currentUserId?: string,
): ReactionSummary[] {
  const aggregated = new Map<string, ReactionSummary>();

  for (const reaction of reactions ?? []) {
    const existing = aggregated.get(reaction.reaction);
    const count = typeof reaction.count === "number" ? reaction.count : 1;
    const reactedByUser =
      reaction.reactedByUser ??
      (currentUserId ? reaction.userId === currentUserId : false);

    if (count <= 0) continue;

    if (existing) {
      existing.count += count;
      existing.reactedByUser = existing.reactedByUser || reactedByUser;
    } else {
      aggregated.set(reaction.reaction, {
        reaction: reaction.reaction,
        count,
        reactedByUser,
      });
    }
  }

  return Array.from(aggregated.values());
}
