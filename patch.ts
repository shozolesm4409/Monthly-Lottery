import fs from 'fs';

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The marker we want to find
const map1Start = code.indexOf("{campaigns.filter(c => c.status === 'active').map((camp) => (");
if (map1Start !== -1) {
  // Find the end by looking for the next piece of code we know is right after it
  const endMarker = "                    {campaigns.length > 2 && (";
  const end1 = code.indexOf(endMarker, map1Start);
  
  if (end1 !== -1) {
       code = code.substring(0, map1Start) + "{campaigns.filter(c => c.status === 'active').map((camp) => renderCampaignCard(camp))}\n" + code.substring(end1);
  }
}

const map2Start = code.indexOf("{campaigns.map((camp) => (");
if (map2Start !== -1) {
  const endMarker2 = "            </div>\n          </div>\n        )}\n\n      </main>";
  const end2 = code.indexOf(endMarker2, map2Start);
  
  if (end2 !== -1) {
       code = code.substring(0, map2Start) + "{campaigns.map((camp) => renderCampaignCard(camp))}\n" + code.substring(end2);
  } else {
    // If we missed endMarker2, find the next nearest
    const fallbackEnd = code.indexOf("          </div>\n        )}\n\n      </main>", map2Start);
    if(fallbackEnd!==-1) {
       code = code.substring(0, map2Start) + "{campaigns.map((camp) => renderCampaignCard(camp))}\n" + code.substring(fallbackEnd - 13);
    }
  }
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Patched!");
