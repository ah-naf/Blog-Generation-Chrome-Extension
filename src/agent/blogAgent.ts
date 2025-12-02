import { SourceContent } from '@/shared/types';
import { BlogAgentState, TodoItem } from './types';
import {
  analyzeSourcesNode,
  createPlanNode,
  createTodosNode,
  executeDraftNode,
  refinementNode,
} from './nodes';
import { checkpointStorage } from '@/shared/utils/storage';

export const blogAgent = {
  stream: async function* (inputs: { sources: SourceContent[] }) {
    const initialState: BlogAgentState = {
      sources: inputs.sources,
      currentStep: 'analyzing_sources',
      sourceAnalysis: '',
      plan: '',
      todos: [],
      draft: '',
    };

    // Create checkpoint ID
    const checkpointId = `checkpoint_${Date.now()}`;
    const timestamp = Date.now();

    try {
      // Step 1: Analyze sources
      let state = { ...initialState };
      const analysisUpdate = await analyzeSourcesNode(state);
      state = { ...state, ...analysisUpdate };

      // Save checkpoint
      await checkpointStorage.save({
        id: checkpointId,
        state,
        timestamp,
        lastUpdated: Date.now(),
      });

      yield { analyze_sources: analysisUpdate };

      // Step 2: Create plan
      const planUpdate = await createPlanNode(state);
      state = { ...state, ...planUpdate };

      // Save checkpoint
      await checkpointStorage.save({
        id: checkpointId,
        state,
        timestamp,
        lastUpdated: Date.now(),
      });

      yield { create_plan: planUpdate };

      // Step 3: Create todos
      const todosUpdate = await createTodosNode(state);
      state = { ...state, ...todosUpdate };

      // Save checkpoint
      await checkpointStorage.save({
        id: checkpointId,
        state,
        timestamp,
        lastUpdated: Date.now(),
      });

      yield { create_todos: todosUpdate };

      // Step 4: Execute draft (this is a generator itself)
      const draftGenerator = executeDraftNode(state);
      for await (const draftUpdate of draftGenerator) {
        state = { ...state, ...draftUpdate };

        // Save checkpoint after each section
        await checkpointStorage.save({
          id: checkpointId,
          state,
          timestamp,
          lastUpdated: Date.now(),
        });

        yield { execute_draft: draftUpdate };
      }

      // Step 5: Refinement
      // Explicitly set state to refining before calling the node
      state = { ...state, currentStep: 'refining' };

      // Save checkpoint for refining state
      await checkpointStorage.save({
        id: checkpointId,
        state,
        timestamp,
        lastUpdated: Date.now(),
      });

      const refinementUpdate = await refinementNode(state);
      state = { ...state, ...refinementUpdate };

      // Save checkpoint
      await checkpointStorage.save({
        id: checkpointId,
        state,
        timestamp,
        lastUpdated: Date.now(),
      });

      yield { refinement: refinementUpdate };

      // Save final checkpoint
      await checkpointStorage.save({
        id: checkpointId,
        state,
        timestamp,
        lastUpdated: Date.now(),
      });

      // Do NOT clear checkpoint here - we want to persist the finished state
      // await checkpointStorage.clear();
    } catch (error) {
      console.error('Agent execution failed:', error);
      yield {
        error: {
          currentStep: 'finished',
          error: error instanceof Error ? error.message : 'Unknown error',
        } as Partial<BlogAgentState>,
      };

      // Clear checkpoint on error
      await checkpointStorage.clear();
    }
  },
};

export type { BlogAgentState, TodoItem };
