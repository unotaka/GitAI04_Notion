export function formatTo4DigitYear(input) {
  if (input === null || input === undefined) return input;
  const str = String(input).trim();
  if (str === '') return str;
  const match = str.match(/^(\d{1,4})(\/(\d{1,2}))?$/);
  if (!match) return str;
  const yearPart = match[1];
  const monthPart = match[3];
  let year;
  if (yearPart.length <= 2) {
    const yy = parseInt(yearPart, 10);
    year = yy < 70 ? 2000 + yy : 1900 + yy;
  } else {
    year = parseInt(yearPart, 10);
  }
  return monthPart ? `${year}/${monthPart.padStart(2, '0')}` : `${year}`;
}

export function parseYearMonth(input) {
  if (!input) return null;
  const str = String(input).trim();
  if (/現在|継続|now/i.test(str)) return new Date();
  const normalized = formatTo4DigitYear(str);
  const match = normalized.match(/^(\d{4})(?:\/(\d{1,2}))?$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = match[2] ? parseInt(match[2], 10) - 1 : 0;
  return new Date(year, month, 1);
}

export function calculateMonths(startStr, endStr) {
  const start = parseYearMonth(startStr);
  const end = parseYearMonth(endStr);
  if (!start || !end) return '';
  const totalMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1;
  if (totalMonths <= 0) return '0ヶ月';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) return `${years}年${months}ヶ月`;
  if (years > 0) return `${years}年`;
  return `${months}ヶ月`;
}

export function parseExcelDate(serial) {
  if (serial === null || serial === undefined || serial === '') return '';
  const num = Number(serial);
  if (Number.isNaN(num)) return String(serial);
  const utcDays = Math.floor(num - 25569);
  const utcMs = utcDays * 86400 * 1000;
  const date = new Date(utcMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export function calculateAge(birthDateStr) {
  if (!birthDateStr) return '';
  const match = String(birthDateStr).match(/(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})/);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}
