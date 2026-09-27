export type LanguageCode = 'en' | 'hi' | 'mr' | 'pa' | 'te' | 'ta' | 'kn' | 'gu' | 'bn';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
  greeting: string;
  badge: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    region: 'All India / Global',
    greeting: 'Welcome',
    badge: 'EN'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    region: 'उत्तर व मध्य भारत (North & Central India)',
    greeting: 'नमस्ते',
    badge: 'हि'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    region: 'महाराष्ट्र (Maharashtra)',
    greeting: 'नमस्कार',
    badge: 'म'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    region: 'ਪੰਜਾਬ (Punjab & Haryana)',
    greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
    badge: 'ਪੰ'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    region: 'ఆంధ్రప్రదేశ్ & తెలంగాణ (AP & Telangana)',
    greeting: 'నమస్కారం',
    badge: 'తె'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    region: 'தமிழ்நாடு (Tamil Nadu)',
    greeting: 'வணக்கம்',
    badge: 'த'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    region: 'ಕರ್ನಾಟಕ (Karnataka)',
    greeting: 'ನಮಸ್ಕಾರ',
    badge: 'ಕ'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    region: 'ગુજરાત (Gujarat)',
    greeting: 'નમસ્તે',
    badge: 'ગુ'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'পশ্চিমবঙ্গ (West Bengal)',
    greeting: 'নমস্কার',
    badge: 'বা'
  }
];
