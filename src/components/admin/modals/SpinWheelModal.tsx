import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, HelpCircle, Sparkles, Star, RefreshCw, X, Play } from 'lucide-react';
import { LotteryCampaign, ManagedUser } from '../../../types';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: LotteryCampaign;
  availableUsers: ManagedUser[];
  onDrawCompleted: (winners: { id: string; name: string; email: string; prizeAmount: number }[]) => Promise<void>;
  theme?: 'dark' | 'light';
}

const SECTOR_THEMES = [
  { bg: '#0d9488', text: '#ffffff' }, // Teal
  { bg: '#3b82f6', text: '#ffffff' }, // Blue
  { bg: '#f59e0b', text: '#000000' }, // Yellow/Amber
  { bg: '#ec4899', text: '#ffffff' }, // Pink
  { bg: '#10b981', text: '#ffffff' }, // Emerald
  { bg: '#8b5cf6', text: '#ffffff' }, // Violet
  { bg: '#f97316', text: '#ffffff' }, // Orange
  { bg: '#ef4444', text: '#ffffff' }, // Red
];

export default function SpinWheelModal({
  isOpen,
  onClose,
  campaign,
  availableUsers,
  onDrawCompleted,
  theme = 'dark',
}: SpinWheelModalProps) {
  // We need to determine candidates initially
  // We need to keep a list of active candidates during the modal session,
  // removing winners on subsequent spins if multi-draw requires it.
  const [candidates, setCandidates] = useState<ManagedUser[]>([]);
  const [sessionWinners, setSessionWinners] = useState<{ id: string; name: string; email: string; prizeAmount: number }[]>([]);
  const [currentWinner, setCurrentWinner] = useState<ManagedUser | null>(null);
  
  // Audio & Animation states
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flashToggle, setFlashToggle] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDark = theme === 'dark';
  const winnersToDraw = campaign.winnersPerDraw || 1;

  // Initialize candidates
  useEffect(() => {
    if (isOpen && campaign) {
      // Find past drawn winner IDs to exclude them from eligibility
      const alreadyWonIds: string[] = [];
      const draws = campaign.monthlyDraws || [];
      draws.forEach(d => {
        if (d.status === 'completed') {
          if (d.winnerId) {
            d.winnerId.split(',').forEach(id => {
              const trimmed = id.trim();
              if (trimmed && !alreadyWonIds.includes(trimmed)) {
                alreadyWonIds.push(trimmed);
              }
            });
          }
          if (d.winners) {
            d.winners.forEach(w => {
              if (w.id && !alreadyWonIds.includes(w.id)) {
                alreadyWonIds.push(w.id);
              }
            });
          }
        }
      });

      const selectedUserIds = campaign.selectedUsers || [];
      const eligibleUsers = availableUsers.filter(
        u => selectedUserIds.includes(u.id) && !alreadyWonIds.includes(u.id)
      );

      setCandidates(eligibleUsers);
      setSessionWinners([]);
      setCurrentWinner(null);
      setRotation(0);
      setShowCelebration(false);
      setIsSpinning(false);
    }
  }, [isOpen, campaign, availableUsers]);

  // Flash border lightbulbs
  useEffect(() => {
    let interval: any;
    if (isOpen) {
      interval = setInterval(() => {
        setFlashToggle(prev => !prev);
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRoundName = campaign.monthlyDraws?.find(d => d.status === 'pending')?.monthNumber 
    ? `Round #${campaign.monthlyDraws.find(d => d.status === 'pending')?.monthNumber}` 
    : 'New Round';

  const basePrize = (campaign.selectedUsers?.length || 0) * (campaign.monthlyAmount || 0);
  const prizePerWinner = winnersToDraw > 0 ? basePrize / winnersToDraw : basePrize;

  // SVG parameters
  const cx = 200;
  const cy = 200;
  const r = 160; // radius of inner wheel
  const numSlices = candidates.length;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  // Build sector path helpers
  const describeSlice = (sliceStartX: number, sliceStartY: number, sliceEndX: number, sliceEndY: number, largeArc: number) => {
    return `M ${cx} ${cy} L ${sliceStartX} ${sliceStartY} A ${r} ${r} 0 ${largeArc} 1 ${sliceEndX} ${sliceEndY} Z`;
  };

  // Render slices
  const slices = candidates.map((candidate, i) => {
    const sliceAngle = 360 / numSlices;
    const startAngle = i * sliceAngle;
    const endAngle = (i + 1) * sliceAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const startX = cx + r * Math.cos(startRad);
    const startY = cy + r * Math.sin(startRad);
    const endX = cx + r * Math.cos(endRad);
    const endY = cy + r * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;
    const pathData = describeSlice(startX, startY, endX, endY, largeArc);

    const midAngle = startAngle + sliceAngle / 2;
    const themeColor = SECTOR_THEMES[i % SECTOR_THEMES.length];

    return {
      pathData,
      themeColor,
      midAngle,
      id: candidate.id,
      name: candidate.name,
    };
  });

  // Calculate coordinates for bezel dots (lightbulbs)
  const bezelDotsCount = 24;
  const bezelDots = Array.from({ length: bezelDotsCount }).map((_, i) => {
    const angle = (i * 360) / bezelDotsCount;
    const dotsRadius = 185;
    const x = cx + dotsRadius * Math.cos((angle * Math.PI) / 180);
    const y = cy + dotsRadius * Math.sin((angle * Math.PI) / 180);
    const isActive = flashToggle ? i % 2 === 0 : i % 2 !== 0;
    return { x, y, color: isActive ? '#f59e0b' : '#ffffff', glow: isActive };
  });

  // Perform wheel spin
  const handleSpinClick = () => {
    if (isSpinning || candidates.length === 0) return;

    setIsSpinning(true);
    setShowCelebration(false);

    // Pick a winner random index from the active candidates list
    const winnerIdx = Math.floor(Math.random() * candidates.length);
    const selectedWinner = candidates[winnerIdx];

    // Compute angle to align winner's sector center with the right-hand arrow (0 degrees)
    const sliceAngle = 360 / numSlices;
    const sectorCenterAngle = winnerIdx * sliceAngle + sliceAngle / 2;
    
    // Rotation calculations to stop on selector (0 degrees pointing right)
    const targetOffset = (360 - sectorCenterAngle) % 360;
    
    // Continuous spinning onwards (at least 5 full rotations + offset)
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const nextRotation = rotation + (extraSpins * 360) + ((targetOffset - (rotation % 360) + 360) % 360);

    setRotation(nextRotation);

    // Wait for the rotation transition to complete
    setTimeout(() => {
      setIsSpinning(false);
      
      // Update candidates immediately so the board reflects the removal
      setCandidates(prev => prev.filter(u => u.id !== selectedWinner.id));
      setRotation(0); // Reset rotation to 0 for the new wheel layout

      setCurrentWinner(selectedWinner);
      setShowCelebration(true);

      // Successfully drawn - auto-clear the celebration after a short delay so the next spin can start
      setTimeout(() => {
        handleNextSpinSetup();
      }, 3500);

      // Add to session winners
      setSessionWinners(prev => [
        ...prev,
        {
          id: selectedWinner.id,
          name: selectedWinner.name,
          email: selectedWinner.email,
          prizeAmount: prizePerWinner,
        },
      ]);
    }, 4000); // matches the transition-duration
  };

  // Next spin setup: clear current winner UI state
  const handleNextSpinSetup = () => {
    setCurrentWinner(null);
    setShowCelebration(false);
  };

  // Final database update submit
  const handleFinalizeDraw = async () => {
    if (sessionWinners.length === 0 || saving) return;

    setSaving(true);
    try {
      await onDrawCompleted(sessionWinners);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to finalize the draw. Please check Firestore rules.');
    } finally {
      setSaving(false);
    }
  };

  // Remaining draws count calculation
  const remainingVotesToDraw = Math.max(0, winnersToDraw - sessionWinners.length);

  return (
    <div className="w-full h-full p-1 md:p-2">
      <div 
        className={`w-full max-w-5xl mx-auto rounded-3xl border shadow-xl relative flex flex-col md:flex-row overflow-hidden min-h-[550px] ${
          isDark ? 'bg-[#0b0c10] border-amber-500/20 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Close Button if we want to abandon */}
        <button
          onClick={onClose}
          disabled={isSpinning || saving}
          className={`absolute top-2.5 right-2.5 md:top-3.5 md:right-3.5 px-3 py-1.5 rounded-xl border transition-all z-15 cursor-pointer text-[10px] font-bold font-mono tracking-wider flex items-center gap-1.5 ${
            isDark 
              ? 'border-neutral-850 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white' 
              : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
          }`}
          title="Exit Draw and Go Back"
        >
          <X className="w-3.5 h-3.5" />
          EXIT DRAW
        </button>

        {/* LEFT COLUMN: SPIN WHEEL EMBEDDED */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 border-b md:border-b-0 md:border-r border-amber-500/10 relative">
          
          {/* Wheel header badge */}
          <div className="text-center mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/20 font-bold font-mono text-[10px] tracking-wider text-amber-500 uppercase">
              <Trophy className="w-3.5 h-3.5" />
              {currentRoundName} PRIZE GAME
            </span>
            <h3 className={`text-base md:text-lg font-black mt-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              Interactive Draw Wheel
            </h3>
          </div>

          <div className="relative w-[260px] h-[260px] md:w-[320px] md:h-[320px] flex items-center justify-center select-none shrink-0 my-2">
            
            {/* Spinning wrapper structure matching provided image */}
            <div className="absolute inset-0 bg-[#0e3040]/30 rounded-full border border-teal-500/30 blur-2xl pointer-events-none"></div>

            {/* Pointer Beak on the RIGHT side center */}
            <div className="absolute right-[-8px] top-[calc(50%-10px)] z-20 pointer-events-none drop-shadow-lg">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[18px] border-r-amber-500 animate-pulse"></div>
            </div>

            {/* Decorative support base at bottom to look like the illustration */}
            <div className={`absolute bottom-[-10px] w-24 h-5 rounded-t-xl border-t z-0 ${
              isDark ? 'bg-teal-950/60 border-teal-500/30' : 'bg-teal-100 border-teal-300'
            }`}></div>

            {/* REAL SVG SPIN WHEEL */}
            <div 
              className="w-full h-full relative z-10 transition-transform duration-1000 ease-out"
              style={{
                transform: `rotate(0deg)`,
              }}
            >
              {/* Outer decorative bezel SVG that stays still! */}
              <svg 
                viewBox="0 0 400 400" 
                className="w-full h-full absolute inset-0 z-0"
              >
                {/* Outer Blue Ring Bezel matching image */}
                <circle cx="200" cy="200" r="185" fill={isDark ? '#083344' : '#115e59'} stroke="#0d9488" strokeWidth="8" />
                <circle cx="200" cy="200" r="181" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="3 3" />
                
                {/* Decorative border dots */}
                {bezelDots.map((dot, i) => (
                  <circle
                    key={i}
                    cx={dot.x}
                    cy={dot.y}
                    r={dot.glow ? 5 : 3.5}
                    fill={dot.color}
                    className="transition-all duration-300 pointer-events-none shadow-sm"
                    style={{
                      filter: dot.glow ? 'drop-shadow(0 0 4px #eab308)' : 'none',
                    }}
                  />
                ))}
              </svg>

              {/* ROTATING segments center circle inner wheel */}
              <div
                className="w-full h-full absolute inset-0 z-10"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4000ms cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
                }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {/* Inside background */}
                  <circle cx="200" cy="200" r="162" fill={isDark ? '#111827' : '#f4f4f5'} />

                  {/* Draw each candidate sector slice */}
                  {numSlices > 0 ? (
                    slices.map((slice, i) => (
                      <g key={slice.id}>
                        {/* Slice fill */}
                        <path
                          d={slice.pathData}
                          fill={slice.themeColor.bg}
                          stroke={isDark ? '#0b0c10' : '#ffffff'}
                          strokeWidth="2.5"
                          className="hover:brightness-105 transition-all"
                        />
                        {/* Rotated layout text name radiating from center */}
                        <g transform={`translate(${cx}, ${cy}) rotate(${slice.midAngle}) translate(${r * 0.52}, 0)`}>
                          <text
                            x="10"
                            y="4"
                            textAnchor="start"
                            fill={slice.themeColor.text}
                            className="font-bold tracking-tight text-[10px] md:text-sm select-none"
                            style={{
                              transform: slice.midAngle > 90 && slice.midAngle < 270 ? 'rotate(180deg) translate(-80px, -8px)' : 'none',
                              fontFamily: 'system-ui, sans-serif',
                            }}
                          >
                            {slice.name.length > 10 ? slice.name.substring(0, 10) + '..' : slice.name}
                          </text>
                        </g>
                      </g>
                    ))
                  ) : (
                    /* Default display if no candidates mapped */
                    <circle cx="200" cy="200" r="160" fill="#3f3f46" />
                  )}

                  {/* Outer edge trim of sector disk */}
                  <circle cx="200" cy="200" r="161.5" fill="none" stroke={isDark ? '#0f172a' : '#cbd5e1'} strokeWidth="1.5" />
                </svg>
              </div>

              {/* Central hub (Stay-still center yellow core with Spin Label) */}
              <div className="absolute inset-0 flex items-center justify-center z-25">
                <button
                  type="button"
                  onClick={handleSpinClick}
                  disabled={isSpinning || candidates.length === 0 || remainingVotesToDraw === 0 || showCelebration}
                  className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:from-zinc-650 disabled:to-zinc-550 border-4 border-emerald-950 dark:border-neutral-900 text-neutral-950 font-black tracking-wider shadow-2xl rounded-full flex flex-col items-center justify-center transition-all transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:pointer-events-none cursor-pointer"
                >
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#000] opacity-80 leading-none">Tap</span>
                  <span className="text-xs md:text-sm font-extrabold text-[#000] uppercase font-sans">SPIN</span>
                </button>
              </div>

            </div>
          </div>

          {/* Action guidance */}
          <div className="text-center mt-2 z-10">
            {remainingVotesToDraw > 0 ? (
              <p className="text-xs text-amber-500/90 font-bold flex items-center gap-1.5 justify-center">
                <Sparkles className="w-3.5 h-3.5" />
                Draw {sessionWinners.length + 1} of {winnersToDraw} Multi-Winner
              </p>
            ) : (
              <p className="text-xs text-emerald-500 font-bold flex items-center gap-1.5 justify-center">
                ✓ All {winnersToDraw} winners drawn! Ready to save.
              </p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: DRAW WORK STATUS PANEL - OPTIMIZED WITH HIGH COMPACTNESS */}
        <div className={`p-4 md:p-5 flex flex-col justify-between w-full md:w-72 shrink-0 border-t md:border-t-0 md:border-l ${
          isDark ? 'border-amber-500/10 bg-[#0f111a]/40' : 'border-zinc-200 bg-gray-55/60'
        }`}>
          <div className="space-y-4">
            
            {/* Draw stats & Campaign Details */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono tracking-wider text-gray-500 uppercase block">ACTIVE CAMPAIGN</label>
              <h4 className="text-sm font-bold font-sans tracking-tight">{campaign.title}</h4>
              <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{campaign.description || 'No supplementary guidelines.'}</p>
            </div>

            {/* Prize value info bento */}
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-black/40 border-neutral-800' : 'bg-white border-zinc-200'
            } space-y-0.5`}>
              <span className="text-[9px] uppercase font-mono font-bold text-gray-400">MAPPED PRIZE FOR DRAW</span>
              <div className="text-base font-black text-amber-500">
                ৳ {basePrize.toLocaleString()} BDT
              </div>
              {winnersToDraw > 1 && (
                <div className={`text-[10px] font-semibold font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Per Winner: <span className="text-emerald-500 font-bold">৳ {Math.floor(prizePerWinner).toLocaleString()} BDT</span>
                </div>
              )}
            </div>

            {/* List of Drawn Winners in this modal session */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-gray-500 tracking-wider">
                <span>Drawn Winners ({sessionWinners.length}/{winnersToDraw})</span>
              </div>

              {sessionWinners.length === 0 ? (
                <div className={`py-6 text-center rounded-xl border text-xs italic ${
                  isDark ? 'border-dashed border-neutral-800 text-neutral-500' : 'border-dashed border-zinc-300 text-zinc-400'
                }`}>
                  No candidates drawn yet. Click 'SPIN' to begin.
                </div>
              ) : (
                <div className="max-h-[140px] overflow-y-auto space-y-1 pr-0.5">
                  {sessionWinners.map((winner, idx) => (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      key={winner.id || idx}
                      className={`p-1 px-1.5 rounded-lg border flex items-center justify-between gap-1.5 ${
                        isDark ? 'bg-neutral-900/60 border-neutral-850' : 'bg-white border-zinc-205 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-4.5 h-4.5 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-[9px] shrink-0 font-mono">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate text-amber-500 leading-tight">{winner.name}</p>
                          <p className={`text-[8px] font-mono truncate leading-none ${isDark ? 'text-gray-505' : 'text-gray-400'}`}>{winner.email}</p>
                        </div>
                      </div>
                      <div className="text-[9px] font-bold text-emerald-500 whitespace-nowrap shrink-0">
                        ৳ {winner.prizeAmount.toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Draw Winner Popups & Final Submit button - ULTRA COMPACT */}
          <div className="mt-4 space-y-2.5 pt-3 border-t border-amber-500/10">
            <AnimatePresence>
              {showCelebration && currentWinner && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={`p-3 rounded-xl border text-center relative ${
                    isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <Sparkles className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 text-amber-500 animate-bounce" />
                  <p className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-500 tracking-widest uppercase">
                    WINNER DRAWN!
                  </p>
                  <h4 className="text-sm font-extrabold mt-0.5 text-amber-500">
                    Dear {currentWinner.name}
                  </h4>
                  <p className={`text-[9px] uppercase font-mono tracking-widest mt-0.5 leading-none ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    congratulation!
                  </p>

                  {remainingVotesToDraw === 0 && (
                    <div className="text-[10px] text-emerald-500 font-bold mt-1.5">
                       All targets mapped!
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {remainingVotesToDraw === 0 && sessionWinners.length > 0 && (
              <button
                type="button"
                onClick={handleFinalizeDraw}
                disabled={saving}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-[#000] rounded-xl font-extrabold font-sans text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving Draw...
                  </>
                ) : (
                  <>
                    ✓ SAVE & FINALIZE DRAWS
                  </>
                )}
              </button>
            )}
            
            {remainingVotesToDraw > 0 && (
              <div className={`p-2 rounded-xl text-center text-[10px] font-mono border ${
                isDark ? 'bg-black/20 border-neutral-850 text-neutral-500' : 'bg-zinc-100 border-zinc-200 text-zinc-500'
              }`}>
                {candidates.length === 0 ? 'No candidates available.' : `Tap ‘SPIN’ in center.`}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
