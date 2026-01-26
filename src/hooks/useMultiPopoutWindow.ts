'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface PopoutWindowInfo {
  window: Window;
  opponentId: string;
}

export function useMultiPopoutWindow() {
  const popoutsRef = useRef<Map<string, Window>>(new Map());
  const [poppedOutIds, setPoppedOutIds] = useState<string[]>([]);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const openPopout = useCallback((roomKey: string, opponentId: string, myPlayerId: string) => {
    // Store IDs for popout to read
    sessionStorage.setItem(`popout_${opponentId}_opponentId`, opponentId);
    sessionStorage.setItem(`popout_${opponentId}_roomKey`, roomKey);
    sessionStorage.setItem(`popout_${opponentId}_myPlayerId`, myPlayerId);

    const url = `/room/${roomKey}/opponent-view?opponentId=${opponentId}`;
    const features = 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes';

    // If window already exists for this opponent and isn't closed, focus it
    const existingWindow = popoutsRef.current.get(opponentId);
    if (existingWindow && !existingWindow.closed) {
      existingWindow.focus();
      return;
    }

    const newWindow = window.open(url, `opponent-battlefield-${opponentId}`, features);

    if (newWindow) {
      popoutsRef.current.set(opponentId, newWindow);
      setPoppedOutIds(Array.from(popoutsRef.current.keys()));
    }
  }, []);

  const closePopout = useCallback((opponentId: string) => {
    const popoutWindow = popoutsRef.current.get(opponentId);
    if (popoutWindow && !popoutWindow.closed) {
      popoutWindow.close();
    }
    popoutsRef.current.delete(opponentId);
    setPoppedOutIds(Array.from(popoutsRef.current.keys()));
  }, []);

  const closeAllPopouts = useCallback(() => {
    popoutsRef.current.forEach((win) => {
      if (!win.closed) {
        win.close();
      }
    });
    popoutsRef.current.clear();
    setPoppedOutIds([]);
  }, []);

  const isOpponentPoppedOut = useCallback((opponentId: string) => {
    return poppedOutIds.includes(opponentId);
  }, [poppedOutIds]);

  // Poll to check for closed windows
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      let changed = false;
      popoutsRef.current.forEach((win, opponentId) => {
        if (win.closed) {
          popoutsRef.current.delete(opponentId);
          changed = true;
        }
      });
      if (changed) {
        setPoppedOutIds(Array.from(popoutsRef.current.keys()));
      }
    }, 500);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return {
    poppedOutIds,
    openPopout,
    closePopout,
    closeAllPopouts,
    isOpponentPoppedOut,
    hasAnyPopouts: poppedOutIds.length > 0,
  };
}
