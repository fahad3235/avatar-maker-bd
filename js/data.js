// Avatar Maker BD — option metadata (labels in EN + বাংলা).
// Colour options carry hex values; text options carry ids.
(function (root) {
  'use strict';
  var L = root.AvatarLogic;

  var OPTION_GROUPS = [
    { key: 'face', type: 'chip', options: [
      { id: 'round', en: 'Round', bn: 'গোল' },
      { id: 'oval', en: 'Oval', bn: 'ডিম্বাকৃতি' },
      { id: 'square', en: 'Square', bn: 'চৌকো' }
    ]},
    { key: 'skin', type: 'swatch', values: L.SKINS, labels: [
      { en: 'Fair', bn: 'ফর্সা' }, { en: 'Light', bn: 'হালকা' }, { en: 'Medium', bn: 'মাঝারি' },
      { en: 'Tan', bn: 'তামাটে' }, { en: 'Brown', bn: 'বাদামি' }, { en: 'Deep', bn: 'গাঢ়' }
    ]},
    { key: 'hairStyle', type: 'chip', options: [
      { id: 'short', en: 'Short', bn: 'ছোট' },
      { id: 'curly', en: 'Curly', bn: 'কোঁকড়া' },
      { id: 'long', en: 'Long', bn: 'লম্বা' },
      { id: 'buzz', en: 'Buzz', bn: 'বাজ' },
      { id: 'bun', en: 'Bun', bn: 'খোঁপা' },
      { id: 'spiky', en: 'Spiky', bn: 'খাড়া' },
      { id: 'bald', en: 'Bald', bn: 'টাক' }
    ]},
    { key: 'hairColor', type: 'swatch', values: L.HAIR_COLORS, labels: [
      { en: 'Black', bn: 'কালো' }, { en: 'Brown', bn: 'বাদামি' }, { en: 'Auburn', bn: 'লালচে বাদামি' },
      { en: 'Blonde', bn: 'সোনালি' }, { en: 'Red', bn: 'লাল' }, { en: 'Grey', bn: 'ধূসর' }
    ]},
    { key: 'eyes', type: 'chip', options: [
      { id: 'round', en: 'Round', bn: 'গোল' },
      { id: 'happy', en: 'Happy', bn: 'হাসিখুশি' },
      { id: 'wink', en: 'Wink', bn: 'চোখ টিপ' },
      { id: 'sleepy', en: 'Sleepy', bn: 'ঘুমঘুম' },
      { id: 'star', en: 'Star', bn: 'তারা' }
    ]},
    { key: 'mouth', type: 'chip', options: [
      { id: 'smile', en: 'Smile', bn: 'হাসি' },
      { id: 'grin', en: 'Grin', bn: 'বড় হাসি' },
      { id: 'flat', en: 'Flat', bn: 'সোজা' },
      { id: 'open', en: 'Open', bn: 'খোলা' },
      { id: 'tongue', en: 'Tongue', bn: 'জিভ' }
    ]},
    { key: 'glasses', type: 'chip', options: [
      { id: 'none', en: 'None', bn: 'নেই' },
      { id: 'round', en: 'Round', bn: 'গোল' },
      { id: 'square', en: 'Square', bn: 'চৌকো' },
      { id: 'sunglasses', en: 'Sunglasses', bn: 'সানগ্লাস' }
    ]},
    { key: 'accessory', type: 'chip', options: [
      { id: 'none', en: 'None', bn: 'নেই' },
      { id: 'cap', en: 'Cap', bn: 'ক্যাপ' },
      { id: 'hijab', en: 'Hijab', bn: 'হিজাব' },
      { id: 'headband', en: 'Headband', bn: 'হেডব্যান্ড' }
    ]},
    { key: 'shirt', type: 'swatch', values: L.SHIRTS, labels: [
      { en: 'Teal', bn: 'টিল' }, { en: 'Coral', bn: 'প্রবাল' }, { en: 'Green', bn: 'সবুজ' },
      { en: 'Purple', bn: 'বেগুনি' }, { en: 'Navy', bn: 'নেভি' }, { en: 'Mustard', bn: 'সরিষা' },
      { en: 'Pink', bn: 'গোলাপি' }, { en: 'Charcoal', bn: 'ছাই' }
    ]},
    { key: 'bg', type: 'swatch', values: L.BACKGROUNDS, labels: [
      { en: 'Cream', bn: 'ক্রিম' }, { en: 'Sky', bn: 'আকাশি' }, { en: 'Mint', bn: 'পুদিনা' },
      { en: 'Blush', bn: 'গোলাপি' }, { en: 'Lavender', bn: 'ল্যাভেন্ডার' }, { en: 'Peach', bn: 'পীচ' },
      { en: 'Aqua', bn: 'অ্যাকোয়া' }, { en: 'Mist', bn: 'কুয়াশা' }
    ]}
  ];

  root.AvatarData = { OPTION_GROUPS: OPTION_GROUPS };
})(typeof window !== 'undefined' ? window : globalThis);
