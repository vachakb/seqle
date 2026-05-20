const EPOCH = new Date("2025-01-01T00:00:00Z").getTime();
const MS_PER_DAY = 86400000;

function getDayNumber(): number {
  return Math.floor((Date.now() - EPOCH) / MS_PER_DAY);
}

export function getTimeUntilNextPuzzle(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const currentDay = getDayNumber();
  const nextDayStart = EPOCH + (currentDay + 1) * MS_PER_DAY;
  const diff = Math.max(0, nextDayStart - Date.now());

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}
