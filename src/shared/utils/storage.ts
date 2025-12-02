import type { StorageData, SourceContent, GenerationState } from '@/shared/types';

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

/**
 * Source management utilities
 */
export const sourceStorage = {
  /**
   * Get all sources
   */
  async getAll(): Promise<SourceContent[]> {
    const sources = await storage.get('sources');
    return sources || [];
  },

  /**
   * Add a new source
   */
  async add(source: SourceContent): Promise<void> {
    const sources = await this.getAll();
    sources.unshift(source); // Add to beginning
    await storage.set('sources', sources);
  },

  /**
   * Remove a source by ID
   */
  async remove(id: string): Promise<void> {
    const sources = await this.getAll();
    const filtered = sources.filter((s) => s.id !== id);
    await storage.set('sources', filtered);
  },

  /**
   * Get a single source by ID
   */
  async getById(id: string): Promise<SourceContent | undefined> {
    const sources = await this.getAll();
    return sources.find((s) => s.id === id);
  },

  /**
   * Clear all sources
   */
  async clear(): Promise<void> {
    await storage.set('sources', []);
  },

  /**
   * Update a source by ID
   */
  async update(id: string, updates: Partial<SourceContent>): Promise<void> {
    const sources = await this.getAll();
    const index = sources.findIndex((s) => s.id === id);
    if (index !== -1) {
      sources[index] = { ...sources[index], ...updates };
      await storage.set('sources', sources);
    }
  },

  /**
   * Refine a source's content (stores original and updates with refined)
   */
  async refine(id: string, refinedContent: string): Promise<void> {
    const sources = await this.getAll();
    const index = sources.findIndex((s) => s.id === id);
    if (index !== -1) {
      const source = sources[index];
      // Store original content if not already stored
      if (!source.originalContent) {
        source.originalContent = source.content;
      }
      // Cache the refined content for future use
      source.refinedContent = refinedContent;
      // Update current content with refined version
      source.content = refinedContent;
      source.isRefined = true;
      source.refinedAt = new Date().toISOString();
      await storage.set('sources', sources);
    }
  },

  /**
   * Undo refinement (restore original content)
   */
  async undoRefinement(id: string): Promise<void> {
    const sources = await this.getAll();
    const index = sources.findIndex((s) => s.id === id);
    if (index !== -1) {
      const source = sources[index];
      if (source.originalContent) {
        source.content = source.originalContent;
        source.isRefined = false;
        source.refinedAt = undefined;
        // Keep both originalContent and refinedContent cached
        // This allows re-refinement without API call
        await storage.set('sources', sources);
      }
    }
  },
};

/**
 * Generation state management utilities
 */
export const generationStateStorage = {
  /**
   * Save the current generation state
   */
  async save(agentState: GenerationState['agentState']): Promise<void> {
    const state: GenerationState = {
      agentState,
      timestamp: new Date().toISOString(),
    };
    await storage.set('generationState', state);
  },

  /**
   * Load the saved generation state
   */
  async load(): Promise<GenerationState | undefined> {
    return await storage.get('generationState');
  },

  /**
   * Clear the saved generation state
   */
  async clear(): Promise<void> {
    await storage.remove('generationState');
  },

  /**
   * Check if there is a saved state
   */
  async hasSavedState(): Promise<boolean> {
    const state = await this.load();
    return !!state?.agentState;
  },
};
