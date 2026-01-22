import type { FleetShip } from '../types';

/**
 * Encodes a fleet into a compressed, URI-safe string.
 * Currently uses Base64 encoding.
 */
export const encodeFleet = (fleet: FleetShip[]): string => {
    try {
        const json = JSON.stringify(fleet);
        // Using btoa for Base64, but we need to handle Unicode safely for ship names
        const encoded = btoa(unescape(encodeURIComponent(json)));
        return encoded;
    } catch (e) {
        console.error("Failed to encode fleet:", e);
        return "";
    }
};

/**
 * Decodes a fleet from a Base64 encoded string.
 */
export const decodeFleet = (data: string): FleetShip[] | null => {
    try {
        const decoded = decodeURIComponent(escape(atob(data)));
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return null;
    } catch (e) {
        console.error("Failed to decode fleet data:", e);
        return null;
    }
};

/**
 * Generates a shareable URL containing the current fleet.
 */
export const generateShareUrl = (fleet: FleetShip[]): string => {
    const encoded = encodeFleet(fleet);
    const url = new URL(window.location.href);
    url.searchParams.set('fleet', encoded);
    return url.toString();
};

/**
 * Downloads the fleet as a JSON file.
 */
export const exportFleetToJson = (fleet: FleetShip[]) => {
    const json = JSON.stringify(fleet, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sc-fleet-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};
