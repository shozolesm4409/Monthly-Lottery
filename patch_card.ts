import fs from 'fs';

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const markerStart = "  const renderCampaignCard = (camp: LotteryCampaign) => {\n    return (";
const startIdx = code.indexOf(markerStart);

if (startIdx !== -1) {
  const replaceStart = code.substring(0, startIdx);
  const findEndMarker = "  return (\n    <div className={`min-h-screen";
  const endIdx = code.indexOf(findEndMarker, startIdx);
  
  if (endIdx !== -1) {
    const renderCampaignCardReplacement = `  const renderCampaignCard = (camp: LotteryCampaign) => {
    return (
      <LotteryCampaignCard
        key={camp.id}
        camp={camp}
        theme={theme}
        isUserAdmin={isUserAdmin}
        processing={processing}
        handleOpenEditModal={handleOpenEditModal}
        handleResetCampaign={handleResetCampaign}
        handleDeleteCampaign={handleDeleteCampaign}
        handleDrawWinner={handleDrawWinner}
        setRoadmapCampaign={setRoadmapCampaign}
        setRecentlyDrawnMonth={setRecentlyDrawnMonth}
        setActiveTab={setActiveTab}
      />
    );
  };

`;
    code = replaceStart + renderCampaignCardReplacement + code.substring(endIdx);
  }
}

const importMarker = "import RoadmapView from './admin/RoadmapView';";
const importInsert = "import LotteryCampaignCard from './admin/LotteryCampaignCard';\n";
code = code.replace(importMarker, importInsert + importMarker);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Patched renderCampaignCard")
