import fs from 'fs';

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Find activeTab and add recentlyDrawnMonth state
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'campaigns' | 'users' | 'tickets' | 'profile' | 'permissions' | 'all_campaigns' | 'roadmap'>('campaigns');",
  "const [activeTab, setActiveTab] = useState<'campaigns' | 'users' | 'tickets' | 'profile' | 'permissions' | 'all_campaigns' | 'roadmap'>('campaigns');\n  const [recentlyDrawnMonth, setRecentlyDrawnMonth] = useState<number | null>(null);"
);

// Find handleDrawMonthWinner where it updates the roadmap state
const roadmapUpdateCode = `      // Update roadmapCampaign state if it's currently open to reflect drawn winner
      if (roadmapCampaign && roadmapCampaign.id === campaignId) {
        setRoadmapCampaign(prev => prev ? {
          ...prev,
          monthlyDraws: draws,
          status: updatedCampaignStatus
        } : null);
`;
const newRoadmapUpdateCode = `      // Update roadmapCampaign state
      const newCampData = {
        ...(campaign),
        monthlyDraws: draws,
        status: updatedCampaignStatus
      };
      
      setRoadmapCampaign(newCampData);
      setRecentlyDrawnMonth(monthNumber);
      setActiveTab('roadmap');
`;

if(code.includes(roadmapUpdateCode)) {
  const endIf = code.indexOf("      }", code.indexOf(roadmapUpdateCode));
  code = code.substring(0, code.indexOf(roadmapUpdateCode)) + newRoadmapUpdateCode + code.substring(endIf + 7);
}

// Pass recentlyDrawnMonth to RoadmapView
code = code.replace(
  "<RoadmapView \n                campaign={roadmapCampaign} \n                onBack={() => { setRoadmapCampaign(null); setActiveTab('campaigns'); }} \n                theme={theme}\n            />",
  "<RoadmapView \n                campaign={roadmapCampaign} \n                recentlyDrawnMonth={recentlyDrawnMonth} \n                onBack={() => { setRoadmapCampaign(null); setRecentlyDrawnMonth(null); setActiveTab('campaigns'); }} \n                theme={theme}\n            />"
);

// We should also clear recentlyDrawnMonth if they click Roadmap from the card "Roadmap" button
code = code.replace(
  "onClick={() => { setRoadmapCampaign(camp); setActiveTab('roadmap'); }}",
  "onClick={() => { setRoadmapCampaign(camp); setRecentlyDrawnMonth(null); setActiveTab('roadmap'); }}"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard patched for routing to Roadmap");
