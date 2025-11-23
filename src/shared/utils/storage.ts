import type { StorageData } from '@/shared/types';

/**
 * Utility functions for Chrome storage
 */

export const storage = {
  /**
   * Get data from Chrome storage
   */
  async get<K extends keyof StorageData>(
    key: K
  ): Promise<StorageData[K] | undefined> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  },

  /**
   * Set data in Chrome storage
   */
  async set<K extends keyof StorageData>(
    key: K,
    value: StorageData[K]
  ): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },

  /**
   * Remove data from Chrome storage
   */
  async remove(key: keyof StorageData): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, () => {
        resolve();
      });
    });
  },

  /**
   * Clear all data from Chrome storage
   */
  async clear(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  },
};
