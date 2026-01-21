import { NextRequest, NextResponse } from 'next/server';
import { db, decks } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { getCardsInBulk, getCardByFuzzyName } from '@/lib/clients/scryfall';
import type { Card } from '@/types';

interface EnrichedCard {
  name: string;
  quantity: number;
  scryfallId: string;
  imageUrl: string;
  card: Card;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const [deck] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, id), eq(decks.userId, session.userId)))
      .limit(1);

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Collect all unique card names
    const cardNames = new Set<string>();

    if (deck.cardList?.commanders) {
      for (const cmd of deck.cardList.commanders) {
        cardNames.add(cmd.name);
      }
    }

    if (deck.cardList?.cards) {
      for (const card of deck.cardList.cards) {
        cardNames.add(card.name);
      }
    }

    // Fetch all cards from Scryfall in bulk
    const identifiers = Array.from(cardNames).map(name => ({ name }));
    const { cards: scryfallCards, notFound } = await getCardsInBulk(identifiers);

    // Create a lookup map by name
    const cardMap = new Map<string, Card>();
    for (const card of scryfallCards) {
      cardMap.set(card.name.toLowerCase(), card);
      // Also map by first part of split card names
      if (card.name.includes(' // ')) {
        const firstName = card.name.split(' // ')[0].toLowerCase();
        cardMap.set(firstName, card);
      }
    }

    // Try fuzzy search for cards not found
    for (const name of notFound) {
      const result = await getCardByFuzzyName(name);
      if (result) {
        cardMap.set(name.toLowerCase(), result.card);
      }
    }

    // Enrich commanders
    const enrichedCommanders: EnrichedCard[] = [];
    if (deck.cardList?.commanders) {
      for (const cmd of deck.cardList.commanders) {
        const card = cardMap.get(cmd.name.toLowerCase());
        if (card) {
          enrichedCommanders.push({
            name: card.name,
            quantity: cmd.quantity,
            scryfallId: card.id,
            imageUrl: card.imageUris.normal,
            card,
          });
        } else {
          // Fallback: include without full card data
          enrichedCommanders.push({
            name: cmd.name,
            quantity: cmd.quantity,
            scryfallId: cmd.scryfallId || '',
            imageUrl: '',
            card: null as unknown as Card,
          });
        }
      }
    }

    // Enrich main deck cards
    const enrichedCards: EnrichedCard[] = [];
    if (deck.cardList?.cards) {
      for (const c of deck.cardList.cards) {
        const card = cardMap.get(c.name.toLowerCase());
        if (card) {
          enrichedCards.push({
            name: card.name,
            quantity: c.quantity,
            scryfallId: card.id,
            imageUrl: card.imageUris.normal,
            card,
          });
        } else {
          // Fallback: include without full card data
          enrichedCards.push({
            name: c.name,
            quantity: c.quantity,
            scryfallId: c.scryfallId || '',
            imageUrl: '',
            card: null as unknown as Card,
          });
        }
      }
    }

    return NextResponse.json({
      deck: {
        ...deck,
        cardList: {
          commanders: enrichedCommanders,
          cards: enrichedCards,
        },
      },
    });
  } catch (error) {
    console.error('Failed to enrich deck:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
