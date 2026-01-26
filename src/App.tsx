import React, { useState, useEffect } from 'react';
import type { Ship, Item, FleetShip } from './types';
import { fetchShips, fetchItems } from './services/dataService';
import { ShipList } from './components/ShipList';
import { FleetList, DatalinkInfo } from './components/FleetList';
import { LoadoutEditor } from './components/LoadoutEditor';
import { Rocket, Shield, Database, Layout, FileText } from 'lucide-react';
import { decodeFleet } from './utils/dataEncoding';

const App: React.FC = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [fleet, setFleet] = useState<FleetShip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ships' | 'fleet'>('ships');
  const [editingShipId, setEditingShipId] = useState<string | null>(null);
  const [showDatalinkHelp, setShowDatalinkHelp] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [shipsData, itemsData] = await Promise.all([fetchShips(), fetchItems()]);
        setShips(shipsData);
        setItems(itemsData);

        // Check for URL-based fleet import
        const urlParams = new URLSearchParams(window.location.search);
        const encodedFleet = urlParams.get('fleet');

        if (encodedFleet) {
          const decoded = decodeFleet(encodedFleet);
          if (decoded && window.confirm("Detected a shared fleet! Would you like to import it? This will merge with your current fleet.")) {
            // Remove the param from URL without refreshing
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);

            setFleet(prev => {
              // Simple merge: append imports, but could be smarter (dedupe by ID)
              const merged = [...prev, ...decoded];
              return merged;
            });
            setActiveTab('fleet');
          }
        }

        const savedFleet = localStorage.getItem('sc_fleet');
        if (savedFleet) {
          try {
            const parsed = JSON.parse(savedFleet);
            if (Array.isArray(parsed)) {
              // If we already imported from URL, only set from storage if fleet is currently empty
              setFleet(current => current.length === 0 ? parsed : current);
            }
          } catch (e) {
            console.error("Failed to parse saved fleet:", e);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to local storage whenever fleet changes
  useEffect(() => {
    if (loading) return; // Don't save while initial data is loading
    localStorage.setItem('sc_fleet', JSON.stringify(fleet));
  }, [fleet, loading]);

  // Handle toast timeout
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const addToFleet = (ship: Ship) => {
    const newShip: FleetShip = {
      id: crypto.randomUUID(),
      shipClass: ship.ClassName,
      name: ship.Name,
      customLoadout: {}
    };
    setFleet([...fleet, newShip]);
    setToast({ message: `${ship.Name.toUpperCase()} ADDED TO FLEET`, visible: true });
    // setActiveTab('fleet');
  };

  const removeFromFleet = (id: string) => {
    setFleet(fleet.filter(s => s.id !== id));
    if (editingShipId === id) setEditingShipId(null);
  };

  const clearFleet = () => {
    setFleet([]);
    setEditingShipId(null);
  };

  const importFleet = (newFleet: FleetShip[]) => {
    setFleet([...fleet, ...newFleet]);
  };

  const updateLoadout = (id: string, portName: string, itemClassName: string) => {
    setFleet(fleet.map(s => {
      if (s.id === id) {
        return {
          ...s,
          customLoadout: { ...s.customLoadout, [portName]: itemClassName }
        };
      }
      return s;
    }));
  };

  const editingShip = fleet.find(s => s.id === editingShipId);

  if (loading) {
    return (
      <div className="min-h-screen bg-sc-dark flex items-center justify-center text-sc-blue">
        <div className="flex flex-col items-center gap-4">
          <Rocket className="animate-bounce w-12 h-12" />
          <p className="text-xl font-mono tracking-widest">INITIALIZING HUD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sc-dark text-gray-200 font-sans">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-50 bg-sc-dark/80 backdrop-blur-md border-b border-white/5 pb-4 px-4 md:px-8">
        <header className="max-w-7xl mx-auto pt-4 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-bold text-sc-blue tracking-tighter flex items-center gap-2">
              <Shield className="w-10 h-10" /> SC FLEET LOADOUT MANAGER
            </h1>
            <p className="text-gray-500 font-mono text-sm mt-1 flex items-center gap-2">
              v4.9.1 [BUILD: 2026-01-25 21:05] // DATALINK: SCUNPACKED
              <a
                href="https://github.com/Lucky44/sc-fleet-loadout-manager/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sc-blue/60 hover:text-sc-blue transition-colors flex items-center gap-1 ml-1"
                title="View Documentation"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-widest border-b border-sc-blue/30">Docs</span>
              </a>
            </p>
          </div>

          <nav className="flex bg-sc-gray rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('ships')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all ${activeTab === 'ships' ? 'bg-sc-blue text-orange-600 font-bold' : 'hover:bg-white/5 text-orange-500'}`}
            >
              <Database className="w-4 h-4" /> SHIP DATABASE
            </button>
            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all ${activeTab === 'fleet' ? 'bg-sc-blue text-orange-600 font-bold' : 'hover:bg-white/5 text-orange-500'}`}
            >
              <Layout className="w-4 h-4" /> MY FLEET ({fleet.length})
            </button>
          </nav>
        </header>

        {/* Global Datalink Status - Always visible above content */}
        <div className="max-w-7xl mx-auto">
          <DatalinkInfo showHelp={showDatalinkHelp} setShowHelp={setShowDatalinkHelp} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'ships' ? (
          <ShipList ships={ships} onAddToFleet={addToFleet} />
        ) : (
          <FleetList
            fleet={fleet}
            ships={ships}
            onRemove={removeFromFleet}
            onEdit={(ship) => setEditingShipId(ship.id)}
            onImport={importFleet}
            onClear={clearFleet}
          />
        )}
      </main>

      {/* Loadout Modal */}
      {editingShip && (
        <LoadoutEditor
          fleetShip={editingShip}
          ships={ships}
          items={items}
          onUpdate={updateLoadout}
          onClose={() => setEditingShipId(null)}
        />
      )}
      {/* Toast Notification */}
      <div className={`fixed inset-0 pointer-events-none z-[100] flex items-center justify-center transition-all duration-500 ${toast.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="bg-[#0b0c15]/90 border-2 border-orange-500/50 rounded-xl px-12 py-6 shadow-[0_0_80px_rgba(249,115,22,0.3)] flex flex-col items-center gap-4 relative overflow-hidden backdrop-blur-2xl">
          {/* Decorative scanner line */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse"></div>

          <div className="w-8 h-8 rounded border border-orange-500/30 flex items-center justify-center bg-orange-500/5">
            <Rocket className="w-4 h-4 text-orange-500" />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[12px] font-mono text-orange-500/50 uppercase tracking-[0.3em] leading-none mb-2">Datalink Transmission</span>
            <span className="text-orange-500 font-black italic tracking-tighter text-2xl leading-none">
              {toast.message}
            </span>
          </div>

          <div className="flex items-center gap-2 opacity-40">
            <div className="w-8 h-1 bg-orange-500/30"></div>
            <div className="w-12 h-1 bg-orange-500/50"></div>
            <div className="w-8 h-1 bg-orange-500/30"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
