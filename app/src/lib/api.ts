import type { HealthResponse } from '@fridge/shared';
import { SERVER_URL } from './config';

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${SERVER_URL}/health`);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}
