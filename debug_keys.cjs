const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function keys() {
    const className = 'DRAK_Corsair';
    const url = `https://scunpacked.com/api/v2/ships/${className.toLowerCase()}-ports.json`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("KEYS:", Object.keys(data));

        // Print one sample from each key
        for (const k of Object.keys(data)) {
            console.log(`SAMPLE FROM ${k}:`, JSON.stringify(data[k][0]?.PortName || data[k][0]?.Name));
        }
    } catch (e) {
        console.error(e);
    }
}
keys();
