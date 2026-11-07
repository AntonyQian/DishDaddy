import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ScanResult } from '@fridge/shared';
import type { CapturedPhoto } from './types';

interface ScanState {
  photos: CapturedPhoto[];
  result: ScanResult | null;
  addPhoto: (photo: CapturedPhoto) => void;
  removePhoto: (uri: string) => void;
  setResult: (result: ScanResult | null) => void;
  /** Starts a new Scan, dropping the old photos. */
  reset: () => void;
}

const ScanContext = createContext<ScanState | null>(null);

/**
 * Holds the current Scan above every screen, so photos survive a failed
 * upload, a retry, or going back to take more.
 */
export function ScanProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);

  const value = useMemo<ScanState>(
    () => ({
      photos,
      result,
      addPhoto: (p) => {
        setPhotos((ps) => [...ps, p]);
        setResult(null);
      },
      removePhoto: (uri) => {
        setPhotos((ps) => ps.filter((p) => p.uri !== uri));
        setResult(null);
      },
      setResult,
      reset: () => {
        setPhotos([]);
        setResult(null);
      },
    }),
    [photos, result],
  );

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScan(): ScanState {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used inside ScanProvider');
  return ctx;
}
