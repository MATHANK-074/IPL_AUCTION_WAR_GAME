const fs = require('fs');
const path = require('path');

const playersPath = 'c:/Users/mathankumar/OneDrive/Desktop/IPL AUCTION/server/data/players.json';
const players = JSON.parse(fs.readFileSync(playersPath, 'utf8'));

// Wicket Keeper List (Common names)
const wks = new Set([
    "Virat Kohli", "MS Dhoni", "KL Rahul", "Rishabh Pant", "Sanju Samson", "Ishan Kishan", 
    "Jos Buttler", "Quinton de Kock", "Nicholas Pooran", "Heinrich Klaasen", "Phil Salt", 
    "Jitesh Sharma", "Dhruv Jurel", "Dinesh Karthik", "Wriddhiman Saha", "Abhishek Porel",
    "Kumar Kushagra", "Shai Hope", "Tristan Stubbs", "Rahmanullah Gurbaz"
]);

// Helper to check if Indian
const isIndian = (p) => p.nationality === 'India';

// 1. Star Players India (20)
let starInd = players.filter(p => isIndian(p) && p.tier === 'Marquee').slice(0, 20);
let starIndIds = new Set(starInd.map(p => p.id));

// 2. Star Players International (20)
let starInt = players.filter(p => !isIndian(p) && p.tier === 'Marquee').slice(0, 20);
let starIntIds = new Set(starInt.map(p => p.id));

// Remaining
let remaining = players.filter(p => !starIndIds.has(p.id) && !starIntIds.has(p.id));

// 3. Capped Indian (130)
let cappedInd = remaining.filter(p => isIndian(p)).slice(0, 130);
let cappedIndIds = new Set(cappedInd.map(p => p.id));
remaining = remaining.filter(p => !cappedIndIds.has(p.id));

// 4. Capped International (100)
let cappedInt = remaining.filter(p => !isIndian(p)).slice(0, 100);
let cappedIntIds = new Set(cappedInt.map(p => p.id));
remaining = remaining.filter(p => !cappedIntIds.has(p.id));

// 5. Uncapped Indian (40)
let uncappedInd = remaining.filter(p => isIndian(p)).slice(0, 40);
let uncappedIndIds = new Set(uncappedInd.map(p => p.id));
remaining = remaining.filter(p => !uncappedIndIds.has(p.id));

// 6. Uncapped International (40)
let uncappedInt = remaining.filter(p => !isIndian(p)).slice(0, 40);
let uncappedIntIds = new Set(uncappedInt.map(p => p.id));

// Final Mapping
const finalPlayers = players.map(p => {
    let setNum = 0;
    let setName = '';

    if (starIndIds.has(p.id)) { setNum = 1; setName = 'STAR PLAYERS INDIA'; }
    else if (starIntIds.has(p.id)) { setNum = 2; setName = 'STAR PLAYERS INTERNATIONAL'; }
    else if (cappedIndIds.has(p.id)) { setNum = 3; setName = 'CAPPED INDIAN PLAYERS'; }
    else if (cappedIntIds.has(p.id)) { setNum = 4; setName = 'CAPPED INTERNATIONAL PLAYERS'; }
    else if (uncappedIndIds.has(p.id)) { setNum = 5; setName = 'UNCAPPED INDIAN PLAYERS'; }
    else if (uncappedIntIds.has(p.id)) { setNum = 6; setName = 'UNCAPPED INTERNATIONAL PLAYERS'; }
    
    const updated = { ...p };
    if (setNum > 0) {
        updated.setNum = setNum;
        updated.setName = setName;
    }
    
    // Assign Wicket Keeper role
    if (wks.has(p.name)) {
        updated.role = 'Wicket Keeper';
    }

    return updated;
});

// Calculate total assigned
const assignedCount = finalPlayers.filter(p => p.setNum).length;
console.log(`Total players assigned to sets: ${assignedCount}`);

fs.writeFileSync(playersPath, JSON.stringify(finalPlayers, null, 2));
console.log('Successfully updated players.json');
