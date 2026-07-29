export const llmService = {
  generateQuestions: async (fileContent: Buffer) => {
    // Real LLM integration to be added
    return [];
  },
  restylePrompt: async (notes: string) => {
    // In production, this would call OpenAI/Gemini to restyle the text.
    // For TDD/MVP, we mock the response.
    return `Here is your simplified study guide based on: "${notes.substring(0, 50)}..."`;
  }
};
