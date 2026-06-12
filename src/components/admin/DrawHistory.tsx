import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Search, 
  Calendar, 
  DollarSign, 
  Download, 
  Layers, 
  ChevronRight, 
  Bookmark, 
  Hash, 
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { LotteryCampaign } from '../../types';

interface DrawHistoryProps {
  campaigns: LotteryCampaign[];
  theme: 'dark' | 'light';
}

interface FlattenedDraw {
  id: string; // generated unique id
  campaignId: string;
  campaignTitle: string;
  monthNumber: number;
  drawDate: string;
  winnerId: string;
  winnerName: string;
  winnerEmail: string;
  prizeAmount: number;
}

export default function DrawHistory({ campaigns, theme }: DrawHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Flatten all completed draws from all campaigns
  const allDraws = useMemo(() => {
    const draws: FlattenedDraw[] = [];
    campaigns.forEach((camp) => {
      if (camp.monthlyDraws) {
        camp.monthlyDraws.forEach((d) => {
          if (d.status === 'completed' && d.winnerName) {
            const prizeAmount = d.prizeAmount ?? ((camp.selectedUsers?.length || camp.totalUsers || 1) * (camp.monthlyAmount || 0));
            draws.push({
              id: `${camp.id}-m${d.monthNumber}`,
              campaignId: camp.id,
              campaignTitle: camp.title,
              monthNumber: d.monthNumber,
              drawDate: d.drawDate,
              winnerId: d.winnerId || 'N/A',
              winnerName: d.winnerName,
              winnerEmail: d.winnerEmail || 'N/A',
              prizeAmount: prizeAmount
            });
          }
        });
      }
    });
    return draws;
  }, [campaigns]);

  // Unique campaigns that have draws for our dropdown filter
  const campaignsWithDraws = useMemo(() => {
    const list = new Map<string, string>();
    allDraws.forEach(d => {
      list.set(d.campaignId, d.campaignTitle);
    });
    return Array.from(list.entries()).map(([id, title]) => ({ id, title }));
  }, [allDraws]);

  // Filter and Search Draws
  const filteredDraws = useMemo(() => {
    let result = allDraws.filter((draw) => {
      const matchCampaign = selectedCampaignId === 'all' || draw.campaignId === selectedCampaignId;
      const matchSearch = 
        draw.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draw.winnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draw.winnerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCampaign && matchSearch;
    });

    // Sort by drawDate and monthNumber
    result.sort((a, b) => {
      const dateA = new Date(a.drawDate).getTime();
      const dateB = new Date(b.drawDate).getTime();
      if (dateA !== dateB) {
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }
      return sortOrder === 'desc' ? b.monthNumber - a.monthNumber : a.monthNumber - b.monthNumber;
    });

    return result;
  }, [allDraws, searchTerm, selectedCampaignId, sortOrder]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalDraws = filteredDraws.length;
    const totalPrizeDistributed = filteredDraws.reduce((sum, d) => sum + d.prizeAmount, 0);
    const uniqueWinners = new Set(filteredDraws.map(d => d.winnerEmail)).size;
    return {
      totalDraws,
      totalPrizeDistributed,
      uniqueWinners
    };
  }, [filteredDraws]);

  // CSV download trigger
  const handleExportCSV = () => {
    if (filteredDraws.length === 0) return;
    
    const headers = ['Campaign Title', 'Draw Month', 'Draw Date', 'Winner Name', 'Winner Email', 'Prize Amount (BDT)'];
    const rows = filteredDraws.map((d) => [
      `"${d.campaignTitle.replace(/"/g, '""')}"`,
      `"Month ${d.monthNumber}"`,
      `"${d.drawDate}"`,
      `"${d.winnerName.replace(/"/g, '""')}"`,
      `"${d.winnerEmail.replace(/"/g, '""')}"`,
      d.prizeAmount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Monthly_Lottery_Draw_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[10px] tracking-wider uppercase font-bold">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Authorized Log History</span>
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-sans`}>
            Draw History Logs
          </h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-sans`}>
            Audited results and statistics of completed monthly raffle rounds
          </p>
        </div>

        {filteredDraws.length > 0 && (
          <button
            id="btn-export-draw-csv"
            onClick={handleExportCSV}
            className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              theme === 'dark' 
                ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-600' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-sm'
            }`}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Audit Stats Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#060606] border-[#181818]' : 'bg-gray-50 border-gray-200'} space-y-1`}>
          <p className="text-[10px] uppercase font-bold font-mono text-gray-550">Total Rounds Drawn</p>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <span className={`text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {stats.totalDraws}
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#060606] border-[#181818]' : 'bg-gray-50 border-gray-200'} space-y-1`}>
          <p className="text-[10px] uppercase font-bold font-mono text-gray-550">Total Prizes Distributed</p>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 font-bold font-sans">৳</span>
            <span className={`text-xl font-extrabold font-mono text-amber-500`}>
              {stats.totalPrizeDistributed.toLocaleString()} BDT
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#060606] border-[#181818]' : 'bg-gray-50 border-gray-200'} space-y-1`}>
          <p className="text-[10px] uppercase font-bold font-mono text-gray-550">Unique Winners Mapped</p>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className={`text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {stats.uniqueWinners} Accounts
            </span>
          </div>
        </div>
      </div>

      {/* Core Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Search Search */}
        <div className="relative md:col-span-6">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="input-draw-history-search"
            type="text"
            placeholder="Search campaign, winner name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-2.5 pl-10 pr-4 text-xs rounded-xl border font-sans tracking-wide transition-all ${
              theme === 'dark'
                ? 'bg-[#121212] border-[#222] text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                : 'bg-white border-gray-200 text-gray-850 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            }`}
          />
        </div>

        {/* Campaign Filter */}
        <div className="md:col-span-4">
          <select
            id="select-campaign-draw-filter"
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className={`w-full py-2.5 px-3.5 text-xs rounded-xl border font-sans transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#121212] border-[#222] text-gray-300 focus:border-amber-500'
                : 'bg-white border-gray-200 text-gray-700 focus:border-emerald-500'
            }`}
          >
            <option value="all">All Campaigns</option>
            {campaignsWithDraws.map((camp) => (
              <option key={camp.id} value={camp.id}>{camp.title}</option>
            ))}
          </select>
        </div>

        {/* Sort Trigger */}
        <div className="md:col-span-2">
          <button
            id="btn-sort-draw-date"
            onClick={toggleSort}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#121212] border-[#222] text-gray-300 hover:text-white hover:bg-[#1a1a1a]'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </div>
      </div>

      {/* Main Logs Table */}
      <div className={`border rounded-2xl overflow-hidden ${
        theme === 'dark' ? 'bg-[#080808]/50 border-[#1a1a1a]' : 'bg-gray-50/40 border-gray-150'
      }`}>
        <div className="overflow-auto max-h-[380px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                theme === 'dark' ? 'bg-[#111]/80 border-[#1a1a1a] text-gray-550' : 'bg-gray-100/70 border-gray-200 text-gray-500'
              }`}>
                <th className="py-1 px-1.5 font-bold flex items-center gap-1"><Bookmark className="w-3 h-3" /> Campaign Name</th>
                <th className="py-1 px-1.5 font-bold"><Hash className="w-3 h-3 inline mr-1" />Month</th>
                <th className="py-1 px-1.5 font-bold"><Calendar className="w-3 h-3 inline mr-1" />Draw Date</th>
                <th className="py-1 px-1.5 font-bold">Winner Name</th>
                <th className="py-1 px-1.5 font-bold">Winner Email</th>
                <th className="py-1 px-1.5 font-bold text-right"><DollarSign className="w-3 h-3 inline mr-1" />Prize Amount</th>
                <th className="py-1 px-1.5 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-[#151515] divide-gray-100 text-xs font-medium font-sans">
              {filteredDraws.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-mono text-xs">
                    <Clock className="w-8 h-8 text-gray-600/40 mx-auto mb-2" />
                    No completed lottery draws matched the current options.
                  </td>
                </tr>
              ) : (
                filteredDraws.map((draw) => (
                  <tr 
                    key={draw.id} 
                    className={`hover:bg-amber-500/[0.02] dark:hover:bg-amber-500/[0.015] transition-colors ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    <td className="py-0.5 px-1.5 font-bold text-amber-500">
                      {draw.campaignTitle}
                    </td>
                    <td className="py-0.5 px-1.5 font-mono font-bold">
                      Month {draw.monthNumber}
                    </td>
                    <td className="py-0.5 px-1.5 font-mono text-xs text-gray-400">
                      {draw.drawDate}
                    </td>
                    <td className="py-0.5 px-1.5">
                      {draw.winnerName}
                    </td>
                    <td className="py-0.5 px-1.5 text-xs font-mono text-gray-400">
                      {draw.winnerEmail}
                    </td>
                    <td className="py-0.5 px-1.5 font-mono font-extrabold text-right text-emerald-500">
                      ৳ {draw.prizeAmount.toLocaleString()} BDT
                    </td>
                    <td className="py-0.5 px-1.5 text-center">
                      <span className="inline-flex py-1 px-2.5 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-full font-mono text-[9px] font-bold uppercase select-none">
                        Drawn
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
