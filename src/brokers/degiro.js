import Big from 'big.js';

import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';

export const canParsePage = content => content.includes('www.degiro.de');

const parseActivity = (content, index) => {
  const foreignCurrencyOffset = content[index + 6] === 'EUR' ? 0 : 1;
  const company = content[index + 2];
  const isin = content[index + 3];
  const shares = parseGermanNum(content[index + 5]);
  let amount = parseGermanNum(content[index + 11]);

  // So far no testing for sell or dividend available
  if (amount >= 0) {
    console.error('Can not parse sell orders and dividends yet');
  }
  const type = amount < 0 ? 'Buy' : undefined;
  amount = Big(amount).abs();
  const price = amount.div(shares);
  const fee = Math.abs(
    parseGermanNum(content[index + 13 + foreignCurrencyOffset])
  );

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    content[index],
    content[index + 1],
    'dd-MM-yyyy',
    'dd-MM-yyyy HH:mm'
  );

  return validateActivity({
    broker: 'degiro',
    date: parsedDate,
    datetime: parsedDateTime,
    company: company,
    isin: isin,
    shares: shares,
    amount: +amount,
    type: type,
    price: +price,
    fee: fee,
    tax: 0,
  });
};

export const parsePages = contents => {
  let activities = [];
  for (let content of contents) {
    let transactionIndex = content.indexOf('Gesamt') + 1;
    while (transactionIndex > 0 && content.length - transactionIndex > 15) {
      // Entries might have a longer length (by 1) if there is a currency rate
      // this checks that the entry is a date in the expected format
      if (!content[transactionIndex].match(/^[0-9]{2}-[0-9]{2}-[0-9]{4}$/)) {
        transactionIndex += 1;
        continue;
      }
      try {
        // A normal activity w/o currency rates spans 16 lines from date to date
        activities.push(parseActivity(content, transactionIndex));
        transactionIndex += 16;
      } catch (exception) {
        console.error('Error while parsing page (degiro)', exception, content);
      }
    }
  }

  return {
    activities,
    status: 0,
  };
};
