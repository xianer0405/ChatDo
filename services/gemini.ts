import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";

// 1. Define Tools
const addTaskTool: FunctionDeclaration = {
  name: 'addTask',
  description: 'Add a new task to the todo list. Extract due date, priority, and notes if present in the user request.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: 'The content of the task (e.g., "Buy milk", "Call John")',
      },
      dueDate: {
        type: Type.STRING,
        description: 'ISO 8601 date string (YYYY-MM-DD). If user says "tomorrow" or "next friday", calculate the date based on the Current Date.',
      },
      priority: {
        type: Type.STRING,
        enum: ['low', 'medium', 'high'],
        description: 'The priority level of the task.',
      },
      notes: {
        type: Type.STRING,
        description: 'Additional details, description, or context for the task.',
      }
    },
    required: ['text'],
  },
};

const removeTaskTool: FunctionDeclaration = {
  name: 'removeTask',
  description: 'Remove a task from the list by its ID. ALWAYS ask the user to list tasks first if you do not know the ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.STRING,
        description: 'The unique ID of the task to remove.',
      },
    },
    required: ['id'],
  },
};

const toggleTaskTool: FunctionDeclaration = {
  name: 'toggleTask',
  description: 'Mark a task as completed or active (incomplete).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.STRING,
        description: 'The unique ID of the task.',
      },
      completed: {
        type: Type.BOOLEAN,
        description: 'True to mark completed, false to mark active.',
      },
    },
    required: ['id', 'completed'],
  },
};

const listTasksTool: FunctionDeclaration = {
  name: 'getTasks',
  description: 'Get the current list of all tasks to see what is on the agenda.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const tools: Tool[] = [{
  functionDeclarations: [addTaskTool, removeTaskTool, toggleTaskTool, listTasksTool]
}];

const SYSTEM_INSTRUCTION = `
You are ChatDo, an efficient, friendly, and motivational personal task manager. 
Your goal is to help the user organize their life. 

Capabilities:
- You can Add, Remove, and Toggle tasks using the provided tools.
- You can see the list of tasks using getTasks.

Guidelines:
- When a user asks to do something, use the appropriate tool.
- Be concise.
- If the user asks "What do I have to do?", call getTasks and then summarize the list for them in a nice way.
- When adding a task, look for details like due dates, priority (low, medium, high), and notes.
- If you add a task, confirm it briefly (e.g., "Added 'Buy milk' for tomorrow with high priority!").
- If you complete a task, celebrate slightly (e.g., "Great job! Marked 'Gym' as done.").
- If you need a Task ID to delete or toggle something and you don't have it, assume the user is referring to a task by name and try to find it if you recently called getTasks, otherwise ask or call getTasks yourself to look it up.
- Always be helpful and positive.
`;

// 2. Initialize Client
export const createGeminiClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 3. Helper to create a chat session
export const createChatSession = (client: GoogleGenAI) => {
  // Inject current date so the model can calculate relative dates (e.g. "tomorrow")
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dynamicInstruction = `${SYSTEM_INSTRUCTION}\n\nCurrent Date: ${dateStr}`;

  return client.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: dynamicInstruction,
      tools: tools,
    },
  });
};