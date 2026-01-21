'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { BoardCard } from '@/types';
import { useGameStore } from '@/store/gameStore';

interface CardEditModalProps {
  isOpen: boolean;
  card: BoardCard | null;
  onClose: () => void;
}

export function CardEditModal({ isOpen, card, onClose }: CardEditModalProps) {
  const { updateCardStats, createCardCopy } = useGameStore();

  // Local state for editing
  const [counters, setCounters] = useState(0);
  const [powerMod, setPowerMod] = useState(0);
  const [toughnessMod, setToughnessMod] = useState(0);

  // Parse base power/toughness from card data
  const getBasePowerToughness = useCallback(() => {
    if (!card?.card) return { basePower: null, baseToughness: null };

    const pt = card.card.power && card.card.toughness
      ? { basePower: parseInt(card.card.power) || 0, baseToughness: parseInt(card.card.toughness) || 0 }
      : { basePower: null, baseToughness: null };

    return pt;
  }, [card]);

  // Initialize state when card changes
  useEffect(() => {
    if (card) {
      setCounters(card.counters || 0);
      setPowerMod(card.modifiedPower ?? 0);
      setToughnessMod(card.modifiedToughness ?? 0);
    }
  }, [card]);

  const handleSave = useCallback(() => {
    if (!card) return;

    updateCardStats(card.instanceId, {
      counters,
      modifiedPower: powerMod,
      modifiedToughness: toughnessMod,
    });

    onClose();
  }, [card, counters, powerMod, toughnessMod, updateCardStats, onClose]);

  const handleMakeCopy = useCallback(() => {
    if (!card) return;
    createCardCopy(card);
  }, [card, createCardCopy]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  const { basePower, baseToughness } = getBasePowerToughness();
  const isCreature = basePower !== null && baseToughness !== null;
  const imageUrl = card.imageUrl || card.card?.imageUris?.normal || '';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-gray-900 rounded-lg w-full max-w-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                Edit Card
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl leading-none p-1"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Card preview */}
              <div className="flex gap-4">
                <div className="relative w-32 h-44 rounded overflow-hidden bg-gray-700 shrink-0">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={card.cardName}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm text-gray-500 text-center px-2">
                        {card.cardName}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium text-lg">{card.cardName}</h3>
                  {card.card?.typeLine && (
                    <p className="text-gray-400 text-sm mt-1">{card.card.typeLine}</p>
                  )}
                  {card.isCopy && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-purple-600/50 text-purple-200 text-xs rounded">
                      Copy
                    </span>
                  )}
                </div>
              </div>

              {/* Counters (top-right of card) */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Counters</h4>
                    <p className="text-gray-400 text-xs">Displayed on top-right of card</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCounters(Math.max(0, counters - 1))}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-lg font-bold"
                    >
                      -
                    </button>
                    <span className="text-white text-xl font-bold w-8 text-center">{counters}</span>
                    <button
                      onClick={() => setCounters(counters + 1)}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Power/Toughness (for creatures) */}
              {isCreature && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-1">Power / Toughness</h4>
                  <p className="text-gray-400 text-xs mb-3">Base: {basePower}/{baseToughness} - Displayed on bottom-right</p>
                  <div className="flex gap-6">
                    {/* Power */}
                    <div className="flex-1">
                      <label className="text-gray-300 text-sm block mb-2">Power Modifier</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPowerMod(powerMod - 1)}
                          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-lg font-bold"
                        >
                          -
                        </button>
                        <span className={`text-xl font-bold w-12 text-center ${powerMod > 0 ? 'text-green-400' : powerMod < 0 ? 'text-red-400' : 'text-white'}`}>
                          {powerMod >= 0 ? '+' : ''}{powerMod}
                        </span>
                        <button
                          onClick={() => setPowerMod(powerMod + 1)}
                          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-center text-gray-400 text-sm mt-1">
                        = {basePower + powerMod}
                      </p>
                    </div>
                    {/* Toughness */}
                    <div className="flex-1">
                      <label className="text-gray-300 text-sm block mb-2">Toughness Modifier</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setToughnessMod(toughnessMod - 1)}
                          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-lg font-bold"
                        >
                          -
                        </button>
                        <span className={`text-xl font-bold w-12 text-center ${toughnessMod > 0 ? 'text-green-400' : toughnessMod < 0 ? 'text-red-400' : 'text-white'}`}>
                          {toughnessMod >= 0 ? '+' : ''}{toughnessMod}
                        </span>
                        <button
                          onClick={() => setToughnessMod(toughnessMod + 1)}
                          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-center text-gray-400 text-sm mt-1">
                        = {baseToughness + toughnessMod}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Make a Token Copy */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Make a Token Copy</h4>
                    <p className="text-gray-400 text-xs">Creates a copy of this card on the battlefield</p>
                  </div>
                  <button
                    onClick={handleMakeCopy}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
                  >
                    Create Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
