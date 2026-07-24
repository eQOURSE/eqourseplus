import { describe, expect, it, vi } from "vitest";

import {
  THEME_STORAGE_KEY,
  persistTheme,
  resolveTheme,
} from "../src/theme/resolution";

describe("FR-PUB-00 theme resolution", () => {
  it("defaults to light during SSR even when a dark system preference is supplied", () => {
    expect(
      resolveTheme({
        isServer: true,
        storedTheme: null,
        systemPrefersDark: true,
      }),
    ).toBe("light");
  });

  it("uses the system preference when there is no persisted override", () => {
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: null,
        systemPrefersDark: true,
      }),
    ).toBe("dark");
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: null,
        systemPrefersDark: false,
      }),
    ).toBe("light");
  });

  it("gives a valid persisted override precedence over the system preference", () => {
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: "light",
        systemPrefersDark: true,
      }),
    ).toBe("light");
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: "dark",
        systemPrefersDark: false,
      }),
    ).toBe("dark");
  });

  it("ignores invalid stored values", () => {
    expect(
      resolveTheme({
        isServer: false,
        storedTheme: "sepia",
        systemPrefersDark: true,
      }),
    ).toBe("dark");
  });

  it("persists an explicit user theme under the stable storage key", () => {
    const storage = { setItem: vi.fn() };

    persistTheme(storage, "dark");

    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "dark");
  });
});
