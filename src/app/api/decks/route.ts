import { NextRequest, NextResponse } from 'next/server';
import { db, decks } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ decks: [] });
    }

    const userDecks = await db
      .select({
        id: decks.id,
        name: decks.name,
        commander: decks.commander,
      })
      .from(decks)
      .where(eq(decks.userId, session.userId))
      .orderBy(decks.createdAt);

    return NextResponse.json({ decks: userDecks });
  } catch (error) {
    console.error('Failed to fetch decks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { name, commander, cardList } = await request.json();

    if (!name || !commander || !cardList) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [deck] = await db
      .insert(decks)
      .values({
        userId: session.userId,
        name,
        commander,
        cardList,
      })
      .returning();

    return NextResponse.json({ deck });
  } catch (error) {
    console.error('Failed to create deck:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
