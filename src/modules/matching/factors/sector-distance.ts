/**
 * Rough sector-distance approximation used until MapsModule provides real
 * Distance Matrix data. Outputs km and minutes — close enough to drive matching
 * factors and UI cards in the demo without making a remote call per provider.
 *
 * Three resolution strategies, tried in order:
 *   1. Normalized exact match → same sector.
 *   2. Islamabad-style `G-13` zone+index parsing.
 *   3. Per-city ordered lists for Karachi / Lahore (index gap → distance).
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

// Ordered roughly along a south→north / cardinal axis per city so that
// `|indexA - indexB|` approximates distance.
const CITY_SECTOR_ORDER: Record<string, string[]> = {
    karachi: [
        'dha-phase-5',
        'dha-phase-6',
        'defence-phase-8',
        'clifton',
        'pechs',
        'bahadurabad',
        'gulshan-e-iqbal',
        'north-nazimabad',
    ],
    lahore: [
        'dha-phase-5',
        'cantt',
        'gulberg-iii',
        'garden-town',
        'model-town',
        'johar-town',
        'iqbal-town',
        'bahria-town',
    ],
};

function normalizeSector(s: string): string {
    return s
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-');
}

function parseSector(sector: string): { zone: string; index: number } | null {
    const match = /^([A-Z])-?(\d{1,2})$/.exec(sector.toUpperCase().trim());
    if (!match) return null;
    return { zone: match[1], index: Number(match[2]) };
}

function lookupCity(normalized: string): { city: string; index: number } | null {
    for (const [city, list] of Object.entries(CITY_SECTOR_ORDER)) {
        const idx = list.indexOf(normalized);
        if (idx >= 0) return { city, index: idx };
    }
    return null;
}

export function estimateSectorDistance(from: string | null, to: string | null): SectorDistance {
    if (!from || !to) {
        return { km: 6, minutes: 18, rationale: 'unknown sector — citywide estimate' };
    }
    const fromN = normalizeSector(from);
    const toN = normalizeSector(to);
    if (fromN === toN) {
        return { km: 1.5, minutes: 6, rationale: `same sector (${from})` };
    }

    const a = parseSector(from);
    const b = parseSector(to);
    if (a && b) {
        if (a.zone === b.zone) {
            const gap = Math.abs(a.index - b.index);
            const km = Math.min(2 + gap * 0.6, 7);
            return {
                km,
                minutes: Math.round(km * 3),
                rationale: `same zone, ${gap} sectors apart`,
            };
        }
        const adjacent = (ZONE_ADJACENCY[a.zone] ?? []).includes(b.zone);
        if (adjacent) {
            return { km: 6, minutes: 18, rationale: `${a.zone} ↔ ${b.zone} (adjacent zones)` };
        }
        return { km: 9, minutes: 27, rationale: `${a.zone} ↔ ${b.zone} (non-adjacent zones)` };
    }

    const fromCity = lookupCity(fromN);
    const toCity = lookupCity(toN);
    if (fromCity && toCity && fromCity.city === toCity.city) {
        const gap = Math.abs(fromCity.index - toCity.index);
        // Karachi/Lahore are larger metros — step size is bigger than Islamabad's.
        const km = Number(Math.min(3 + gap * 2.0, 22).toFixed(1));
        return {
            km,
            minutes: Math.round(km * 2.5),
            rationale: `${fromCity.city} — ${gap} sectors apart`,
        };
    }

    return { km: 6, minutes: 18, rationale: 'unparseable sector — citywide estimate' };
}
