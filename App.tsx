import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, GenerateContentResponse } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { createGeminiClient, createChatSession } from './services/gemini';
import { Task, Message, Sender, AddTaskArgs, RemoveTaskArgs, ToggleTaskArgs } from './types';
import TaskList from './components/TaskList';
import ChatBubble from './components/ChatBubble';
import TaskFormModal from './components/TaskFormModal';
import { SendIcon, MenuIcon, PlusIcon, SparklesIcon, CheckCircleIcon } from './components/Icon';

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('chatdo_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hi there! I'm ChatDo. I can help you manage your tasks. Just tell me what you need to do!",
      sender: Sender.BOT,
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [isModalOpen, setIsModalOpen] = useState(false); // Manual entry modal
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Refs for Gemini Session
  const clientRef = useRef(createGeminiClient());
  const chatSessionRef = useRef<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('chatdo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    // Initialize Chat Session
    chatSessionRef.current = createChatSession(clientRef.current);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Tool Executors ---
  const executeAddTask = (args: AddTaskArgs): string => {
    // Parse Date
    let dueDateTimestamp: number | null = null;
    if (args.dueDate) {
      const parsed = Date.parse(args.dueDate);
      if (!isNaN(parsed)) {
        dueDateTimestamp = parsed;
      }
    }

    const newTask: Task = {
      id: uuidv4(),
      text: args.text,
      completed: false,
      createdAt: Date.now(),
      dueDate: dueDateTimestamp,
      priority: args.priority || null,
      notes: args.notes || null,
    };
    setTasks(prev => [newTask, ...prev]);
    
    let confirmation = `Task added with ID: ${newTask.id}`;
    if (newTask.priority) confirmation += `, Priority: ${newTask.priority}`;
    if (newTask.dueDate) confirmation += `, Due: ${args.dueDate}`;
    return confirmation;
  };

  const executeRemoveTask = (args: RemoveTaskArgs): string => {
    let found = false;
    setTasks(prev => {
      const exists = prev.some(t => t.id === args.id);
      if (exists) found = true;
      return prev.filter(t => t.id !== args.id);
    });
    return found ? `Task ${args.id} removed.` : `Task with ID ${args.id} not found.`;
  };

  const executeToggleTask = (args: ToggleTaskArgs): string => {
    let found = false;
    setTasks(prev => prev.map(t => {
      if (t.id === args.id) {
        found = true;
        return { ...t, completed: args.completed };
      }
      return t;
    }));
    return found 
      ? `Task ${args.id} marked as ${args.completed ? 'completed' : 'active'}.`
      : `Task with ID ${args.id} not found.`;
  };

  const executeGetTasks = (): string => {
    return JSON.stringify(tasksRef.current.map(t => ({ 
      id: t.id, 
      text: t.text, 
      completed: t.completed,
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : undefined,
      notes: t.notes 
    })));
  };

  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);


  // --- Chat Logic ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !chatSessionRef.current) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    const userMsg: Message = {
      id: uuidv4(),
      text: userText,
      sender: Sender.USER,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      let result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: userText });
      
      while (result.candidates?.[0]?.content?.parts?.some(p => p.functionCall)) {
        const parts = result.candidates[0].content.parts;
        const functionResponses = [];

        for (const part of parts) {
          if (part.functionCall) {
            const { name, args, id } = part.functionCall;
            let executionResult = "";
            
            console.log(`Executing tool: ${name}`, args);

            switch (name) {
              case 'addTask':
                executionResult = executeAddTask(args as unknown as AddTaskArgs);
                break;
              case 'removeTask':
                executionResult = executeRemoveTask(args as unknown as RemoveTaskArgs);
                break;
              case 'toggleTask':
                executionResult = executeToggleTask(args as unknown as ToggleTaskArgs);
                break;
              case 'getTasks':
                executionResult = executeGetTasks();
                break;
              default:
                executionResult = "Error: Unknown tool.";
            }

            functionResponses.push({
              name,
              response: { result: executionResult },
              id
            });
          }
        }

        if (functionResponses.length > 0) {
           result = await chatSessionRef.current.sendMessage({
             message: functionResponses.map(fr => ({
                 functionResponse: fr
             }))
           });
        }
      }

      const botText = result.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || "Done!";
      
      const botMsg: Message = {
        id: uuidv4(),
        text: botText,
        sender: Sender.BOT,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: Message = {
        id: uuidv4(),
        text: "Sorry, I encountered an error communicating with the server.",
        sender: Sender.BOT,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (id: string, completed: boolean) => {
    executeToggleTask({ id, completed });
  };

  const handleRemove = (id: string) => {
    executeRemoveTask({ id });
  };

  const handleManualSubmit = (args: AddTaskArgs) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => {
        if (t.id === editingTask.id) {
           let newDueDate: number | null = null;
           if (args.dueDate) {
               const parsed = Date.parse(args.dueDate);
               if (!isNaN(parsed)) newDueDate = parsed;
           }
           
           return {
             ...t,
             text: args.text,
             priority: args.priority || null,
             dueDate: newDueDate,
             notes: args.notes || null
           };
        }
        return t;
      }));
      setEditingTask(null);
    } else {
      executeAddTask(args);
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden relative">
      
      <TaskFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleManualSubmit}
        initialTask={editingTask}
      />

      {/* --- Sidebar (Tasks) --- */}
      <div 
        className={`fixed inset-y-0 left-0 z-20 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <CheckCircleIcon className="w-5 h-5" />
              </span>
              ChatDo
            </h2>
            
            <div className="flex items-center gap-2">
               <button
                  onClick={openAddModal}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  aria-label="Add Task Manually"
               >
                 <PlusIcon className="w-5 h-5" />
               </button>
               <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="md:hidden p-2 text-slate-400 hover:text-slate-600"
               >
                <PlusIcon className="w-6 h-6 rotate-45" />
               </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Tasks ({tasks.filter(t => !t.completed).length})
            </h3>
            <TaskList 
              tasks={tasks} 
              onToggle={handleToggle} 
              onRemove={handleRemove} 
              onEdit={openEditModal}
            />
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
             <div className="text-xs text-slate-400 text-center">
               Powered by Google Gemini 2.5
             </div>
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-10">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600">
             <MenuIcon className="w-6 h-6" />
           </button>
           <span className="font-semibold text-slate-800">ChatDo</span>
           <button onClick={openAddModal} className="p-2 text-indigo-600">
             <PlusIcon className="w-6 h-6" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 scroll-smooth">
          <div className="max-w-3xl mx-auto w-full pb-4">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-6 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-sm text-slate-400 font-medium">Thinking...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-slate-200">
          <div className="max-w-3xl mx-auto w-full">
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add a task (e.g., 'Buy milk tomorrow high priority')..."
                className="w-full pl-5 pr-14 py-4 bg-slate-100 border-none rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-inner"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:shadow-none"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </form>
            <div className="mt-2 text-center text-[10px] text-slate-300 md:hidden">
              Try "Remind me to buy milk tomorrow"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;