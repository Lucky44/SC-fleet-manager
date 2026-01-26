const fs = require('fs');
const data = JSON.parse(fs.readFileSync('corsair-ports.json', 'utf8'));

console.log("Keys in data:", Object.keys(data));

const rawPorts = Object.values(data).flat();
console.log("Total ports found:", rawPorts.length);

const extractPorts = (portList, parentName = '') => {
    let extracted = [];
    portList.forEach(p => {
        const rawName = p.PortName || p.Name || '';
        const item = p.InstalledItem;
        const itemType = (item?.Type || item?.type || '').toLowerCase();
        const itemTags = item?.Tags || item?.tags || [];
        const nestedPorts = item?.Ports || item?.ports || [];

        const isTurret = itemType.includes('turret');
        const isRack = itemType.includes('missilelauncher') || itemType.includes('missilerack');
        const isGimbal = isTurret || itemTags.some((t) => String(t).toLowerCase().includes('gimbal'));
        const isMount = isGimbal || isRack;

        let childPorts = [];
        if (isMount && Array.isArray(nestedPorts)) {
            childPorts = nestedPorts.filter((cp) => {
                const types = (cp.Types || cp.types || []).join(',').toLowerCase();
                const category = (cp.Category || cp.category || '').toLowerCase();
                return types.includes('gun') || types.includes('missile') || types.includes('torpedo') ||
                    category.includes('weapon') || category.includes('missile');
            });
        }

        if (childPorts.length > 0) {
            console.log(`[PROMOTING] ${rawName} (${itemType}) has ${childPorts.length} children`);
            childPorts.forEach((cp, index) => {
                const childRawName = cp.PortName || cp.Name || '';
                // ...
                extracted.push({ Name: `${rawName} > ${childRawName}`, Item: cp.InstalledItem?.Name });
            });
        } else {
            extracted.push({ Name: rawName, Item: item?.Name });
        }
    });
    return extracted;
};

const results = extractPorts(rawPorts);
console.log("\nSample Results (First 5):");
console.log(results.slice(0, 5));

console.log("\nTurret Search:");
const turrets = results.filter(r => (r.Name || '').toLowerCase().includes('turret'));
console.log("Turrets found in results:", turrets.length);
turrets.forEach(t => console.log(t));
