export function parseTime(time: string): number {
  const match = time.match(/(\d+):(\d+)/);
  if (!match) return 360;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (time.includes("PM") && h < 12) h += 12;
  if (time.includes("AM") && h === 12) h = 0;
  return h * 60 + m;
}

export function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function skyPhaseForTime(totalMinutes: number): number {
  return Math.min(1, Math.max(0, (totalMinutes - 360) / 180));
}
