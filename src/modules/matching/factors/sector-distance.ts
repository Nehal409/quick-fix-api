/**
 * Rough Islamabad-sector distance approximation used until MapsModule provides real
 * Distance Matrix data. Outputs km and minutes — close enough to drive matching
 * factors and UI cards in the demo without making a remote call per provider.
 */
export interface SectorDistance {
    km: number;
    minutes: number;
    rationale: string;
}

const ZONE_ADJACENCY: Record<string, string[]> = {
    G: ['F', 'I'],
    F: ['G', 'E'],
    I: ['G'],
    E: ['F'],
};

function parseSector(sector: string): { zone: string; index: number } | null {
    const match = /^([A-Z])-?(\d{1,2})$/.exec(sector.toUpperCase().trim());
    if (!match) return null;
    return { zone: match[1], index: Number(match[2]) };
}

export function estimateSectorDistance(from: string | null, to: string | null): SectorDistance {
    if (!from || !to) {
        return { km: 6, minutes: 18, rationale: 'unknown sector — citywide estimate' };
    }
    if (from.toUpperCase() === to.toUpperCase()) {
        return { km: 1.5, minutes: 6, rationale: `same sector (${from})` };
    }
    const a = parseSector(from);
    const b = parseSector(to);
    if (!a || !b) {
        return { km: 6, minutes: 18, rationale: 'unparseable sector — citywide estimate' };
    }
    if (a.zone === b.zone) {
        const gap = Math.abs(a.index - b.index);
        const km = Math.min(2 + gap * 0.6, 7);
        return { km, minutes: Math.round(km * 3), rationale: `same zone, ${gap} sectors apart` };
    }
    const adjacent = (ZONE_ADJACENCY[a.zone] ?? []).includes(b.zone);
    if (adjacent) {
        return { km: 6, minutes: 18, rationale: `${a.zone} ↔ ${b.zone} (adjacent zones)` };
    }
    return { km: 9, minutes: 27, rationale: `${a.zone} ↔ ${b.zone} (non-adjacent zones)` };
}
