import { useCallback, useEffect, useState } from 'react';

export type AsyncState<V> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; value: V };

/** Runs `load` on mount (and when its deps change), with a retry. */
export function useAsync<V>(load: () => Promise<V>, deps: readonly unknown[]): [AsyncState<V>, () => void] {
  const [state, setState] = useState<AsyncState<V>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    load().then(
      (value) => live && setState({ status: 'ready', value }),
      (e) => live && setState({ status: 'error', message: e instanceof Error ? e.message : String(e) }),
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);
  return [state, retry];
}
