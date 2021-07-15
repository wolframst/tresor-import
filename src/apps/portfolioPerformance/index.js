import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';
import { detectLocale, getKeyMap, getTypeMap, keyNormalizer } from './utils';

const activityNormalizer = typeKeyMap => activity => {
  const type = Object.keys(typeKeyMap).find(
    key => typeKeyMap[key] === activity.type
  );
  const normalizedNumericFields = [
    'shares',
    'amount',
    'grossAmount',
    'tax',
    'fee',
    'exchangeRate',
  ].reduce(
    (prev, curr) => ({
      ...prev,
      [curr]: parseGermanNum(activity[curr]),
    }),
    {}
  );

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    activity.date.substring(0, 10),
    activity.date.substring(11, 16),
    'yyyy-MM-dd',
    'yyyy-MM-dd HH:mm'
  );

  activity = {
    ...activity,
    type,
    ...normalizedNumericFields,
    date: parsedDate,
    datetime: parsedDateTime,
  };

  // The following fields can have empty or undefined values. All of these fields (with empty or undefined values) should
  // be removed. The validation logic for activities will mark activities with empty or undefined values as invalid.
  ['isin', 'wkn', 'symbol', 'grossCurrency'].forEach(field => {
    if (activity[field] !== undefined) {
      const value = activity[field].trim();
      if (value.length === 0) {
        delete activity[field];
      }
    }

    if (activity[field] === undefined) {
      delete activity[field];
    }
  });

  return activity;
};

const validate = activity => {
  // Filter "Buy" cash oposite
  if (activity.type === 'Buy' && activity.amount < 0) {
    return [];
  }

  // filter "Sell" cash opposite
  if (activity.type === 'Sell' && activity.amount > 0) {
    return [];
  }

  // transform transferOut to Sell
  if (activity.type === 'transferOut' || activity.type === 'bookOut') {
    activity.type = 'TransferOut';
  }

  // transform transferIn to Buy
  if (activity.type === 'transferIn' || activity.type === 'bookIn') {
    activity.type = 'TransferIn';
  }

  // filter cash movements and other non-supported types
  if (
    !['Buy', 'Sell', 'Dividend', 'TransferOut', 'TransferIn'].includes(
      activity.type
    )
  ) {
    return [];
  }

  if (activity.amount <= 0) {
    // remove negative values from sales
    activity.amount = Math.abs(activity.amount);
  }

  // PP exports net amounts for Sales. Add fees and taxes again to it
  // so a sale represents the actual value of the stock once it was sold
  // so shares * price === amount is true
  const bigFee = Big(activity.fee);
  const bigTax = Big(activity.tax);
  const delta = bigFee.plus(bigTax);

  if (activity.type === 'Sell') {
    activity.amount = +Big(activity.amount).plus(delta);
  } else if (activity.type === 'Buy') {
    activity.amount = +Big(activity.amount).minus(delta);
  } else if (activity.type === 'Dividend') {
    activity.amount = +Big(activity.amount).plus(delta);
  }

  // calculate price (Kurs)
  if (activity.shares > 0) {
    activity.price = +Big(activity.amount).div(Big(activity.shares));
  }

  activity = validateActivity(activity, true);
  if (activity === undefined) {
    return [];
  }

  return [activity];
};

export const canParseDocument = (pages, extension) =>
  extension === 'csv' &&
  pages
    .flat()
    .some(
      line =>
        (line.includes('Datum') &&
          line.includes('Typ') &&
          line.includes('Wert') &&
          line.includes('Buchungswährung') &&
          line.includes('Steuern') &&
          line.includes('Stück') &&
          line.includes('ISIN') &&
          line.includes('WKN') &&
          line.includes('Ticker-Symbol') &&
          line.includes('Wertpapiername')) ||
        (line.includes('Date') &&
          line.includes('Type') &&
          line.includes('Value') &&
          line.includes('Transaction Currency') &&
          line.includes('Taxes') &&
          line.includes('Shares') &&
          line.includes('ISIN') &&
          line.includes('WKN') &&
          line.includes('Ticker Symbol') &&
          line.includes('Security Name'))
    );

export const parsePages = content => {
  if (content.length === 0) {
    return {
      activities: [],
      status: 5,
    };
  }

  const locale = detectLocale(content);
  if (!locale) {
    throw new Error('Locale could not be detected!');
  }

  const keyMap = getKeyMap(locale);
  const typeMap = getTypeMap(locale);
  if (!keyMap || !typeMap) {
    throw new Error(`'${locale}' not yet supported!`);
  }

  const normalizeKeys = keyNormalizer(keyMap);
  const normalizeActivity = activityNormalizer(typeMap);

  const activities = content
    .map(normalizeKeys)
    .filter(({ shares }) => shares !== undefined)
    .filter(({ type }) => Boolean(type))
    .map(normalizeActivity)
    .flatMap(validate);

  return {
    activities,
    status: 0,
  };
};
