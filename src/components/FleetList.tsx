import React from 'react';
import type { FleetShip, Ship } from '../types';
import { Trash2, Settings2, Rocket, Share2, Download, Upload, Trash, Info, ChevronDown, ChevronUp, ShieldCheck, Zap } from 'lucide-react';
import { generateShareUrl, exportFleetToJson } from '../utils/dataEncoding';

export interface DatalinkInfoProps {
    showHelp: boolean;
    setShowHelp: (show: boolean) => void;
}

export const DatalinkInfo: React.FC<DatalinkInfoProps> = ({ showHelp, setShowHelp }) => (
    <div className="mb-0 overflow-hidden rounded-2xl border border-sc-blue/20 bg-sc-blue/5">
        <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex w-full items-center justify-between p-4 text-sc-blue transition-colors hover:bg-sc-blue/10"
        >
            <div className="flex items-center gap-2 font-bold">
                <Info className="w-5 h-5" />
                <span className="text-sm tracking-widest uppercase">Datalink Status: Manual Sync Required</span>
            </div>
            {showHelp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showHelp && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-t border-sc-blue/10 bg-black/20">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sc-blue font-bold text-xs">
                        <Zap className="w-4 h-4" /> INSTANT SYNC
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Use <strong>Share Fleet</strong> to generate a secure Datalink URL. Open this link on any device to instantly clone your hangar.
                    </p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sc-blue font-bold text-xs">
                        <Download className="w-4 h-4" /> HARD COPY
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        <strong>Export</strong> your fleet as a JSON file. Perfect for long-term backups or keeping multiple fleet variants on your PC.
                    </p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sc-blue font-bold text-xs">
                        <ShieldCheck className="w-4 h-4" /> PRIVACY FIRST
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        No cloud accounts. All data stays in your browser's Local Storage until you choose to share or export it.
                    </p>
                </div>
            </div>
        )}
    </div>
);

interface FleetListProps {
    fleet: FleetShip[];
    ships: Ship[];
    onRemove: (id: string) => void;
    onEdit: (ship: FleetShip) => void;
    onImport: (fleet: FleetShip[]) => void;
    onClear: () => void;
}

export const FleetList: React.FC<FleetListProps> = ({ fleet, ships, onRemove, onEdit, onImport, onClear }) => {
    const [isConfirmingClear, setIsConfirmingClear] = React.useState(false);


    const handleShare = () => {
        const url = generateShareUrl(fleet);
        navigator.clipboard.writeText(url);
        alert("Fleet share link copied to clipboard! Send this URL to your other devices.");
    };

    const handleExport = () => {
        exportFleetToJson(fleet);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                    onImport(parsed);
                    alert(`Successfully imported ${parsed.length} ships!`);
                }
            } catch (err) {
                alert("Failed to parse fleet file. Ensure it's a valid JSON export.");
            }
        };
        reader.readAsText(file);
    };


    const Toolbar = () => (
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-sc-gray/50 p-4 rounded-2xl border border-white/5">
            <div className="flex-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-sc-blue" /> HANGAR MANAGEMENT
                </h2>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Local Storage Status: Active</p>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleShare}
                    disabled={fleet.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-sc-blue/10 hover:bg-sc-blue/20 text-sc-blue rounded-lg border border-sc-blue/20 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Share2 className="w-4 h-4" /> SHARE FLEET
                </button>

                <button
                    onClick={handleExport}
                    disabled={fleet.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-4 h-4" /> EXPORT
                </button>

                <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 transition-all text-xs font-bold cursor-pointer">
                    <Upload className="w-4 h-4" /> IMPORT
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>

                {isConfirmingClear ? (
                    <div className="flex items-center gap-6 bg-white/5 p-1 rounded-xl border border-white/10 transition-all">
                        <button
                            onClick={() => {
                                onClear();
                                setIsConfirmingClear(false);
                            }}
                            className="w-24 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-[10px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        >
                            YES, CLEAR
                        </button>
                        <button
                            onClick={() => setIsConfirmingClear(false)}
                            className="w-24 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-[10px] font-black tracking-widest uppercase"
                        >
                            NO
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsConfirmingClear(true)}
                        disabled={fleet.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash className="w-4 h-4" /> CLEAR ALL
                    </button>
                )}
            </div>
        </div>
    );

    if (fleet.length === 0) {
        return (
            <div className="max-w-4xl mx-auto">
                <Toolbar />
                <div className="flex flex-col items-center justify-center py-20 bg-sc-gray rounded-3xl border border-dashed border-white/10">
                    <Rocket className="w-16 h-16 text-gray-700 mb-4" />
                    <h3 className="text-xl font-bold text-gray-500 uppercase tracking-tighter">Your Hangar is Empty</h3>
                    <p className="text-gray-600 mt-2 text-sm italic font-mono">"Checking Datalink... No Ships Assigned."</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto">
            <Toolbar />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fleet.map(fs => {
                    const shipData = ships.find(s => s.ClassName === fs.shipClass);

                    if (!shipData) {
                        return (
                            <div key={fs.id} className="relative bg-red-950/20 border-2 border-red-500/30 rounded-2xl overflow-hidden p-6 shadow-xl backdrop-blur-sm">
                                <div className="absolute top-0 right-0 p-4">
                                    <button
                                        onClick={() => onRemove(fs.id)}
                                        className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all text-red-500/50"
                                        title="Remove Corrupted Entry"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <span className="text-[10px] font-mono text-red-500 tracking-tighter bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-pulse">
                                        DATALINK ERROR
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold mb-1 text-red-100 italic">CORRUPTED SHIP DATA</h3>
                                <p className="text-[10px] text-red-400 font-mono mb-6 uppercase tracking-widest">CLASS: {fs.shipClass}</p>

                                <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 mb-2">
                                    <p className="text-[10px] text-red-200/60 leading-relaxed italic">
                                        "Warning: Terminal unable to sync with local hangar database for this hull. Datalink may be outdated or ship data was removed. Manual cleanup required."
                                    </p>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={fs.id} className="relative bg-sc-gray border-2 border-white/10 rounded-2xl overflow-hidden p-6 shadow-xl">
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
        </div>
    );
};
