'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Card } from '@/types/card';
import { ManaText } from '@/components/ui/ManaSymbol';

interface EnrichedCard {
  name: string;
  quantity: number;
  scryfallId: string;
  imageUrl: string;
  card: Card | null;
}

interface DeckData {
  id: string;
  name: string;
  commander: string;
  cardList: {
    commanders: EnrichedCard[];
    cards: EnrichedCard[];
  };
}

interface DeckViewerProps {
  deckId: string;
  onClose: () => void;
}

type CardCategory = 'Commanders' | 'Creatures' | 'Instants' | 'Sorceries' | 'Artifacts' | 'Enchantments' | 'Planeswalkers' | 'Lands' | 'Other';

const CATEGORY_ORDER: CardCategory[] = [
  'Commanders',
  'Creatures',
  'Planeswalkers',
  'Instants',
  'Sorceries',
  'Artifacts',
  'Enchantments',
  'Lands',
  'Other',
];

function categorizeCard(typeLine: string | undefined): CardCategory {
  if (!typeLine) return 'Other';
  const lower = typeLine.toLowerCase();
  if (lower.includes('creature')) return 'Creatures';
  if (lower.includes('instant')) return 'Instants';
  if (lower.includes('sorcery')) return 'Sorceries';
  if (lower.includes('artifact')) return 'Artifacts';
  if (lower.includes('enchantment')) return 'Enchantments';
  if (lower.includes('planeswalker')) return 'Planeswalkers';
  if (lower.includes('land')) return 'Lands';
  return 'Other';
}

export function DeckViewer({ deckId, onClose }: DeckViewerProps) {
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewCard, setPreviewCard] = useState<EnrichedCard | null>(null);
  const [previewFaceIndex, setPreviewFaceIndex] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<CardCategory>>(new Set(CATEGORY_ORDER));

  const toggleCategory = (category: CardCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        // Use the enrich endpoint to get full card data
        const res = await fetch(`/api/decks/${deckId}/enrich`);
        if (!res.ok) throw new Error('Failed to load deck');
        const data = await res.json();
        setDeck(data.deck);

        // Set initial preview to commander
        if (data.deck?.cardList?.commanders?.[0]) {
          setPreviewCard(data.deck.cardList.commanders[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deck');
      } finally {
        setLoading(false);
      }
    };
    fetchDeck();
  }, [deckId]);

  // Group cards by category
  const categorizedCards = useMemo(() => {
    if (!deck?.cardList) return new Map<CardCategory, EnrichedCard[]>();

    const groups = new Map<CardCategory, EnrichedCard[]>();

    // Initialize all categories
    CATEGORY_ORDER.forEach(cat => groups.set(cat, []));

    // Add commanders
    deck.cardList.commanders?.forEach(enrichedCard => {
      groups.get('Commanders')!.push(enrichedCard);
    });

    // Add mainboard cards
    deck.cardList.cards?.forEach(enrichedCard => {
      const category = categorizeCard(enrichedCard.card?.typeLine);
      groups.get(category)!.push(enrichedCard);
    });

    // Sort each category by name
    groups.forEach((cards) => {
      cards.sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [deck]);

  const totalCards = useMemo(() => {
    if (!deck?.cardList) return 0;
    const commanderCount = deck.cardList.commanders?.reduce((sum, c) => sum + c.quantity, 0) || 0;
    const mainboardCount = deck.cardList.cards?.reduce((sum, c) => sum + c.quantity, 0) || 0;
    return commanderCount + mainboardCount;
  }, [deck]);

  const handleCardClick = (enrichedCard: EnrichedCard) => {
    setPreviewCard(enrichedCard);
    setPreviewFaceIndex(0);
  };

  const toggleCardFace = () => {
    const card = previewCard?.card;
    if (card?.cardFaces && card.cardFaces.length > 1) {
      setPreviewFaceIndex(prev => (prev + 1) % card.cardFaces!.length);
    }
  };

  // Get the current image URL for preview (art crop only)
  const getPreviewImageUrl = () => {
    if (!previewCard) return null;

    const card = previewCard.card;

    // Double-faced cards with separate images
    if (card?.cardFaces && card.cardFaces[previewFaceIndex]?.imageUris) {
      const faceUris = card.cardFaces[previewFaceIndex].imageUris!;
      return faceUris.artCrop || faceUris.large || faceUris.normal;
    }

    // Regular cards
    if (card?.imageUris) {
      return card.imageUris.artCrop || card.imageUris.large || card.imageUris.normal;
    }

    // Fallback to Scryfall art_crop API
    if (previewCard.name) {
      return `https://api.scryfall.com/cards/named?format=image&version=art_crop&exact=${encodeURIComponent(previewCard.name)}`;
    }

    return null;
  };

  const card = previewCard?.card;
  const isDoubleFaced = card?.cardFaces && card.cardFaces.length > 1 &&
    card.cardFaces[0]?.imageUris;

  return (
    <div className="deck-viewer-overlay" onClick={onClose}>
      <div className="deck-viewer-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="deck-viewer-header">
          <div>
            <h2 className="deck-viewer-title">{deck?.name || 'Loading...'}</h2>
            {deck && <p className="deck-viewer-subtitle">{totalCards} cards</p>}
          </div>
          <button onClick={onClose} className="deck-viewer-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="deck-viewer-loading">
            <div className="deck-viewer-spinner" />
            <p>Loading grimoire...</p>
          </div>
        ) : error ? (
          <div className="deck-viewer-error">
            <p>{error}</p>
          </div>
        ) : (
          <div className="deck-viewer-content">
            {/* Card List */}
            <div className="deck-viewer-list">
              {CATEGORY_ORDER.map(category => {
                const cards = categorizedCards.get(category);
                if (!cards || cards.length === 0) return null;

                const isExpanded = expandedCategories.has(category);

                return (
                  <div key={category} className="deck-viewer-category">
                    <button
                      className="deck-viewer-category-title"
                      onClick={() => toggleCategory(category)}
                    >
                      <span className={`deck-viewer-category-chevron ${isExpanded ? 'expanded' : ''}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                      {category}
                      <span className="deck-viewer-category-count">
                        ({cards.reduce((sum, c) => sum + c.quantity, 0)})
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="deck-viewer-cards">
                        {cards.map((enrichedCard) => (
                          <button
                            key={enrichedCard.scryfallId || enrichedCard.name}
                            className={`deck-viewer-card-row ${previewCard?.name === enrichedCard.name ? 'selected' : ''}`}
                            onClick={() => handleCardClick(enrichedCard)}
                          >
                            <span className="deck-viewer-card-quantity">{enrichedCard.quantity}x</span>
                            <span className="deck-viewer-card-name">{enrichedCard.name}</span>
                            {enrichedCard.card?.manaCost && (
                              <span className="deck-viewer-card-mana">
                                <ManaText text={enrichedCard.card.manaCost} symbolSize={12} />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Card Preview */}
            <div className="deck-viewer-preview">
              <div className="deck-viewer-preview-scroll">
                {previewCard ? (
                  <>
                    <div
                      className={`deck-viewer-preview-image ${isDoubleFaced ? 'flippable' : ''}`}
                      onClick={isDoubleFaced ? toggleCardFace : undefined}
                    >
                      {getPreviewImageUrl() ? (
                        <img
                          src={getPreviewImageUrl()!}
                          alt={previewCard.name}
                          loading="eager"
                        />
                      ) : (
                        <div className="deck-viewer-preview-placeholder">
                          <span>No image available</span>
                        </div>
                      )}
                      {isDoubleFaced && (
                        <div className="deck-viewer-flip-hint">
                          Click to flip
                        </div>
                      )}
                    </div>
                    <div className="deck-viewer-preview-info">
                      <h4 className="deck-viewer-preview-name">{previewCard.name}</h4>
                      <p className="deck-viewer-preview-type">{previewCard.card?.typeLine || 'Unknown type'}</p>
                      {previewCard.card?.oracleText && (
                        <div className="deck-viewer-preview-text">
                          <ManaText text={previewCard.card.oracleText} symbolSize={14} />
                        </div>
                      )}
                      {(previewCard.card?.power || previewCard.card?.toughness) && (
                        <p className="deck-viewer-preview-pt">
                          {previewCard.card.power}/{previewCard.card.toughness}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="deck-viewer-preview-empty">
                    <p>Select a card to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
