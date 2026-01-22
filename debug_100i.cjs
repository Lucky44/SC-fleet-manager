const https = require('https');

const fetchPorts = () => {
    return new Promise((resolve, reject) => {
        // 100i class name is ORIG_100i
        https.get('https://scunpacked.com/api/v2/ships/orig_100i-ports.json', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        });
    });
};

fetchPorts().then(data => {
    const rawPorts = Object.values(data).flat();
    // Filter for missile-related ports to see what they look like
    const missilePorts = rawPorts.filter(p =>
        (p.Name && p.Name.toLowerCase().includes('missile')) ||
        (p.Types && p.Types.some(t => t.toLowerCase().includes('missile')))
    );

    console.log(JSON.stringify(missilePorts, null, 2));
});
