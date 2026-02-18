import { createChat, getChats } from '@/src/actions/chat';
import { getSession } from '@/src/lib/session';
import { NextResponse } from 'next/server';

// GET: Return chat summaries for the logged-in user
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json([]);
    }

    const summaries = await getChats();
    return NextResponse.json(summaries);

  } catch (error) {
    console.error("CHAT API ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: Create a new chat for the logged-in user
export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newChat = await createChat();
    return NextResponse.json(newChat);

  } catch (error) {
    console.error("CREATE CHAT ERROR:", error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
