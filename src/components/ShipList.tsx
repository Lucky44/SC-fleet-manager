import React, { useState } from 'react';
import type { Ship } from '../types';
import { Search, Plus, Filter } from 'lucide-react';

interface ShipListProps {
    ships: Ship[];
    onAddToFleet: (ship: Ship) => void;
}

export const ShipList: React.FC<ShipListProps> = ({ ships, onAddToFleet }) => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const cleanShipName = (ship: Ship): string => {
        const parts = ship.Name.split(' ');
        if (parts.length <= 1) return ship.Name;

        const firstWord = parts[0];
        // If first word matches code (e.g. RSI) or is in manufacturer name (e.g. Aegis), strip it
        if (firstWord.toUpperCase() === ship.Manufacturer.Code.toUpperCase() ||
            ship.Manufacturer.Name.includes(firstWord)) {
            return parts.slice(1).join(' ');
        }
        return ship.Name;
    };

    const filteredShips = ships.filter(ship =>
        ship.Name.toLowerCase().includes(search.toLowerCase()) &&
        (roleFilter === '' || ship.Role === roleFilter)
    ).sort((a, b) => cleanShipName(a).localeCompare(cleanShipName(b)));

    const roles = Array.from(new Set(ships.map(s => s.Role))).sort();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 bg-sc-gray p-4 rounded-xl border border-white/5 shadow-2xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="SEARCH SHIPS..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sc-blue focus:outline-none focus:border-sc-blue/50 font-mono"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg py-2 px-4 text-gray-300 focus:outline-none focus:border-sc-blue/50"
                    >
                        <option value="">ALL ROLES</option>
                        {roles.map(role => (
                            <option key={role} value={role}>{role.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredShips.map(ship => (
                    <ShipCard key={ship.ClassName} ship={ship} onAddToFleet={onAddToFleet} />
                ))}
            </div>
        </div>
    );
};

const ShipCard: React.FC<{ ship: Ship; onAddToFleet: (ship: Ship) => void }> = ({ ship, onAddToFleet }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="group bg-sc-gray border border-white/20 rounded-2xl overflow-hidden hover:border-sc-blue/30 transition-all hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] flex flex-col">
            <div className="px-3 pb-3 pt-1 flex-1 flex flex-col">
                <div className="flex justify-end items-start min-h-[0px]">
                    {expanded && (
                        <span className="text-[10px] font-mono text-gray-500 uppercase animate-in fade-in slide-in-from-bottom-2">
                            SIZE {ship.Size}
                        </span>
                    )}
                </div>


                <h3 className="text-lg font-bold mb-1 text-blue-400 transition-colors">
                    {(() => {
                        const parts = ship.Name.split(' ');
                        const firstWord = parts[0];
                        if (parts.length > 1 && (firstWord.toUpperCase() === ship.Manufacturer.Code.toUpperCase() || ship.Manufacturer.Name.includes(firstWord))) {
                            return parts.slice(1).join(' ');
                        }
                        return ship.Name;
                    })()}
                </h3>

                <div className="flex-1"></div>

                {expanded && (
                    <div className="mt-4 mb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-black bg-sc-blue px-2 py-0.5 rounded font-bold">
                                {ship.Manufacturer.Code}
                            </span>
                            <p className="text-xs text-gray-400 font-mono border-l-2 border-sc-blue pl-2">
                                {ship.Role.toUpperCase()} / {ship.Career.toUpperCase()}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/30 p-2 rounded border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase font-mono">Cargo</p>
                                <p className="text-sm font-bold">{ship.Cargo} SCU</p>
                            </div>
                            <div className="bg-black/30 p-2 rounded border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase font-mono">Size</p>
                                <p className="text-sm font-bold">{ship.Size}</p>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 italic">
                            {ship.Description}
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-2 flex gap-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-0 rounded-lg transition-all text-xs font-mono border border-white/5"
                    >
                        {expanded ? 'LESS INFO' : 'DETAILS'}
                    </button>
                    <button
                        onClick={() => onAddToFleet(ship)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white py-0 rounded-lg transition-all text-xs font-bold border border-white/5"
                    >
                        <Plus className="w-4 h-4" /> ADD
                    </button>
                </div>
            </div>
        </div>
    );
};
