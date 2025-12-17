/**
 * VAPI Formatting Utilities
 * Utilities for formatting data for VAPI API calls as per API-DOCS.md
 */

/**
 * Convert phone number to E.164 format
 * @param phone - Phone number in any format
 * @returns Phone number in E.164 format (+1XXXXXXXXXX)
 */
const formatPhoneToE164 = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If doesn't start with +, assume US number and add +1
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 if present
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    cleaned = '+1' + cleaned;
  }

  // Validate E.164 format (max 15 digits after +)
  if (!/^\+[1-9]\d{1,14}$/.test(cleaned)) {
    throw new Error(`Invalid phone number format: ${phone}`);
  }

  return cleaned;
};

/**
 * Spell out phone number for VAPI
 * @param phone - Phone number
 * @returns Spelled out phone number (e.g., "five five five, one two three, four five six seven")
 */
const spellOutPhone = (phone: string): string => {
  if (!phone) return '';

  const e164 = formatPhoneToE164(phone);
  const digits = e164.replace(/\D/g, '').substring(1); // Remove + and country code

  const numberWords: Record<string, string> = {
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
  };

  const spelled = digits
    .split('')
    .map(d => numberWords[d] || d)
    .join(' ');

  // Format as: "five five five, one two three, four five six seven"
  if (digits.length === 10) {
    // Split into area code (3), exchange (3), number (4)
    const areaCode = spelled.substring(0, 11); // "five five five"
    const exchange = spelled.substring(12, 23); // "one two three"
    const number = spelled.substring(24); // "four five six seven"
    return `${areaCode}, ${exchange}, ${number}`;
  }

  return spelled;
};

/**
 * Spell out year
 */
const spellOutYear = (year: number): string => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = [
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (year < 2000) {
    return year.toString();
  }

  const thousands = Math.floor(year / 1000);
  const hundreds = Math.floor((year % 1000) / 100);
  const remainder = year % 100;

  let result = '';

  if (thousands > 0) {
    result += ones[thousands] + ' thousand ';
  }

  if (hundreds > 0) {
    result += ones[hundreds] + ' hundred ';
  }

  if (remainder >= 20) {
    result += tens[Math.floor(remainder / 10)] + ' ';
    if (remainder % 10 > 0) {
      result += ones[remainder % 10] + ' ';
    }
  } else if (remainder >= 10) {
    result += teens[remainder - 10] + ' ';
  } else if (remainder > 0) {
    result += ones[remainder] + ' ';
  }

  return result.trim();
};

/**
 * Spell out date for VAPI
 * @param date - Date object or ISO string
 * @returns Spelled out date (e.g., "January fifteenth, twenty twenty five")
 */
const spellOutDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
    'tenth',
    'eleventh',
    'twelfth',
    'thirteenth',
    'fourteenth',
    'fifteenth',
    'sixteenth',
    'seventeenth',
    'eighteenth',
    'nineteenth',
    'twentieth',
    'twenty-first',
    'twenty-second',
    'twenty-third',
    'twenty-fourth',
    'twenty-fifth',
    'twenty-sixth',
    'twenty-seventh',
    'twenty-eighth',
    'twenty-ninth',
    'thirtieth',
    'thirty-first',
  ];

  const month = months[d.getMonth()];
  const day = dayNames[d.getDate() - 1];
  const year = spellOutYear(d.getFullYear());

  return `${month} ${day}, ${year}`;
};

export { formatPhoneToE164, spellOutPhone, spellOutDate };
