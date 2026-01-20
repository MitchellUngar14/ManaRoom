import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Generate a 6-character room key
function generateRoomKey(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let key = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}

export async function POST(request: NextRequest) {
  try {
    const { deckId } = await request.json();

    if (!deckId) {
      return NextResponse.json(
        { error: 'Deck ID is required' },
        { status: 400 }
      );
    }

    // Generate unique room key
    const roomKey = generateRoomKey();

    // Note: In production, you'd store this in Redis or a database
    // For now, room management happens in the Socket.io server

    return NextResponse.json({ roomKey });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
