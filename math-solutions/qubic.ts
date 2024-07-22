import { Decimal } from "decimal.js";

function solveCubicCardano(
  a: Decimal,
  b: Decimal,
  c: Decimal,
  d: Decimal
): Decimal[] {
  const p = new Decimal(3)
    .times(a)
    .times(c)
    .minus(b.pow(2))
    .div(new Decimal(3).times(a.pow(2)));
  const q = new Decimal(2)
    .times(b.pow(3))
    .minus(new Decimal(9).times(a).times(b).times(c))
    .plus(new Decimal(27).times(a.pow(2)).times(d))
    .div(new Decimal(27).times(a.pow(3)));

  const delta = q.div(2).pow(2).plus(p.div(3).pow(3));

  if (delta.gt(0)) {
    const u = q.div(-2).plus(delta.sqrt()).cbrt();
    const v = q.div(-2).minus(delta.sqrt()).cbrt();
    return [u.plus(v).minus(b.div(new Decimal(3).times(a)))];
  } else if (delta.eq(0)) {
    const u = q.div(-2).cbrt();
    return [
      u.times(2).minus(b.div(new Decimal(3).times(a))),
      u.neg().minus(b.div(new Decimal(3).times(a))),
    ];
  } else {
    const r = new Decimal(2).times(p.div(-3).sqrt());
    const theta = q.times(new Decimal(3)).div(p.times(r)).acos().div(3);
    const x1 = r.times(theta.cos()).minus(b.div(new Decimal(3).times(a)));
    const x2 = r
      .times(theta.plus(new Decimal(2).times(Math.PI).div(3)).cos())
      .minus(b.div(new Decimal(3).times(a)));
    const x3 = r
      .times(theta.minus(new Decimal(2).times(Math.PI).div(3)).cos())
      .minus(b.div(new Decimal(3).times(a)));
    return [x1, x2, x3];
  }
}

function calculateNewY(x: number, y: number, deltaX: number): Decimal {
  const xDecimal = new Decimal(x);
  const yDecimal = new Decimal(y);
  const deltaXDecimal = new Decimal(deltaX);

  const k = xDecimal
    .pow(3)
    .times(yDecimal)
    .plus(yDecimal.pow(3).times(xDecimal));
  const xPrime = xDecimal.plus(deltaXDecimal);

  const roots = solveCubicCardano(
    new Decimal(1),
    new Decimal(0),
    xPrime.pow(2),
    k.neg().div(xPrime)
  );
  const positiveRoots = roots.filter((root) => root.gt(0));
  if (positiveRoots.length === 0) {
    throw new Error("No positive roots found");
  }
  console.log(roots);
  return positiveRoots[0]; // Only one positive root should be found
}

function calculateDeltaY(x: number, y: number, deltaX: number): number {
  const yPrime = calculateNewY(x, y, deltaX);
  const yDecimal = new Decimal(y);
  const deltaY = yDecimal.minus(yPrime);
  return deltaY.toNumber();
}

const x = 2;
const y = 1;
const deltaX = 1;
try {
  const deltaY = calculateDeltaY(x, y, deltaX);
  console.log(`Difference y: ${deltaY}`);
} catch (error) {
  console.error(error);
}
