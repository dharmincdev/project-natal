import { TreeData, Person, Relationship } from '@/types/tree';

export type GeoEventType = 'birth' | 'marriage' | 'education' | 'career' | 'memorial' | 'other';

export type GeoLocation = {
  name: string;
  country: string;
  lat: number;
  lng: number;
};

export type GeoEvent = {
  id: string;
  type: GeoEventType;
  personId: string;
  personName: string;
  photoUrl: string | null;
  date: string | null;
  year: number | null;
  locationName: string;
  lat: number;
  lng: number;
  description: string;
};

export type LocationCluster = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  events: GeoEvent[];
  peopleCount: number;
};

export type MigrationPath = {
  id: string;
  parentPersonId: string;
  parentName: string;
  childPersonId: string;
  childName: string;
  fromLocation: string;
  fromLat: number;
  fromLng: number;
  toLocation: string;
  toLat: number;
  toLng: number;
  year: number | null;
  generationSpan: string;
};

export type CitySuggestion = {
  city: string;
  country: string;
  fullName: string;
};

/**
 * High-precision offline coordinates dictionary.
 * Maps city, region, state, and country strings to accurate (lat, lng).
 */
export const GLOBAL_GEO_DICTIONARY: Record<string, { lat: number; lng: number; country: string }> = {
  // California & US West Coast
  'san francisco': { lat: 37.7749, lng: -122.4194, country: 'United States' },
  'san francisco, ca': { lat: 37.7749, lng: -122.4194, country: 'United States' },
  'san francisco bay area': { lat: 37.7749, lng: -122.4194, country: 'United States' },
  'oakland': { lat: 37.8044, lng: -122.2712, country: 'United States' },
  'oakland, ca': { lat: 37.8044, lng: -122.2712, country: 'United States' },
  'berkeley': { lat: 37.8716, lng: -122.2727, country: 'United States' },
  'berkeley, ca': { lat: 37.8716, lng: -122.2727, country: 'United States' },
  'san jose': { lat: 37.3382, lng: -121.8863, country: 'United States' },
  'san jose, ca': { lat: 37.3382, lng: -121.8863, country: 'United States' },
  'palo alto': { lat: 37.4419, lng: -122.1430, country: 'United States' },
  'palo alto, ca': { lat: 37.4419, lng: -122.1430, country: 'United States' },
  'los angeles': { lat: 34.0522, lng: -118.2437, country: 'United States' },
  'los angeles, ca': { lat: 34.0522, lng: -118.2437, country: 'United States' },
  'san diego': { lat: 32.7157, lng: -117.1611, country: 'United States' },
  'san diego, ca': { lat: 32.7157, lng: -117.1611, country: 'United States' },
  'sacramento': { lat: 38.5816, lng: -121.4944, country: 'United States' },
  'sacramento, ca': { lat: 38.5816, lng: -121.4944, country: 'United States' },
  'seattle': { lat: 47.6062, lng: -122.3321, country: 'United States' },
  'seattle, wa': { lat: 47.6062, lng: -122.3321, country: 'United States' },
  'portland': { lat: 45.5152, lng: -122.6784, country: 'United States' },
  'portland, or': { lat: 45.5152, lng: -122.6784, country: 'United States' },
  'honolulu': { lat: 21.3069, lng: -157.8583, country: 'United States' },
  'anchorage': { lat: 61.2181, lng: -149.9003, country: 'United States' },

  // US Midwest, Southwest & Mountain
  'austin': { lat: 30.2672, lng: -97.7431, country: 'United States' },
  'austin, tx': { lat: 30.2672, lng: -97.7431, country: 'United States' },
  'dallas': { lat: 32.7767, lng: -96.7970, country: 'United States' },
  'dallas, tx': { lat: 32.7767, lng: -96.7970, country: 'United States' },
  'houston': { lat: 29.7604, lng: -95.3698, country: 'United States' },
  'houston, tx': { lat: 29.7604, lng: -95.3698, country: 'United States' },
  'san antonio': { lat: 29.4241, lng: -98.4936, country: 'United States' },
  'denver': { lat: 39.7392, lng: -104.9903, country: 'United States' },
  'denver, co': { lat: 39.7392, lng: -104.9903, country: 'United States' },
  'phoenix': { lat: 33.4484, lng: -112.0740, country: 'United States' },
  'phoenix, az': { lat: 33.4484, lng: -112.0740, country: 'United States' },
  'salt lake city': { lat: 40.7608, lng: -111.8910, country: 'United States' },
  'las vegas': { lat: 36.1699, lng: -115.1398, country: 'United States' },
  'chicago': { lat: 41.8781, lng: -87.6298, country: 'United States' },
  'chicago, il': { lat: 41.8781, lng: -87.6298, country: 'United States' },
  'minneapolis': { lat: 44.9778, lng: -93.2650, country: 'United States' },
  'detroit': { lat: 42.3314, lng: -83.0458, country: 'United States' },
  'columbus': { lat: 39.9612, lng: -82.9988, country: 'United States' },
  'indianapolis': { lat: 39.7684, lng: -86.1581, country: 'United States' },
  'st. louis': { lat: 38.6270, lng: -90.1994, country: 'United States' },

  // US East Coast & South
  'boston': { lat: 42.3601, lng: -71.0589, country: 'United States' },
  'boston, ma': { lat: 42.3601, lng: -71.0589, country: 'United States' },
  'new york': { lat: 40.7128, lng: -74.0060, country: 'United States' },
  'new york, ny': { lat: 40.7128, lng: -74.0060, country: 'United States' },
  'philadelphia': { lat: 39.9526, lng: -75.1652, country: 'United States' },
  'philadelphia, pa': { lat: 39.9526, lng: -75.1652, country: 'United States' },
  'washington': { lat: 38.9072, lng: -77.0369, country: 'United States' },
  'washington, dc': { lat: 38.9072, lng: -77.0369, country: 'United States' },
  'washington dc': { lat: 38.9072, lng: -77.0369, country: 'United States' },
  'baltimore': { lat: 39.2904, lng: -76.6122, country: 'United States' },
  'pittsburgh': { lat: 40.4406, lng: -79.9959, country: 'United States' },
  'atlanta': { lat: 33.7490, lng: -84.3880, country: 'United States' },
  'atlanta, ga': { lat: 33.7490, lng: -84.3880, country: 'United States' },
  'miami': { lat: 25.7617, lng: -80.1918, country: 'United States' },
  'miami, fl': { lat: 25.7617, lng: -80.1918, country: 'United States' },
  'orlando': { lat: 28.5383, lng: -81.3792, country: 'United States' },
  'charlotte': { lat: 35.2271, lng: -80.8431, country: 'United States' },
  'nashville': { lat: 36.1627, lng: -86.7816, country: 'United States' },
  'new orleans': { lat: 29.9511, lng: -90.0715, country: 'United States' },

  // Canada & Latin America
  'toronto': { lat: 43.6532, lng: -79.3832, country: 'Canada' },
  'vancouver': { lat: 49.2827, lng: -123.1207, country: 'Canada' },
  'montreal': { lat: 45.5017, lng: -73.5673, country: 'Canada' },
  'calgary': { lat: 51.0447, lng: -114.0719, country: 'Canada' },
  'mexico city': { lat: 19.4326, lng: -99.1332, country: 'Mexico' },
  'mexico city, mexico': { lat: 19.4326, lng: -99.1332, country: 'Mexico' },
  'guadalajara': { lat: 20.6597, lng: -103.3496, country: 'Mexico' },
  'guadalajara, mexico': { lat: 20.6597, lng: -103.3496, country: 'Mexico' },
  'puebla': { lat: 19.0414, lng: -98.2063, country: 'Mexico' },
  'puebla, mexico': { lat: 19.0414, lng: -98.2063, country: 'Mexico' },
  'monterrey': { lat: 25.6866, lng: -100.3161, country: 'Mexico' },
  'tijuana': { lat: 32.5149, lng: -117.0382, country: 'Mexico' },
  'oaxaca': { lat: 17.0732, lng: -96.7266, country: 'Mexico' },
  'cancun': { lat: 21.1619, lng: -86.8515, country: 'Mexico' },
  'merida': { lat: 20.9674, lng: -89.5926, country: 'Mexico' },
  'leon': { lat: 21.1221, lng: -101.6826, country: 'Mexico' },
  'havana': { lat: 23.1136, lng: -82.3666, country: 'Cuba' },
  'san juan': { lat: 18.4655, lng: -66.1057, country: 'Puerto Rico' },
  'bogota': { lat: 4.7110, lng: -74.0721, country: 'Colombia' },
  'medellin': { lat: 6.2442, lng: -75.5812, country: 'Colombia' },
  'lima': { lat: -12.0464, lng: -77.0428, country: 'Peru' },
  'buenos aires': { lat: -34.6037, lng: -58.3816, country: 'Argentina' },
  'santiago': { lat: -33.4489, lng: -70.6693, country: 'Chile' },
  'sao paulo': { lat: -23.5505, lng: -46.6333, country: 'Brazil' },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729, country: 'Brazil' },

  // Zambia & African Metropolitan Centers
  'ndola': { lat: -12.9694, lng: 28.6366, country: 'Zambia' },
  'ndola, zambia': { lat: -12.9694, lng: 28.6366, country: 'Zambia' },
  'ndola zambia': { lat: -12.9694, lng: 28.6366, country: 'Zambia' },
  'lusaka': { lat: -15.3875, lng: 28.3228, country: 'Zambia' },
  'lusaka, zambia': { lat: -15.3875, lng: 28.3228, country: 'Zambia' },
  'kitwe': { lat: -12.8024, lng: 28.2132, country: 'Zambia' },
  'kitwe, zambia': { lat: -12.8024, lng: 28.2132, country: 'Zambia' },
  'livingstone': { lat: -17.8419, lng: 25.8543, country: 'Zambia' },
  'livingstone, zambia': { lat: -17.8419, lng: 25.8543, country: 'Zambia' },
  'chipata': { lat: -13.6333, lng: 32.6500, country: 'Zambia' },
  'kabwe': { lat: -14.4469, lng: 28.4464, country: 'Zambia' },
  'zambia': { lat: -13.1339, lng: 27.8493, country: 'Zambia' },
  'nairobi': { lat: -1.2921, lng: 36.8219, country: 'Kenya' },
  'nairobi, kenya': { lat: -1.2921, lng: 36.8219, country: 'Kenya' },
  'mombasa': { lat: -4.0435, lng: 39.6682, country: 'Kenya' },
  'lagos': { lat: 6.5244, lng: 3.3792, country: 'Nigeria' },
  'lagos, nigeria': { lat: 6.5244, lng: 3.3792, country: 'Nigeria' },
  'abuja': { lat: 9.0765, lng: 7.3986, country: 'Nigeria' },
  'cairo': { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
  'cairo, egypt': { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
  'alexandria': { lat: 31.2001, lng: 29.9187, country: 'Egypt' },
  'johannesburg': { lat: -26.2041, lng: 28.0473, country: 'South Africa' },
  'cape town': { lat: -33.9249, lng: 18.4241, country: 'South Africa' },
  'durban': { lat: -29.8587, lng: 31.0218, country: 'South Africa' },
  'pretoria': { lat: -25.7479, lng: 28.2293, country: 'South Africa' },
  'addis ababa': { lat: 9.0320, lng: 38.7480, country: 'Ethiopia' },
  'accra': { lat: 5.6037, lng: -0.1870, country: 'Ghana' },
  'dakar': { lat: 14.7167, lng: -17.4677, country: 'Senegal' },
  'dar es salaam': { lat: -6.7924, lng: 39.2083, country: 'Tanzania' },
  'kampala': { lat: 0.3476, lng: 32.5825, country: 'Uganda' },
  'harare': { lat: -17.8252, lng: 31.0335, country: 'Zimbabwe' },
  'casablanca': { lat: 33.5731, lng: -7.5898, country: 'Morocco' },
  'marrakech': { lat: 31.6295, lng: -7.9811, country: 'Morocco' },
  'algiers': { lat: 36.7538, lng: 3.0588, country: 'Algeria' },
  'tunis': { lat: 36.8065, lng: 10.1815, country: 'Tunisia' },
  'kigali': { lat: -1.9706, lng: 30.1044, country: 'Rwanda' },
  'luanda': { lat: -8.8390, lng: 13.2894, country: 'Angola' },
  'maputo': { lat: -25.9692, lng: 32.5732, country: 'Mozambique' },
  'gaborone': { lat: -24.6282, lng: 25.9231, country: 'Botswana' },
  'windhoek': { lat: -22.5609, lng: 17.0658, country: 'Namibia' },
  'kinshasa': { lat: -4.4419, lng: 15.2663, country: 'DR Congo' },

  // Taiwan & East / South Asia
  'taipei': { lat: 25.0330, lng: 121.5654, country: 'Taiwan' },
  'taipei, taiwan': { lat: 25.0330, lng: 121.5654, country: 'Taiwan' },
  'tainan': { lat: 22.9997, lng: 120.2270, country: 'Taiwan' },
  'tainan, taiwan': { lat: 22.9997, lng: 120.2270, country: 'Taiwan' },
  'taichung': { lat: 24.1477, lng: 120.6736, country: 'Taiwan' },
  'kaohsiung': { lat: 22.6273, lng: 120.3014, country: 'Taiwan' },
  'tokyo': { lat: 35.6762, lng: 139.6503, country: 'Japan' },
  'tokyo, japan': { lat: 35.6762, lng: 139.6503, country: 'Japan' },
  'kyoto': { lat: 35.0116, lng: 135.7681, country: 'Japan' },
  'osaka': { lat: 34.6937, lng: 135.5023, country: 'Japan' },
  'seoul': { lat: 37.5665, lng: 126.9780, country: 'South Korea' },
  'beijing': { lat: 39.9042, lng: 116.4074, country: 'China' },
  'shanghai': { lat: 31.2304, lng: 121.4737, country: 'China' },
  'hong kong': { lat: 22.3193, lng: 114.1694, country: 'Hong Kong' },
  'singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  'bangkok': { lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  'manila': { lat: 14.5995, lng: 120.9842, country: 'Philippines' },
  'jakarta': { lat: -6.2088, lng: 106.8456, country: 'Indonesia' },
  'kuala lumpur': { lat: 3.1390, lng: 101.6869, country: 'Malaysia' },
  'hanoi': { lat: 21.0285, lng: 105.8542, country: 'Vietnam' },
  'mumbai': { lat: 19.0760, lng: 72.8777, country: 'India' },
  'delhi': { lat: 28.7041, lng: 77.1025, country: 'India' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, country: 'India' },
  'chennai': { lat: 13.0827, lng: 80.2707, country: 'India' },
  'kolkata': { lat: 22.5726, lng: 88.3639, country: 'India' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, country: 'India' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, country: 'India' },
  'pune': { lat: 18.5204, lng: 73.8567, country: 'India' },
  'sydney': { lat: -33.8688, lng: 151.2093, country: 'Australia' },
  'melbourne': { lat: -37.8136, lng: 144.9631, country: 'Australia' },
  'brisbane': { lat: -27.4698, lng: 153.0251, country: 'Australia' },
  'perth': { lat: -31.9505, lng: 115.8605, country: 'Australia' },
  'auckland': { lat: -36.8485, lng: 174.7633, country: 'New Zealand' },

  // Europe
  'florence': { lat: 43.7696, lng: 11.2558, country: 'Italy' },
  'florence, italy': { lat: 43.7696, lng: 11.2558, country: 'Italy' },
  'rome': { lat: 41.9028, lng: 12.4964, country: 'Italy' },
  'rome, italy': { lat: 41.9028, lng: 12.4964, country: 'Italy' },
  'milan': { lat: 45.4642, lng: 9.1900, country: 'Italy' },
  'venice': { lat: 45.4408, lng: 12.3155, country: 'Italy' },
  'dublin': { lat: 53.3498, lng: -6.2603, country: 'Ireland' },
  'dublin, ireland': { lat: 53.3498, lng: -6.2603, country: 'Ireland' },
  'london': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom' },
  'london, uk': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom' },
  'edinburgh': { lat: 55.9533, lng: -3.1883, country: 'United Kingdom' },
  'manchester': { lat: 53.4808, lng: -2.2426, country: 'United Kingdom' },
  'paris': { lat: 48.8566, lng: 2.3522, country: 'France' },
  'paris, france': { lat: 48.8566, lng: 2.3522, country: 'France' },
  'marseille': { lat: 43.2965, lng: 5.3698, country: 'France' },
  'madrid': { lat: 40.4168, lng: -3.7038, country: 'Spain' },
  'barcelona': { lat: 41.3879, lng: 2.1699, country: 'Spain' },
  'lisbon': { lat: 38.7223, lng: -9.1393, country: 'Portugal' },
  'berlin': { lat: 52.5200, lng: 13.4050, country: 'Germany' },
  'munich': { lat: 48.1351, lng: 11.5820, country: 'Germany' },
  'amsterdam': { lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  'brussels': { lat: 50.8503, lng: 4.3517, country: 'Belgium' },
  'zurich': { lat: 47.3769, lng: 8.5417, country: 'Switzerland' },
  'geneva': { lat: 46.2044, lng: 6.1432, country: 'Switzerland' },
  'vienna': { lat: 48.2082, lng: 16.3738, country: 'Austria' },
  'prague': { lat: 50.0755, lng: 14.4378, country: 'Czech Republic' },
  'athens': { lat: 37.9838, lng: 23.7275, country: 'Greece' },
  'stockholm': { lat: 59.3293, lng: 18.0686, country: 'Sweden' },
  'oslo': { lat: 59.9139, lng: 10.7522, country: 'Norway' },
  'copenhagen': { lat: 55.6761, lng: 12.5683, country: 'Denmark' },
  'helsinki': { lat: 60.1699, lng: 24.9384, country: 'Finland' },
  'warsaw': { lat: 52.2297, lng: 21.0122, country: 'Poland' },
  'krakow': { lat: 50.0647, lng: 19.9450, country: 'Poland' },
  'budapest': { lat: 47.4979, lng: 19.0402, country: 'Hungary' },
  'bucharest': { lat: 44.4268, lng: 26.1025, country: 'Romania' },
  'sofia': { lat: 42.6977, lng: 23.3219, country: 'Bulgaria' },
  'belgrade': { lat: 44.7866, lng: 20.4489, country: 'Serbia' },
  'zagreb': { lat: 45.8150, lng: 15.9819, country: 'Croatia' },
  'sarajevo': { lat: 43.8563, lng: 18.4131, country: 'Bosnia and Herzegovina' },
  'kyiv': { lat: 50.4501, lng: 30.5234, country: 'Ukraine' },
  'reykjavik': { lat: 64.1466, lng: -21.9426, country: 'Iceland' },
  'birmingham': { lat: 52.4862, lng: -1.8904, country: 'United Kingdom' },
  'glasgow': { lat: 55.8642, lng: -4.2518, country: 'United Kingdom' },
  'leeds': { lat: 53.8008, lng: -1.5491, country: 'United Kingdom' },
  'liverpool': { lat: 53.4084, lng: -2.9916, country: 'United Kingdom' },
  'cardiff': { lat: 51.4816, lng: -3.1791, country: 'United Kingdom' },
  'lyon': { lat: 45.7640, lng: 4.8357, country: 'France' },
  'nice': { lat: 43.7102, lng: 7.2620, country: 'France' },
  'toulouse': { lat: 43.6047, lng: 1.4442, country: 'France' },
  'bordeaux': { lat: 44.8378, lng: -0.5792, country: 'France' },
  'seville': { lat: 37.3891, lng: -5.9845, country: 'Spain' },
  'valencia': { lat: 39.4699, lng: -0.3763, country: 'Spain' },
  'malaga': { lat: 36.7213, lng: -4.4214, country: 'Spain' },
  'porto': { lat: 41.1579, lng: -8.6291, country: 'Portugal' },
  'naples': { lat: 40.8518, lng: 14.2681, country: 'Italy' },
  'turin': { lat: 45.0703, lng: 7.6869, country: 'Italy' },
  'palermo': { lat: 38.1157, lng: 13.3615, country: 'Italy' },
  'bologna': { lat: 44.4949, lng: 11.3426, country: 'Italy' },
  'hamburg': { lat: 53.5511, lng: 9.9937, country: 'Germany' },
  'frankfurt': { lat: 50.1109, lng: 8.6821, country: 'Germany' },
  'cologne': { lat: 50.9375, lng: 6.9603, country: 'Germany' },
  'stuttgart': { lat: 48.7758, lng: 9.1829, country: 'Germany' },
  'rotterdam': { lat: 51.9244, lng: 4.4777, country: 'Netherlands' },
  'the hague': { lat: 52.0705, lng: 4.3007, country: 'Netherlands' },
  'antwerp': { lat: 51.2194, lng: 4.4025, country: 'Belgium' },
  'basel': { lat: 47.5596, lng: 7.5886, country: 'Switzerland' },

  // Middle East & North Africa
  'dubai': { lat: 25.2048, lng: 55.2708, country: 'United Arab Emirates' },
  'dubai, uae': { lat: 25.2048, lng: 55.2708, country: 'United Arab Emirates' },
  'abu dhabi': { lat: 24.4539, lng: 54.3773, country: 'United Arab Emirates' },
  'doha': { lat: 25.2854, lng: 51.5310, country: 'Qatar' },
  'doha, qatar': { lat: 25.2854, lng: 51.5310, country: 'Qatar' },
  'riyadh': { lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia' },
  'jeddah': { lat: 21.5433, lng: 39.1728, country: 'Saudi Arabia' },
  'mecca': { lat: 21.3891, lng: 39.8579, country: 'Saudi Arabia' },
  'medina': { lat: 24.5247, lng: 39.5692, country: 'Saudi Arabia' },
  'istanbul': { lat: 41.0082, lng: 28.9784, country: 'Turkey' },
  'istanbul, turkey': { lat: 41.0082, lng: 28.9784, country: 'Turkey' },
  'ankara': { lat: 39.9334, lng: 32.8597, country: 'Turkey' },
  'izmir': { lat: 38.4237, lng: 27.1428, country: 'Turkey' },
  'tel aviv': { lat: 32.0853, lng: 34.7818, country: 'Israel' },
  'tel aviv, israel': { lat: 32.0853, lng: 34.7818, country: 'Israel' },
  'jerusalem': { lat: 31.7683, lng: 35.2137, country: 'Israel' },
  'beirut': { lat: 33.8938, lng: 35.5018, country: 'Lebanon' },
  'amman': { lat: 31.9454, lng: 35.9284, country: 'Jordan' },
  'baghdad': { lat: 33.3152, lng: 44.3661, country: 'Iraq' },
  'tehran': { lat: 35.6892, lng: 51.3890, country: 'Iran' },
  'muscat': { lat: 23.5880, lng: 58.3829, country: 'Oman' },
  'kuwait city': { lat: 29.3759, lng: 47.9774, country: 'Kuwait' },
  'manama': { lat: 26.2285, lng: 50.5860, country: 'Bahrain' },

  // South Asia
  'surat': { lat: 21.1702, lng: 72.8311, country: 'India' },
  'jaipur': { lat: 26.9124, lng: 75.7873, country: 'India' },
  'lucknow': { lat: 26.8467, lng: 80.9462, country: 'India' },
  'kanpur': { lat: 26.4499, lng: 80.3319, country: 'India' },
  'nagpur': { lat: 21.1458, lng: 79.0882, country: 'India' },
  'indore': { lat: 22.7196, lng: 75.8577, country: 'India' },
  'vadodara': { lat: 22.3072, lng: 73.1812, country: 'India' },
  'bhopal': { lat: 23.2599, lng: 77.4126, country: 'India' },
  'patna': { lat: 25.5941, lng: 85.1376, country: 'India' },
  'ludhiana': { lat: 30.9010, lng: 75.8573, country: 'India' },
  'agra': { lat: 27.1767, lng: 78.0081, country: 'India' },
  'varanasi': { lat: 25.3176, lng: 82.9739, country: 'India' },
  'amritsar': { lat: 31.6340, lng: 74.8723, country: 'India' },
  'rajkot': { lat: 22.3039, lng: 70.8022, country: 'India' },
  'kochi': { lat: 9.9312, lng: 76.2673, country: 'India' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, country: 'India' },
  'karachi': { lat: 24.8607, lng: 67.0011, country: 'Pakistan' },
  'lahore': { lat: 31.5204, lng: 74.3587, country: 'Pakistan' },
  'islamabad': { lat: 33.6844, lng: 73.0479, country: 'Pakistan' },
  'dhaka': { lat: 23.8103, lng: 90.4125, country: 'Bangladesh' },
  'chittagong': { lat: 22.3569, lng: 91.7832, country: 'Bangladesh' },
  'colombo': { lat: 6.9271, lng: 79.8612, country: 'Sri Lanka' },
  'kathmandu': { lat: 27.7172, lng: 85.3240, country: 'Nepal' },

  // East & Southeast Asia
  'yokohama': { lat: 35.4437, lng: 139.6380, country: 'Japan' },
  'sapporo': { lat: 43.0618, lng: 141.3545, country: 'Japan' },
  'nagoya': { lat: 35.1815, lng: 136.9066, country: 'Japan' },
  'kobe': { lat: 34.6901, lng: 135.1955, country: 'Japan' },
  'fukuoka': { lat: 33.5904, lng: 130.4017, country: 'Japan' },
  'busan': { lat: 35.1796, lng: 129.0756, country: 'South Korea' },
  'incheon': { lat: 37.4563, lng: 126.7052, country: 'South Korea' },
  'guangzhou': { lat: 23.1291, lng: 113.2644, country: 'China' },
  'shenzhen': { lat: 22.5431, lng: 114.0579, country: 'China' },
  'chengdu': { lat: 30.5728, lng: 104.0668, country: 'China' },
  'wuhan': { lat: 30.5928, lng: 114.3055, country: 'China' },
  'xian': { lat: 34.3416, lng: 108.9398, country: 'China' },
  'hangzhou': { lat: 30.2741, lng: 120.1551, country: 'China' },
  'chongqing': { lat: 29.4316, lng: 106.9123, country: 'China' },
  'ho chi minh city': { lat: 10.8231, lng: 106.6297, country: 'Vietnam' },
  'da nang': { lat: 16.0544, lng: 108.2022, country: 'Vietnam' },
  'phnom penh': { lat: 11.5564, lng: 104.9282, country: 'Cambodia' },
  'yangon': { lat: 16.8661, lng: 96.1951, country: 'Myanmar' },
  'bali': { lat: -8.3405, lng: 115.0920, country: 'Indonesia' },

  // Additional Americas & Oceania
  'ottawa': { lat: 45.4215, lng: -75.6972, country: 'Canada' },
  'edmonton': { lat: 53.5461, lng: -113.4938, country: 'Canada' },
  'winnipeg': { lat: 49.8951, lng: -97.1384, country: 'Canada' },
  'quebec city': { lat: 46.8139, lng: -71.2080, country: 'Canada' },
  'halifax': { lat: 44.6488, lng: -63.5752, country: 'Canada' },
  'victoria': { lat: 48.4284, lng: -123.3656, country: 'Canada' },
  'panama city': { lat: 8.9824, lng: -79.5199, country: 'Panama' },
  'san jose, costa rica': { lat: 9.9281, lng: -84.0907, country: 'Costa Rica' },
  'guatemala city': { lat: 14.6349, lng: -90.5069, country: 'Guatemala' },
  'san salvador': { lat: 13.6929, lng: -89.2182, country: 'El Salvador' },
  'santo domingo': { lat: 18.4861, lng: -69.9312, country: 'Dominican Republic' },
  'kingston': { lat: 17.9712, lng: -76.7936, country: 'Jamaica' },
  'caracas': { lat: 10.4806, lng: -66.9036, country: 'Venezuela' },
  'quito': { lat: -0.1807, lng: -78.4678, country: 'Ecuador' },
  'guayaquil': { lat: -2.1710, lng: -79.9224, country: 'Ecuador' },
  'la paz': { lat: -16.4897, lng: -68.1193, country: 'Bolivia' },
  'asuncion': { lat: -25.2637, lng: -57.5759, country: 'Paraguay' },
  'montevideo': { lat: -34.9011, lng: -56.1645, country: 'Uruguay' },
  'brasilia': { lat: -15.8267, lng: -47.9218, country: 'Brazil' },
  'salvador': { lat: -12.9777, lng: -38.5016, country: 'Brazil' },
  'fortaleza': { lat: -3.7319, lng: -38.5267, country: 'Brazil' },
  'belo horizonte': { lat: -19.9167, lng: -43.9345, country: 'Brazil' },
  'curitiba': { lat: -25.4290, lng: -49.2671, country: 'Brazil' },
  'adelaide': { lat: -34.9285, lng: 138.6007, country: 'Australia' },
  'gold coast': { lat: -28.0167, lng: 153.4000, country: 'Australia' },
  'canberra': { lat: -35.2809, lng: 149.1300, country: 'Australia' },
  'wellington': { lat: -41.2865, lng: 174.7762, country: 'New Zealand' },
  'christchurch': { lat: -43.5321, lng: 172.6362, country: 'New Zealand' },

  // Westeros / Fantasy Locations for House Targaryen
  'dragonstone': { lat: 38.7169, lng: -27.2289, country: 'Crownlands' },
  "king's landing": { lat: 42.6403, lng: 18.1083, country: 'Crownlands' },
  'kings landing': { lat: 42.6403, lng: 18.1083, country: 'Crownlands' },
  'oldtown': { lat: 36.8381, lng: -2.4597, country: 'The Reach' },
  'driftmark': { lat: 39.0520, lng: -26.9850, country: 'Crownlands' },
  'winterfell': { lat: 57.1497, lng: -2.0943, country: 'The North' },
  'pentos': { lat: 37.9838, lng: 23.7275, country: 'Free Cities' },
  'meereen': { lat: 30.0444, lng: 31.2357, country: 'Slavers Bay' },
  'valyria': { lat: 35.3387, lng: 25.1442, country: 'Valyrian Peninsula' },
  'runestone': { lat: 54.9783, lng: -1.6178, country: 'The Vale' },
  'eyrie': { lat: 46.5197, lng: 6.6323, country: 'The Vale' },
  'riverrun': { lat: 52.4862, lng: -1.8904, country: 'Riverlands' },
  'sunspear': { lat: 36.7213, lng: -4.4214, country: 'Dorne' },
};

/**
 * Centroid coordinates for global countries.
 * Ensures any mention of a country lands inside its geographical borders.
 */
export const GLOBAL_COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number; country: string }> = {
  zambia: { lat: -13.1339, lng: 27.8493, country: 'Zambia' },
  kenya: { lat: -0.0236, lng: 37.9062, country: 'Kenya' },
  nigeria: { lat: 9.0820, lng: 8.6753, country: 'Nigeria' },
  'south africa': { lat: -30.5595, lng: 22.9375, country: 'South Africa' },
  egypt: { lat: 26.8206, lng: 30.8025, country: 'Egypt' },
  ethiopia: { lat: 9.1450, lng: 40.4897, country: 'Ethiopia' },
  ghana: { lat: 7.9465, lng: -1.0232, country: 'Ghana' },
  tanzania: { lat: -6.3690, lng: 34.8888, country: 'Tanzania' },
  uganda: { lat: 1.3733, lng: 32.2903, country: 'Uganda' },
  zimbabwe: { lat: -19.0154, lng: 29.1549, country: 'Zimbabwe' },
  morocco: { lat: 31.7917, lng: -7.0926, country: 'Morocco' },
  algeria: { lat: 28.0339, lng: 1.6596, country: 'Algeria' },
  tunisia: { lat: 33.8869, lng: 9.5375, country: 'Tunisia' },
  senegal: { lat: 14.4974, lng: -14.4524, country: 'Senegal' },
  angola: { lat: -11.2027, lng: 17.8739, country: 'Angola' },
  mozambique: { lat: -18.6657, lng: 35.5296, country: 'Mozambique' },
  botswana: { lat: -22.3285, lng: 24.6849, country: 'Botswana' },
  namibia: { lat: -22.9576, lng: 18.4904, country: 'Namibia' },
  rwanda: { lat: -1.9403, lng: 29.8739, country: 'Rwanda' },
  congo: { lat: -0.2280, lng: 15.8277, country: 'Republic of the Congo' },
  drc: { lat: -4.0383, lng: 21.7587, country: 'DR Congo' },
  'dr congo': { lat: -4.0383, lng: 21.7587, country: 'DR Congo' },
  india: { lat: 20.5937, lng: 78.9629, country: 'India' },
  'united states': { lat: 37.0902, lng: -95.7129, country: 'United States' },
  usa: { lat: 37.0902, lng: -95.7129, country: 'United States' },
  canada: { lat: 56.1304, lng: -106.3468, country: 'Canada' },
  mexico: { lat: 23.6345, lng: -102.5528, country: 'Mexico' },
  'united kingdom': { lat: 55.3781, lng: -3.4360, country: 'United Kingdom' },
  uk: { lat: 55.3781, lng: -3.4360, country: 'United Kingdom' },
  ireland: { lat: 53.1424, lng: -7.6921, country: 'Ireland' },
  france: { lat: 46.2276, lng: 2.2137, country: 'France' },
  germany: { lat: 51.1657, lng: 10.4515, country: 'Germany' },
  italy: { lat: 41.8719, lng: 12.5674, country: 'Italy' },
  spain: { lat: 40.4637, lng: -3.7492, country: 'Spain' },
  portugal: { lat: 39.3999, lng: -8.2245, country: 'Portugal' },
  switzerland: { lat: 46.8182, lng: 8.2275, country: 'Switzerland' },
  austria: { lat: 47.5162, lng: 14.5501, country: 'Austria' },
  netherlands: { lat: 52.1326, lng: 5.2913, country: 'Netherlands' },
  belgium: { lat: 50.5039, lng: 4.4699, country: 'Belgium' },
  sweden: { lat: 60.1282, lng: 18.6435, country: 'Sweden' },
  norway: { lat: 60.4720, lng: 8.4689, country: 'Norway' },
  denmark: { lat: 56.2639, lng: 9.5018, country: 'Denmark' },
  finland: { lat: 61.9241, lng: 25.7482, country: 'Finland' },
  poland: { lat: 51.9194, lng: 19.1451, country: 'Poland' },
  greece: { lat: 39.0742, lng: 21.8243, country: 'Greece' },
  turkey: { lat: 38.9637, lng: 35.2433, country: 'Turkey' },
  israel: { lat: 31.0461, lng: 34.8516, country: 'Israel' },
  'saudi arabia': { lat: 23.8859, lng: 45.0792, country: 'Saudi Arabia' },
  uae: { lat: 23.4241, lng: 53.8478, country: 'United Arab Emirates' },
  'united arab emirates': { lat: 23.4241, lng: 53.8478, country: 'United Arab Emirates' },
  qatar: { lat: 25.3548, lng: 51.1839, country: 'Qatar' },
  pakistan: { lat: 30.3753, lng: 69.3451, country: 'Pakistan' },
  bangladesh: { lat: 23.6850, lng: 90.3563, country: 'Bangladesh' },
  'sri lanka': { lat: 7.8731, lng: 80.7718, country: 'Sri Lanka' },
  nepal: { lat: 28.3949, lng: 84.1240, country: 'Nepal' },
  thailand: { lat: 15.8700, lng: 100.9925, country: 'Thailand' },
  vietnam: { lat: 14.0583, lng: 108.2772, country: 'Vietnam' },
  philippines: { lat: 12.8797, lng: 121.7740, country: 'Philippines' },
  indonesia: { lat: -0.7893, lng: 113.9213, country: 'Indonesia' },
  malaysia: { lat: 4.2105, lng: 101.9758, country: 'Malaysia' },
  singapore: { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  'south korea': { lat: 35.9078, lng: 127.7669, country: 'South Korea' },
  korea: { lat: 35.9078, lng: 127.7669, country: 'South Korea' },
  russia: { lat: 61.5240, lng: 105.3188, country: 'Russia' },
  ukraine: { lat: 48.3794, lng: 31.1656, country: 'Ukraine' },
  'czech republic': { lat: 49.8175, lng: 15.4730, country: 'Czech Republic' },
  hungary: { lat: 47.1625, lng: 19.5033, country: 'Hungary' },
  romania: { lat: 45.9432, lng: 24.9668, country: 'Romania' },
  bulgaria: { lat: 42.7339, lng: 25.4858, country: 'Bulgaria' },
  croatia: { lat: 45.1000, lng: 15.2000, country: 'Croatia' },
  serbia: { lat: 44.0165, lng: 21.0059, country: 'Serbia' },
  iceland: { lat: 64.9631, lng: -19.0208, country: 'Iceland' },
  venezuela: { lat: 6.4238, lng: -66.5897, country: 'Venezuela' },
  ecuador: { lat: -1.8312, lng: -78.1834, country: 'Ecuador' },
  bolivia: { lat: -16.2902, lng: -63.5887, country: 'Bolivia' },
  paraguay: { lat: -23.4425, lng: -58.4438, country: 'Paraguay' },
  uruguay: { lat: -32.5228, lng: -55.7658, country: 'Uruguay' },
  'costa rica': { lat: 9.7489, lng: -83.7534, country: 'Costa Rica' },
  panama: { lat: 8.5379, lng: -80.7821, country: 'Panama' },
  cuba: { lat: 21.5218, lng: -77.7812, country: 'Cuba' },
  'dominican republic': { lat: 18.7357, lng: -70.1627, country: 'Dominican Republic' },
  jamaica: { lat: 18.1096, lng: -77.2975, country: 'Jamaica' },
  japan: { lat: 36.2048, lng: 138.2529, country: 'Japan' },
  china: { lat: 35.8617, lng: 104.1954, country: 'China' },
  taiwan: { lat: 23.6978, lng: 120.9605, country: 'Taiwan' },
  australia: { lat: -25.2744, lng: 133.7751, country: 'Australia' },
  'new zealand': { lat: -40.9006, lng: 174.8860, country: 'New Zealand' },
  brazil: { lat: -14.2350, lng: -51.9253, country: 'Brazil' },
  argentina: { lat: -38.4161, lng: -63.6167, country: 'Argentina' },
  chile: { lat: -35.6751, lng: -71.5430, country: 'Chile' },
  colombia: { lat: 4.5709, lng: -74.2973, country: 'Colombia' },
  peru: { lat: -9.1900, lng: -75.0152, country: 'Peru' },
};

/**
 * Curated list of searchable global cities for instant autocomplete.
 */
export const SEARCHABLE_CITIES: CitySuggestion[] = [
  // Zambia & Africa
  { city: 'Ndola', country: 'Zambia', fullName: 'Ndola, Zambia' },
  { city: 'Lusaka', country: 'Zambia', fullName: 'Lusaka, Zambia' },
  { city: 'Kitwe', country: 'Zambia', fullName: 'Kitwe, Zambia' },
  { city: 'Livingstone', country: 'Zambia', fullName: 'Livingstone, Zambia' },
  { city: 'Nairobi', country: 'Kenya', fullName: 'Nairobi, Kenya' },
  { city: 'Mombasa', country: 'Kenya', fullName: 'Mombasa, Kenya' },
  { city: 'Lagos', country: 'Nigeria', fullName: 'Lagos, Nigeria' },
  { city: 'Abuja', country: 'Nigeria', fullName: 'Abuja, Nigeria' },
  { city: 'Johannesburg', country: 'South Africa', fullName: 'Johannesburg, South Africa' },
  { city: 'Cape Town', country: 'South Africa', fullName: 'Cape Town, South Africa' },
  { city: 'Durban', country: 'South Africa', fullName: 'Durban, South Africa' },
  { city: 'Cairo', country: 'Egypt', fullName: 'Cairo, Egypt' },
  { city: 'Alexandria', country: 'Egypt', fullName: 'Alexandria, Egypt' },
  { city: 'Addis Ababa', country: 'Ethiopia', fullName: 'Addis Ababa, Ethiopia' },
  { city: 'Accra', country: 'Ghana', fullName: 'Accra, Ghana' },
  { city: 'Dakar', country: 'Senegal', fullName: 'Dakar, Senegal' },
  { city: 'Dar es Salaam', country: 'Tanzania', fullName: 'Dar es Salaam, Tanzania' },
  { city: 'Kampala', country: 'Uganda', fullName: 'Kampala, Uganda' },
  { city: 'Harare', country: 'Zimbabwe', fullName: 'Harare, Zimbabwe' },
  { city: 'Casablanca', country: 'Morocco', fullName: 'Casablanca, Morocco' },
  { city: 'Marrakech', country: 'Morocco', fullName: 'Marrakech, Morocco' },
  { city: 'Algiers', country: 'Algeria', fullName: 'Algiers, Algeria' },
  { city: 'Tunis', country: 'Tunisia', fullName: 'Tunis, Tunisia' },
  { city: 'Kigali', country: 'Rwanda', fullName: 'Kigali, Rwanda' },
  { city: 'Luanda', country: 'Angola', fullName: 'Luanda, Angola' },
  { city: 'Maputo', country: 'Mozambique', fullName: 'Maputo, Mozambique' },
  { city: 'Gaborone', country: 'Botswana', fullName: 'Gaborone, Botswana' },
  { city: 'Windhoek', country: 'Namibia', fullName: 'Windhoek, Namibia' },
  { city: 'Kinshasa', country: 'DR Congo', fullName: 'Kinshasa, DR Congo' },

  // USA
  { city: 'San Francisco', country: 'United States', fullName: 'San Francisco, CA' },
  { city: 'Los Angeles', country: 'United States', fullName: 'Los Angeles, CA' },
  { city: 'San Diego', country: 'United States', fullName: 'San Diego, CA' },
  { city: 'San Jose', country: 'United States', fullName: 'San Jose, CA' },
  { city: 'Oakland', country: 'United States', fullName: 'Oakland, CA' },
  { city: 'Berkeley', country: 'United States', fullName: 'Berkeley, CA' },
  { city: 'Palo Alto', country: 'United States', fullName: 'Palo Alto, CA' },
  { city: 'Sacramento', country: 'United States', fullName: 'Sacramento, CA' },
  { city: 'Seattle', country: 'United States', fullName: 'Seattle, WA' },
  { city: 'Portland', country: 'United States', fullName: 'Portland, OR' },
  { city: 'New York', country: 'United States', fullName: 'New York, NY' },
  { city: 'Boston', country: 'United States', fullName: 'Boston, MA' },
  { city: 'Philadelphia', country: 'United States', fullName: 'Philadelphia, PA' },
  { city: 'Washington', country: 'United States', fullName: 'Washington, DC' },
  { city: 'Chicago', country: 'United States', fullName: 'Chicago, IL' },
  { city: 'Austin', country: 'United States', fullName: 'Austin, TX' },
  { city: 'Dallas', country: 'United States', fullName: 'Dallas, TX' },
  { city: 'Houston', country: 'United States', fullName: 'Houston, TX' },
  { city: 'San Antonio', country: 'United States', fullName: 'San Antonio, TX' },
  { city: 'Miami', country: 'United States', fullName: 'Miami, FL' },
  { city: 'Orlando', country: 'United States', fullName: 'Orlando, FL' },
  { city: 'Atlanta', country: 'United States', fullName: 'Atlanta, GA' },
  { city: 'Denver', country: 'United States', fullName: 'Denver, CO' },
  { city: 'Phoenix', country: 'United States', fullName: 'Phoenix, AZ' },
  { city: 'Las Vegas', country: 'United States', fullName: 'Las Vegas, NV' },
  { city: 'Salt Lake City', country: 'United States', fullName: 'Salt Lake City, UT' },
  { city: 'Minneapolis', country: 'United States', fullName: 'Minneapolis, MN' },
  { city: 'Detroit', country: 'United States', fullName: 'Detroit, MI' },
  { city: 'Columbus', country: 'United States', fullName: 'Columbus, OH' },
  { city: 'Indianapolis', country: 'United States', fullName: 'Indianapolis, IN' },
  { city: 'St. Louis', country: 'United States', fullName: 'St. Louis, MO' },
  { city: 'Charlotte', country: 'United States', fullName: 'Charlotte, NC' },
  { city: 'Nashville', country: 'United States', fullName: 'Nashville, TN' },
  { city: 'New Orleans', country: 'United States', fullName: 'New Orleans, LA' },
  { city: 'Honolulu', country: 'United States', fullName: 'Honolulu, HI' },
  { city: 'Anchorage', country: 'United States', fullName: 'Anchorage, AK' },

  // Canada & Latin America
  { city: 'Toronto', country: 'Canada', fullName: 'Toronto, Canada' },
  { city: 'Vancouver', country: 'Canada', fullName: 'Vancouver, Canada' },
  { city: 'Montreal', country: 'Canada', fullName: 'Montreal, Canada' },
  { city: 'Calgary', country: 'Canada', fullName: 'Calgary, Canada' },
  { city: 'Mexico City', country: 'Mexico', fullName: 'Mexico City, Mexico' },
  { city: 'Guadalajara', country: 'Mexico', fullName: 'Guadalajara, Mexico' },
  { city: 'Monterrey', country: 'Mexico', fullName: 'Monterrey, Mexico' },
  { city: 'Puebla', country: 'Mexico', fullName: 'Puebla, Mexico' },
  { city: 'Tijuana', country: 'Mexico', fullName: 'Tijuana, Mexico' },
  { city: 'Oaxaca', country: 'Mexico', fullName: 'Oaxaca, Mexico' },
  { city: 'Cancun', country: 'Mexico', fullName: 'Cancun, Mexico' },
  { city: 'Havana', country: 'Cuba', fullName: 'Havana, Cuba' },
  { city: 'San Juan', country: 'Puerto Rico', fullName: 'San Juan, Puerto Rico' },
  { city: 'Bogota', country: 'Colombia', fullName: 'Bogota, Colombia' },
  { city: 'Medellin', country: 'Colombia', fullName: 'Medellin, Colombia' },
  { city: 'Lima', country: 'Peru', fullName: 'Lima, Peru' },
  { city: 'Buenos Aires', country: 'Argentina', fullName: 'Buenos Aires, Argentina' },
  { city: 'Santiago', country: 'Chile', fullName: 'Santiago, Chile' },
  { city: 'São Paulo', country: 'Brazil', fullName: 'São Paulo, Brazil' },
  { city: 'Rio de Janeiro', country: 'Brazil', fullName: 'Rio de Janeiro, Brazil' },

  // Europe
  { city: 'London', country: 'United Kingdom', fullName: 'London, United Kingdom' },
  { city: 'Edinburgh', country: 'United Kingdom', fullName: 'Edinburgh, United Kingdom' },
  { city: 'Manchester', country: 'United Kingdom', fullName: 'Manchester, United Kingdom' },
  { city: 'Dublin', country: 'Ireland', fullName: 'Dublin, Ireland' },
  { city: 'Belfast', country: 'United Kingdom', fullName: 'Belfast, United Kingdom' },
  { city: 'Paris', country: 'France', fullName: 'Paris, France' },
  { city: 'Marseille', country: 'France', fullName: 'Marseille, France' },
  { city: 'Rome', country: 'Italy', fullName: 'Rome, Italy' },
  { city: 'Florence', country: 'Italy', fullName: 'Florence, Italy' },
  { city: 'Milan', country: 'Italy', fullName: 'Milan, Italy' },
  { city: 'Venice', country: 'Italy', fullName: 'Venice, Italy' },
  { city: 'Madrid', country: 'Spain', fullName: 'Madrid, Spain' },
  { city: 'Barcelona', country: 'Spain', fullName: 'Barcelona, Spain' },
  { city: 'Lisbon', country: 'Portugal', fullName: 'Lisbon, Portugal' },
  { city: 'Berlin', country: 'Germany', fullName: 'Berlin, Germany' },
  { city: 'Munich', country: 'Germany', fullName: 'Munich, Germany' },
  { city: 'Hamburg', country: 'Germany', fullName: 'Hamburg, Germany' },
  { city: 'Frankfurt', country: 'Germany', fullName: 'Frankfurt, Germany' },
  { city: 'Cologne', country: 'Germany', fullName: 'Cologne, Germany' },
  { city: 'Amsterdam', country: 'Netherlands', fullName: 'Amsterdam, Netherlands' },
  { city: 'Rotterdam', country: 'Netherlands', fullName: 'Rotterdam, Netherlands' },
  { city: 'Brussels', country: 'Belgium', fullName: 'Brussels, Belgium' },
  { city: 'Antwerp', country: 'Belgium', fullName: 'Antwerp, Belgium' },
  { city: 'Zurich', country: 'Switzerland', fullName: 'Zurich, Switzerland' },
  { city: 'Geneva', country: 'Switzerland', fullName: 'Geneva, Switzerland' },
  { city: 'Basel', country: 'Switzerland', fullName: 'Basel, Switzerland' },
  { city: 'Vienna', country: 'Austria', fullName: 'Vienna, Austria' },
  { city: 'Prague', country: 'Czech Republic', fullName: 'Prague, Czech Republic' },
  { city: 'Warsaw', country: 'Poland', fullName: 'Warsaw, Poland' },
  { city: 'Krakow', country: 'Poland', fullName: 'Krakow, Poland' },
  { city: 'Budapest', country: 'Hungary', fullName: 'Budapest, Hungary' },
  { city: 'Bucharest', country: 'Romania', fullName: 'Bucharest, Romania' },
  { city: 'Sofia', country: 'Bulgaria', fullName: 'Sofia, Bulgaria' },
  { city: 'Belgrade', country: 'Serbia', fullName: 'Belgrade, Serbia' },
  { city: 'Zagreb', country: 'Croatia', fullName: 'Zagreb, Croatia' },
  { city: 'Sarajevo', country: 'Bosnia and Herzegovina', fullName: 'Sarajevo, Bosnia' },
  { city: 'Kyiv', country: 'Ukraine', fullName: 'Kyiv, Ukraine' },
  { city: 'Athens', country: 'Greece', fullName: 'Athens, Greece' },
  { city: 'Stockholm', country: 'Sweden', fullName: 'Stockholm, Sweden' },
  { city: 'Oslo', country: 'Norway', fullName: 'Oslo, Norway' },
  { city: 'Copenhagen', country: 'Denmark', fullName: 'Copenhagen, Denmark' },
  { city: 'Helsinki', country: 'Finland', fullName: 'Helsinki, Finland' },
  { city: 'Reykjavik', country: 'Iceland', fullName: 'Reykjavik, Iceland' },
  { city: 'Birmingham', country: 'United Kingdom', fullName: 'Birmingham, United Kingdom' },
  { city: 'Glasgow', country: 'United Kingdom', fullName: 'Glasgow, United Kingdom' },
  { city: 'Leeds', country: 'United Kingdom', fullName: 'Leeds, United Kingdom' },
  { city: 'Liverpool', country: 'United Kingdom', fullName: 'Liverpool, United Kingdom' },
  { city: 'Cardiff', country: 'United Kingdom', fullName: 'Cardiff, United Kingdom' },
  { city: 'Lyon', country: 'France', fullName: 'Lyon, France' },
  { city: 'Nice', country: 'France', fullName: 'Nice, France' },
  { city: 'Seville', country: 'Spain', fullName: 'Seville, Spain' },
  { city: 'Valencia', country: 'Spain', fullName: 'Valencia, Spain' },
  { city: 'Porto', country: 'Portugal', fullName: 'Porto, Portugal' },
  { city: 'Naples', country: 'Italy', fullName: 'Naples, Italy' },
  { city: 'Turin', country: 'Italy', fullName: 'Turin, Italy' },
  { city: 'Bologna', country: 'Italy', fullName: 'Bologna, Italy' },

  // Middle East
  { city: 'Dubai', country: 'United Arab Emirates', fullName: 'Dubai, UAE' },
  { city: 'Abu Dhabi', country: 'United Arab Emirates', fullName: 'Abu Dhabi, UAE' },
  { city: 'Doha', country: 'Qatar', fullName: 'Doha, Qatar' },
  { city: 'Riyadh', country: 'Saudi Arabia', fullName: 'Riyadh, Saudi Arabia' },
  { city: 'Jeddah', country: 'Saudi Arabia', fullName: 'Jeddah, Saudi Arabia' },
  { city: 'Istanbul', country: 'Turkey', fullName: 'Istanbul, Turkey' },
  { city: 'Ankara', country: 'Turkey', fullName: 'Ankara, Turkey' },
  { city: 'Tel Aviv', country: 'Israel', fullName: 'Tel Aviv, Israel' },
  { city: 'Jerusalem', country: 'Israel', fullName: 'Jerusalem, Israel' },
  { city: 'Beirut', country: 'Lebanon', fullName: 'Beirut, Lebanon' },
  { city: 'Amman', country: 'Jordan', fullName: 'Amman, Jordan' },
  { city: 'Kuwait City', country: 'Kuwait', fullName: 'Kuwait City, Kuwait' },
  { city: 'Muscat', country: 'Oman', fullName: 'Muscat, Oman' },

  // South Asia
  { city: 'Mumbai', country: 'India', fullName: 'Mumbai, India' },
  { city: 'Delhi', country: 'India', fullName: 'Delhi, India' },
  { city: 'Bengaluru', country: 'India', fullName: 'Bengaluru, India' },
  { city: 'Chennai', country: 'India', fullName: 'Chennai, India' },
  { city: 'Ahmedabad', country: 'India', fullName: 'Ahmedabad, India' },
  { city: 'Surat', country: 'India', fullName: 'Surat, India' },
  { city: 'Jaipur', country: 'India', fullName: 'Jaipur, India' },
  { city: 'Lucknow', country: 'India', fullName: 'Lucknow, India' },
  { city: 'Vadodara', country: 'India', fullName: 'Vadodara, India' },
  { city: 'Rajkot', country: 'India', fullName: 'Rajkot, India' },
  { city: 'Kolkata', country: 'India', fullName: 'Kolkata, India' },
  { city: 'Hyderabad', country: 'India', fullName: 'Hyderabad, India' },
  { city: 'Pune', country: 'India', fullName: 'Pune, India' },
  { city: 'Karachi', country: 'Pakistan', fullName: 'Karachi, Pakistan' },
  { city: 'Lahore', country: 'Pakistan', fullName: 'Lahore, Pakistan' },
  { city: 'Islamabad', country: 'Pakistan', fullName: 'Islamabad, Pakistan' },
  { city: 'Dhaka', country: 'Bangladesh', fullName: 'Dhaka, Bangladesh' },
  { city: 'Colombo', country: 'Sri Lanka', fullName: 'Colombo, Sri Lanka' },
  { city: 'Kathmandu', country: 'Nepal', fullName: 'Kathmandu, Nepal' },

  // East & Southeast Asia
  { city: 'Tokyo', country: 'Japan', fullName: 'Tokyo, Japan' },
  { city: 'Kyoto', country: 'Japan', fullName: 'Kyoto, Japan' },
  { city: 'Osaka', country: 'Japan', fullName: 'Osaka, Japan' },
  { city: 'Yokohama', country: 'Japan', fullName: 'Yokohama, Japan' },
  { city: 'Sapporo', country: 'Japan', fullName: 'Sapporo, Japan' },
  { city: 'Seoul', country: 'South Korea', fullName: 'Seoul, South Korea' },
  { city: 'Busan', country: 'South Korea', fullName: 'Busan, South Korea' },
  { city: 'Beijing', country: 'China', fullName: 'Beijing, China' },
  { city: 'Shanghai', country: 'China', fullName: 'Shanghai, China' },
  { city: 'Guangzhou', country: 'China', fullName: 'Guangzhou, China' },
  { city: 'Shenzhen', country: 'China', fullName: 'Shenzhen, China' },
  { city: 'Chengdu', country: 'China', fullName: 'Chengdu, China' },
  { city: 'Hong Kong', country: 'Hong Kong', fullName: 'Hong Kong' },
  { city: 'Taipei', country: 'Taiwan', fullName: 'Taipei, Taiwan' },
  { city: 'Tainan', country: 'Taiwan', fullName: 'Tainan, Taiwan' },
  { city: 'Singapore', country: 'Singapore', fullName: 'Singapore' },
  { city: 'Bangkok', country: 'Thailand', fullName: 'Bangkok, Thailand' },
  { city: 'Hanoi', country: 'Vietnam', fullName: 'Hanoi, Vietnam' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', fullName: 'Ho Chi Minh City, Vietnam' },
  { city: 'Manila', country: 'Philippines', fullName: 'Manila, Philippines' },
  { city: 'Jakarta', country: 'Indonesia', fullName: 'Jakarta, Indonesia' },
  { city: 'Kuala Lumpur', country: 'Malaysia', fullName: 'Kuala Lumpur, Malaysia' },

  // Additional Americas & Oceania
  { city: 'Ottawa', country: 'Canada', fullName: 'Ottawa, Canada' },
  { city: 'Edmonton', country: 'Canada', fullName: 'Edmonton, Canada' },
  { city: 'Winnipeg', country: 'Canada', fullName: 'Winnipeg, Canada' },
  { city: 'Quebec City', country: 'Canada', fullName: 'Quebec City, Canada' },
  { city: 'Panama City', country: 'Panama', fullName: 'Panama City, Panama' },
  { city: 'San Jose', country: 'Costa Rica', fullName: 'San Jose, Costa Rica' },
  { city: 'Santo Domingo', country: 'Dominican Republic', fullName: 'Santo Domingo, Dominican Republic' },
  { city: 'Kingston', country: 'Jamaica', fullName: 'Kingston, Jamaica' },
  { city: 'Caracas', country: 'Venezuela', fullName: 'Caracas, Venezuela' },
  { city: 'Quito', country: 'Ecuador', fullName: 'Quito, Ecuador' },
  { city: 'La Paz', country: 'Bolivia', fullName: 'La Paz, Bolivia' },
  { city: 'Montevideo', country: 'Uruguay', fullName: 'Montevideo, Uruguay' },
  { city: 'Brasilia', country: 'Brazil', fullName: 'Brasilia, Brazil' },
  { city: 'Salvador', country: 'Brazil', fullName: 'Salvador, Brazil' },
  { city: 'Sydney', country: 'Australia', fullName: 'Sydney, Australia' },
  { city: 'Melbourne', country: 'Australia', fullName: 'Melbourne, Australia' },
  { city: 'Brisbane', country: 'Australia', fullName: 'Brisbane, Australia' },
  { city: 'Perth', country: 'Australia', fullName: 'Perth, Australia' },
  { city: 'Adelaide', country: 'Australia', fullName: 'Adelaide, Australia' },
  { city: 'Auckland', country: 'New Zealand', fullName: 'Auckland, New Zealand' },
  { city: 'Wellington', country: 'New Zealand', fullName: 'Wellington, New Zealand' },
];

/**
 * Searches curated cities for autocomplete suggestions.
 */
export function searchCities(query: string, maxResults: number = 8): CitySuggestion[] {
  if (!query || query.trim().length === 0) {
    return SEARCHABLE_CITIES.slice(0, maxResults);
  }
  const q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!q) return SEARCHABLE_CITIES.slice(0, maxResults);

  return SEARCHABLE_CITIES
    .map(item => {
      const cityClean = item.city.toLowerCase().replace(/[^a-z0-9]/g, '');
      const countryClean = item.country.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fullClean = item.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');

      let score = 0;
      if (cityClean === q) score += 100;
      else if (cityClean.startsWith(q)) score += 60;
      else if (fullClean.startsWith(q)) score += 50;
      else if (cityClean.includes(q)) score += 30;
      else if (countryClean.startsWith(q)) score += 25;
      else if (countryClean.includes(q)) score += 20;

      return { item, score };
    })
    .filter(res => res.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(res => res.item);
}

/**
 * Normalizes location string query.
 * Corrects single-character prefix typos such as "N,Dola" or "N. Dola" -> "ndola".
 */
export function cleanQuery(query: string): string {
  let s = query.toLowerCase();
  // Fix single-letter prefixes separated by punctuation or spaces, e.g. "n,dola" or "n. dola" -> "ndola"
  s = s.replace(/\b([a-z])[,.\-]?\s*([a-z]{3,})\b/g, (match, p1, p2) => {
    if (p1 === 'n' && p2 === 'dola') return 'ndola';
    return p1 + p2;
  });
  return s.replace(/[^\w\s,]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Deterministic pseudorandom coordinate generator for unlisted cities.
 * Hashes the location string and maps to realistic land-mass coordinates.
 */
function getDeterministicFallbackCoords(query: string): { lat: number; lng: number; country: string } {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash << 5) - hash + query.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const latFactor = (positive % 1000) / 1000;
  const lngFactor = ((positive >> 3) % 1000) / 1000;

  const lat = 18 + latFactor * 35; // ~18°N to 53°N
  const lng = -120 + lngFactor * 240; // ~-120°W to 120°E

  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    country: 'International',
  };
}

/**
 * Resolves any free-form location text to geographic coordinates.
 */
export function resolveLocation(rawLocation: string | null | undefined): GeoLocation | null {
  if (!rawLocation) return null;
  const cleaned = cleanQuery(rawLocation);
  if (!cleaned) return null;

  // 1. Exact match in dictionary
  if (GLOBAL_GEO_DICTIONARY[cleaned]) {
    const entry = GLOBAL_GEO_DICTIONARY[cleaned];
    return {
      name: rawLocation.trim(),
      country: entry.country,
      lat: entry.lat,
      lng: entry.lng,
    };
  }

  // 2. Exact match in country centroids
  if (GLOBAL_COUNTRY_CENTROIDS[cleaned]) {
    const entry = GLOBAL_COUNTRY_CENTROIDS[cleaned];
    return {
      name: rawLocation.trim(),
      country: entry.country,
      lat: entry.lat,
      lng: entry.lng,
    };
  }

  // 3. Partial substring search (e.g. "San Francisco, CA" matches "san francisco")
  const keys = Object.keys(GLOBAL_GEO_DICTIONARY);
  for (const k of keys) {
    if (cleaned.includes(k) || k.includes(cleaned)) {
      const entry = GLOBAL_GEO_DICTIONARY[k];
      return {
        name: rawLocation.trim(),
        country: entry.country,
        lat: entry.lat,
        lng: entry.lng,
      };
    }
  }

  // 4. Match by city part before comma (e.g. "Dublin, Ohio" ➔ check "dublin")
  const commaIdx = cleaned.indexOf(',');
  if (commaIdx > 0) {
    const cityPart = cleaned.slice(0, commaIdx).trim();
    if (GLOBAL_GEO_DICTIONARY[cityPart]) {
      const entry = GLOBAL_GEO_DICTIONARY[cityPart];
      return {
        name: rawLocation.trim(),
        country: entry.country,
        lat: entry.lat,
        lng: entry.lng,
      };
    }
  }

  // 5. Token analysis: Check if any word is a country (e.g. "zambia")
  const tokens = cleaned.split(/\s+/);
  for (const token of tokens) {
    if (GLOBAL_COUNTRY_CENTROIDS[token]) {
      const countryEntry = GLOBAL_COUNTRY_CENTROIDS[token];
      // Check if any other token matches a known city in the dictionary
      for (const other of tokens) {
        if (other !== token && GLOBAL_GEO_DICTIONARY[other]) {
          const cityEntry = GLOBAL_GEO_DICTIONARY[other];
          return {
            name: rawLocation.trim(),
            country: cityEntry.country,
            lat: cityEntry.lat,
            lng: cityEntry.lng,
          };
        }
      }
      // If city isn't in dictionary, anchor safely inside the country's borders
      return {
        name: rawLocation.trim(),
        country: countryEntry.country,
        lat: countryEntry.lat,
        lng: countryEntry.lng,
      };
    }
  }

  // 6. Deterministic fallback to ensure any custom user city displays stably
  const fallback = getDeterministicFallbackCoords(cleaned);
  return {
    name: rawLocation.trim(),
    country: fallback.country,
    lat: fallback.lat,
    lng: fallback.lng,
  };
}

/**
 * Extracts and categorizes all geographic events across a family tree.
 */
export function extractTreeGeoEvents(treeData: TreeData): {
  events: GeoEvent[];
  clusters: LocationCluster[];
} {
  const events: GeoEvent[] = [];
  const personMap = new Map<string, Person>();
  treeData.people.forEach(p => personMap.set(p.id, p));

  // 1. Birthplaces
  for (const p of treeData.people) {
    if (p.birthPlace) {
      const geo = resolveLocation(p.birthPlace);
      if (geo) {
        const year = p.birthDate ? parseInt(p.birthDate.split('-')[0], 10) : null;
        events.push({
          id: `birth-${p.id}`,
          type: 'birth',
          personId: p.id,
          personName: `${p.firstName} ${p.lastName}`,
          photoUrl: p.photoUrl,
          date: p.birthDate,
          year: !isNaN(year as number) ? year : null,
          locationName: geo.name,
          lat: geo.lat,
          lng: geo.lng,
          description: `Born in ${geo.name}${p.birthDate ? ` on ${p.birthDate}` : ''}.`,
        });
      }
    }

    // 2. Memorials (death places if available, or death date with birthplace)
    if (p.deathDate) {
      const deathPlace = p.customFields?.deathPlace || p.birthPlace;
      if (deathPlace) {
        const geo = resolveLocation(deathPlace);
        if (geo) {
          const year = parseInt(p.deathDate.split('-')[0], 10);
          events.push({
            id: `memorial-${p.id}`,
            type: 'memorial',
            personId: p.id,
            personName: `${p.firstName} ${p.lastName}`,
            photoUrl: p.photoUrl,
            date: p.deathDate,
            year: !isNaN(year) ? year : null,
            locationName: geo.name,
            lat: geo.lat,
            lng: geo.lng,
            description: `Passed away in ${geo.name}${p.deathDate ? ` on ${p.deathDate}` : ''}.`,
          });
        }
      }
    }

    // 3. Milestones (Graduations, Careers, Achievements with location or inferring)
    if (p.milestones && p.milestones.length > 0) {
      p.milestones.forEach((m) => {
        const place = (m as any).location || p.birthPlace;
        if (place) {
          const geo = resolveLocation(place);
          if (geo) {
            const year = m.date ? parseInt(m.date.split('-')[0], 10) : null;
            events.push({
              id: `milestone-${m.id}`,
              type: m.type === 'graduation' ? 'education' : m.type === 'memorial' ? 'memorial' : 'career',
              personId: p.id,
              personName: `${p.firstName} ${p.lastName}`,
              photoUrl: p.photoUrl,
              date: m.date || null,
              year: year && !isNaN(year) ? year : null,
              locationName: geo.name,
              lat: geo.lat,
              lng: geo.lng,
              description: `${m.description} (${geo.name})`,
            });
          }
        }
      });
    }
  }

  // 4. Marriages from Relationships
  const processedSpousePairs = new Set<string>();
  for (const rel of treeData.relationships) {
    if (rel.type === 'spouse') {
      const pA = personMap.get(rel.personAId);
      const pB = personMap.get(rel.personBId);
      if (!pA || !pB) continue;

      const pairKey = [pA.id, pB.id].sort().join('--');
      if (processedSpousePairs.has(pairKey)) continue;
      processedSpousePairs.add(pairKey);

      const marriagePlace = pA.birthPlace || pB.birthPlace;
      if (marriagePlace) {
        const geo = resolveLocation(marriagePlace);
        if (geo) {
          const year = rel.startDate ? parseInt(rel.startDate.split('-')[0], 10) : null;
          events.push({
            id: `marriage-${rel.id}`,
            type: 'marriage',
            personId: pA.id,
            personName: `${pA.firstName} & ${pB.firstName}`,
            photoUrl: pA.photoUrl || pB.photoUrl,
            date: rel.startDate || null,
            year: year && !isNaN(year) ? year : null,
            locationName: geo.name,
            lat: geo.lat,
            lng: geo.lng,
            description: `Married in ${geo.name}${rel.startDate ? ` on ${rel.startDate}` : ''}.`,
          });
        }
      }
    }
  }

  // Cluster events by proximity (~0.4 degrees)
  const clusters: LocationCluster[] = [];
  const PROXIMITY_THRESHOLD = 0.4;

  for (const ev of events) {
    let matchedCluster = clusters.find(
      (c) => Math.abs(c.lat - ev.lat) < PROXIMITY_THRESHOLD && Math.abs(c.lng - ev.lng) < PROXIMITY_THRESHOLD
    );

    if (matchedCluster) {
      matchedCluster.events.push(ev);
      const uniquePersons = new Set(matchedCluster.events.map((e) => e.personId));
      matchedCluster.peopleCount = uniquePersons.size;
    } else {
      const geo = resolveLocation(ev.locationName);
      clusters.push({
        id: `cluster-${ev.lat.toFixed(2)}-${ev.lng.toFixed(2)}`,
        name: ev.locationName,
        country: geo ? geo.country : 'International',
        lat: ev.lat,
        lng: ev.lng,
        events: [ev],
        peopleCount: 1,
      });
    }
  }

  return { events, clusters };
}

/**
 * Extracts generational migration paths (parent birthplace -> child birthplace).
 */
export function extractMigrationPaths(treeData: TreeData): MigrationPath[] {
  const paths: MigrationPath[] = [];
  const personMap = new Map<string, Person>();
  treeData.people.forEach((p) => personMap.set(p.id, p));

  const parentChildRels = treeData.relationships.filter((r) => r.type === 'parent_child');

  parentChildRels.forEach((rel) => {
    const parent = personMap.get(rel.personAId);
    const child = personMap.get(rel.personBId);

    if (!parent || !child || !parent.birthPlace || !child.birthPlace) return;

    const parentGeo = resolveLocation(parent.birthPlace);
    const childGeo = resolveLocation(child.birthPlace);

    if (!parentGeo || !childGeo) return;

    // Only create path if coordinates are geographically distinct (> 40km apart)
    const distanceDeg = Math.hypot(parentGeo.lat - childGeo.lat, parentGeo.lng - childGeo.lng);
    if (distanceDeg > 0.4) {
      const childYear = child.birthDate ? parseInt(child.birthDate.split('-')[0], 10) : null;
      paths.push({
        id: `migration-${parent.id}-${child.id}`,
        parentPersonId: parent.id,
        parentName: `${parent.firstName} ${parent.lastName}`,
        childPersonId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        fromLocation: parentGeo.name,
        fromLat: parentGeo.lat,
        fromLng: parentGeo.lng,
        toLocation: childGeo.name,
        toLat: childGeo.lat,
        toLng: childGeo.lng,
        year: childYear && !isNaN(childYear) ? childYear : null,
        generationSpan: `${parent.firstName} ➔ ${child.firstName}`,
      });
    }
  });

  return paths;
}

/**
 * Converts Latitude & Longitude to 3D Cartesian Coordinates (Three.js space).
 */
export function latLngToVector3(lat: number, lng: number, radius: number = 100): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}

/**
 * Generates points along a great-circle arc elevated above the globe sphere.
 */
export function createGreatCircleArcPoints(
  start: [number, number, number],
  end: [number, number, number],
  radius: number = 100,
  numPoints: number = 36
): [number, number, number][] {
  const points: [number, number, number][] = [];

  const vStart = { x: start[0], y: start[1], z: start[2] };
  const vEnd = { x: end[0], y: end[1], z: end[2] };

  const dot = (vStart.x * vEnd.x + vStart.y * vEnd.y + vStart.z * vEnd.z) / (radius * radius);
  const clampedDot = Math.max(-1, Math.min(1, dot));
  const angularDistance = Math.acos(clampedDot);

  // Maximum arc elevation above earth surface
  const maxAltitude = Math.min(45, Math.max(8, angularDistance * 20));

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;

    let x: number, y: number, z: number;
    if (angularDistance < 0.001) {
      x = vStart.x + (vEnd.x - vStart.x) * t;
      y = vStart.y + (vEnd.y - vStart.y) * t;
      z = vStart.z + (vEnd.z - vStart.z) * t;
    } else {
      const sinDist = Math.sin(angularDistance);
      const a = Math.sin((1 - t) * angularDistance) / sinDist;
      const b = Math.sin(t * angularDistance) / sinDist;
      x = a * vStart.x + b * vEnd.x;
      y = a * vStart.y + b * vEnd.y;
      z = a * vStart.z + b * vEnd.z;
    }

    const currentLen = Math.sqrt(x * x + y * y + z * z);
    const altitude = Math.sin(t * Math.PI) * maxAltitude;
    const elevatedRadius = radius + altitude;

    const scale = elevatedRadius / (currentLen || 1);
    points.push([x * scale, y * scale, z * scale]);
  }

  return points;
}
