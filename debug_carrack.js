const fs = require('fs');

async function findCarrackPorts() {
    try {
        const content = fs.readFileSync('ships_v2.json', 'utf8');
        const data = JSON.parse(content);
        const carrack = data.find(s => s.ClassName === 'ANVL_Carrack');
        if (!carrack) {
            console.log("Carrack not found in ships_v2.json");
            const names = data.map(s => s.ClassName).filter(n => n.includes('Carrack'));
            console.log("Possible Carrack names:", names);
            return;
        }
        console.log("Carrack found in ships_v2.json");
        console.log("Manned Turrets:", JSON.stringify(carrack.MannedTurrets, null, 2));
        console.log("Remote Turrets:", JSON.stringify(carrack.RemoteTurrets, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

findCarrackPorts();
