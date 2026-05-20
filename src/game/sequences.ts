export type SequenceFamily =
  | "arithmetic"
  | "geometric"
  | "polynomial"
  | "recursive"
  | "combinatorial"
  | "prime-related";

export interface MathSequence {
  id: string;
  terms: number[];
  family: SequenceFamily;
  name: string;
  difficulty: 1 | 2 | 3;
  funFact?: string;
  oeis?: string;
}

export const FAMILY_LABELS: Record<SequenceFamily, string> = {
  arithmetic: "Arithmetic",
  geometric: "Geometric",
  polynomial: "Polynomial",
  recursive: "Recursive",
  combinatorial: "Combinatorial",
  "prime-related": "Prime-Related",
};

export const TIER_INFO = {
  1: {
    label: "Easy",
    description: "Arithmetic, squares, simple patterns",
    icon: "~",
  },
  2: {
    label: "Medium",
    description: "Factorials, Catalan, polynomial growth",
    icon: "^",
  },
  3: {
    label: "Hard",
    description: "Recaman, partitions, Collatz",
    icon: "!",
  },
} as const;
