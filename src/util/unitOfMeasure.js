/** Canonical values stored in DB / API */
export const UNIT_OF_MEASURE_OPTIONS = [
    { value: 'pcs', label: 'Бройка' },
    { value: 'kg', label: 'Килограм (кг)' },
    { value: 'l', label: 'Литър (л)' },
];

/** Short labels: бр. / кг / л */
export function formatUnitLabel(unitOfMeasure) {
    const unit = (unitOfMeasure || 'pcs').toString().trim().toLowerCase();
    switch (unit) {
        case 'kg':
        case 'кг':
            return 'кг';
        case 'l':
        case 'lt':
        case 'л':
            return 'л';
        case 'pcs':
        case 'pc':
        case 'бр':
        case 'бр.':
        case 'брой':
        case 'бройка':
        default:
            return 'бр.';
    }
}

/** @deprecated use formatUnitLabel — same short forms */
export function formatUnitFullLabel(unitOfMeasure) {
    return formatUnitLabel(unitOfMeasure);
}

export function formatStockWithUnit(quantity, unitOfMeasure) {
    const qty = quantity ?? 0;
    return `${qty} ${formatUnitLabel(unitOfMeasure)}`;
}
