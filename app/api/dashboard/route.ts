import { getSession } from '@/src/lib/session';
import { db } from '@/src/lib/db';
import { users, todos } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get logged-in user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(session.userId)));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get todos for this user
    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, user.id))
      .orderBy(todos.createdAt);

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      todos: userTodos,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
