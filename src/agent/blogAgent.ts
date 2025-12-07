import { SourceContent, ChatMessage } from '@/shared/types';
import { streamChat } from '@/shared/services/aiService';
import { BlogAgentState, TodoItem } from './types';
import {
  analyzeSourcesNode,
  createPlanNode,
  createTodosNode,
  executeDraftNode,
  refinementNode,
  evaluatorNode,
  optimizerNode,
  finalizeChatNode,
} from './nodes';

const MAX_OPTIMIZATION_ITERATIONS = 2; // Maximum optimization cycles

export const blogAgent = {
  stream: async function* (inputs: { sources: SourceContent[] }) {
    const initialState: BlogAgentState = {
      sources: inputs.sources,
      currentStep: 'analyzing_sources',
      sourceAnalysis: '',
      plan: '',
      todos: [],
      draft: '',
      optimizationIteration: 0,
      maxIterations: MAX_OPTIMIZATION_ITERATIONS,
      previousDrafts: [],
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

      // Step 6: Evaluator-Optimizer Loop
      let optimizationCycle = 0;
      while (optimizationCycle < MAX_OPTIMIZATION_ITERATIONS) {
        // Evaluate the current draft
        state = { ...state, currentStep: 'evaluating' };
        yield { evaluating: { currentStep: 'evaluating' } };

        const evaluationUpdate = await evaluatorNode(state);
        state = { ...state, ...evaluationUpdate };
        yield { evaluation: evaluationUpdate };

        // Check if evaluation passed or max iterations reached
        if (
          state.evaluation?.passThreshold ||
          optimizationCycle >= MAX_OPTIMIZATION_ITERATIONS - 1
        ) {
          state = { ...state, currentStep: 'finished' };
          yield { finished: { currentStep: 'finished' } };
          break;
        }

        // Optimize based on feedback
        state = { ...state, currentStep: 'optimizing' };
        yield { optimizing: { currentStep: 'optimizing' } };

        const optimizationUpdate = await optimizerNode(state);
        state = { ...state, ...optimizationUpdate };
        yield { optimization: optimizationUpdate };

        optimizationCycle++;
      }
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

  streamChat: async function* (inputs: {
    messages: ChatMessage[];
    currentDraft: string;
    plan: string;
  }) {
    const systemPrompt = `You are a helpful blog writing assistant. You are helping the user refine a blog draft.
    
Current Draft Context:
${inputs.currentDraft}

Original Plan:
${inputs.plan}

Your goal is to answer questions about the draft, suggest improvements, or generate new content based on user requests.
Be concise and specific. If the user asks for a change, provide the revised text or explain how to do it.
`;

    const chatMessages = inputs.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const stream = streamChat(chatMessages, systemPrompt);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error('Chat execution failed:', error);
      throw error;
      console.error('Chat execution failed:', error);
      throw error;
    }
  },

  finalizeChatDraft: async function* (inputs: {
    previousDraft: string;
    refinedDraft: string;
  }) {
    const initialState: BlogAgentState = {
      sources: [],
      currentStep: 'refining',
      sourceAnalysis: '',
      plan: '',
      todos: [],
      draft: inputs.previousDraft,
    };

    try {
      yield { refining: { currentStep: 'refining' } };

      const update = await finalizeChatNode(initialState, {
        previousDraft: inputs.previousDraft,
        refinedDraft: inputs.refinedDraft,
      });

      yield { finalization: update };
    } catch (error) {
      console.error('Finalization failed:', error);
      throw error;
    }
  },
};

export type { BlogAgentState, TodoItem };
