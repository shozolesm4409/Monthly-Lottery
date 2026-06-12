import fs from 'fs';

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The marker we want to find
const sidebarStart = code.indexOf("{/* 1. SIDEBAR - Desktop Persistent */}");
if (sidebarStart !== -1) {
  // Find the end by looking for the next piece of code we know is right after it
  const endMarker = "      {/* MAIN CONTENT AREA */}";
  const end1 = code.indexOf(endMarker, sidebarStart);
  
  if (end1 !== -1) {
       code = code.substring(0, sidebarStart) + "<AdminSidebar\n        theme={theme}\n        activeTab={activeTab}\n        setActiveTab={setActiveTab}\n        hasVisibility={hasVisibility}\n        user={user}\n        handleSignOut={handleSignOut}\n        mobileSidebarOpen={mobileSidebarOpen}\n        setMobileSidebarOpen={setMobileSidebarOpen}\n      />\n\n      " + code.substring(end1);
  }
}

const importMarker = "import RoadmapView from './admin/RoadmapView';";
const importInsert = "import AdminSidebar from './admin/AdminSidebar';\n";
code = code.replace(importMarker, importInsert + importMarker);


fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Sidebar Patched!");
