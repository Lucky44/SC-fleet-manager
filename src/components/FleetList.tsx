import React from 'react';
import type { FleetShip, Ship } from '../types';
import { Trash2, Settings2, Rocket } from 'lucide-react';

interface FleetListProps {
    fleet: FleetShip[];
    ships: Ship[];
    onRemove: (id: string) => void;
    onEdit: (ship: FleetShip) => void;
}

export const FleetList: React.FC<FleetListProps> = ({ fleet, ships, onRemove, onEdit }) => {
    if (fleet.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-sc-gray rounded-3xl border border-dashed border-white/10">
                <Rocket className="w-16 h-16 text-gray-700 mb-4" />
                <h3 className="text-xl font-bold text-gray-500">YOUR HANGAR IS EMPTY</h3>
                <p className="text-gray-600 mt-2">Go to the ship database to add ships to your fleet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fleet.map(fs => {
                const shipData = ships.find(s => s.ClassName === fs.shipClass);
                if (!shipData) return null;

                return (
                    <div key={fs.id} className="relative bg-sc-gray border border-white/5 rounded-2xl overflow-hidden p-6 shadow-xl">
                        <div className="absolute top-0 right-0 p-4 flex gap-2">
                            <button
                                onClick={() => onEdit(fs)}
                                className="p-2 hover:bg-sc-blue hover:text-black rounded-lg transition-all text-gray-500"
                                title="Edit Loadout"
                            >
                                <Settings2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onRemove(fs.id)}
                                className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all text-gray-500"
                                title="Remove from Fleet"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <span className="text-[10px] font-mono text-sc-blue tracking-tighter bg-sc-blue/10 px-2 py-0.5 rounded border border-sc-blue/20">
                                {shipData.Manufacturer.Name}
                            </span>
                        </div>

                        <h3 className="text-2xl font-bold mb-1">{fs.name}</h3>
                        <p className="text-sm text-gray-500 font-mono mb-6">{shipData.Name}</p>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-gray-500 uppercase">Loadout Status</span>
                                <span className="text-sc-blue">ACTIVE</span>
                            </div>
                            <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                                <div className="bg-sc-blue h-full w-[85%] shadow-[0_0_10px_rgba(0,210,255,0.5)]"></div>
                            </div>
                        </div>

                        <button
                            onClick={() => onEdit(fs)}
                            className="mt-6 w-full bg-sc-blue/10 hover:bg-sc-blue/20 text-sc-blue py-3 rounded-xl border border-sc-blue/20 font-bold transition-all text-sm tracking-widest"
                        >
                            CONFIGURE SYSTEMS
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
