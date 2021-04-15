import Big from 'big.js';

import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';

//===========================
// BLOCK 1
// SINGLE TRANSACTIONS
//===========================
const findAmountBuySell = textArr => {
  const amountIdx = textArr.findIndex(t => t.includes('Kurswert'));
  return parseGermanNum(textArr[amountIdx + 3]);
};

const findAmountDividend = (textArr, foreignDividend) => {
  if (foreignDividend) {
    const lineNumberTotalAmount = textArr.findIndex(t =>
      t.includes('Bruttobetrag:')
    );
    const lineNumberExchangeRate = textArr.findIndex(t =>
      t.includes('Devisenkurs:')
    );
    if (lineNumberTotalAmount > 0 && lineNumberExchangeRate > 0) {
      return +Big(parseGermanNum(textArr[lineNumberTotalAmount + 2])).div(
        parseGermanNum(textArr[lineNumberExchangeRate + 2])
      );
    }
  }
  const lineNumberTaxBase = textArr.findIndex(t =>
    t.includes('Steuerbemessungsgrundlage')
  );
  const lineNumberTotalAmount = textArr.findIndex(t =>
    t.includes('Bruttobetrag:')
  );
  if (lineNumberTaxBase > 0) {
    return parseGermanNum(textArr[lineNumberTaxBase - 1]);
  } else if (lineNumberTotalAmount > 0) {
    return parseGermanNum(textArr[lineNumberTotalAmount + 2]);
  }
};

const findSharesBuySell = textArr => {
  return Big(
    parseGermanNum(textArr[textArr.findIndex(t => t.includes('St.')) + 1])
  );
};

const findSharesDividend = textArr => {
  return parseGermanNum(
    textArr[textArr.findIndex(t => t.includes('Stk.') || t.includes('STK')) + 1]
  );
};

const findDateBuySell = textArr =>
  textArr[textArr.findIndex(t => t.includes('Geschäftstag')) + 2];

const findTimeSell = textArr =>
  textArr[textArr.findIndex(t => t.includes('Handelszeit')) + 2];

const findDateDividend = (textArr, foreignDividend = false) => {
  if (foreignDividend) {
    if (textArr.indexOf('Information') > 0) {
      return textArr[textArr.findIndex(t => t.includes('Information')) - 3];
    }
  }
  if (textArr.indexOf('Valuta') > 0) {
    if (
      textArr[textArr.findIndex(t => t.includes('Valuta')) + 1].split('.')
        .length > 1
    ) {
      return textArr[textArr.findIndex(t => t.includes('Valuta')) + 1];
    }
  }
  if (textArr.indexOf('per') > 0) {
    if (
      textArr[textArr.findIndex(t => t.includes('per')) + 1].split('.').length >
      1
    ) {
      return textArr[textArr.findIndex(t => t.includes('per')) + 1];
    }
  }
};

const findWknBuySell = textArr => {
  const wknRoughIdx = textArr.indexOf('Wertpapierkennnummer');
  const slicedArry = textArr.slice(wknRoughIdx);
  return slicedArry[slicedArry.findIndex(t => /^[0-9A-Z]{6}$/.test(t))];
};

const findWknDividend = textArr =>
  textArr[textArr.findIndex(t => t.includes('WKN')) + 3];

const findIsinDividend = (textArr, foreignDividend) => {
  if (foreignDividend) {
    const lineNumberPiece = textArr.findIndex(t => t.includes('STK'));
    if (lineNumberPiece > 0) {
      return textArr[lineNumberPiece + 2];
    }
  }
  const lineNumberWknIsin = textArr.findIndex(t => t.includes('WKN/ISIN'));
  if (lineNumberWknIsin > 0) {
    const lineNumberBearerShares = textArr.findIndex(t =>
      t.includes('Inhaber-Anteile')
    );
    const lineNumberRegisteredShares = textArr.findIndex(t =>
      t.includes('Namens-Aktien')
    );
    if (lineNumberBearerShares > 0) {
      return textArr[lineNumberBearerShares - 1];
    } else if (lineNumberRegisteredShares > 0) {
      return textArr[lineNumberRegisteredShares - 1];
    }
  }
  const lineNumberIsin = textArr.findIndex(t => t.includes('ISIN'));
  if (lineNumberIsin > 0) {
    return textArr[lineNumberIsin + 3];
  }
};

const findPriceBuySell = textArr => {
  const priceIdx = textArr.findIndex(t => t.includes('Kurswert')) - 1;
  return parseGermanNum(textArr[priceIdx]);
};

const findFeeBuySell = (textArr, amount) => {
  const lineNumberCommission = textArr.findIndex(t =>
    t.includes('Minimumprovision')
  );
  const lineNumberValuta = textArr.findIndex(t => t.includes('Valuta'));
  if (lineNumberCommission > 0) {
    return +Big(parseGermanNum(textArr[lineNumberCommission + 3]));
  } else if (lineNumberValuta > 0) {
    return +Big(parseGermanNum(textArr[lineNumberValuta + 15])).minus(amount);
  }
};

const findTaxDividend = (textArr, foreignDividend = false) => {
  if (foreignDividend) {
    const lineNumberWithholdingTax = textArr.findIndex(t =>
      t.includes('Quellensteuer')
    );
    const lineNumberExchangeRate = textArr.findIndex(t =>
      t.includes('Devisenkurs:')
    );
    if (lineNumberWithholdingTax > 0 && lineNumberExchangeRate > 0) {
      return +Big(parseGermanNum(textArr[lineNumberWithholdingTax + 2])).div(
        parseGermanNum(textArr[lineNumberExchangeRate + 2])
      );
    }
    return 0;
  }
  const taxIndex = textArr.findIndex(t => t.includes('abgeführte'));
  if (taxIndex >= 0) {
    return Math.abs(parseGermanNum(textArr[taxIndex + 3]));
  }
  return 0;
};

const findCompanyBuySell = textArr => {
  const startCompanyName =
    textArr.findIndex(t => t.includes('Wertpapierkennnummer')) + 1;
  const companyLength = textArr
    .slice(startCompanyName)
    .findIndex(t => /^[0-9A-Z]{6}$/.test(t));
  return textArr
    .slice(startCompanyName, startCompanyName + companyLength)
    .join(' ');
};

const findCompanyDividend = (textArr, foreignDividend = false) => {
  if (foreignDividend) {
    const startCompanyName = textArr.findIndex(t => t.includes('WKN/ISIN')) + 4;
    const endCompanyName = textArr.findIndex(t => t.includes('STK')) - 1;
    return textArr.slice(startCompanyName, endCompanyName + 1).join(' ');
  }
  const lineNumberInvestmentDistribution = textArr.findIndex(t =>
    t.includes('Investment-Ausschüttung')
  );
  const lineNumberBond = textArr.findIndex(t =>
    t.includes('Wertpapier-Bezeichnung')
  );
  const lineNumberPiece = textArr.findIndex(t => t.includes('STK'));
  const lineNumberIssuingCountry = textArr.findIndex(t =>
    t.includes('Emissionsland')
  );
  if (lineNumberInvestmentDistribution > 0) {
    const startCompanyName = lineNumberInvestmentDistribution + 5;
    return textArr.slice(startCompanyName, startCompanyName + 2).join(' ');
  } else if (
    lineNumberBond > 0 &&
    lineNumberPiece > 0 &&
    lineNumberIssuingCountry > 0
  ) {
    const startCompanyName = lineNumberBond + 5;
    let companyName = textArr
      .slice(startCompanyName, lineNumberPiece)
      .join(' ');
    companyName += ' ' + textArr[lineNumberIssuingCountry - 1];
    return companyName;
  }
};

const isBuy = textArr => textArr.some(t => t.includes('Wertpapierkauf'));

const isSell = textArr => textArr.some(t => t.includes('Wertpapierverkauf'));

const isDividend = textArr =>
  textArr.some(
    t =>
      t === 'Investment-Ausschüttung' ||
      t === 'Ertragsgutschrift' ||
      t === 'Dividendengutschrift'
  );

const parseSingleTransaction = textArr => {
  let type,
    date,
    wkn,
    isin,
    company,
    shares,
    price,
    amount,
    fxRate,
    foreignCurrency;
  let fee = 0;
  let tax = 0;
  let activity;
  let time;
  if (isBuy(textArr)) {
    type = 'Buy';
    date = findDateBuySell(textArr);
    wkn = findWknBuySell(textArr);
    company = findCompanyBuySell(textArr);
    shares = +findSharesBuySell(textArr);
    amount = findAmountBuySell(textArr);
    price = findPriceBuySell(textArr);
    fee = findFeeBuySell(textArr, amount);
  } else if (isSell(textArr)) {
    type = 'Sell';
    date = findDateBuySell(textArr);
    time = findTimeSell(textArr);
    wkn = findWknBuySell(textArr);
    company = findCompanyBuySell(textArr);
    shares = +findSharesBuySell(textArr);
    amount = findAmountBuySell(textArr);
    price = findPriceBuySell(textArr);
    fee = findFeeBuySell(textArr, amount);
  } else if (isDividend(textArr)) {
    const foreignCurrencyIndex = textArr.indexOf('Devisenkurs:');
    const foreignDividend = foreignCurrencyIndex >= 0;
    type = 'Dividend';
    date = findDateDividend(textArr, foreignDividend);
    wkn = findWknDividend(textArr);
    isin = findIsinDividend(textArr, foreignDividend);
    company = findCompanyDividend(textArr, foreignDividend);
    shares = findSharesDividend(textArr);
    amount = findAmountDividend(textArr, foreignDividend);
    price = +Big(amount).div(shares);
    tax = findTaxDividend(textArr, foreignDividend);
    if (foreignCurrencyIndex >= 0) {
      foreignCurrency = textArr[foreignCurrencyIndex + 1].split('/')[1];
      fxRate = parseGermanNum(textArr[foreignCurrencyIndex + 2]);
    }
  }
  // sadly, no exact times can be extracted as they are not given in any of the
  // files
  const [parsedDate, parsedDateTime] = createActivityDateTime(date, time);
  activity = {
    broker: 'commerzbank',
    type,
    date: parsedDate,
    datetime: parsedDateTime,
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
  if (foreignCurrency !== undefined) {
    activity.foreignCurrency = foreignCurrency;
    activity.fxRate = fxRate;
  }
  return validateActivity(activity);
};

//===========================
// BLOCK 2
// TRANSACTION REPORTS
//===========================

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
  const fxOffset = txEndIdx - pageIdx > 7 ? 1 : 0;
  const [parsedDate, parsedDateTime] = createActivityDateTime(
    pdfPage[pageIdx + 6 + fxOffset],
    undefined
  );
  let activity = {
    broker: 'commerzbank',
    type: type,
    date: parsedDate,
    datetime: parsedDateTime,
    company: pdfPage.slice(txStart, pageIdx - 2 - priceSplitOffset).join(' '),
    wkn: pdfPage[pageIdx + 2],
    isin: pdfPage[pageIdx + 3].split(' ')[1],
    shares: Math.abs(parseGermanNum(pdfPage[pageIdx + 5 + fxOffset])),
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
  if (fxOffset === 1) {
    activity.foreignCurrency =
      priceSplitOffset === 0
        ? pdfPage[pageIdx - 1].split(' ')[1]
        : pdfPage[pageIdx - 1];
    activity.fxRate = parseGermanNum(pdfPage[pageIdx + 5]);
    activity.price = +Big(activity.price).div(activity.fxRate);
  }
  return activity;
};

const parseDividendTransaction = (pdfPage, pageIdx) => {
  const txEndIdx = pdfPage.indexOf('STK', pageIdx);
  const txStart = findPriorIndex(pdfPage, pageIdx) + 1;
  const priceSplitOffset = pdfPage[pageIdx - 1].includes(' ') ? 0 : 1;

  // If the activity is this long, it is because of foreign currency information
  const fxOffset = txEndIdx - pageIdx > 7 ? 1 : 0;
  const [parsedDate, parsedDateTime] = createActivityDateTime(
    pdfPage[pageIdx + 6 + fxOffset],
    undefined
  );

  let activity = {
    broker: 'commerzbank',
    type: 'Dividend',
    date: parsedDate,
    datetime: parsedDateTime,
    company: pdfPage.slice(txStart, pageIdx - 1 - priceSplitOffset).join(' '),
    wkn: pdfPage[pageIdx + 2],
    isin: pdfPage[pageIdx + 3].split(' ')[1],
    shares: Math.abs(parseGermanNum(pdfPage[pageIdx + 5 + fxOffset])),
    price: Math.abs(parseGermanNum(pdfPage[pageIdx - 1 - priceSplitOffset])),
    fee: 0,
  };

  if (fxOffset === 1) {
    activity.foreignCurrency =
      priceSplitOffset === 0
        ? pdfPage[pageIdx - 1].split(' ')[1]
        : pdfPage[pageIdx - 1];
    activity.fxRate = parseGermanNum(pdfPage[pageIdx + 5]);
    activity.price = +Big(activity.price).div(activity.fxRate);
  }

  activity.amount = +Big(activity.shares).times(activity.price);
  const postTaxAmount = Math.abs(parseGermanNum(pdfPage[pageIdx + 4]));
  // It is unknown from the .pdf file why the net amount and payed out amount
  // diverge, most likely reason is tax:
  activity.tax = +Big(activity.amount).minus(postTaxAmount);
  return activity;
};

// This is not yet implemented in the T1 backend and can be commented out as soon as it is.
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

//===========================
// BLOCK 3
// GENERAL PARSING FUNCTIONS
//===========================

const detectedButIgnoredDocument = content => {
  return content.includes('Umsatzdetails');
};

export const canParseDocument = (pages, extension) => {
  // The first PDF Page does not always contain "Commerzbank", thus this ugly
  // workaround. e. G. dividend_IE00B3RBWM25_1.json
  if (!Array.isArray(pages)) {
    return undefined;
  }

  const firstPageContent = pages[0];
  const joinedContent = firstPageContent.join('');
  return (
    extension === 'pdf' &&
    (((joinedContent.toLowerCase().includes('commerzbank') ||
      joinedContent.includes(
        'SteuerlicheBehandlung:AusländischeInvestment-Ausschüttung'
      )) &&
      !(
        // Don't match the sub brands of commerzbank which we implemented with custom logic
        (
          joinedContent.toLowerCase().includes('comdirect') ||
          joinedContent.toLowerCase().includes('onvista')
        )
      ) &&
      (isBuy(firstPageContent) ||
        isDividend(firstPageContent) ||
        isSell(firstPageContent))) ||
      isTransactionReport(firstPageContent) ||
      detectedButIgnoredDocument(firstPageContent))
  );
};

export const parsePages = contents => {
  let activities = [];
  if (detectedButIgnoredDocument(contents[0])) {
    return {
      activities,
      status: 7,
    };
  }

  // Transaction Reports need to be handled completely different from individual
  // transaction documents
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
