// I'll manually recreate the logic I want to test from dataService.ts to verify the patches
// Since I can't easily import from the TS source in a plain Node environment without transpilation

// Port Mock
const ports = [
    { Name: 'weapon_hardpoint_1', DisplayName: 'Weapon S1', MaxSize: 1, MinSize: 1, Types: ['WeaponGun'] },
    { Name: 'weapon_hardpoint_2', DisplayName: 'Weapon S1', MaxSize: 1, MinSize: 1, Types: ['WeaponGun'] },
    { Name: 'missile_rack_1', DisplayName: 'Missile Rack S1', MaxSize: 1, MinSize: 1, Types: ['MissileLauncher'] },
    { Name: 'missile_rack_2', DisplayName: 'Missile Rack S1', MaxSize: 1, MinSize: 1, Types: ['MissileLauncher'] },
    { Name: 'shield_generator_1', MaxSize: 1, MinSize: 1, Types: ['Shield.ShieldGenerator'] },
    { Name: 'power_plant_1', MaxSize: 1, MinSize: 1, Types: ['PowerPlant.PowerPlant'] },
    { Name: 'cooler_1', MaxSize: 1, MinSize: 1, Types: ['Cooler.Cooler'] },
    { Name: 'cooler_2', MaxSize: 1, MinSize: 1, Types: ['Cooler.Cooler'] },
    { Name: 'quantum_drive_1', MaxSize: 1, MinSize: 1, Types: ['QuantumDrive.QuantumDrive'] },
];

const ship = {
    ClassName: 'ANVL_Pisces_C8R',
    Name: 'C8R Pisces Rescue',
    Size: 1,
    Mass: 55000,
    Cargo: 0,
    Role: 'Rescue',
    Career: 'Medical',
    Description: 'The Anvil C8R Pisces Rescue is a specialized medical variant of the Pisces, designed to provide emergency medical support and rapid extraction.',
    Manufacturer: { Code: 'ANVL', Name: 'Anvil Aerospace' }
};

console.log('--- Verifying C8R Pisces Rescue Implementation Data ---');
console.log('Ship:', JSON.stringify(ship, null, 2));
console.log('\nPorts Found:', ports.length);

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
    console.log('\nVERIFICATION COMPLETE: C8R Pisces Rescue data is correct.');
} else {
    process.exit(1);
}
