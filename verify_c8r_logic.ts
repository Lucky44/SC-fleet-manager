import { fetchShips, fetchShipPorts } from './src/services/dataService';
import { Ship, Port } from './src/types';

// Mock fetch for Node environment
global.fetch = async (url) => {
    if (url.includes('ships_utf8.json')) {
        return {
            ok: true,
            json: async () => [] // Return empty list to trigger manual patches
        };
    }
    if (url.includes('ship-items_utf8.json')) {
        return {
            ok: true,
            json: async () => []
        };
    }
    return { ok: false };
};

// Mock __APP_VERSION__ if needed (usually in Vite)
global.__APP_VERSION__ = '4.2.0';

async function verify() {
    console.log('--- Verifying C8R Pisces Rescue ---');

    const ships = await fetchShips();
    const c8r = ships.find(s => s.ClassName === 'ANVL_Pisces_C8R');

    if (c8r) {
        console.log('SUCCESS: C8R Pisces Rescue found in ship list.');
        console.log(`- Name: ${c8r.Name}`);
        console.log(`- Role: ${c8r.Role}`);
        console.log(`- Career: ${c8r.Career}`);
    } else {
        console.error('FAILURE: C8R Pisces Rescue NOT found in ship list.');
        process.exit(1);
    }

    const ports = await fetchShipPorts('ANVL_Pisces_C8R');
    console.log(`\nFound ${ports.length} ports for C8R:`);

    const expectedPorts = [
        'weapon_hardpoint_1', 'weapon_hardpoint_2',
        'missile_rack_1', 'missile_rack_2',
        'shield_generator_1', 'power_plant_1',
        'cooler_1', 'cooler_2', 'quantum_drive_1'
    ];

    let allFound = true;
    expectedPorts.forEach(name => {
        const found = ports.find(p => p.Name === name);
        if (found) {
            console.log(`- SUCCESS: Port "${name}" found.`);
        } else {
            console.error(`- FAILURE: Port "${name}" NOT found.`);
            allFound = false;
        }
    });

    if (allFound) {
        console.log('\nVERIFICATION COMPLETE: C8R Pisces Rescue is correctly implemented.');
    } else {
        console.error('\nVERIFICATION FAILED: Some ports are missing.');
        process.exit(1);
    }
}

verify().catch(err => {
    console.error('An error occurred during verification:');
    console.error(err);
    process.exit(1);
});
