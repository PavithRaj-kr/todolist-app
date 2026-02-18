'use server';

import { db } from '@/src/lib/db';
import { chatMessages } from '@/src/lib/schema';
import { chats } from '@/src/lib/schema';
import { getSession } from '@/src/lib/session';
import { eq, desc } from 'drizzle-orm';

export async function createChat() {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  // create the chat row
  const [newChat] = await db
    .insert(chats)
    .values({
      userId: session.userId,
    })
    .returning();

  // insert a welcome assistant message so every conversation starts with a greeting
  await db.insert(chatMessages).values({
    chatId: newChat.id,
    role: 'assistant',
    text: 'Hi! I can help you plan your tasks. Try asking something like "I want to plan a birthday party".',
  });

  return newChat;
}

export async function saveChatMessage(
  chatId: number,
  role: 'user' | 'assistant',
  text?: string,
  suggestions?: string[]
) {
  const session = await getSession();

  if (!session) throw new Error('Not authenticated');

  await db.insert(chatMessages).values({
    chatId,
    role,
    text,
    suggestions: suggestions ? JSON.stringify(suggestions) : null,
  });
}

export async function getChats() {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const rows = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, Number(session.userId)))
    .orderBy(desc(chats.createdAt));

  const summaries: Array<{id:number;preview:string;role:string|null;updatedAt:Date}> = [];
  for (const chat of rows) {
    const [last] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chat.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);

    let preview = '';
    if (last) {
      if (last.text) preview = last.text;
      else if (last.suggestions) {
        const arr = typeof last.suggestions === 'string' ? JSON.parse(last.suggestions) : last.suggestions;
        preview = Array.isArray(arr) ? arr[0] : '';
      }
    }

    summaries.push({
      id: chat.id,
      preview,
      role: last ? last.role : null,
      updatedAt: chat.createdAt,
    });
  }

  return summaries;
}

export async function getChatMessages(chatId: number) {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatId, chatId))
    .orderBy(chatMessages.createdAt);

  return messages.map((m: any) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    suggestions: m.suggestions ? (typeof m.suggestions === 'string' ? JSON.parse(m.suggestions) : m.suggestions) : undefined,
  }));
}
