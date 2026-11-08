import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { DEFAULT_GOALS, loadGoals, type Goals } from './goals';

/** The user's goals, re-read whenever the screen comes back into focus (they change them on the Goals tab). */
export function useGoals(): Goals {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  useFocusEffect(
    useCallback(() => {
      loadGoals().then(setGoals);
    }, []),
  );
  return goals;
}
