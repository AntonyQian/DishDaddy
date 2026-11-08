/** The longest time a step mentions, in minutes: "Bake 20-25 min" is 25, "1 hr 30 min" is 90. Null when it names no time. */
export function minutesIn(step: string): number | null {
  let total = 0;
  const hours = /(\d+(?:\.\d+)?)\s*(?:hr|hrs|hour|hours)\b/i.exec(step);
  if (hours) total += Number(hours[1]) * 60;
  const mins = /(?:\d+\s*[-–]\s*)?(\d+)\s*(?:min|mins|minute|minutes)\b/i.exec(step);
  if (mins) total += Number(mins[1]);
  return total > 0 ? Math.round(total) : null;
}
