import React, { useState, useEffect } from 'react';
import type { FleetShip, Ship, Item, Port } from '../types';
import { fetchShipPorts, filterItemsForPort, cleanName, getItemStats } from '../services/dataService';
import { X, ChevronDown, Check, Zap, Shield, Cpu, Wind, Search, Trash2, Box, RotateCcw } from 'lucide-react';

interface LoadoutEditorProps {
    fleetShip: FleetShip;
    ships: Ship[];
    items: Item[];
    onUpdate: (id: string, portName: string, itemClassName: string) => void;
    onReset: (id: string) => void;
    onClose: () => void;
}

export const LoadoutEditor: React.FC<LoadoutEditorProps> = ({
    fleetShip, ships, items, onUpdate, onReset, onClose
}) => {
    const [ports, setPorts] = useState<Port[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmingReset, setIsConfirmingReset] = useState(false);
    const shipData = ships.find(s => s.ClassName === fleetShip.shipClass);

    useEffect(() => {
        const loadPorts = async () => {
            try {
                const portData = await fetchShipPorts(fleetShip.shipClass);
                // Map any existing custom loadout items back into the ports
                const mergedPorts = portData.map(port => {
                    if (fleetShip.customLoadout[port.Name]) {
                        // Empty string means unequipped in our data model for this edit session
                        if (fleetShip.customLoadout[port.Name] === '') {
                            return {
                                ...port,
                                InstalledItem: undefined
                            };
                        }

                        const customItem = items.find(i => i.className === fleetShip.customLoadout[port.Name]);
                        if (customItem) {
                            return {
                                ...port,
                                InstalledItem: {
                                    Name: customItem.name,
                                    ClassName: customItem.className,
                                    Size: customItem.size
                                }
                            };
                        }
                    }
                    return port;
                });
                setPorts(mergedPorts);
            } catch (error) {
                console.error("Error loading ports:", error);
            } finally {
                setLoading(false);
            }
        };
        loadPorts();
    }, [fleetShip, items]);


    // Categorize ports
    const pilotWeapons = ports.filter(p => !p.Turret && p.Types.some(t => t.includes('WeaponGun') || t.includes('MissileLauncher')));
    const turrets = ports.filter(p => p.Turret);
    const components = ports.filter(p => p.Types.some(t =>
        t.includes('Shield') || t.includes('PowerPlant') || t.includes('Cooler') || t.includes('QuantumDrive')
    ));

    // Group turrets by their base name for a cleaner UI
    const turretGroups = turrets.reduce((groups, port) => {
        const name = port.TurretBaseName || 'REMOTE TURRETS';
        if (!groups[name]) groups[name] = [];
        groups[name].push(port);
        return groups;
    }, {} as Record<string, Port[]>);

    const getIcon = (types: string[]) => {
        if (types.some(t => t.includes('Shield'))) return <Shield className="w-5 h-5 text-sc-blue" />;
        if (types.some(t => t.includes('PowerPlant'))) return <Zap className="w-5 h-5 text-yellow-500" />;
        if (types.some(t => t.includes('QuantumDrive'))) return <Cpu className="w-5 h-5 text-purple-500" />;
        if (types.some(t => t.includes('Cooler'))) return <Wind className="w-5 h-5 text-sc-blue" />;
        if (types.some(t => t.includes('Weapon') || t.includes('Turret'))) return <Box className="w-5 h-5 text-red-500" />;
        return <ChevronDown className="w-5 h-5 text-gray-500" />;
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b0c15] w-full max-w-6xl max-h-[90vh] rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative">

                {/* Background Details */}
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <Shield className="w-96 h-96" />
                </div>

                {/* Modal Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-2 py-0.5 bg-sc-blue/20 border border-sc-blue/30 rounded text-sc-blue text-[10px] font-mono tracking-wider">
                                CONFIGURATION MODE
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-sc-blue/50 to-transparent w-20"></div>
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter text-white">
                            {fleetShip.name.toUpperCase()}
                        </h2>
                        <p className="text-sm font-mono text-gray-500 mt-1 flex gap-2">
                            <span>{shipData?.Name}</span>
                            <span className="text-white/20">|</span>
                            <span>ID: <span className="text-sc-blue">{fleetShip.id.slice(0, 8)}</span></span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {isConfirmingReset ? (
                            <div className="flex items-center gap-6 bg-white/5 p-1 rounded-xl border border-white/10 transition-all">
                                <button
                                    onClick={() => {
                                        onReset(fleetShip.id);
                                        setIsConfirmingReset(false);
                                    }}
                                    className="w-32 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-[10px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                >
                                    YES, RESET
                                </button>
                                <button
                                    onClick={() => setIsConfirmingReset(false)}
                                    className="w-32 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-[10px] font-black tracking-widest uppercase"
                                >
                                    NO
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsConfirmingReset(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg border-2 border-red-400 transition-all text-xs font-black tracking-widest uppercase shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:bg-red-700 active:scale-95 whitespace-nowrap"
                                title="Reset all ports to stock items"
                            >
                                <RotateCcw className="w-4 h-4" /> RESET TO STOCK
                            </button>
                        )}
                        <button onClick={onClose} className="group p-3 hover:bg-white/5 rounded-full transition-all border border-transparent hover:border-white/10">
                            <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar relative z-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6">
                            <div className="w-16 h-16 border-4 border-sc-blue/30 border-t-sc-blue rounded-full animate-spin"></div>
                            <div className="text-sc-blue font-mono tracking-widest animate-pulse">SCANNING SHIP SYSTEMS...</div>
                        </div>
                    ) : (
                        <>
                            {/* Pilot Weapons Section */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <h3 className="text-xl font-bold text-white tracking-wide uppercase italic">
                                        <span className="text-sc-blue pr-2">//</span> PILOT WEAPON SYSTEMS
                                    </h3>
                                    <div className="h-px flex-1 bg-white/10"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {pilotWeapons.map(port => (
                                        <div key={port.Name} className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="w-1.5 h-1.5 bg-sc-blue rounded-full"></div>
                                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{port.DisplayName || port.Name}</span>
                                            </div>
                                            <PortSelector
                                                port={port}
                                                items={items}
                                                onSelect={(item) => onUpdate(fleetShip.id, port.Name, item?.className || '')}
                                                getIcon={getIcon}
                                            />
                                        </div>
                                    ))}
                                    {pilotWeapons.length === 0 && <div className="col-span-full py-8 text-center text-gray-600 font-mono italic border border-dashed border-white/5 rounded-xl">NO DIRECT PILOT ARMED SYSTEMS DETECTED</div>}
                                </div>
                            </section>

                            {/* Turrets Section */}
                            {Object.keys(turretGroups).length > 0 && (
                                <section className="space-y-10">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-bold text-white tracking-wide uppercase italic">
                                            <span className="text-red-500 pr-2">//</span> TURRET SYSTEMS
                                        </h3>
                                        <div className="h-px flex-1 bg-white/10"></div>
                                    </div>

                                    <div className="space-y-12">
                                        {Object.entries(turretGroups).map(([groupName, groupPorts]) => (
                                            <div key={groupName} className="space-y-4">
                                                <div className="flex items-center gap-4 ml-2">
                                                    <h4 className="text-sm font-black text-white/40 tracking-[0.2em] uppercase italic bg-white/5 px-3 py-1 rounded-sm border-l-2 border-red-500/50">
                                                        {groupName}
                                                    </h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {groupPorts.map(port => (
                                                        <PortSelector
                                                            key={port.Name}
                                                            port={port}
                                                            items={items}
                                                            onSelect={(item) => onUpdate(fleetShip.id, port.Name, item?.className || '')}
                                                            getIcon={getIcon}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Components Section */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <h3 className="text-xl font-bold text-white tracking-wide uppercase italic">
                                        <span className="text-yellow-500 pr-2">//</span> INTERNAL SYSTEMS
                                    </h3>
                                    <div className="h-px flex-1 bg-white/10"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {components.map(port => (
                                        <div key={port.Name} className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{port.DisplayName || port.Name}</span>
                                            </div>
                                            <PortSelector
                                                port={port}
                                                items={items}
                                                onSelect={(item) => onUpdate(fleetShip.id, port.Name, item?.className || '')}
                                                getIcon={getIcon}
                                            />
                                        </div>
                                    ))}
                                    {components.length === 0 && <div className="col-span-full py-8 text-center text-gray-600 font-mono italic border border-dashed border-white/5 rounded-xl">NO CONFIGURABLE INTERNAL HARDPOINTS DETECTED</div>}
                                </div>
                            </section>
                        </>
                    )}
                </div>

                <div className="p-6 bg-[#050508] border-t border-white/5 flex justify-between items-center relative z-10">
                    {/* <div className="text-[10px] font-mono text-gray-700 flex flex-col gap-0.5">
                        <p>DEBUG DATA:</p>
                        <p>Total Items Loaded: {items.length}</p>
                        <p>Ports Configured: {ports.length}</p>
                        <p>Ship Class: {fleetShip.shipClass}</p>
                    </div> */}
                    <button
                        onClick={onClose}
                        className="bg-sc-blue text-black font-bold px-10 py-3 rounded hover:shadow-[0_0_25px_rgba(0,210,255,0.4)] transition-all hover:scale-105 active:scale-95"
                    >
                        CONFIRM CONFIGURATION
                    </button>
                </div>
            </div>
        </div>
    );
};

const PortSelector: React.FC<{
    port: Port,
    items: Item[],
    onSelect: (item: Item | null) => void,
    getIcon: (types: string[]) => React.ReactNode
}> = ({ port, items, onSelect, getIcon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Initial filtering of compatible items
    const compatibleItems = React.useMemo(() => {
        return filterItemsForPort(items, port);
    }, [items, port]);

    // Derived filtering based on search
    const filteredItems = React.useMemo(() => {
        if (!search) return compatibleItems;
        return compatibleItems.filter(item => {
            const cleanedName = cleanName(item.name, item.className).toLowerCase();
            const searchLower = search.toLowerCase();
            return cleanedName.includes(searchLower) ||
                item.manufacturer?.toLowerCase().includes(searchLower) ||
                item.className.toLowerCase().includes(searchLower);
        });
    }, [compatibleItems, search]);

    const currentItem = port.InstalledItem;

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset search when opening
    useEffect(() => {
        if (isOpen) setSearch('');
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    group p-5 bg-white/[0.03] border rounded-xl cursor-pointer transition-all duration-300
                    hover:bg-white/[0.06] hover:border-sc-blue/40
                    ${isOpen ? 'border-sc-blue ring-1 ring-sc-blue/20 bg-black' : 'border-white/10'}
                `}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`
                            w-12 h-12 rounded-lg flex items-center justify-center border transition-colors
                            ${isOpen ? 'bg-sc-blue/10 border-sc-blue/30' : 'bg-black/40 border-white/5'}
                        `}>
                            {getIcon(port.Types)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold truncate ${currentItem ? 'text-white text-lg' : 'text-gray-500 italic'}`}>
                                    {currentItem ? cleanName(currentItem.Name, currentItem.ClassName) : 'EMPTY SLOT'}
                                </span>
                                {currentItem && (
                                    <span className="text-[10px] px-2 py-0.5 border border-white/10 rounded-sm font-mono text-sc-blue bg-sc-blue/5">
                                        SIZE {currentItem.Size}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sc-blue' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#0F1016] border border-sc-blue/30 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] z-[100] overflow-hidden flex flex-col max-h-[400px] animate-in fade-in zoom-in-95 duration-100">

                    {/* Search Bar */}
                    <div className="p-3 border-b border-white/10 bg-black/20 sticky top-0 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Filter components..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-sc-blue/50 focus:ring-1 focus:ring-sc-blue/20 font-mono"
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
                        {/* Unequip Option */}
                        <div
                            onClick={() => {
                                onSelect(null);
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-3 p-3 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-lg cursor-pointer group/unequip mb-1 transition-colors"
                        >
                            <div className="w-8 h-8 rounded flex items-center justify-center bg-white/5 text-gray-500 group-hover/unequip:text-red-400 group-hover/unequip:bg-red-500/20 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-400 group-hover/unequip:text-red-400">UNEQUIP ITEM</span>
                        </div>

                        {filteredItems.map(item => {
                            const isSelected = item.className === currentItem?.ClassName;
                            const stats = getItemStats(item);

                            return (
                                <div
                                    key={item.className}
                                    onClick={() => {
                                        onSelect(item);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        relative flex items-start gap-3 p-3 rounded-lg cursor-pointer border border-transparent transition-all mb-1
                                        ${isSelected ? 'bg-sc-blue/10 border-sc-blue/30' : 'hover:bg-white/5 hover:border-white/10'}
                                    `}
                                >
                                    {/* Selection Indicator */}
                                    {isSelected && <div className="absolute right-3 top-3"><Check className="w-4 h-4 text-sc-blue" /></div>}

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-sm font-bold ${isSelected ? 'text-sc-blue' : 'text-gray-200'}`}>
                                                {cleanName(item.name, item.className)}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1 rounded">S{item.size}</span>
                                        </div>

                                        {/* Quick Stats Grid */}
                                        {stats.length > 0 && (
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                                {stats.map((stat, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                                                        <span className="text-gray-600">{stat.label}</span>
                                                        <span className="text-gray-400 font-bold">{stat.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {stats.length === 0 && (
                                            <p className="text-[10px] text-gray-600 font-mono mt-1 uppercase">{item.manufacturer || 'Unknown Mfg'}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredItems.length === 0 && (
                            <div className="py-8 text-center">
                                <p className="text-gray-500 text-sm">No matching items found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
