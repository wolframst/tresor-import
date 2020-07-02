import format from 'date-fns/format';
import Big from 'big.js';

import { parseGermanNum } from '@/helper';

function normalizeActivity(a) {
  let type;

  if (a['Typ'] === 'Dividende') {
    type = 'Dividend';
  } else if (a['Typ'] === 'Kauf') {
    type = 'Buy';
  } else if (a['Typ'] === 'Verkauf') {
    type = 'Sell';
  } else if (a['Typ'] === 'Einlage') {
    type = 'cashIn';
  } else if (a['Typ'] === 'Entnahme') {
    type = 'cashOut';
  } else if (a['Typ'] === 'Einlieferung') {
    type = 'transferIn';
  } else if (a['Typ'] === 'Auslieferung') {
    type = 'transferOut';
  } else if (a['Typ'] === 'Umbuchung (Eingang)') {
    type = 'bookIn';
  } else if (a['Typ'] === 'Umbuchung (Ausgang)') {
    type = 'bookOut';
  }

  const normalized = {
    type,
    company: a['Wertpapiername'],
    isin: a['ISIN'],
    wkn: a['WKN'],
    symbol: a['Ticker-Symbol'],
    date: format(new Date(a['Datum']), 'yyyy-MM-dd'),
    shares: parseGermanNum(a['Stück']),
    amount: parseGermanNum(a['Wert']),
    grossAmount: parseGermanNum(a['Bruttobetrag']),
    tax: parseGermanNum(a['Steuern']),
    fee: parseGermanNum(a['Gebühren']),
    currency: a['Buchungswährung'],
    grossCurrency: a['Währung Bruttobetrag'],
    exchangeRate: parseGermanNum(a['Wechselkurs']),
  };

  return normalized;
}

const validateActivity = a => {
  const supportedTypes = ['Buy', 'Sell', 'Dividend'];

  // Filter "Buy" cash oposite
  if (a.type === 'Buy' && a.amount < 0) {
    return [];
  }

  // filter "Sell" cash opposite
  if (a.type === 'Sell' && a.amount > 0) {
    return [];
  }

  // transform transferOut to Sell
  if (a.type === 'transferOut') {
    a.type = 'Sell';
  }

  // transform transferIn to Buy
  if (a.type === 'transferIn') {
    a.type = 'Buy';
  }

  // filter cash movements and other non-supported types
  if (!supportedTypes.includes(a.type)) {
    return [];
  }

  if (a.amount <= 0) {
    // remove negative values from sales
    a.amount = Math.abs(a.amount);
  }

  // PP exports net amounts for Sales. Add fees and taxes again to it
  // so a sale represents the actual value of the stock once it was sold
  // so shares * price === amount is true
  const bigFee = Big(a.fee);
  const bigTax = Big(a.tax);
  const delta = bigFee.plus(bigTax);

  if (a.type === 'Sell') {
    a.amount = +Big(a.amount).plus(delta);
  } else if (a.type === 'Buy') {
    a.amount = +Big(a.amount).minus(delta);
  } else if (a.type === 'Dividend') {
    a.amount = +Big(a.amount).plus(delta);
  }

  // calculate price (Kurs)
  if (a.shares > 0) {
    a.price = +Big(a.amount).div(Big(a.shares));
  }

  a.parsed = true;

  return [a];
};

export const parsePortfolio = transactions => {
  console.log('extract EVERYTHING');
  const activities = transactions
    .filter(a => !!a['Typ'])
    .map(normalizeActivity);
  console.table(activities);
  const supportedActivities = activities.flatMap(validateActivity);
  return supportedActivities;
};
