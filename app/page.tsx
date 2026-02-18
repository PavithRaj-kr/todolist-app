'use client';

import { addTodo, deleteTodo, toggleTodo, createTodoItem } from '@/src/actions/todo';
import { logout } from '@/src/actions/auth';
import { useEffect, useState, useTransition } from 'react';
import { Menu, X, LogOut, User, MessageSquare } from 'lucide-react';
import AddTodo from '@/src/components/AddTodo';
import TodoList from '@/src/components/TodoList';
import Chatbot, { Message } from '@/src/components/Chatbot';
import { getChatResponse } from '@/src/actions/gemini';
import { saveChatMessage, createChat } from '@/src/actions/chat';

export default function Dashboard() {

  const [todos, setTodos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [currentChatId, setCurrentChatId] = useState<number | null>(null);

  // Chatbot State
  const [messages, setMessages] = useState<Message[]>([]);

  const [isChatPending, startChatTransition] = useTransition();
  const [isAdding, startAdding] = useTransition();

  // list of chat summaries for sidebar
  const [chatList, setChatList] = useState<{
    id: number;
    preview: string;
    role: string | null;
    updatedAt: string;
  }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();

      setUser(data.user);
      setTodos(data.todos);

      // LOAD CHAT LIST
      const chatRes = await fetch('/api/chat');
      const chatData = await chatRes.json();
      setChatList(chatData);

      // optionally open first chat automatically
      if (chatData.length > 0) {
        openChat(chatData[0].id);
      } else {
        // start with welcome message until user creates chat
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            text: 'Hi! I can help you plan your tasks. Try asking something like "I want to plan a birthday party".',
          },
        ]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (formData: FormData) => {
    startTransition(async () => {
      await addTodo(formData);
      await fetchData();
    });
  };

  const handleToggleTodo = async (id: number, completed: boolean) => {
    startTransition(async () => {
      await toggleTodo(id, completed);
      await fetchData();
    });
  };

  const handleDeleteTodo = async (id: number) => {
    startTransition(async () => {
      await deleteTodo(id);
      await fetchData();
    });
  };

  // Chatbot Handlers
  // Debounce settings
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const MESSAGE_DEBOUNCE_MS = 500; // Minimum 500ms between messages

  const handleSendMessage = async (text: string) => {
    const now = Date.now();
    if (now - lastMessageTime < MESSAGE_DEBOUNCE_MS) {
      console.warn('Message sent too quickly. Please wait a moment.');
      return;
    }
    setLastMessageTime(now);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMessage]);

    let activeChatId = currentChatId;
    if (!activeChatId) {
      try {
        const newChat = await createChat();
        activeChatId = newChat.id;
        setCurrentChatId(activeChatId);
        setChatList((prev) => [{ id: newChat.id, preview: '', role: null, updatedAt: new Date().toISOString() }, ...prev]);
      } catch (err) {
        console.error('Failed to create chat:', err);
        return;
      }
    }

    await saveChatMessage(activeChatId, 'user', text);

    startChatTransition(async () => {
      try {
        const conversation = messages
          .map((m) => ({ role: m.role, text: m.text || '' }))
          .concat({ role: 'user', text });

        const reply = await getChatResponse(conversation);

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: reply.text,
          suggestions: reply.suggestions,
        };

        setMessages((prev) => [...prev, botMessage]);
        await saveChatMessage(activeChatId!, 'assistant', reply.text, reply.suggestions);

        // update preview for this chat
        setChatList((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? { ...c, preview: reply.text || (reply.suggestions?.[0] || '') }
              : c
          )
        );
      } catch (error: any) {
        console.error('Failed to get chat response:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: error.message || 'Sorry, I encountered an error. Please try again later.',
          },
        ]);
      }
    });
  };

  const handleAddChatTodo = async (messageId: string, task: string) => {
    startAdding(async () => {
      await createTodoItem(task);

      // remove suggestion after adding
      handleRemoveSuggestion(messageId, task);

      await fetchData();
    });
  };

  const handleAddAllChatTodos = async (tasks: string[]) => {
    startAdding(async () => {
      for (const task of tasks) {
        await createTodoItem(task);
      }
      await fetchData();
    });
  };

  // Chatbot handlers

  const regenerateSuggestion = async (messageId: string, removedTasks?: string[]) => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === 'user' && msg.text);

    if (!lastUserMessage || !lastUserMessage.text) return;

    try {
      const excludeNote = removedTasks && removedTasks.length > 0
        ? ` (Do NOT suggest these again: ${removedTasks.join(', ')}). Give me completely different suggestions.`
        : '';

      const convo = messages
        .map((m) => ({ role: m.role, text: m.text || '' }))
        .concat({ role: 'user', text: lastUserMessage.text + excludeNote });

      const reply = await getChatResponse(convo);
      const newSuggestions = reply.suggestions || [];

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, suggestions: newSuggestions }
            : msg
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const [removedTasksMap, setRemovedTasksMap] = useState<Record<string, string[]>>({});

  const handleRemoveSuggestion = (messageId: string, task: string) => {
    // Track removed tasks for this message
    setRemovedTasksMap(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), task],
    }));

    // Find current suggestion count BEFORE updating state
    const targetMsg = messages.find(m => m.id === messageId);
    const remainingCount = (targetMsg?.suggestions?.filter(t => t !== task) || []).length;

    // Update state to remove the suggestion
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId) return msg;
        const remaining = msg.suggestions?.filter(t => t !== task) || [];
        return { ...msg, suggestions: remaining };
      })
    );

    // If that was the last suggestion, auto-regenerate (deferred to avoid render-phase update)
    if (remainingCount === 0) {
      const allRemoved = [...(removedTasksMap[messageId] || []), task];
      setTimeout(() => regenerateSuggestion(messageId, allRemoved), 0);
    }
  };

  const handleNewChat = async () => {
    try {
      const chat = await createChat();
      setCurrentChatId(chat.id);
      // prepend to list
      setChatList((prev) => [
        { id: chat.id, preview: '', role: null, updatedAt: new Date().toISOString() },
        ...prev,
      ]);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: 'Hi! I can help you plan your tasks. Try asking something like "I want to plan a birthday party".',
        },
      ]);
    } catch (err) {
      console.error('Failed to start new chat:', err);
    }
  };

  const openChat = async (chatId: number) => {
    setCurrentChatId(chatId);
    try {
      const res = await fetch(`/api/chat/${chatId}`);
      const chatData = await res.json();

      const formatted = chatData.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role,
        text: msg.text,
        suggestions: msg.suggestions,
      }));

      setMessages(formatted);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    }
  };

  // Calculate statistics
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">

      {/* ====== WARM HEADER ====== */}
      <header className="fixed top-0 left-0 right-0 bg-white/60 backdrop-blur-md border-b border-white/20 z-40 h-16 transition-all duration-300 shadow-sm">
        <div className="flex items-center justify-between px-6 h-full max-w-7xl mx-auto">

          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-stone-600 hover:text-stone-900 transition"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <h1 className="text-xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                ⚡
              </span>
              TaskFlow
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-stone-600 hidden sm:block">
              Good day, {user?.firstName}
            </span>
            <div className="h-9 w-9 bg-white text-primary border border-primary/20 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.firstName?.[0]}
            </div>
            {/* <form action={logout}>
              <button
                className="text-stone-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/50"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </form> */}
          </div>
        </div>
      </header>

      <div className="flex flex-1 h-screen overflow-hidden">

        {/* ====== LEFT SIDEBAR ====== */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/50 backdrop-blur-sm border-r border-white/20 w-72 transition-transform duration-300 z-30 flex flex-col
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          <div className="p-6 flex flex-col h-full overflow-y-auto">

            <div className="space-y-8 flex-1">
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 px-2">Account</h3>
                <div className="flex items-center gap-3 text-stone-700 mb-2 p-2 rounded-xl bg-white/80 border border-white/40 shadow-sm">
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <User size={18} className="text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-stone-800">{user?.firstName} {user?.lastName}</span>
                    <span className="text-[10px] text-stone-500 font-medium">{user?.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 px-2">Dashboard</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col p-3 bg-white/80 rounded-xl border border-white/40 shadow-sm">
                    <span className="text-xs text-stone-500 font-medium mb-1">Pending</span>
                    <span className="text-xl font-bold text-orange-500">{pendingTasks}</span>
                  </div>
                  <div className="flex flex-col p-3 bg-white/80 rounded-xl border border-white/40 shadow-sm">
                    <span className="text-xs text-stone-500 font-medium mb-1">Done</span>
                    <span className="text-xl font-bold text-green-600">{completedTasks}</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white/40 rounded-xl border border-white/20 flex justify-between items-center text-stone-700">
                  <span className="text-xs font-medium">Total Tasks</span>
                  <span className="text-sm font-bold">{totalTasks}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-border">
              <form action={logout}>
                <button className="flex items-center gap-3 text-slate-500 hover:text-red-600 transition-all w-full text-sm font-medium p-3 rounded-xl hover:bg-red-50 group">
                  <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                  Sign Out
                </button>
              </form>
            </div>

          </div>
        </aside>

        {/* ====== RIGHT CHAT SIDEBAR ====== */}
        {/* ====== RIGHT CHAT SIDEBAR ====== */}
        <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white/60 backdrop-blur-xl border-l border-white/40 z-30 flex flex-col shadow-xl">

          {/* Sidebar Header / History Toggle */}
          <div className="flex-none p-4 pb-2 border-b border-white/20 backdrop-blur-sm bg-white/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={12} className="text-primary" />
                History
              </h3>
              <button
                onClick={handleNewChat}
                className="text-xs bg-white text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all px-2 py-1 rounded-md shadow-sm font-medium"
              >
                + New
              </button>
            </div>

            {/* Vertical History List */}
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-28 pb-1 scrollbar-thin scrollbar-thumb-stone-300">
              {chatList.length === 0 ? (
                <span className="text-xs text-stone-400 italic px-1">No history yet</span>
              ) : (
                chatList.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all truncate flex items-center gap-2 ${currentChatId === chat.id
                      ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                      : 'bg-white/50 border-transparent text-stone-600 hover:bg-white hover:border-white/50'
                      }`}
                  >
                    <MessageSquare size={12} className="flex-none text-stone-400" />
                    <span className="truncate">{chat.preview || 'New chat'}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chatbot (Fills remaining) */}
          <div className="flex-1 overflow-hidden relative">
            <Chatbot
              messages={messages}
              isPending={isChatPending}
              isAdding={isAdding}
              onSendMessage={handleSendMessage}
              onAddTodo={handleAddChatTodo}
              onAddAll={handleAddAllChatTodos}
              onRemoveSuggestion={handleRemoveSuggestion}
            />
          </div>

        </aside>

        {/* ====== MAIN CONTENT ====== */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12 w-full scroll-smooth lg:ml-72 mt-16" onClick={() => setSidebarOpen(false)}>
          <div className="max-w-4xl mx-auto pb-20">

            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-stone-800 tracking-tight">My Tasks</h2>
              <p className="text-stone-500 mt-2 text-lg">Focus on what matters most today.</p>
            </div>

            <AddTodo onAdd={handleAddTodo} isPending={isPending} />

            <TodoList
              todos={todos}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
              isPending={isPending}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
