import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum } from '@/helper';

const findISIN = text => text[text.findIndex(t => t === 'ISIN') + 3];

const findCompany = text => text[text.findIndex(t => t === 'ISIN') + 1];

const findDividendCompany = textArr =>
  textArr[textArr.findIndex(t => t === 'DIVIDENDENGUTSCHRIFT') + 2];

const findDividendWKN = textArr => {
  return textArr[textArr.findIndex(t => t === 'DIVIDENDENGUTSCHRIFT') + 1]
    .split('WKN:')
    .pop()
    .trim();
};

const findDateBuySell = textArr => {
  const idx = textArr.findIndex(
    t => t.toLowerCase() === 'wertpapierabrechnung'
  );
  const date = textArr[idx + 2].substr(3, 10).trim();

  return date;
};

const findDateDividend = textArr => {
  const keyword = 'schlusstag per';
  const dateLine = textArr.find(t => t.toLowerCase().includes(keyword));
  const date = dateLine.substr(dateLine.length - 10).trim();
  return date;
};

const findShares = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'umsatz');
  const shares = textArr[idx + 2];

  return parseGermanNum(shares);
};

const findDividendShares = textArr => {
  const sharesLine = textArr.find(t => t.includes('ST'));
  const shares = sharesLine.split('ST')[1];
  return parseGermanNum(shares);
};

const findAmount = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'kurswert');
  const amount = textArr[idx + 2];

  return parseGermanNum(amount);
};

const findPayout = textArr => {
  const payoutLine = textArr.find(
    t => t.toLowerCase && t.toLowerCase().includes('wert')
  );
  const payoutString = payoutLine.split('EUR').pop().trim();
  return parseGermanNum(payoutString);
};

const findFee = textArr => {
  const brokerageIdx = textArr.findIndex(
    t => t.toLowerCase() === 'eig. spesen'
  );
  const brokerage = brokerageIdx >= 0 ? textArr[brokerageIdx + 2] : null;
  const baseFeeIdx = textArr.findIndex(t => t.toLowerCase() === 'grundgebühr');
  const baseFee = baseFeeIdx >= 0 ? textArr[baseFeeIdx + 2] : null;

  const sum = +Big(parseGermanNum(brokerage)).plus(
    Big(parseGermanNum(baseFee))
  );

  return Math.abs(sum);
};

const findTax = textArr => {
  const kapstIdx = textArr.findIndex(t => t.toLowerCase() === 'kapst');
  const solzIdx = textArr.findIndex(t => t.toLowerCase() === 'solz');

  const kapst = kapstIdx >= 0 ? textArr[kapstIdx + 3] : null;
  const solz = solzIdx >= 0 ? textArr[solzIdx + 3] : null;
  const sum = +Big(parseGermanNum(kapst)).plus(Big(parseGermanNum(solz)));

  return Math.abs(sum);
};

const findDividendTax = textArr => {
  const endTaxLine = textArr.findIndex(t => t.includes('WERT'));
  const sum = textArr.reduce((acc, t, i) => {
    const isTax = t.includes('KAPST') || t.includes('SOLZ');

    if (isTax && i < endTaxLine) {
      let taxLineSplitted = textArr[i].split('EUR');
      let taxAmountString = taxLineSplitted[taxLineSplitted.length - 1];
      return acc.plus(Big(parseGermanNum(taxAmountString)));
    }
    return acc;
  }, Big(0));

  return Math.abs(+sum);
};

const isBuy = textArr => {
  const idx = textArr.findIndex(
    t => t.toLowerCase() === 'wertpapierabrechnung'
  );
  return idx >= 0 && textArr[idx + 1].toLowerCase() === 'kauf';
};

const isSell = textArr => {
  const idx = textArr.findIndex(
    t => t.toLowerCase() === 'wertpapierabrechnung'
  );
  return idx >= 0 && textArr[idx + 1].toLowerCase() === 'verkauf';
};

const isDividend = textArr =>
  textArr.some(t =>
    ['ertragsgutschrift', 'dividendengutschrift'].includes(t.toLowerCase())
  );

export const canParseData = textArr => {
  const isCortalConsors = textArr.some(t => {
    return t.toLowerCase && t.toLowerCase().includes('cortal consors s.a.');
  });

  if (!isCortalConsors) {
    return false;
  }

  const isSupportedType =
    isBuy(textArr) || isSell(textArr) || isDividend(textArr);

  return isSupportedType;
};

export const parseData = textArr => {
  let type, date, isin, wkn, company, shares, price, amount, fee, tax;

  if (isBuy(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = +Big(amount).div(Big(shares));
    fee = findFee(textArr);
    tax = 0;
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = +Big(amount).div(Big(shares));
    fee = findFee(textArr);
    tax = findTax(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    wkn = findDividendWKN(textArr);
    company = findDividendCompany(textArr);
    date = findDateDividend(textArr);
    shares = findDividendShares(textArr);
    amount = findPayout(textArr);
    price = +Big(amount).div(Big(shares));
    fee = 0;
    tax = findDividendTax(textArr);
  }

  const activity = {
    broker: 'cortalconsors',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    wkn,
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  };

  // Since we do not receive the ISIN from a dividend pdf,
  // it is okay that the ISIN maybe undefined.
  const valid =
    (!!activity.broker || activity.broker === 0) &&
    (!!activity.type || activity.type === 0) &&
    (!!activity.date || activity.date === 0) &&
    // (!!activity.wkn || activity.wkn === 0) &&
    (!!activity.company || activity.company === 0) &&
    (!!activity.shares || activity.shares === 0) &&
    (!!activity.price || activity.price === 0) &&
    (!!activity.amount || activity.amount === 0) &&
    (!!activity.fee || activity.fee === 0) &&
    (!!activity.tax || activity.tax === 0);

  if (!valid) {
    console.error('Error while parsing PDF', activity);
    return undefined;
  } else {
    return activity;
  }
};

export const parsePages = contents => {
  // only first page has activity data
  const activity = parseData(contents[0]);
  return [activity];
};
