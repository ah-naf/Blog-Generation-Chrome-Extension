import type { Message } from '@/shared/types';

/**
 * Utility functions for Chrome messaging
 */

export const messaging = {
  /**
   * Send message to background script
   */
  async sendToBackground<T = unknown>(message: Message): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  },

  /**
   * Send message to content script in active tab
   */
  async sendToContentScript<T = unknown>(message: Message): Promise<T> {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.id) {
      throw new Error('No active tab found');
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id!, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  },

  /**
   * Send message to specific tab
   */
  async sendToTab<T = unknown>(tabId: number, message: Message): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  },
};
