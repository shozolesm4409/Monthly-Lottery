import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Moon, Trophy, Ticket, Globe, Gift, Users, ArrowLeft, Sparkles } from 'lucide-react';
import { LotteryCampaign, ManagedUser } from '../../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

interface RoadmapViewProps {
  campaign: LotteryCampaign | null;
  recentlyDrawnMonth?: number | null;
  onBack: () => void;
  onCheckWinners: (campaignId: string) => void;
  onNavigateToAchievements?: () => void;
  theme?: 'dark' | 'light';
  availableUsers?: ManagedUser[];
}

export default function RoadmapView({ 
  campaign, 
  recentlyDrawnMonth, 
  onBack, 
  onCheckWinners,
  onNavigateToAchievements,
  theme, 
  availableUsers = [] 
}: RoadmapViewProps) {
  const [showReveal, setShowReveal] = useState(false);
  const [revealedWinnerName, setRevealedWinnerName] = useState('');

  useEffect(() => {
    if (recentlyDrawnMonth && campaign) {
      const drawnDraw = campaign.monthlyDraws?.find(d => d.monthNumber === recentlyDrawnMonth);
      if (drawnDraw) {
        setRevealedWinnerName(drawnDraw.winnerName || 'Unknown');
        setShowReveal(true);
        
        // Hide the big reveal and scroll to roadmap after 6 seconds naturally, 
        // or user can click 'Continue to Roadmap'
        // Actually, let's keep it visible until they dismiss, or just show it integrated
      }
    }
  }, [recentlyDrawnMonth, campaign]);

  if (!campaign) return null;

  const pastDraws = campaign.monthlyDraws?.filter(d => d.status === 'completed') || [];
  const upcomingDraws = campaign.monthlyDraws?.filter(d => d.status === 'pending') || [];
  
  // Compute eligible names for upcoming draws
  const alreadyWonIds: string[] = [];
  pastDraws.forEach(d => {
    if (d.winnerId) {
      d.winnerId.split(',').forEach(id => {
        const trimmed = id.trim();
        if (trimmed && !alreadyWonIds.includes(trimmed)) {
          alreadyWonIds.push(trimmed);
        }
      });
    }
  });
  const selectedUserIds = campaign?.selectedUsers || [];
  const eligibleUserIds = selectedUserIds.filter(id => !alreadyWonIds.includes(id));
  const eligibleNames = availableUsers
    .filter(u => eligibleUserIds.includes(u.id))
    .map(u => u.name);

  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative w-full rounded-2xl md:rounded-3xl p-3 md:p-4 max-w-5xl mx-auto my-2 shadow-sm ${
        isDark ? 'bg-[#0f1118] text-gray-100' : 'bg-white text-gray-900 border border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${
              isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
            <Calendar className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className={`text-xl md:text-2xl font-bold font-sans ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Roadmap: {campaign.title}
          </h2>
        </div>
      </div>

      <AnimatePresence>
        {showReveal && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
             className={`mb-6 overflow-hidden rounded-3xl border shadow-2xl relative ${
              isDark 
                ? 'bg-gradient-to-br from-[#1a1500] via-[#0f0a00] to-[#0f1118] border-amber-500/30' 
                : 'bg-gradient-to-br from-amber-100 via-amber-50 to-white border-amber-300'
            }`}
          >
            <div className="px-4 py-8 md:py-12 flex flex-col items-center justify-center text-center relative z-10">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.6, duration: 1 }}
                className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30 mb-6 border-4 border-white dark:border-[#0f1118]"
              >
                <Trophy className="w-10 h-10 md:w-12 md:h-12 text-amber-900" />
              </motion.div>
              
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-1"
              >
                Draw #{recentlyDrawnMonth} Complete
              </motion.span>
              
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-2xl font-bold font-sans text-amber-500 mb-2 lowercase"
              >
                congratulation!
              </motion.span>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="relative"
              >
                <Sparkles className="absolute -top-6 -left-8 w-8 h-8 text-amber-400 animate-pulse" />
                <Sparkles className="absolute -bottom-4 -right-6 w-6 h-6 text-yellow-300 animate-bounce" />
                <h3 className="text-xl md:text-3xl font-extrabold font-sans tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 drop-shadow-sm px-4 py-2">
                  Dear {revealedWinnerName}
                </h3>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className={`max-w-md ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                The random draw has been finalized! They are our winner for Draw #{recentlyDrawnMonth}.
              </motion.p>
              
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                onClick={() => setShowReveal(false)}
                className={`mt-8 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'
                }`}
              >
                Continue to Roadmap
              </motion.button>
            </div>
            
            {/* Background elements */}
            <Sparkles className="absolute top-10 left-10 w-8 h-8 text-amber-400/40 animate-pulse" />
            <Sparkles className="absolute bottom-12 right-12 w-12 h-12 text-amber-500/30 animate-pulse" style={{ animationDelay: '1s' }} />
            <Trophy className="absolute -bottom-8 -left-8 w-48 h-48 text-amber-500/5 -rotate-12 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-6 relative">
        
        {/* Timeline Labels & Dots */}
        <div className="w-full md:w-32 shrink-0 relative hidden md:block">
          {/* Continuous thick blue bar */}
          <div className={`absolute top-4 bottom-12 right-6 w-[28px] rounded-full z-0 ${
            isDark ? 'bg-[#181d2e]' : 'bg-[#161f36]'
          }`}></div>

          <div className="relative z-10 flex flex-col space-y-8 h-full">
            
            {/* Start Node */}
            <div className="flex items-center justify-end pr-8 pt-4">
              <span className={`mr-6 font-bold text-[15px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Start</span>
              <div className={`absolute right-[28px] w-5 h-5 rounded-full bg-amber-500 border-[3px] ${isDark ? 'border-[#161f36]' : 'border-white'} shadow-[0_0_0_2px_#f59e0b]`}></div>
            </div>

            {/* Spacer for Kickoff box (Kickoff height approx 80px) */}
            <div className="h-6"></div>

            {/* Past Draws Dot */}
            {pastDraws.length > 0 && (
              <div className="flex items-center justify-end pr-8 mt-2">
                 <div className="absolute right-[28px] w-5 h-5 rounded-full bg-amber-500 shadow-[0_0_0_2px_#161f36]"></div>
              </div>
            )}
            
            {/* Past Draws Spacer */}
            {pastDraws.length > 0 && <div className="h-24"></div>}

            {/* Upcoming Draws Labels & Dots */}
            {upcomingDraws.map((d, i) => (
              <div key={d.monthNumber} className={`flex items-center justify-end pr-8 ${i === 0 ? 'mt-8' : 'mt-4'}`}>
                <span className="mr-6 font-bold text-[15px] text-gray-600 dark:text-gray-300">Draw {d.monthNumber}</span>
                <div className="absolute right-[28px] w-5 h-5 rounded-full bg-gray-800 border-[3px] border-[#161f36] shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"></div>
              </div>
            ))}

            {/* Spacer to push Completed down slightly */}
            <div className="flex-grow"></div>

            {/* Completed Node */}
            <div className="flex items-center justify-end pr-8 pb-12 mt-8">
              <span className={`mr-6 font-bold text-[15px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Completed</span>
              <div className={`absolute right-[28px] w-5 h-5 rounded-full bg-[#8b5cf6] border-[3px] ${isDark ? 'border-[#161f36]' : 'border-white'}`}></div>
            </div>
          </div>
        </div>

        {/* Mobile simplified timeline view indicator */}
        <div className="md:hidden block mb-6 px-2">
            <div className="flex items-center gap-2 text-sm font-bold bg-[#161f36] text-white py-2 px-4 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              Roadmap Progress
            </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 space-y-4 pb-12 md:pb-0 z-10 w-full overflow-hidden">
          
          {/* Registered Users for Campaign */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#151a28] border-gray-800' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Registered Users ({campaign.selectedUsers?.length || 0})
            </h3>
            <div className="grid grid-cols-6 gap-3">
              {campaign.selectedUsers?.map((userId, index) => {
                const user = availableUsers.find(u => u.id === userId);
                if (!user) return null;

                // Check if user is a winner in any past draw
                const isWinner = pastDraws.some(draw => draw.winnerId?.split(',').map(id => id.trim()).includes(user.id));
                
                return (
                  <div key={user.id} className="relative flex flex-col items-center gap-1.5 min-w-0">
                    <div className="relative">
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                        alt={user.name} 
                        className="w-12 h-12 rounded-full border-2 border-gray-700/20 object-cover"
                      />
                      {isWinner && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1 shadow-md border-2 border-white dark:border-[#0f1118]">
                           <Trophy className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {pastDraws.some(draw => draw.winnerId?.split(',').map(id => id.trim()).includes(user.id)) && (
                        <div className="absolute -bottom-1 -left-1 bg-gray-800 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-[#0f1118]">
                          {pastDraws.find(draw => draw.winnerId?.split(',').map(id => id.trim()).includes(user.id))?.monthNumber}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-center truncate w-full font-medium text-gray-500 dark:text-gray-400">
                      {user.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Past Draw Winners (Horizontal Scroll) */}
          {pastDraws.length > 0 && (
            <div className="space-y-3 pb-2">
              <h3 className="font-bold text-lg px-1 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Past Draw Winners
              </h3>
              <div className="w-full">
                <Swiper
                  modules={[Autoplay, Pagination]}
                  spaceBetween={16}
                  slidesPerView="auto"
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 3500, disableOnInteraction: false }}
                  className="w-full pb-8"
                >
                  {pastDraws.map(d => (
                    <SwiperSlide key={d.monthNumber} className="max-w-[260px] pointer-events-auto">
                      <div className={`p-3 rounded-xl border shadow-sm relative overflow-hidden h-full ${
                        d.monthNumber === recentlyDrawnMonth 
                          ? (isDark ? 'bg-amber-500/10 border-amber-500' : 'bg-amber-50 border-amber-400')
                          : (isDark ? 'bg-[#151a28] border-gray-800' : 'bg-white border-gray-200')
                      }`}>
                        {d.monthNumber === recentlyDrawnMonth && (
                          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500 blur-2xl opacity-40"></div>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-bold px-2 py-1 rounded inline-flex items-center gap-1 border border-amber-500/20 uppercase tracking-wider">
                            <Trophy className="w-3 h-3" /> {d.winnerId && d.winnerId.includes(',') ? 'Winners' : 'Winner'}
                          </div>
                          <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {((campaign.totalUsers || 0) * (campaign.monthlyAmount || 0)).toLocaleString()} ৳
                          </div>
                        </div>
                        <div className="absolute top-12 right-2 text-amber-500 opacity-20">
                          <Trophy className="w-16 h-16 animate-pulse" />
                        </div>
                        <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{d.monthNumber === recentlyDrawnMonth && <span className="mr-1 animate-pulse">🏆</span>}Round #{d.monthNumber}: {d.winnerId && d.winnerId.includes(',') ? 'Draw Winners' : 'Draw Winner'}</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                          {d.winnerId && d.winnerId.includes(',') ? 'Names' : 'Name'}: <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{d.winnerName}</span>
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium mt-1`}>
                          Draw Date: {new Date(d.drawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          )}

          {/* Main Prize Draw Rounds */}
          {upcomingDraws.length > 0 && (
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#151a28] border-gray-800' : 'bg-white border-gray-200'
            } shadow-sm`}>
              <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Main Prize Draw Rounds</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingDraws.map((d, index) => {
                  const icons = [Ticket, Globe, Gift, Trophy];
                  const IconLabel = icons[index % icons.length];
                  return (
                    <div key={d.monthNumber} className={`p-3 rounded-xl border flex items-center gap-4 ${
                      isDark ? 'bg-[#0f1118] border-gray-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`p-3 rounded-xl border ${
                        isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-orange-100/50 border-orange-200 shadow-sm'
                      }`}>
                        <IconLabel className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-base ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Draw #{d.monthNumber}</h4>
                        <p className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Date: {new Date(d.drawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className={`text-[10px] flex-shrink-0 text-right w-32 border-l pl-3 ${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`} title={eligibleNames.join(', ')}>
                        {eligibleNames.length > 0 ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-amber-500/80' : 'text-amber-600/80'}`}>Eligible ({eligibleNames.length})</span>
                            <div className="line-clamp-2 w-full text-left leading-tight">
                              {eligibleNames.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="italic text-[10px]">No eligible</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed Stage */}
          <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between ${
            isDark ? 'bg-[#151a28] border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Grand Draw Complete!</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Winners Finalized and Announced.
              </p>
            </div>
            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/30">
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 mx-auto justify-center">
        <button 
          onClick={() => onCheckWinners(campaign.id)}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all ${
            isDark ? 'bg-[#161f36] text-white hover:bg-[#1f2947]' : 'bg-[#161f36] text-white shadow-xl shadow-[#161f36]/20'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          Check Winners List
        </button>
        <button 
          onClick={onNavigateToAchievements}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all ${
            isDark ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30' : 'bg-[#ffecd1] text-[#b47120] hover:bg-[#ffe1ba] border border-[#f5dbb8]'
          }`}
        >
          <Gift className="w-4 h-4" />
          View Prizes
        </button>
      </div>

    </motion.div>
  );
}
