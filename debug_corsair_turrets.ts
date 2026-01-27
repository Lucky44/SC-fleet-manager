import { fetchShipPorts } from './src/services/dataService';

async function debug() {
    const ports = await fetchShipPorts('DRAK_Corsair');
    console.log('EXTRACTED PORTS (AFTER PATCHES):');
    ports.forEach(p => {
        if (p.Turret || p.Name.toLowerCase().includes('turret')) {
            console.log(`- ${p.Name} | ${p.DisplayName} | Turret: ${p.Turret}`);
        }
    });
}

debug();
