/**
 * F1 Archive — Safe Storage Utility
 * Wraps localStorage with try/catch guards to prevent crashes in
 * Safari private browsing mode, disabled storage contexts, and quota limits.
 */

class SafeStorage implements Storage {
  private memoryFallback: Map<string, string> = new Map();

  private isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__f1_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  get length(): number {
    try {
      if (this.isAvailable()) {
        return window.localStorage.length;
      }
    } catch {
      // Fall through
    }
    return this.memoryFallback.size;
  }

  clear(): void {
    try {
      if (this.isAvailable()) {
        window.localStorage.clear();
      }
    } catch {
      // Fall through
    }
    this.memoryFallback.clear();
  }

  getItem(key: string): string | null {
    try {
      if (this.isAvailable()) {
        const value = window.localStorage.getItem(key);
        if (value !== null) return value;
      }
    } catch {
      // Fall through to memory fallback
    }
    return this.memoryFallback.get(key) ?? null;
  }

  key(index: number): string | null {
    try {
      if (this.isAvailable()) {
        return window.localStorage.key(index);
      }
    } catch {
      // Fall through
    }
    const keys = Array.from(this.memoryFallback.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    try {
      if (this.isAvailable()) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Fall through
    }
    this.memoryFallback.delete(key);
  }

  setItem(key: string, value: string): void {
    try {
      if (this.isAvailable()) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (err) {
      console.warn(`[SafeStorage] localStorage.setItem failed for key "${key}", falling back to memory:`, err);
    }
    this.memoryFallback.set(key, value);
  }
}

export const safeStorage = new SafeStorage();
