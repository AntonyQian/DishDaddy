import { beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ canGoBack: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock('expo-router', () => ({ router }));

import { goBack } from './navigation';

beforeEach(() => vi.clearAllMocks());

describe('goBack', () => {
  it('goes back when there is a screen behind this one', () => {
    router.canGoBack.mockReturnValue(true);
    goBack();
    expect(router.back).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('opens the Kitchen instead when this screen was opened directly, so there is nothing to go back to', () => {
    router.canGoBack.mockReturnValue(false);
    goBack();
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('can fall back to a different screen', () => {
    router.canGoBack.mockReturnValue(false);
    goBack('/recipes');
    expect(router.replace).toHaveBeenCalledWith('/recipes');
  });
});
