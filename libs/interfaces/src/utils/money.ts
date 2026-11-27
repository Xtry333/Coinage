/** Round charges and credits symmetrically, to the precision stored in PostgreSQL. */
export function roundMoney(value: number): number {
    const rounded = Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100;
    return rounded === 0 ? 0 : rounded * Math.sign(value);
}
