/**
 * Strategic Intelligence Analyzer for IPL Auction
 * 
 * Provides:
 * 1. Power Ratings for squads (Batting, Pace, Spin, WK)
 * 2. Real-time Tactical Advice based on squad gaps and budget.
 */

export const analyzeSquad = (squad, purse) => {
  const counts = {
    Batsman: 0,
    Bowler: 0,
    'All-rounder': 0,
    'Wicket Keeper': 0,
    Overseas: 0
  };

  squad.forEach(p => {
    counts[p.role] = (counts[p.role] || 0) + 1;
    if (p.nationality !== 'India') counts.Overseas++;
  });

  // 1. Calculate Power Ratings (0-100)
  // Simple heuristic based on balanced team construction
  const power = {
    batting: Math.min(100, (counts.Batsman * 15) + (counts['All-rounder'] * 8)),
    pace: Math.min(100, (counts.Bowler * 12) + (counts['All-rounder'] * 5)),
    spin: Math.min(100, (counts.Bowler * 10) + (counts['All-rounder'] * 7)),
    bench: Math.min(100, (squad.length / 25) * 100)
  };

  // 2. Generate AI Tactical Advice
  const advice = [];
  
  if (counts['Wicket Keeper'] === 0) advice.push("CRITICAL: No Wicket Keeper in squad. Prioritize a keeper in next set.");
  if (counts.Overseas >= 8) advice.push("LIMIT: Overseas slots full (8/8). Focus on Indian talent now.");
  if (purse < 5 && squad.length < 15) advice.push("CAUTION: Low budget with high vacancy. Avoid bidding wars.");
  if (counts.Batsman < 4 && squad.length > 10) advice.push("SQUAD GAP: Batting core is weak. Look for reliable top-order assets.");
  if (counts.Bowler < 4 && squad.length > 10) advice.push("SQUAD GAP: Pace/Spin attack lacks depth. Secure a primary bowler.");
  
  if (advice.length === 0) advice.push("STRATEGY: Squad balance is optimal. Maintain budget for marquee finishers.");

  return { power, counts, tips: advice };
};

export const getBudgetForecast = (purse, currentSquadSize) => {
  const remainingSlots = 25 - currentSquadSize;
  if (remainingSlots <= 0) return 0;
  
  // Reserve 0.2Cr for each remaining slot (minimum base price)
  const reserve = (remainingSlots - 1) * 0.2;
  const safeMax = Math.max(0, purse - reserve);
  
  return parseFloat(safeMax.toFixed(2));
};
