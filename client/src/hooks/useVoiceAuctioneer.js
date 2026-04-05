import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for Web Speech API integration for IPL Auction
 * 
 * Provides automated vocal announcements for:
 * 1. New Player Arrival
 * 2. High Bid Updates
 * 3. Auction Results
 */

export const useVoiceAuctioneer = (currentPlayer, currentBid, playerResult) => {
  const synth = window.speechSynthesis;
  const lastSpokenPlayer = useRef(null);
  const lastSpokenResult = useRef(null);

  const speak = useCallback((text) => {
    if (!synth) return;
    
    // Stop previous to avoid overlap
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a deep, professional voice (English-UK/US)
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.pitch = 0.9; // Lower pitch for authority
    utterance.rate = 1.0;  // Standard pace
    utterance.volume = 0.8;
    
    synth.speak(utterance);
  }, [synth]);

  // Handle New Player
  useEffect(() => {
    if (currentPlayer && currentPlayer.id !== lastSpokenPlayer.current) {
      lastSpokenPlayer.current = currentPlayer.id;
      const basePrice = currentPlayer.base_price;
      speak(`Up next. ${currentPlayer.name}. Role: ${currentPlayer.role}. Base price: ${basePrice} Crores.`);
    }
  }, [currentPlayer, speak]);

  // Handle Auction Result
  useEffect(() => {
    if (playerResult && playerResult.player?.id !== lastSpokenResult.current) {
      lastSpokenResult.current = playerResult.player?.id;
      const resultMsg = playerResult.result === 'SOLD' 
        ? `${playerResult.player.name}. Sold to ${playerResult.teamId}. Final price: ${playerResult.amount} Crores.`
        : `${playerResult.player.name}. remains Unsold. Moving to the next lot.`;
      
      // Delay slightly for dramatic effect
      setTimeout(() => speak(resultMsg), 500);
    }
  }, [playerResult, speak]);

  return { speak };
};
