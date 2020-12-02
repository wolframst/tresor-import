import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';

// These functions are for single transaction documents
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
    textArr[textArr.findIndex(t => t.includes('GESCHÄFTSABRECHNUNG')) + 2];
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

const findWknBuy = textArr =>
  textArr[textArr.findIndex(t => t.includes('Registered')) - 1];

const findWknDividend = textArr =>
  textArr[textArr.findIndex(t => t.includes('WKN')) + 3];

const findWknForeignDividend = textArr =>
  textArr[textArr.findIndex(t => t.includes('WKN/ISIN')) + 3];

const findIsinDividend = textArr =>
  textArr[textArr.findIndex(t => t.includes('ISIN')) + 3];

const findIsinForeignDividend = textArr =>
  textArr[textArr.findIndex(t => t.includes('STK')) + 2];

const findTaxDividend = textArr => {
  // Foreign Payouts need to be treated differently
  const index = textArr.findIndex(t => t.includes('abgeführte')) + 3;
  return Big(Math.abs(parseGermanNum(textArr[index])));
};

const findCompanyBuy = textArr => {
  const startCompanyName =
    textArr.findIndex(t => t.includes('Wertpapierkennnummer')) + 1;
  const companyLength = textArr
    .slice(startCompanyName)
    .findIndex(t => /^[0-9A-Z]{6}$/.test(t));
  return textArr
    .slice(startCompanyName, startCompanyName + companyLength)
    .join(' ');
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

const parseSingleTransaction = textArr => {
  let type, date, wkn, isin, company, shares, price, amount;
  let fee = 0;
  let tax = 0;
  let activity;
  if (isBuy(textArr)) {
    type = 'Buy';
    date = findDateBuy(textArr);
    wkn = findWknBuy(textArr);
    company = findCompanyBuy(textArr);
    shares = +findSharesBuy(textArr);
    amount = findAmountBuy(textArr);
    price = +Big(amount).div(shares);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    date = findDateDividend(textArr);
    wkn = findWknDividend(textArr);
    isin = findIsinDividend(textArr);
    company = findCompanyDividend(textArr);
    shares = +findSharesDividend(textArr);
    amount = findAmountDividend(textArr);
    price = +Big(amount).div(shares);
    tax = +findTaxDividend(textArr);
  } else if (isForeignDividend(textArr)) {
    type = 'Dividend';
    date = findDateForeignDividend(textArr);
    wkn = findWknForeignDividend(textArr);
    isin = findIsinForeignDividend(textArr);
    company = findCompanyForeignDividend(textArr);
    shares = +findSharesForeignDividend(textArr);
    amount = findAmountForeignDividend(textArr);
    price = +Big(amount).div(shares);
  }
  activity = {
    broker: 'commerzbank',
    type,
    date,
    wkn,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  };
  if (isin !== undefined) {
    activity.isin = isin;
  }
  return validateActivity(activity);
};

// These functions are for transaction reports
const findPriorIndex = (arr, idx, keyArr = ['STK', '/ Sperre']) => {
  let backwardIdx = 1;
  while (idx - backwardIdx >= 0) {
    if (keyArr.includes(arr[idx - backwardIdx])) {
      return idx - backwardIdx;
    }
    backwardIdx += 1;
  }
  return -1;
};

const isTransactionReport = textArr =>
  textArr
    .join('')
    .includes(
      'StückzinsenKurs/ AusschüttungTransaktionsartDatumWKN / ISINEndbetrag'
    );

const parseBuySellTransaction = (pdfPage, pageIdx, type) => {
  const txStart = findPriorIndex(pdfPage, pageIdx) + 1;
  const txEndIdx = pdfPage.indexOf('STK', pageIdx);
  const priceSplitOffset = pdfPage[pageIdx - 1].includes(' ') ? 0 : 1;
  let activity = {
    broker: 'commerzbank',
    type: type,
    company: pdfPage.slice(txStart, pageIdx - 2 - priceSplitOffset).join(' '),
    wkn: pdfPage[pageIdx + 2],
    isin: pdfPage[pageIdx + 3].split(' ')[1],
    amount: Math.abs(parseGermanNum(pdfPage[pageIdx - 2 - priceSplitOffset])),
    price: Math.abs(parseGermanNum(pdfPage[pageIdx - 1 - priceSplitOffset])),
    fee: 0,
    tax: 0,
  };
  // It is not exactly clear what is a fee and what is a tax from the .pdf
  // Since Buy only has fees it will be a fee for the buy operation and a
  // tax for the sell operations. This is NOT ENTIRELY CORRECT
  const payedAmount = Math.abs(parseGermanNum(pdfPage[pageIdx + 4]));
  if (type === 'Buy') {
    activity.fee = +Big(activity.amount).minus(payedAmount).abs();
  } else if (type === 'Sell') {
    activity.tax = +Big(activity.amount).minus(payedAmount).abs();
  }

  if (txEndIdx - pageIdx > 7) {
    activity.foreignCurrency =
      priceSplitOffset === 0
        ? pdfPage[pageIdx - 1].split(' ')[1]
        : pdfPage[pageIdx - 1];
    activity.fxRate = parseGermanNum(pdfPage[pageIdx + 5]);
    activity.price = +Big(activity.price).div(activity.fxRate);
  }
  const fxOffset = activity.fxRate === undefined ? 0 : 1;
  activity.shares = Math.abs(parseGermanNum(pdfPage[pageIdx + 5 + fxOffset]));
  activity.date = format(
    parse(pdfPage[pageIdx + 6 + fxOffset], 'dd.MM.yyyy', new Date()),
    'yyyy-MM-dd'
  );
  if (type === 'Sell') {
    return activity;
  }
  return activity;
};

/* const parseTxInOutTransaction = (pdfPage, pageIdx, type) => {

  const txStart = findPriorIndex(pdfPage, pageIdx)+1;
  const fxOffset = pdfPage[pageIdx+7] === 'STK' ? 1 : 0;
  return {
    broker: 'commerzbank',
    type: type,
    company: pdfPage.slice(txStart, pageIdx).join(' '),
    wkn: pdfPage[pageIdx+2],
    isin: pdfPage[pageIdx+3].split(' ')[1],
    shares: Math.abs(parseGermanNum(pdfPage[pageIdx+4+fxOffset])),
    date: format(parse(pdfPage[pageIdx+5+fxOffset], 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    tax: 0,
    fee: 0,
  }
} */

const parseDividendTransaction = (pdfPage, pageIdx) => {
  const txEndIdx = pdfPage.indexOf('STK', pageIdx);
  const txStart = findPriorIndex(pdfPage, pageIdx) + 1;
  const priceSplitOffset = pdfPage[pageIdx - 1].includes(' ') ? 0 : 1;

  let activity = {
    broker: 'commerzbank',
    type: 'Dividend',
    company: pdfPage.slice(txStart, pageIdx - 1 - priceSplitOffset).join(' '),
    wkn: pdfPage[pageIdx + 2],
    isin: pdfPage[pageIdx + 3].split(' ')[1],
    price: Math.abs(parseGermanNum(pdfPage[pageIdx - 1 - priceSplitOffset])),
    fee: 0,
  };
  if (txEndIdx - pageIdx > 7) {
    activity.foreignCurrency =
      priceSplitOffset === 0
        ? pdfPage[pageIdx - 1].split(' ')[1]
        : pdfPage[pageIdx - 1];
    activity.fxRate = parseGermanNum(pdfPage[pageIdx + 5]);
    activity.price = +Big(activity.price).div(activity.fxRate);
  }
  const fxOffset = activity.fxRate === undefined ? 0 : 1;
  activity.date = format(
    parse(pdfPage[pageIdx + 6 + fxOffset], 'dd.MM.yyyy', new Date()),
    'yyyy-MM-dd'
  );
  activity.shares = Math.abs(parseGermanNum(pdfPage[pageIdx + 5 + fxOffset]));
  activity.amount = +Big(activity.shares).times(activity.price);
  const postTaxAmount = Math.abs(parseGermanNum(pdfPage[pageIdx + 4]));
  // It is unknown from the .pdf file why the net amount and payed out amount
  // diverge, most likely reason is tax:
  activity.tax = +Big(activity.amount).minus(postTaxAmount);
  return activity;
};

const parseTransactionReport = pdfPages => {
  let actions = [];
  for (const pdfPage of pdfPages) {
    let pageIdx = 0;
    while (pageIdx <= pdfPage.length) {
      let activity = undefined;
      if (pdfPage[pageIdx] === 'Kauf') {
        activity = parseBuySellTransaction(pdfPage, pageIdx, 'Buy');
        pageIdx += 6; // A transaction string is followed by 6 least related entries
      } else if (pdfPage[pageIdx] === 'Verkauf') {
        activity = parseBuySellTransaction(pdfPage, pageIdx, 'Sell');
        pageIdx += 6;
      } else if (pdfPage[pageIdx] === 'Ausschüttung') {
        activity = parseDividendTransaction(pdfPage, pageIdx, 'Dividend');
        pageIdx += 6;
      } else if (pdfPage[pageIdx] === 'Einbuchung') {
        // activity = parseTxInOutTransaction(pdfPage, pageIdx, 'TransferIn');
        pageIdx += 6;
      } else if (pdfPage[pageIdx] === 'Ausbuchung') {
        // activity = parseTxInOutTransaction(pdfPage, pageIdx, 'TransferOut');
        pageIdx += 6;
      }
      pageIdx++;
      if (activity !== undefined) {
        actions.push(validateActivity(activity));
      }
    }
  }
  return actions;
};

// General parsing functions
export const canParsePage = (content, extension) => {
  // The first PDF Page does not always contain "Commerzbank", thus this ugly
  // workaround. e. G. dividend_IE00B3RBWM25_1.json
  if (!Array.isArray(content)) {
    return undefined;
  }
  const joinedContent = content.join('');
  return (
    extension === 'pdf' &&
    (((joinedContent.toLowerCase().includes('commerzbank') ||
      joinedContent.includes(
        'SteuerlicheBehandlung:AusländischeInvestment-Ausschüttung'
      )) &&
      (isBuy(content) || isForeignDividend(content) || isDividend(content))) ||
      isTransactionReport(content))
  );
};

export const parsePages = contents => {
  // Transaction Reports need to be handled completely different from individual
  // transaction documents
  let activities;
  if (isTransactionReport(contents[0])) {
    activities = parseTransactionReport(contents);
  } else {
    activities = [parseSingleTransaction(contents[0])];
  }
  return {
    activities,
    status: 0,
  };
};
