'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { GameCard } from '@/types';
import { ManaText } from '@/components/ui/ManaSymbol';

interface CardPreviewPaneProps {
  card: GameCard | null;
  onClose: () => void;
}

export function CardPreviewPane({ card, onClose }: CardPreviewPaneProps) {
  if (!card) return null;

  const largeImageUrl =
    card.card?.imageUris?.large ||
    card.card?.imageUris?.normal ||
    card.imageUrl ||
    '';

  const cardData = card.card;

  return (
    <AnimatePresence>
      {card && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Preview pane sliding from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-gray-900 z-50 shadow-2xl flex flex-col"
          >
            {/* Close button */}
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl leading-none p-1 bg-gray-900/80 rounded"
              >
                &times;
              </button>
            </div>

            {/* Card image */}
            <div className="p-4 flex justify-center">
              <div className="relative w-72 aspect-[488/680]">
                {largeImageUrl ? (
                  <Image
                    src={largeImageUrl}
                    alt={card.cardName}
                    fill
                    className="object-contain rounded-lg"
                    sizes="288px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">{card.cardName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card details */}
            {cardData && (
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                {/* Mana cost and type */}
                <div className="space-y-1">
                  {cardData.manaCost && (
                    <div className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="text-gray-500">Mana:</span>
                      <ManaText text={cardData.manaCost} symbolSize={16} />
                    </div>
                  )}
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Type:</span> {cardData.typeLine}
                  </p>
                </div>

                {/* Oracle text */}
                {cardData.oracleText && (
                  <div className="bg-gray-800 rounded p-3">
                    <ManaText
                      text={cardData.oracleText}
                      symbolSize={14}
                      className="text-sm text-gray-200 whitespace-pre-wrap"
                    />
                  </div>
                )}

                {/* Set info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    {cardData.setName} ({cardData.setCode.toUpperCase()}) #{cardData.collectorNumber}
                  </p>
                  <p className="capitalize">{cardData.rarity}</p>
                </div>

                {/* Prices */}
                {cardData.prices && (cardData.prices.usd || cardData.prices.eur) && (
                  <div className="text-xs text-gray-500 flex gap-3">
                    {cardData.prices.usd && <span>${cardData.prices.usd}</span>}
                    {cardData.prices.eur && <span>{cardData.prices.eur}EUR</span>}
                  </div>
                )}

                {/* Double-faced card faces */}
                {cardData.cardFaces && cardData.cardFaces.length > 1 && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Card Faces:</p>
                    {cardData.cardFaces.map((face, index) => (
                      <div key={index} className="mb-3">
                        <p className="text-sm font-medium text-gray-300">{face.name}</p>
                        {face.oracleText && (
                          <ManaText
                            text={face.oracleText}
                            symbolSize={12}
                            className="text-xs text-gray-400 mt-1 whitespace-pre-wrap block"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
