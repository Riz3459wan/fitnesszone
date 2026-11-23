import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../../hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("does not update the debounced value before the delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 300 } },
    );

    rerender({ value: "changed", delay: 300 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("initial");
  });

  it("updates the debounced value after the delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 300 } },
    );

    rerender({ value: "changed", delay: 300 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("changed");
  });

  it("only reflects the latest value when changed multiple times rapidly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    rerender({ value: "c" });
    rerender({ value: "final" });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("final");
  });
});
