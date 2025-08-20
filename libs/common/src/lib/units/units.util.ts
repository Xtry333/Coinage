import { Unit } from './units.enum';

export function normalizeUnit(u?: string | null): string | null {
    return u ? u.trim().toLowerCase() : null;
}

export function parseUnit(u?: string | null): Unit | null {
    const n = normalizeUnit(u);
    if (!n) return null;
    switch (n) {
        case 'ml': return Unit.ML;
        case 'cl': return Unit.CL;
        case 'l':
        case 'liter':
        case 'litre': return Unit.L;
        case 'g': return Unit.G;
        case 'kg': return Unit.KG;
        default: return null;
    }
}

export function toLiters(size: number, unit: Unit | string | null): number | null {
    const u = typeof unit === 'string' ? parseUnit(unit) : unit;
    if (!u) return null;
    switch (u) {
        case Unit.ML: return size / 1000;
        case Unit.CL: return size / 100;
        case Unit.L: return size;
        default: return null;
    }
}

export function toKg(size: number, unit: Unit | string | null): number | null {
    const u = typeof unit === 'string' ? parseUnit(unit) : unit;
    if (!u) return null;
    switch (u) {
        case Unit.G: return size / 1000;
        case Unit.KG: return size;
        default: return null;
    }
}
