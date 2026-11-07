import { describe, expect, it } from 'vitest';
import type { ScanResult } from '@fridge/shared';
import { createApp } from './app';
import type { Photo } from './detection/types';

const RESULT: ScanResult = {
  detections: [{ ingredient: 'egg', label: 'eggs', confidence: 0.9, box: [0, 0, 10, 10], photoIndex: 0, alternatives: [] }],
};

function form(...files: File[]) {
  const body = new FormData();
  for (const f of files) body.append('photos', f);
  return body;
}
const jpeg = (name: string, text = name) => new File([text], name, { type: 'image/jpeg' });

describe('POST /scan', () => {
  it('passes every photo, in order, to detection and returns its ScanResult', async () => {
    let received: Photo[] = [];
    const app = createApp({
      detectIngredients: async (photos) => {
        received = photos;
        return RESULT;
      },
    });
    const res = await app.request('/scan', { method: 'POST', body: form(jpeg('a.jpg', 'AAA'), jpeg('b.jpg', 'BB')) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(RESULT);
    expect(received.map((p) => [new TextDecoder().decode(p.bytes), p.mimeType])).toEqual([
      ['AAA', 'image/jpeg'],
      ['BB', 'image/jpeg'],
    ]);
  });

  it('rejects a Scan with no photos', async () => {
    const app = createApp({ detectIngredients: async () => RESULT });
    const res = await app.request('/scan', { method: 'POST', body: new FormData() });
    expect(res.status).toBe(400);
  });

  it('rejects files that are not images', async () => {
    const app = createApp({ detectIngredients: async () => RESULT });
    const res = await app.request('/scan', {
      method: 'POST',
      body: form(new File(['x'], 'notes.txt', { type: 'text/plain' })),
    });
    expect(res.status).toBe(400);
  });

  it('reports a detection failure as 502 so the app can offer a retry', async () => {
    const app = createApp({
      detectIngredients: async () => {
        throw new Error('quota');
      },
    });
    const res = await app.request('/scan', { method: 'POST', body: form(jpeg('a.jpg')) });
    expect(res.status).toBe(502);
    expect(await res.json()).toHaveProperty('error');
  });

  it('reports 503 when detection is not configured', async () => {
    const res = await createApp({}).request('/scan', { method: 'POST', body: form(jpeg('a.jpg')) });
    expect(res.status).toBe(503);
  });
});
