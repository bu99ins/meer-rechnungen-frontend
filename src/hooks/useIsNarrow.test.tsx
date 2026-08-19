import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useIsNarrow } from './useIsNarrow';
import { setViewportWidth } from '../test-setup';

describe('useIsNarrow', () => {
  it('is false at the default (wide) test viewport', () => {
    const { result } = renderHook(() => useIsNarrow());
    expect(result.current).toBe(false);
  });

  it('flips to true once the width drops to or below the breakpoint', () => {
    const { result } = renderHook(() => useIsNarrow());
    act(() => setViewportWidth(375));
    expect(result.current).toBe(true);
  });

  it('flips back to false once the width returns above the breakpoint', () => {
    const { result } = renderHook(() => useIsNarrow());
    act(() => setViewportWidth(375));
    act(() => setViewportWidth(1280));
    expect(result.current).toBe(false);
  });
});
