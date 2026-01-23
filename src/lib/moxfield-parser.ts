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
 * - Section headers: "// Commander", "// Mainboard", "SIDEBOARD:", etc.
 * - Commander after blank line at end of list (no quantity prefix)
 */
export function parseMoxfieldText(text: string): ParseResult {
  const lines = text.trim().split('\n');
  const cards: ParsedCard[] = [];
  const commanders: ParsedCard[] = [];
  const errors: string[] = [];

  let currentSection: 'mainboard' | 'commander' | 'sideboard' | 'maybeboard' =
    'mainboard';

  // Track if we've seen a blank line after sideboard (indicates commander section)
  let afterSideboardBlankLine = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle empty lines - after sideboard, they indicate commander section
    if (!trimmed) {
      if (currentSection === 'sideboard') {
        afterSideboardBlankLine = true;
      }
      continue;
    }

    // Handle section headers (both "// Section" and "SECTION:" formats)
    if (trimmed.startsWith('//') || /^[A-Z]+:$/i.test(trimmed)) {
      const sectionName = trimmed.startsWith('//')
        ? trimmed.slice(2).trim().toLowerCase()
        : trimmed.slice(0, -1).toLowerCase();

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
      afterSideboardBlankLine = false;
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

      if (isCommanderTag || currentSection === 'commander' || afterSideboardBlankLine) {
        // Commander if tagged, in commander section, or after blank line following sideboard
        card.isCommander = true;
        commanders.push(card);
      } else if (currentSection === 'sideboard' || currentSection === 'maybeboard') {
        // Skip sideboard/maybeboard cards
        continue;
      } else {
        cards.push(card);
      }
    } else if (cleanedLine && !cleanedLine.startsWith('#')) {
      // Handle card name without quantity (usually commander at end)
      // This is a card name on its own line, assume quantity of 1
      const name = cleanedLine.replace(/\s+\([^)]+\)\s*\d*$/, '').trim();

      if (name) {
        const card: ParsedCard = { quantity: 1, name };

        if (isCommanderTag || currentSection === 'commander' || afterSideboardBlankLine) {
          card.isCommander = true;
          commanders.push(card);
        } else if (currentSection === 'sideboard' || currentSection === 'maybeboard') {
          // Skip sideboard/maybeboard cards
          continue;
        } else {
          // Could be a card without quantity, add as error for review
          errors.push(`No quantity specified: "${line}" (assuming 1)`);
          cards.push(card);
        }
      }
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
