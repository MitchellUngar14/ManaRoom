import { NextRequest, NextResponse } from 'next/server';
import { searchCards, searchTokens } from '@/lib/clients/scryfall';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    let cards;
    if (type === 'token') {
      cards = await searchTokens(query);
    } else {
      cards = await searchCards(query);
    }

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Card search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
