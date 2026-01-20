import type { ScryfallCard, Card } from '@/types';
import { mapScryfallCard } from '@/types';

const SCRYFALL_API = 'https://api.scryfall.com';
const RATE_LIMIT_MS = 100;

let lastRequestTime = 0;

/**
 * Normalize card names for Scryfall API.
 * Split cards (e.g., "Dead/Gone") need special handling.
 */
function normalizeCardName(name: string): string {
  if (name.includes('//')) {
    return name.split('//')[0].trim();
  }
  if (name.includes('/')) {
    return name.split('/')[0].trim();
  }
  return name;
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
}

export class ScryfallError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ScryfallError';
  }
}

export async function getCardByName(name: string): Promise<Card> {
  await rateLimit();

  const normalizedName = normalizeCardName(name);
  const response = await fetch(
    `${SCRYFALL_API}/cards/named?exact=${encodeURIComponent(normalizedName)}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ManaRoom/1.0',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new ScryfallError(`Card not found: ${name}`, 404);
    }
    throw new ScryfallError(
      `Scryfall API error: ${response.status}`,
      response.status
    );
  }

  const data: ScryfallCard = await response.json();
  return mapScryfallCard(data);
}

export async function getCardByFuzzyName(
  name: string
): Promise<{ card: Card; queryName: string } | null> {
  await rateLimit();

  const response = await fetch(
    `${SCRYFALL_API}/cards/named?fuzzy=${encodeURIComponent(name)}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ManaRoom/1.0',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    console.warn(`Fuzzy search failed for "${name}": ${response.status}`);
    return null;
  }

  const data: ScryfallCard = await response.json();
  return { card: mapScryfallCard(data), queryName: name };
}

export async function getCardById(id: string): Promise<Card> {
  await rateLimit();

  const response = await fetch(`${SCRYFALL_API}/cards/${id}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ManaRoom/1.0',
    },
  });

  if (!response.ok) {
    throw new ScryfallError(
      `Scryfall API error: ${response.status}`,
      response.status
    );
  }

  const data: ScryfallCard = await response.json();
  return mapScryfallCard(data);
}

interface BulkCardIdentifier {
  name?: string;
  id?: string;
}

export async function getCardsInBulk(identifiers: BulkCardIdentifier[]): Promise<{
  cards: Card[];
  notFound: string[];
}> {
  await rateLimit();

  const normalizedIdentifiers = identifiers.map((id) => ({
    ...id,
    name: id.name ? normalizeCardName(id.name) : undefined,
  }));

  // Scryfall allows max 75 cards per request
  const chunks: BulkCardIdentifier[][] = [];
  for (let i = 0; i < normalizedIdentifiers.length; i += 75) {
    chunks.push(normalizedIdentifiers.slice(i, i + 75));
  }

  const allCards: Card[] = [];
  const notFound: string[] = [];

  for (const chunk of chunks) {
    await rateLimit();

    const response = await fetch(`${SCRYFALL_API}/cards/collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'ManaRoom/1.0',
      },
      body: JSON.stringify({ identifiers: chunk }),
    });

    if (!response.ok) {
      throw new ScryfallError(
        `Scryfall API error: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();

    for (const card of data.data) {
      allCards.push(mapScryfallCard(card));
    }

    if (data.not_found) {
      for (const item of data.not_found) {
        notFound.push(item.name || item.id);
      }
    }
  }

  return { cards: allCards, notFound };
}

export async function searchCards(query: string, limit = 20): Promise<Card[]> {
  await rateLimit();

  const normalizedQuery = normalizeCardName(query);
  const response = await fetch(
    `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(normalizedQuery)}&unique=cards`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ManaRoom/1.0',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new ScryfallError(
      `Scryfall API error: ${response.status}`,
      response.status
    );
  }

  const data = await response.json();
  return data.data.slice(0, limit).map(mapScryfallCard);
}

export async function searchTokens(query: string, limit = 20): Promise<Card[]> {
  await rateLimit();

  const response = await fetch(
    `${SCRYFALL_API}/cards/search?q=t:token+${encodeURIComponent(query)}&unique=art`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ManaRoom/1.0',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new ScryfallError(
      `Scryfall API error: ${response.status}`,
      response.status
    );
  }

  const data = await response.json();
  return data.data.slice(0, limit).map(mapScryfallCard);
}

export async function autocomplete(query: string): Promise<string[]> {
  if (query.length < 2) return [];

  const response = await fetch(
    `${SCRYFALL_API}/cards/autocomplete?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ManaRoom/1.0',
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.data;
}
