import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';

const findAmountBuy = textArr => {
  const amountIndex = textArr.findIndex(t => t.includes('IBAN')) - 1;
  return parseGermanNum(textArr[amountIndex]);
};

const findAmountDividend = textArr => {
  const amountIndex =
    textArr.findIndex(t => t.includes('Steuerbemessungsgrundlage')) - 1;
  return parseGermanNum(textArr[amountIndex]);
};

const findAmountForeignDividend = textArr => {
  const amountIndex = textArr.findIndex(t => t.includes('Devisenkurs:')) + 4;
  return parseGermanNum(textArr[amountIndex]);
};

const findSharesBuy = textArr => {
  return Big(
    parseGermanNum(textArr[textArr.findIndex(t => t.includes('St.')) + 1])
  );
};

const findSharesDividend = textArr => {
  return Big(
    parseGermanNum(textArr[textArr.findIndex(t => t.includes('Stk.')) + 1])
  );
};

const findSharesForeignDividend = textArr => {
  return Big(
    parseGermanNum(textArr[textArr.findIndex(t => t.includes('STK')) + 1])
  );
};

const findDateBuy = textArr => {
  const date_string =
    textArr[textArr.findIndex(t => t.includes('Verwahrungs-Art:')) - 3];
  return format(parse(date_string, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd');
};

const findDateDividend = textArr => {
  const date_string = textArr[textArr.findIndex(t => t.includes('Valuta')) + 1];
  return format(parse(date_string, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd');
};

const findDateForeignDividend = textArr => {
  const date_string =
    textArr[textArr.findIndex(t => t.includes('Information')) - 3];
  return format(parse(date_string, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd');
};

const findWknBuy = textArr => {
  return textArr[textArr.findIndex(t => t.includes('Registered')) - 1];
};

const findWknDividend = textArr => {
  return textArr[textArr.findIndex(t => t.includes('WKN')) + 3];
};

const findWknForeignDividend = textArr => {
  return textArr[textArr.findIndex(t => t.includes('WKN/ISIN')) + 3];
};

const findIsinDividend = textArr => {
  return textArr[textArr.findIndex(t => t.includes('ISIN')) + 3];
};
const findIsinForeignDividend = textArr => {
  return textArr[textArr.findIndex(t => t.includes('STK')) + 2];
};

const findTaxDividend = textArr => {
  // Foreign Payouts need to be treated differently
  const index = textArr.findIndex(t => t.includes('abgeführte')) + 3;
  return Big(Math.abs(parseGermanNum(textArr[index])));
};

const findCompanyBuy = textArr => {
  const startCompanyName =
    textArr.findIndex(t => t.includes('Wertpapierkennnummer')) + 1;
  const endCompanyName = textArr.findIndex(t => t.includes('Registered')) - 1;
  return textArr.slice(startCompanyName, endCompanyName).join(' ');
};

const findCompanyDividend = textArr => {
  const startCompanyName =
    textArr.findIndex(t => t.includes('Investment-Ausschüttung')) + 5;
  return textArr.slice(startCompanyName, startCompanyName + 2).join(' ');
};

const findCompanyForeignDividend = textArr => {
  const startCompanyName = textArr.findIndex(t => t.includes('WKN/ISIN')) + 4;
  const endCompanyName = textArr.findIndex(t => t.includes('STK')) - 1;
  return textArr.slice(startCompanyName, endCompanyName + 1).join(' ');
};

const isBuy = textArr => textArr.some(t => t.includes('Wertpapierkauf'));

const isDividend = textArr =>
  textArr.some(t => t.includes('Investment-Ausschüttung'));

const isForeignDividend = textArr =>
  textArr.some(t => t.includes('Ertragsgutschrift'));

export const canParsePage = (content, extension) => {
  //The first PDF Page does not always contain "Commerzbank", thus this ugly
  //workaround. e. G. dividend_IE00B3RBWM25_1.json
  if (!Array.isArray(content)) {
    return undefined
  }
  const joinedContent = content.join('');
  return (
    extension === 'pdf' &&
    (joinedContent.includes('COMMERZBANK') ||
      joinedContent.includes('Commerzbank') ||
      joinedContent.includes(
        'SteuerlicheBehandlung:AusländischeInvestment-Ausschüttung'
      )) &&
    (isBuy(content) || isForeignDividend(content) || isDividend(content))
  );
};

const parseData = textArr => {
  let activity;
  if (isBuy(textArr)) {
    const foundAmount = Big(findAmountBuy(textArr));
    const foundShares = findSharesBuy(textArr);
    activity = {
      broker: 'commerzbank',
      type: 'Buy',
      date: findDateBuy(textArr),
      wkn: findWknBuy(textArr),
      company: findCompanyBuy(textArr),
      shares: +foundShares,
      price: +foundAmount.div(foundShares),
      amount: +foundAmount,
      fee: 0,
      tax: 0,
    };
  } else if (isDividend(textArr)) {
    const foundAmount = Big(findAmountDividend(textArr));
    const foundShares = findSharesDividend(textArr);
    activity = {
      broker: 'commerzbank',
      type: 'Dividend',
      date: findDateDividend(textArr),
      wkn: findWknDividend(textArr),
      isin: findIsinDividend(textArr),
      company: findCompanyDividend(textArr),
      shares: +foundShares,
      price: +foundAmount.div(foundShares),
      amount: +foundAmount,
      fee: 0,
      tax: +findTaxDividend(textArr),
    };
  } else if (isForeignDividend(textArr)) {
    const foundAmount = Big(findAmountForeignDividend(textArr));
    const foundShares = findSharesForeignDividend(textArr);
    activity = {
      broker: 'commerzbank',
      type: 'Dividend',
      date: findDateForeignDividend(textArr),
      wkn: findWknForeignDividend(textArr),
      isin: findIsinForeignDividend(textArr),
      company: findCompanyForeignDividend(textArr),
      shares: +findSharesForeignDividend(textArr),
      price: +foundAmount.div(foundShares),
      amount: +foundAmount,
      fee: 0,
      tax: 0,
    };
  }
  return validateActivity(activity);
};

export const parsePages = contents => {
  const activities = [parseData(contents[0])];

  return {
    activities,
    status: 0,
  };
};
