import { getChatMessages } from '@/src/actions/chat';
import { getSession } from '@/src/lib/session';
import { NextResponse, NextRequest } from 'next/server';

// GET: Return all messages for a specific chat
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId } = await params;
        const messages = await getChatMessages(Number(chatId));

        return NextResponse.json(messages);

    } catch (error) {
        console.error("CHAT MESSAGES API ERROR:", error);
        return NextResponse.json([], { status: 500 });
    }
}
