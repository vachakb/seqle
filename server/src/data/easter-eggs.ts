import type { MathSequence } from "../types.js";

export function generateGhostNumber(sequence: MathSequence, targetIndex: number): number | null {
  const actual = sequence.terms[targetIndex];
  if (actual === undefined) return null;
  const offset = Math.max(1, Math.floor(Math.abs(actual) * 0.15) + 1);
  const direction = Math.random() > 0.5 ? 1 : -1;
  const ghost = actual + direction * offset;
  return ghost === actual ? actual + 1 : ghost;
}

export function isSpecialDate(): MathSequence | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 3 && day === 14) {
    return {
      id: "special-pi",
      terms: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3],
      family: "arithmetic",
      name: "Digits of Pi",
      difficulty: 2,
      funFact: "Happy Pi Day! Pi has been computed to over 100 trillion digits.",
    };
  }

  if (month === 11 && day === 23) {
    return {
      id: "special-fib",
      terms: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55],
      family: "recursive",
      name: "Fibonacci Numbers (Nov 23)",
      difficulty: 1,
      funFact: "Happy Fibonacci Day! November 23 (11/23) starts the Fibonacci sequence.",
    };
  }

  return null;
}
