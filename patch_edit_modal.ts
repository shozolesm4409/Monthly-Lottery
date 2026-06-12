import fs from 'fs';

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const modalStart = code.indexOf("{/* EDIT LOTTERY MODAL */}");
if (modalStart !== -1) {
  const endMarker = "{/* CREATE LOTTERY MODAL */}";
  const endIdx = code.indexOf(endMarker, modalStart);
  
  if (endIdx !== -1) {
    const replacement = `<EditCampaignModal 
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        theme={theme}
        handleEditCampaign={handleEditCampaign}
        editCampaignTitle={editCampaignTitle}
        setEditCampaignTitle={setEditCampaignTitle}
        editCampaignDesc={editCampaignDesc}
        setEditCampaignDesc={setEditCampaignDesc}
        isEditUsersDropdownOpen={isEditUsersDropdownOpen}
        setIsEditUsersDropdownOpen={setIsEditUsersDropdownOpen}
        editSelectedUsers={editSelectedUsers}
        setEditSelectedUsers={setEditSelectedUsers}
        availableUsers={availableUsers}
        editMonthlyAmount={editMonthlyAmount}
        setEditMonthlyAmount={setEditMonthlyAmount}
        editMonthlyDrawDate={editMonthlyDrawDate}
        setEditMonthlyDrawDate={setEditMonthlyDrawDate}
        editTotalMonths={editTotalMonths}
        setEditTotalMonths={setEditTotalMonths}
        processing={processing}
      />\n\n      `;
      code = code.substring(0, modalStart) + replacement + code.substring(endIdx);
  }
}

const importMarker = "import DeleteConfirmModal from './admin/modals/DeleteConfirmModal';";
const importInsert = "import EditCampaignModal from './admin/modals/EditCampaignModal';\n";
code = code.replace(importMarker, importInsert + importMarker);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Patched EditCampaignModal");
