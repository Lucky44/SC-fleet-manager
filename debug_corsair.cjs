const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function debugCorsair() {
    const className = 'DRAK_Corsair';
    const url = `https://scunpacked.com/api/v2/ships/${className.toLowerCase()}-ports.json`;
    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();
        const rawPorts = Object.values(data).flat();

        console.log("PORT DATA SAMPLES:");
        rawPorts.slice(0, 5).forEach(p => {
            console.log(JSON.stringify({
                Name: p.PortName || p.Name,
                DisplayName: p.DisplayName,
                InstalledItem: p.InstalledItem?.Name
            }, null, 2));
        });

    } catch (e) {
        console.error(e);
    }
}

debugCorsair();
