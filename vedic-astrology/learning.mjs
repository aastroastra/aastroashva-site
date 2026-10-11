// Schematic learning diagrams only. These functions do not calculate a birth chart.
export const SIGNS = [
  ['Aries','मेष'],['Taurus','वृषभ'],['Gemini','मिथुन'],['Cancer','कर्क'],
  ['Leo','सिंह'],['Virgo','कन्या'],['Libra','तुला'],['Scorpio','वृश्चिक'],
  ['Sagittarius','धनु'],['Capricorn','मकर'],['Aquarius','कुंभ'],['Pisces','मीन']
];
export const STARS = [
  ['Ashwini','अश्विनी'],['Bharani','भरणी'],['Krittika','कृत्तिका'],['Rohini','रोहिणी'],
  ['Mrigashira','मृगशिरा'],['Ardra','आर्द्रा'],['Punarvasu','पुनर्वसु'],['Pushya','पुष्य'],
  ['Ashlesha','आश्लेषा'],['Magha','मघा'],['Purva Phalguni','पूर्व फाल्गुनी'],['Uttara Phalguni','उत्तर फाल्गुनी'],
  ['Hasta','हस्त'],['Chitra','चित्रा'],['Swati','स्वाती'],['Vishakha','विशाखा'],
  ['Anuradha','अनुराधा'],['Jyeshtha','ज्येष्ठा'],['Mula','मूल'],['Purva Ashadha','पूर्वाषाढ़ा'],
  ['Uttara Ashadha','उत्तराषाढ़ा'],['Shravana','श्रवण'],['Dhanishtha','धनिष्ठा'],['Shatabhisha','शतभिषा'],
  ['Purva Bhadrapada','पूर्व भाद्रपदा'],['Uttara Bhadrapada','उत्तर भाद्रपदा'],['Revati','रेवती']
];
export const LORDS = [['Ketu','केतु'],['Venus','शुक्र'],['Sun','सूर्य'],['Moon','चंद्र'],['Mars','मंगल'],['Rahu','राहु'],['Jupiter','गुरु'],['Saturn','शनि'],['Mercury','बुध']];
export const PERIODS = [7,20,6,10,7,18,16,19,17];
export function normalize(degrees) {
  if (!Number.isFinite(degrees)) throw new TypeError('A finite angle is required');
  const angle = degrees % 360;
  return angle < 0 ? angle + 360 : (angle || 0);
}
export function skyAddress(degrees) {
  const angle = normalize(degrees);
  // Scaling before division keeps exact half-open sector boundaries consistent.
  const quarter = Math.floor(angle * 3 / 10);
  return {angle, sign:Math.floor(angle / 30), star:Math.floor(quarter / 4), pada:quarter % 4 + 1};
}
export function kpParts(starIndex = 0) {
  if (!Number.isInteger(starIndex) || starIndex < 0 || starIndex > 26) throw new RangeError('Nakshatra index must be 0..26');
  let elapsed = 0;
  return Array.from({length:9}, (_, i) => {
    const lord = (starIndex + i) % 9;
    const start = elapsed / 9;
    elapsed += PERIODS[lord];
    return {lord, start, end:elapsed / 9};
  });
}
export function kpAt(offset, starIndex = 0) {
  if (!Number.isFinite(offset) || offset < 0 || offset >= 40/3) throw new RangeError('Offset must lie within one nakshatra');
  return kpParts(starIndex).find(part => offset < part.end) || kpParts(starIndex).at(-1);
}
