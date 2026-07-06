export type SupersetColor = {
  border: string;
  bg: string;
  text: string;
  badge: string;
};

export type SupersetGroup<T> =
  | {
      kind: "single";
      item: T;
      index: number;
    }
  | {
      kind: "superset";
      supersetId: string;
      items: { item: T; index: number }[];
      color: SupersetColor;
    };

const SUPERSET_COLORS: SupersetColor[] = [
  {
    border: "border-sky-500",
    bg: "bg-sky-950/20",
    text: "text-sky-200",
    badge: "border-sky-700 bg-sky-950/70 text-sky-100",
  },
  {
    border: "border-emerald-500",
    bg: "bg-emerald-950/20",
    text: "text-emerald-200",
    badge: "border-emerald-700 bg-emerald-950/70 text-emerald-100",
  },
  {
    border: "border-amber-500",
    bg: "bg-amber-950/20",
    text: "text-amber-200",
    badge: "border-amber-700 bg-amber-950/70 text-amber-100",
  },
  {
    border: "border-fuchsia-500",
    bg: "bg-fuchsia-950/20",
    text: "text-fuchsia-200",
    badge: "border-fuchsia-700 bg-fuchsia-950/70 text-fuchsia-100",
  },
  {
    border: "border-cyan-500",
    bg: "bg-cyan-950/20",
    text: "text-cyan-200",
    badge: "border-cyan-700 bg-cyan-950/70 text-cyan-100",
  },
];

export function getSupersetIds<T extends { supersetId?: string }>(items: T[]) {
  return Array.from(
    new Set(items.map((item) => item.supersetId).filter(Boolean))
  ) as string[];
}

export function getSupersetColor(supersetId: string, supersetIds: string[]) {
  const colorIndex = Math.max(0, supersetIds.indexOf(supersetId));
  return SUPERSET_COLORS[colorIndex % SUPERSET_COLORS.length];
}

export function groupBySuperset<T extends { supersetId?: string }>(
  items: T[]
): SupersetGroup<T>[] {
  const groups: SupersetGroup<T>[] = [];
  const supersetIds = getSupersetIds(items);
  const groupedIndexes = new Set<number>();

  items.forEach((item, index) => {
    if (groupedIndexes.has(index)) return;

    if (!item.supersetId) {
      groups.push({ kind: "single", item, index });
      return;
    }

    const matchingItems = items
      .map((candidate, candidateIndex) => ({ item: candidate, index: candidateIndex }))
      .filter((candidate) => candidate.item.supersetId === item.supersetId);

    matchingItems.forEach((candidate) => groupedIndexes.add(candidate.index));
    groups.push({
      kind: "superset",
      supersetId: item.supersetId,
      items: matchingItems,
      color: getSupersetColor(item.supersetId, supersetIds),
    });
  });

  return groups;
}
