import { SourceContent } from '@/shared/types';
import { BlogAgentState, TodoItem } from './types';
import {
  analyzeSourcesNode,
  createPlanNode,
  createTodosNode,
  executeDraftNode,
  refinementNode,
} from './nodes';

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

    try {
      // Step 1: Analyze sources
      let state = { ...initialState };
      const analysisUpdate = await analyzeSourcesNode(state);
      state = { ...state, ...analysisUpdate };
      yield { analyze_sources: analysisUpdate };

      // Step 2: Create plan
      const planUpdate = await createPlanNode(state);
      state = { ...state, ...planUpdate };
      yield { create_plan: planUpdate };

      // Step 3: Create todos
      const todosUpdate = await createTodosNode(state);
      state = { ...state, ...todosUpdate };
      yield { create_todos: todosUpdate };

      // Step 4: Execute draft (this is a generator itself)
      const draftGenerator = executeDraftNode(state);
      for await (const draftUpdate of draftGenerator) {
        state = { ...state, ...draftUpdate };
        yield { execute_draft: draftUpdate };
      }

      // Step 5: Refinement
      state = { ...state, currentStep: 'refining' };
      const refinementUpdate = await refinementNode(state);
      state = { ...state, ...refinementUpdate };
      yield { refinement: refinementUpdate };

    } catch (error) {
      console.error('Agent execution failed:', error);
      yield {
        error: {
          currentStep: 'finished',
          error: error instanceof Error ? error.message : 'Unknown error',
        } as Partial<BlogAgentState>,
      };
    }
  },
};

export type { BlogAgentState, TodoItem };
