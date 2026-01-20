export interface ParsedCard {
  quantity: number;
  name: string;
  isCommander?: boolean;
}

export interface ParseResult {
  cards: ParsedCard[];
  commanders: ParsedCard[];
  errors: string[];
}

/**
 * Parse a Moxfield-style deck list text.
 * Supports formats:
 * - "1 Card Name"
 * - "1x Card Name"
 * - "1 Card Name (SET) 123"
 * - "1 Card Name *CMDR*"
 * - Section headers: "// Commander", "// Mainboard", etc.
 */
export function parseMoxfieldText(text: string): ParseResult {
  const lines = text.trim().split('\n');
  const cards: ParsedCard[] = [];
  const commanders: ParsedCard[] = [];
  const errors: string[] = [];

  let currentSection: 'mainboard' | 'commander' | 'sideboard' | 'maybeboard' =
    'mainboard';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Handle section headers
    if (trimmed.startsWith('//')) {
      const sectionName = trimmed.slice(2).trim().toLowerCase();
      if (
        sectionName.includes('commander') ||
        sectionName.includes('cmdr')
      ) {
        currentSection = 'commander';
      } else if (sectionName.includes('sideboard')) {
        currentSection = 'sideboard';
      } else if (sectionName.includes('maybe')) {
        currentSection = 'maybeboard';
      } else {
        currentSection = 'mainboard';
      }
      continue;
    }

    // Check for *CMDR* tag
    const isCommanderTag = trimmed.includes('*CMDR*');
    const cleanedLine = trimmed.replace('*CMDR*', '').trim();

    // Parse format: "1 Card Name" or "1x Card Name" with optional set info
    const match = cleanedLine.match(/^(\d+)x?\s+(.+?)(?:\s+\([^)]+\).*)?$/i);

    if (match) {
      const quantity = parseInt(match[1], 10);
      let name = match[2].trim();

      // Remove any trailing set/collector info that might have been missed
      name = name.replace(/\s+\([^)]+\)\s*\d*$/, '').trim();

      const card: ParsedCard = { quantity, name };

      if (isCommanderTag || currentSection === 'commander') {
        card.isCommander = true;
        commanders.push(card);
      } else {
        cards.push(card);
      }
    } else if (trimmed && !trimmed.startsWith('#')) {
      errors.push(`Could not parse: ${line}`);
    }
  }

  return { cards, commanders, errors };
}

/**
 * Validate a deck for Commander format.
 * Returns validation errors if any.
 */
export function validateCommanderDeck(
  cards: ParsedCard[],
  commanders: ParsedCard[]
): string[] {
  const errors: string[] = [];

  // Must have at least one commander
  if (commanders.length === 0) {
    errors.push('No commander found. Please specify a commander.');
  }

  // Count total cards (excluding commanders)
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const commanderCount = commanders.reduce((sum, c) => sum + c.quantity, 0);

  // Commander deck should have exactly 100 cards including commander(s)
  const total = totalCards + commanderCount;
  if (total !== 100) {
    errors.push(`Deck has ${total} cards. Commander decks require exactly 100 cards.`);
  }

  // Check for duplicates (Commander is singleton format)
  const cardCounts = new Map<string, number>();
  for (const card of [...cards, ...commanders]) {
    const current = cardCounts.get(card.name.toLowerCase()) || 0;
    cardCounts.set(card.name.toLowerCase(), current + card.quantity);
  }

  for (const [name, count] of cardCounts) {
    // Basic lands are exempt from singleton rule
    const basicLands = [
      'plains',
      'island',
      'swamp',
      'mountain',
      'forest',
      'wastes',
      'snow-covered plains',
      'snow-covered island',
      'snow-covered swamp',
      'snow-covered mountain',
      'snow-covered forest',
    ];

    if (count > 1 && !basicLands.includes(name)) {
      errors.push(`"${name}" appears ${count} times. Commander is a singleton format.`);
    }
  }

  return errors;
}
