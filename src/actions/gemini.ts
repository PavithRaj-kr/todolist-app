'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

const systemInstruction = `
### IDENTITY
You are the "TaskFlow Planner," a specialized AI assistant inside a Todo app. Your goal is to help users turn vague ideas into high-quality, actionable checklists.

### OPERATIONAL MODES
You operate in two strictly separate modes:

1. **CONVERSATION MODE** (Plain Text):
   - Trigger: User says hello, hi, hey, bye, goodbye, thanks, or asks a general non-task question.
   - Output: A friendly, short text response (max 2 sentences).
   - Example (Greeting): "Hello! Ready to get organized? What are we planning today?"
   - Example (Closing): "You're welcome! Good luck with your tasks. Bye!"

2. **PLANNING MODE** (Pure JSON):
   - Trigger: User mentions a specific goal, event, project, or task (e.g., "moving," "vacation," "coding a site").
   - Output: A valid JSON array of strings ONLY.
   - Example: ["Research movers", "Buy packing tape", "Label boxes"]

### STRICT RULES
- **NO MARKDOWN**: Never use backticks (\`\`\`) or words like "json" in your response. Return the array starting with "[" and ending with "]".
- **NO MIXING**: If you provide a plan, provide ONLY the JSON array. Do not add "Here is your plan:" or any other text.
- **TASK LIMITS**: Provide exactly 3-5 tasks. Each must be under 40 characters and start with an action verb (Buy, Call, Draft).
- **CONTEXT SENSITIVITY**: If the user says "bye" or "thanks" after you've already provided a plan, stay in CONVERSATION MODE. Do not repeat the plan.
`;

const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite-001',
    systemInstruction,
});

const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2000,
};

// request rate limiting
let requestCount = 0;
let requestCountReset = Date.now() + 60000;
const MAX_REQUESTS_PER_MINUTE = 5;

async function retryWithBackoff(
    fn: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<any> {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            if (error.status !== 429 && !error.message?.includes('429')) {
                throw error;
            }
            if (attempt === maxRetries - 1) throw error;
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw lastError;
}

export type Conversation = { role: 'user' | 'assistant'; text: string }[];
export type ChatReply = { text: string; suggestions?: string[] };

export async function getChatResponse(conversation: Conversation): Promise<ChatReply> {
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined');
    }

    if (Date.now() > requestCountReset) {
        requestCount = 0;
        requestCountReset = Date.now() + 60000;
    }
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        throw new Error(`Too many requests. Try again in a moment.`);
    }
    requestCount++;

    // Map roles correctly: 'assistant' -> 'model'
    const mappedConversation = conversation.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user' as 'model' | 'user',
        parts: [{ text: m.text }]
    }));

    // Identify the new query (last user message)
    let prompt = '';
    let historyParts = mappedConversation;

    if (mappedConversation.length > 0 && mappedConversation[mappedConversation.length - 1].role === 'user') {
        prompt = mappedConversation[mappedConversation.length - 1].parts[0].text;
        historyParts = mappedConversation.slice(0, -1);
    } else {
        // Fallback if the last message isn't user (unlikely in this flow)
        // Just take the very last user message as prompt if possible?
        // For now, assume proper flow. If prompt is empty, sendMessage('') might fail or behave weirdly.
        let lastUserIdx = -1;
        for (let i = mappedConversation.length - 1; i >= 0; i--) {
            if (mappedConversation[i].role === 'user') {
                lastUserIdx = i;
                break;
            }
        }
        if (lastUserIdx !== -1) {
            prompt = mappedConversation[lastUserIdx].parts[0].text;
            // History is everything before that?
            // This acts as a recovery only.
            // Ideally we stick to: last item is prompt.
        }
    }

    // Ensure history starts with 'user'
    const firstUserIdx = historyParts.findIndex(m => m.role === 'user');
    const validHistory = firstUserIdx === -1 ? [] : historyParts.slice(firstUserIdx);

    const chatSession = model.startChat({
        generationConfig,
        history: validHistory,
    });

    try {
        // --- STEP 1: Actually call the AI ---
        const result = await retryWithBackoff(() => chatSession.sendMessage(prompt));
        const responseText = result.response.text();

        // --- STEP 2: Clean and Parse the response ---
        try {
            // Strip out markdown code blocks and "json" labels just in case
            const cleanedText = responseText.replace(/```json|```|json/gi, "").trim();

            const parsed = JSON.parse(cleanedText);
            
            if (Array.isArray(parsed) && parsed.every((el) => typeof el === 'string')) {
                // If it's valid JSON, return it as suggestions
                return { text: '', suggestions: parsed };
            }
        } catch (parseError) { 
            // If parsing fails, it's just a regular text message (like "Bye!")
            console.log("Not a JSON plan, treating as conversation.");
        }

        // Return as regular text if it's not a list of tasks
        return { text: responseText };

    } catch (error: any) {
        console.error('Error fetching chat response:', error);
        // ... (Your Error Handling stays here) ...
        throw new Error('I had trouble thinking. Please try again.');
    }
}

export const getGeminiSuggestions = async (query: string) => {
    const reply = await getChatResponse([{ role: 'user', text: query }]);
    return reply.suggestions || [];
};
