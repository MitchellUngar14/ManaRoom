'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

export function usePopoutWindow() {
  const popoutRef = useRef<Window | null>(null);
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const openPopout = useCallback((roomKey: string, opponentId: string) => {
    // Store opponent ID for popout to read
    sessionStorage.setItem('popout_opponentId', opponentId);
    sessionStorage.setItem('popout_roomKey', roomKey);

    const url = `/room/${roomKey}/opponent-view`;
    const features = 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes';

    // If window already exists and isn't closed, focus it
    if (popoutRef.current && !popoutRef.current.closed) {
      popoutRef.current.focus();
      return;
    }

    popoutRef.current = window.open(url, 'opponent-battlefield', features);

    if (popoutRef.current) {
      setIsPopoutOpen(true);

      // Poll to check if window is closed
      checkIntervalRef.current = setInterval(() => {
        if (popoutRef.current?.closed) {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
          setIsPopoutOpen(false);
          popoutRef.current = null;
        }
      }, 500);
    }
  }, []);

  const closePopout = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    if (popoutRef.current && !popoutRef.current.closed) {
      popoutRef.current.close();
    }
    popoutRef.current = null;
    setIsPopoutOpen(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      // Don't close the popout on unmount - let it survive page refreshes
    };
  }, []);

  return { isPopoutOpen, openPopout, closePopout };
}
