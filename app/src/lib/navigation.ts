import { router, type Href } from 'expo-router';

/**
 * Back, unless there is nothing to go back to. A screen opened straight from a link or after a reload
 * has no screen behind it, and a plain `router.back()` there only logs "GO_BACK was not handled".
 */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
