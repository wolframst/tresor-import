export const buySamples = [require('./buy/disney-buy-2021.json')];

export const sellSamples = [require('./sell/sell-sse-2021.json')];

export const dividendSamples = [
  require('./dividend/johnson-johnson-dividend-2021.json'),
  require('./dividend/allianz-dividend-2021.json'),
];

export const ignoredSamples = [require('./ignored/sse-ignored-page-2021.json')];

export const allSamples = buySamples.concat(
  sellSamples,
  buySamples,
  dividendSamples
);
