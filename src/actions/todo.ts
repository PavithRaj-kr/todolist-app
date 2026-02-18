'use server'
import { db } from '@/src/lib/db';
import { todos } from '@/src/lib/schema';
import { getSession } from '@/src/lib/session';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getTodos() {
  const session = await getSession();
  if (!session?.userId) return [];

  // Fetch todos only for the logged-in user
  return await db.select()
    .from(todos)
    .where(eq(todos.userId, Number(session.userId)))
    .orderBy(desc(todos.createdAt));
}

export async function createTodoItem(text: string) {
  const session = await getSession();
  if (!session?.userId) return;

  await db.insert(todos).values({
    text,
    userId: Number(session.userId),
  });

  revalidatePath('/');
}

export async function addTodo(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) return;

  const text = formData.get('text') as string;
  if (!text) return;

  await createTodoItem(text);
}

export async function toggleTodo(id: number, currentState: boolean) {
  const session = await getSession();
  if (!session?.userId) return;

  await db.update(todos)
    .set({ completed: !currentState })
    .where(and(eq(todos.id, id), eq(todos.userId, Number(session.userId))));

  revalidatePath('/');
}

export async function deleteTodo(id: number) {
  const session = await getSession();
  if (!session?.userId) return;

  await db.delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, Number(session.userId))));

  revalidatePath('/');
}