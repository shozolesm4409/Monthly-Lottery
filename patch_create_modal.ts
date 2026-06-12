import fs from 'fs';

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const modalStart = code.indexOf("{/* CREATE LOTTERY MODAL */}");
if (modalStart !== -1) {
  const endMarker = "  return (";
  const endIdx = code.indexOf(endMarker, modalStart + 20); // wait, it might be the end of the file.
  
  // Let's find the closing AnimatePresence of it.
  const modalEndStr = "      </AnimatePresence>\n\n    </div>";
  const modalEnd = code.indexOf(modalEndStr, modalStart);
  
  if (modalEnd !== -1) {
    const replacement = `<CreateCampaignModal 
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        theme={theme}
        handleCreateCampaign={handleCreateCampaign}
        newCampaignTitle={newCampaignTitle}
        setNewCampaignTitle={setNewCampaignTitle}
        newCampaignDesc={newCampaignDesc}
        setNewCampaignDesc={setNewCampaignDesc}
        isUsersDropdownOpen={isUsersDropdownOpen}
        setIsUsersDropdownOpen={setIsUsersDropdownOpen}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        availableUsers={availableUsers}
        newMonthlyAmount={newMonthlyAmount}
        setNewMonthlyAmount={setNewMonthlyAmount}
        newMonthlyDrawDate={newMonthlyDrawDate}
        setNewMonthlyDrawDate={setNewMonthlyDrawDate}
        newTotalMonths={newTotalMonths}
        setNewTotalMonths={setNewTotalMonths}
        processing={processing}
      />`;
      code = code.substring(0, modalStart) + replacement + code.substring(modalEnd + 24);
  }
}

const importMarker = "import EditCampaignModal from './admin/modals/EditCampaignModal';";
const importInsert = "import CreateCampaignModal from './admin/modals/CreateCampaignModal';\n";
code = code.replace(importMarker, importInsert + importMarker);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Patched CreateCampaignModal");
