export const buySamples = [require('./buy/2014_allianz.json')];

export const sellSamples = [require('./sell/2014_allianz.json')];

export const dividendSamples = [require('./dividend/2014_allianz.json')];

export const allSamples = buySamples.concat(sellSamples, dividendSamples);
