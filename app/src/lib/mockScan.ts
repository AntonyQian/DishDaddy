import type { Detection, ScanResult } from '@fridge/shared';

const MOCK: Omit<Detection, 'photoIndex'>[] = [
  { ingredient: 'milk', label: 'carton of milk', confidence: 0.95, box: [80, 60, 420, 260], alternatives: [] },
  { ingredient: 'egg', label: 'box of eggs', confidence: 0.92, box: [500, 100, 640, 480], alternatives: [] },
  { ingredient: 'leek', label: 'green stalks', confidence: 0.55, box: [650, 520, 900, 950], alternatives: ['spring onion'] },
  { ingredient: 'greek yogurt', label: 'white tub', confidence: 0.62, box: [300, 600, 480, 820], alternatives: ['yogurt'] },
  { ingredient: null, label: 'opaque tupperware', confidence: 0.3, box: [100, 550, 280, 900], alternatives: [] },
  { ingredient: 'ketchup', label: 'red squeeze bottle', confidence: 0.88, box: [150, 300, 450, 420], alternatives: [], visibleText: 'Tomato Ketchup' },
];

/** A canned ScanResult spread over the photos taken, after a realistic delay. */
export async function mockScanResult(photoCount: number): Promise<ScanResult> {
  await new Promise((r) => setTimeout(r, 2500));
  return { detections: MOCK.map((d, i) => ({ ...d, photoIndex: i % Math.max(1, photoCount) })) };
}
