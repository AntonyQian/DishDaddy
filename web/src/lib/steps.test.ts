import { describe, expect, it } from 'vitest';
import { minutesIn } from './steps';

describe('minutesIn', () => {
  it('reads a time in minutes', () => {
    expect(minutesIn('Bake for 35 min until golden.')).toBe(35);
    expect(minutesIn('Simmer 10 minutes.')).toBe(10);
  });
  it('takes the longer end of a range', () => {
    expect(minutesIn('Cook 20-25 min.')).toBe(25);
  });
  it('adds hours and minutes', () => {
    expect(minutesIn('Rest for 1 hr 30 min.')).toBe(90);
    expect(minutesIn('Chill for 2 hours.')).toBe(120);
  });
  it('is null when there is no time', () => {
    expect(minutesIn('Whisk the eggs.')).toBeNull();
  });
});
