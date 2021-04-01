export const buySamples = [
  require('./buy/2021_single_buy.json'),
  require('./buy/2021_single_buy_deka.json'),
];

export const sellSamples = [require('./sell/2021_single_sell_evonik.json')];

export const dividendsSamples = [require('./dividend/2021_dividend.json')];

export const allSamples = buySamples.concat(
  buySamples,
  sellSamples,
  dividendsSamples
);
