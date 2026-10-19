export const shortAddress = (a: string) => `${a.slice(0, 5)}…${a.slice(-4)}`;

export function formatDuration(seconds: number): string {
  if (seconds % 86400 === 0) return `${seconds / 86400} day${seconds === 86400 ? "" : "s"}`;
  if (seconds % 3600 === 0) return `${seconds / 3600} h`;
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  return `${seconds} s`;
}

export const formatTime = (unix: number) => new Date(unix * 1000).toLocaleString();
