const precision = 10000;

export const round = num => Math.round(num * precision) / precision;

export const isBelowDelta = (a, b, delta = 0.0001) => {
  Math.abs(a - b) < delta;
};
