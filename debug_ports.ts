console.log("DEBUG SCRIPT STARTING");
import { fetchShipPorts } from './src/services/dataService';

async function test() {
    try {
        console.log("Starting fetchShipPorts for RSI_Polaris...");
        const ports = await fetchShipPorts('RSI_Polaris');
        console.log(`Fetch complete. Got ${ports.length} ports.`);
        const populatedPorts = ports.filter(p => p.InstalledItem);
        console.log(`Ship: RSI_Polaris`);
        console.log(`Total ports: ${ports.length}`);
        console.log(`Populated ports: ${populatedPorts.length}`);

        populatedPorts.forEach(p => {
            console.log(`Port: ${p.DisplayName || p.Name}`);
            console.log(`  Installed: ${p.InstalledItem?.Name} (${p.InstalledItem?.ClassName})`);
        });
    } catch (e) {
        console.error("Caught error in test:", e);
    }
}

test();
