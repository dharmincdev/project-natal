/**
 * Ultra-High-Fidelity Global Landmass & Inland Water Dataset.
 * Coordinates are [longitude, latitude] in degrees (-180 to 180, -90 to 90).
 * Captures recognizable, anatomically accurate geographical silhouettes:
 * - Detailed USA (Florida Keys, Cape Canaveral, Gulf of Mexico, Texas curve, California, Puget Sound, Baja California, Alaska, Cape Cod, Outer Banks)
 * - Great Lakes cutouts (Superior, Michigan, Huron, Erie, Ontario) & Michigan Mitten
 * - Africa (Horn of Africa, Cape of Good Hope, West Africa Bulge, Gulf of Guinea, Sinai, Madagascar, Lake Victoria)
 * - Europe (British Isles, Scandinavian fjords, Italian boot & heel, Iberian peninsula, Greece)
 * - Inland Seas (Black Sea, Caspian Sea, Mediterranean)
 * - Asia (Indian Subcontinent, Arabian Peninsula, Indochina, Japan, Korea, China, Indonesia)
 * - Australia, Tasmania, New Zealand & Antarctica
 */

export type LandPolygon = [number, number][];

export const WORLD_LAND_POLYGONS: LandPolygon[] = [
  // -------------------------------------------------------------
  // 1. NORTH AMERICA CONTINENT
  // -------------------------------------------------------------
  [
    // Bering Strait & Alaska Western Coast
    [-168.1, 65.6], [-166.5, 64.5], [-164.0, 64.5], [-161.0, 63.8],
    [-162.0, 61.0], [-165.5, 60.0], [-164.0, 58.5], [-160.0, 58.8],
    [-158.0, 56.5], [-163.0, 55.0], [-165.0, 54.5], // Alaska Peninsula
    [-161.0, 55.8], [-157.0, 57.0], [-153.5, 58.5],
    [-151.5, 59.8], // Kenai Peninsula
    [-148.0, 60.5], [-145.0, 60.0], [-140.0, 59.5], [-136.0, 58.2],
    [-134.0, 57.0], [-132.0, 55.0], [-130.5, 54.8], // Alexander Archipelago / Inside Passage
    // British Columbia & Pacific Northwest
    [-128.5, 52.5], [-127.0, 50.8], [-125.0, 49.5], [-123.1, 49.3], // Vancouver / Fraser River
    [-122.5, 48.0], [-124.5, 48.3], [-124.7, 48.4], // Puget Sound & Cape Flattery
    [-124.2, 46.2], // Columbia River Mouth (Astoria)
    [-124.0, 44.5], [-124.4, 43.0], [-124.4, 40.4], // Cape Mendocino, California
    [-123.8, 39.3], [-123.0, 38.3],
    [-122.5, 37.8], // San Francisco Bay Entrance (Golden Gate)
    [-122.0, 36.9], [-121.9, 36.6], // Monterey Bay
    [-121.8, 36.2], // Big Sur
    [-120.5, 34.45], // Point Conception
    [-119.7, 34.4], [-118.5, 34.0], // Los Angeles & Long Beach
    [-117.8, 33.5], [-117.2, 32.7], // San Diego Bay
    // Baja California Peninsula (Pacific Side)
    [-116.6, 31.8], [-115.8, 30.5], [-114.5, 28.5], [-115.0, 27.8],
    [-113.5, 26.7], [-112.0, 24.6], [-110.2, 23.5],
    [-109.9, 22.9], // Cabo San Lucas (Tip of Baja)
    // Baja California Peninsula (Sea of Cortez / Gulf Side)
    [-109.4, 23.4], [-110.3, 24.2], [-111.3, 26.0], [-112.3, 27.3],
    [-113.5, 28.9], [-114.8, 31.0],
    [-114.8, 31.8], // Colorado River Delta (Top of Sea of Cortez)
    // Mexican Pacific Coast
    [-113.0, 30.0], [-110.9, 27.9], [-109.0, 25.6], [-106.4, 23.2],
    [-105.7, 20.5], [-104.3, 19.0], [-101.5, 17.0], [-99.9, 16.8], // Acapulco
    [-96.5, 15.8], [-95.0, 16.0], [-93.0, 15.0],
    // Central America (Pacific Side)
    [-91.0, 14.0], [-89.0, 13.5], [-87.7, 13.1], [-85.5, 9.8],
    [-83.5, 8.4], [-80.5, 7.3], // Panama Azuero Peninsula
    [-79.5, 8.5], [-78.0, 8.0], [-77.4, 8.4], // Darien Gap / Colombia border
    // Central America (Caribbean Side)
    [-78.5, 9.5], [-79.9, 9.4], [-82.5, 9.5], [-83.5, 10.0], // Costa Rica
    [-83.5, 12.5], [-83.1, 15.0], [-85.5, 15.8], [-88.0, 15.8], // Honduras
    [-88.3, 18.5], // Belize
    // Yucatan Peninsula
    [-88.0, 18.5], [-86.9, 20.4], [-86.8, 21.2], // Cancun / Cozumel
    [-88.5, 21.6], [-90.4, 21.6], [-90.5, 19.8], [-92.0, 18.7], // Campeche / Tabasco
    // Mexican Gulf Coast & Texas
    [-94.5, 18.1], [-96.1, 19.2], [-97.8, 22.2], // Veracruz & Tampico
    [-97.8, 25.5], [-97.2, 25.9], // Brownsville / Rio Grande
    [-97.3, 26.5], [-97.2, 27.8], // Corpus Christi Bay
    [-96.0, 28.6], [-94.8, 29.3], // Galveston / Houston
    [-93.9, 29.7], // Sabine Pass (Texas/Louisiana border)
    [-91.5, 29.5], [-90.0, 29.3],
    [-89.3, 29.1], // Mississippi River Bird-Foot Delta
    [-88.0, 30.2], // Mobile Bay, Alabama
    [-87.2, 30.4], [-85.7, 30.2], [-85.3, 29.7], // Florida Panhandle (Apalachicola)
    // Florida Peninsula (West Coast)
    [-84.2, 30.0], [-83.0, 29.2], [-82.6, 27.8], // Tampa Bay
    [-82.1, 26.6], [-81.8, 26.0], // Fort Myers / Naples
    [-81.1, 25.1], // Cape Sable (Everglades)
    [-81.8, 24.5], [-80.8, 24.9], [-80.3, 25.3], // Florida Keys
    // Florida Peninsula (East Coast)
    [-80.1, 25.8], // Miami & Fort Lauderdale
    [-80.0, 26.7], // West Palm Beach
    [-80.5, 28.4], // Cape Canaveral
    [-81.3, 29.9], [-81.4, 30.3], // Jacksonville / St. Johns River
    // US Southeast & Mid-Atlantic Coast
    [-81.1, 32.0], // Savannah, Georgia
    [-79.9, 32.8], // Charleston, South Carolina
    [-78.0, 33.8], // Cape Fear, North Carolina
    [-76.5, 34.6], // Cape Lookout
    [-75.5, 35.2], // Cape Hatteras & Outer Banks
    [-76.0, 36.8], [-76.0, 37.1], // Chesapeake Bay Entrance (Norfolk/Virginia Beach)
    [-75.5, 37.5], [-75.2, 39.0], // Delaware Bay Entrance
    [-74.9, 38.9], [-74.4, 39.4], // Atlantic City, New Jersey
    [-74.0, 40.5], // New York Bay / Sandy Hook
    // Long Island, New England & Maine
    [-73.0, 41.0], [-71.9, 41.0], // Long Island Sound & Montauk Point
    [-71.4, 41.5], // Rhode Island (Narragansett Bay)
    [-70.0, 41.8], [-70.2, 42.0], // Cape Cod & Provincetown hook
    [-70.9, 42.4], // Boston Harbor & Massachusetts Bay
    [-70.3, 43.6], // Portland, Maine
    [-68.3, 44.3], // Bar Harbor / Acadia
    [-66.0, 45.0], // Bay of Fundy (Maine/Canada border)
    // Maritime Canada & St. Lawrence
    [-63.5, 44.5], [-60.0, 46.0], // Nova Scotia (Halifax to Cape Breton)
    [-63.0, 46.5], [-65.0, 49.0], // New Brunswick / Gaspe Peninsula
    [-68.0, 48.5], [-71.0, 47.0], // St. Lawrence River
    [-68.0, 50.0], [-60.0, 50.2], [-56.5, 51.5], // Quebec North Shore
    // Labrador & Canadian Arctic
    [-56.0, 53.0], [-60.0, 58.0], [-64.0, 60.5], // Cape Chidley (Labrador)
    // Hudson Bay Coastline
    [-70.0, 62.0], [-79.0, 55.0], [-82.0, 51.2], // James Bay
    [-85.0, 54.5], [-92.0, 57.0], [-94.2, 58.8], // Churchill / West Hudson Bay
    [-94.0, 63.0], [-89.0, 65.0], [-84.0, 67.0], // Foxe Basin
    // Arctic Canada to Point Barrow
    [-95.0, 71.0], [-105.0, 69.0], [-115.0, 68.0], [-133.0, 69.0],
    [-141.0, 69.6], [-150.0, 70.5], [-156.8, 71.3], // Point Barrow, Alaska (Northernmost US point)
    [-160.0, 70.6], [-166.1, 68.9], [-166.8, 68.3], [-163.0, 66.9],
    [-168.1, 65.6], // Back to Bering Strait
  ],

  // -------------------------------------------------------------
  // 2. SOUTH AMERICA CONTINENT
  // -------------------------------------------------------------
  [
    [-77.4, 8.4], [-76.0, 9.0], [-74.8, 11.0], [-72.5, 12.0], // Colombia Caribbean
    [-71.5, 11.5], [-69.5, 12.0], [-66.0, 10.6], // Caracas, Venezuela
    [-63.0, 10.5], [-61.0, 9.5], // Orinoco River Delta
    [-58.5, 6.8], [-55.0, 6.0], [-52.0, 4.5], // Guyana, Suriname, French Guiana
    [-50.0, 1.5], [-48.5, -0.5], // Amazon River Estuary
    [-44.5, -2.5], [-40.0, -3.0], [-35.5, -5.2], // Northern Brazil
    [-34.8, -7.5], [-35.2, -9.0], // Cabo de São Roque / Recife / Natal (Easternmost tip of South America)
    [-37.0, -11.5], [-38.5, -13.0], // Salvador da Bahia
    [-40.0, -19.5], [-41.0, -22.0],
    [-43.2, -23.0], // Rio de Janeiro & Guanabara Bay
    [-46.3, -24.0], // Santos / São Paulo
    [-48.5, -28.0], [-52.0, -32.5], // Southern Brazil
    [-55.0, -35.0], // Uruguay (Montevideo / Punta del Este)
    [-58.0, -34.5], // Río de la Plata Estuary (Buenos Aires)
    [-60.0, -38.5], [-62.0, -40.5], // Bahia Blanca / Northern Patagonia
    [-64.0, -42.5], [-65.0, -43.5], // Península Valdés & Golfo San Jorge
    [-67.0, -47.0], [-68.5, -51.5], // Puerto Santa Cruz
    [-66.0, -54.0], [-68.5, -55.0], // Tierra del Fuego / Ushuaia / Cape Horn
    // Pacific Coast (Chile, Peru, Ecuador)
    [-73.5, -53.0], [-75.0, -48.0], [-74.0, -44.0], // Chilean Fjords
    [-73.0, -40.0], [-72.0, -36.0], [-71.5, -33.0], // Valparaíso / Santiago
    [-71.0, -28.0], [-70.5, -23.5], // Antofagasta
    [-70.2, -18.5], // Arica (Chile/Peru border bend)
    [-76.0, -14.0], [-77.2, -12.1], // Lima & Callao, Peru
    [-81.3, -4.5], // Punta Pariñas (Westernmost tip of South America)
    [-80.0, -2.5], // Gulf of Guayaquil, Ecuador
    [-80.5, -0.5], [-79.0, 1.5], [-77.5, 5.0], [-77.4, 8.4],
  ],

  // -------------------------------------------------------------
  // 3. AFRICA CONTINENT (Complete anatomical contours)
  // -------------------------------------------------------------
  [
    [-5.8, 35.8], // Strait of Gibraltar (Tangier, Morocco)
    [-5.3, 35.6], [-0.6, 35.7], [3.0, 36.8], [7.7, 36.9], // Algeria (Oran, Algiers, Annaba)
    [9.8, 37.3], // Cap Blanc / Bizerte, Tunisia (Northernmost point of Africa)
    [11.0, 37.1], [10.6, 35.8], [10.7, 34.7], [10.1, 33.9], // Gulf of Gabès & Djerba
    [13.2, 32.9], [15.1, 32.4], [17.5, 31.2], // Tripoli & Gulf of Sirte, Libya
    [20.0, 32.1], [22.6, 32.8], [24.0, 32.1], // Cyrenaica Bulge & Tobruk
    [25.1, 31.5], [27.2, 31.4], [29.9, 31.2], // Alexandria, Egypt
    [30.4, 31.5], [31.8, 31.4], [32.3, 31.3], // Nile Delta & Port Said
    [34.2, 31.3], // Sinai Mediterranean (Rafah)
    // Sinai Peninsula & Red Sea
    [34.9, 29.5], [34.3, 27.9], // Gulf of Aqaba & Sharm El Sheikh
    [34.2, 27.7], [33.6, 28.2], [32.5, 29.9], // Gulf of Suez
    [32.3, 29.6], [33.8, 27.2], [34.9, 25.1], [35.5, 23.9], // Hurghada & Marsa Alam
    [36.6, 22.2], [37.2, 19.6], [37.9, 18.4], // Sudan Red Sea Coast (Port Sudan)
    [39.5, 15.6], [42.7, 13.0], [43.3, 12.6], // Bab-el-Mandeb Strait (Djibouti)
    // Gulf of Aden & Horn of Africa
    [43.5, 11.3], [45.0, 10.4], [49.2, 11.3],
    [51.2, 11.8], // Cape Guardafui / Ras Asir (Easternmost spear tip of Africa)
    [51.4, 10.4], // Ras Hafun (Easternmost point of continental Africa)
    [49.8, 7.9], [48.5, 5.3], [45.3, 2.0], // Somalia Coast & Mogadishu
    [42.5, -0.4], [40.9, -2.3], [39.7, -4.0], // Kenya (Lamu & Mombasa)
    [39.3, -6.8], [39.5, -8.9], [40.2, -10.3], // Tanzania (Dar es Salaam)
    [40.6, -10.7], [40.5, -13.0], [40.7, -15.0], [39.9, -16.2], // Mozambique
    [36.9, -17.9], [34.8, -19.8], [35.4, -23.9], // Beira & Inhambane
    [33.7, -25.0], [32.6, -26.0], // Maputo
    [32.1, -28.8], [31.0, -29.9], // Durban, South Africa
    [27.9, -33.0], [25.6, -33.9], [24.8, -34.2], // Port Elizabeth
    [20.0, -34.8], // Cape Agulhas (Southernmost tip of African continent)
    [18.5, -34.35], // Cape Point / Cape of Good Hope
    [18.4, -33.9], // Cape Town & Table Bay
    [18.0, -33.0], [18.3, -32.1], [16.5, -28.6], // Western South Africa
    [15.2, -26.6], [14.5, -22.9], [12.8, -19.0], [11.8, -17.3], // Namibia (Skeleton Coast)
    [12.1, -15.2], [13.5, -12.6], [13.2, -8.8], // Luanda, Angola
    [12.3, -6.1], // Congo River Mouth
    [11.8, -4.8], [8.7, -0.7], [9.4, 0.4], // Gabon & Cape Lopez
    [9.8, 1.9], [9.2, 4.0], // Cameroon (Mount Cameroon & Douala)
    [8.3, 4.9], [7.1, 4.4], [6.0, 4.3], // Niger Delta Cape Formosa
    [5.3, 5.4], [3.4, 6.4], // Lagos, Nigeria
    [2.4, 6.4], [1.2, 6.1], [-0.2, 5.5], // Benin, Togo, Ghana (Accra)
    [-2.1, 4.7], [-4.0, 5.3], [-6.6, 4.7], // Ivory Coast
    [-7.7, 4.4], // Cape Palmas (Liberia)
    [-10.8, 6.3], // Monrovia
    [-13.3, 8.5], // Freetown (Sierra Leone)
    [-13.7, 9.5], [-14.5, 10.7], // Guinea
    [-15.8, 11.8], [-16.2, 12.3], // Guinea-Bissau
    [-16.6, 13.5], // The Gambia
    [-17.5, 14.7], // Cap-Vert (Dakar, Senegal - Westernmost tip of Africa)
    [-16.5, 16.0], [-16.0, 18.1], [-17.0, 20.8], // Mauritania
    [-15.9, 23.7], [-14.5, 26.1], [-13.2, 27.2], // Western Sahara
    [-12.9, 27.9], [-10.2, 29.4], [-9.6, 30.4], // Agadir, Morocco
    [-9.8, 31.5], [-8.5, 33.2], [-7.6, 33.6], [-6.8, 34.0], // Casablanca & Rabat
    [-6.1, 35.2], [-5.8, 35.8], // Back to Tangier
  ],

  // -------------------------------------------------------------
  // 4. EURASIA CONTINENT (Western Europe to Russian Far East)
  // -------------------------------------------------------------
  [
    // Iberian Peninsula & France
    [-9.0, 43.0], [-8.5, 43.5], [-4.0, 43.5], [-1.8, 43.4], // Bay of Biscay (San Sebastian)
    [-1.2, 46.0], [-4.5, 48.3], // Brittany Peninsula (Brest)
    [-2.0, 49.5], [0.1, 49.5], [1.5, 50.5], // Normandy & Calais
    [3.5, 51.3], [4.5, 52.0], [5.5, 53.5], // Belgium & Netherlands
    [8.5, 54.0], [9.0, 56.5], [10.5, 57.7], // Jutland Peninsula, Denmark (Skagen)
    [10.0, 55.5], [12.0, 54.5], [14.5, 54.0], [19.0, 54.5], // Baltic Germany & Poland
    // Scandinavia (Sweden, Norway, Finland)
    [24.0, 65.5], [21.5, 63.5], [18.0, 59.5], // Stockholm
    [14.5, 55.5], [12.0, 57.5], [10.5, 59.5], // Oslo Fjord
    [7.5, 58.0], [5.2, 60.5], [5.0, 62.0], // Bergen & Norwegian Fjords
    [10.0, 64.0], [14.0, 68.0], [25.0, 71.0], [28.0, 71.2], // North Cape (Northernmost Europe)
    [32.0, 70.0], [38.0, 67.5], // Kola Peninsula
    // Arctic Coast of Russia
    [45.0, 68.5], [50.0, 68.0], [60.0, 69.5], [70.0, 71.0],
    [75.0, 73.0], [85.0, 74.0], [100.0, 76.5], // Taymyr Peninsula
    [115.0, 74.0], [130.0, 72.5], [150.0, 71.0], [170.0, 69.0],
    // Bering Strait & Kamchatka
    [171.0, 66.0], [178.0, 65.0], [170.0, 63.0], [163.0, 58.5],
    [157.0, 51.5], // Cape Lopatka (Kamchatka Tip)
    [156.0, 55.0], [150.0, 59.5], [142.0, 54.0], [137.0, 48.0], // Sea of Okhotsk
    [132.0, 43.0], // Vladivostok
    // Korean Peninsula
    [129.5, 38.0], [129.2, 35.5], [126.8, 34.3], [125.8, 38.0], // Korea
    // China Coastline
    [124.5, 39.8], [121.5, 38.8], [118.0, 39.0], // Bohai Sea
    [120.5, 36.0], // Qingdao / Shandong Peninsula
    [121.8, 31.5], // Shanghai & Yangtze River Delta
    [120.0, 27.5], [117.5, 24.0], [114.2, 22.3], // Hong Kong & Pearl River Delta
    [110.0, 21.0], [108.5, 21.5], // Leizhou Peninsula
    // Indochina & Southeast Asia
    [106.0, 19.5], [108.0, 16.0], [109.0, 12.0], [105.0, 9.0], // Vietnam Coast
    [103.0, 10.5], [100.5, 13.0], // Bangkok, Thailand
    [100.0, 8.0], [103.8, 1.3], // Singapore / Malay Peninsula Tip
    [99.0, 6.0], [98.5, 12.0], [96.0, 16.5], // Myanmar (Irrawaddy Delta)
    [93.0, 20.0], [91.0, 22.0], [89.0, 22.0], // Bangladesh / Ganges Delta
    // Indian Subcontinent (True Triangular Shape)
    [87.0, 21.5], [83.0, 18.0], [80.3, 13.1], // Chennai / Coromandel Coast
    [77.5, 8.1], // Kanyakumari / Cape Comorin (Southernmost tip of India)
    [75.0, 12.5], [72.8, 19.0], // Mumbai / Konkan Coast
    [70.0, 21.0], [69.0, 22.5], // Kathiawar / Gujarat Peninsula
    [67.0, 24.8], // Karachi & Indus River Delta, Pakistan
    // Arabian Sea & Persian Gulf
    [62.0, 25.2], [57.0, 25.8], // Strait of Hormuz
    [50.0, 26.5], [48.0, 29.8], // Kuwait & Tigris-Euphrates River Mouth
    [50.5, 26.0], [51.5, 25.3], // Qatar Peninsula
    [56.0, 24.0], [59.8, 22.5], // Oman (Ras al Hadd)
    [54.0, 17.0], [49.0, 14.5], [45.0, 12.8], // Yemen (Aden)
    // Red Sea Arabian Coast
    [43.0, 13.5], [41.0, 18.0], [38.5, 23.0], [35.0, 28.0],
    // Levant & Mediterranean Turkey
    [34.5, 31.5], [35.5, 34.0], [36.0, 36.5], // Lebanon & Syria
    [34.0, 36.5], [30.5, 36.8], [27.5, 37.0], // Antalya & Aegean Turkey
    [26.2, 39.5], [26.5, 41.0], // Dardanelles & Gallipoli
    // Greece & Balkan Coast
    [24.0, 40.5], [23.5, 38.0], // Athens
    [22.5, 36.5], [21.5, 38.0], // Peloponnese Peninsula
    [20.0, 39.5], [19.0, 42.0], [15.0, 44.5], [13.5, 45.5], // Adriatic Coast (Croatia, Venice)
    // Italian Peninsula (The Boot, Toe & Heel)
    [12.5, 45.0], // Po River Delta
    [14.0, 42.0], [18.5, 40.2], // Puglia / Heel of Italy
    [17.0, 39.8], // Gulf of Taranto (Arch of the Boot)
    [16.0, 38.5], [15.6, 38.2], // Reggio Calabria (Toe of the Boot)
    [14.2, 40.8], // Naples
    [12.5, 41.8], // Rome
    [10.0, 43.8], [9.0, 44.4], // Genoa / Liguria
    [5.5, 43.2], [3.5, 43.5], // French Riviera (Marseille)
    // Spain (Mediterranean & Atlantic Coast)
    [2.2, 41.4], [0.0, 40.0], [-0.5, 38.5], [-2.5, 36.7], // Barcelona to Malaga
    [-5.4, 36.1], // Rock of Gibraltar
    [-7.0, 37.0], [-9.0, 37.0], // Algarve, Southern Portugal
    [-9.5, 38.7], // Lisbon & Cabo da Roca
    [-9.0, 41.5], [-9.0, 43.0], // Back to Galicia, Spain
  ],

  // -------------------------------------------------------------
  // 5. GREAT BRITAIN
  // -------------------------------------------------------------
  [
    [-5.7, 50.0], // Land's End, Cornwall
    [-3.5, 50.4], [-1.5, 50.7], [1.4, 51.2], // Dover & South Coast
    [1.7, 52.8], [0.3, 53.5], [0.0, 54.5], // East Anglia & Yorkshire
    [-1.5, 55.5], [-2.0, 57.5], [-3.0, 58.5], // Scotland East Coast
    [-4.5, 58.6], [-5.0, 57.5], [-5.5, 56.0], // Scotland West Coast
    [-4.5, 54.8], [-3.0, 53.5], // Liverpool Bay
    [-4.5, 53.0], [-5.3, 51.8], [-3.5, 51.4], // Wales (Cardigan Bay & Bristol Channel)
    [-5.0, 50.5], [-5.7, 50.0],
  ],

  // -------------------------------------------------------------
  // 6. IRELAND
  // -------------------------------------------------------------
  [
    [-6.0, 53.4], // Dublin
    [-6.0, 52.2], [-7.5, 51.5], [-9.8, 51.5], // Cork & Mizen Head
    [-10.4, 52.0], [-9.9, 52.8], [-9.5, 54.0], // Galway & West Coast
    [-8.5, 55.2], // Malin Head (Northernmost Ireland)
    [-5.8, 54.6], // Belfast
    [-6.0, 53.4],
  ],

  // -------------------------------------------------------------
  // 7. JAPANESE ARCHIPELAGO
  // -------------------------------------------------------------
  // Honshu, Shikoku & Kyushu
  [
    [130.5, 31.5], [131.5, 33.0], [134.0, 33.5], [135.5, 34.5], // Osaka Bay
    [139.7, 35.3], // Tokyo Bay
    [141.0, 37.5], [141.8, 40.5], [141.0, 41.5], // Northern Honshu
    [140.0, 41.0], [139.0, 37.5], [136.5, 36.5], // Sea of Japan Coast
    [133.0, 35.5], [131.0, 34.0], [129.8, 33.0], [130.5, 31.5],
  ],
  // Hokkaido
  [
    [140.5, 41.8], [143.5, 42.0], [145.5, 43.5], [144.5, 44.5],
    [142.0, 45.5], [141.0, 43.0], [140.5, 41.8],
  ],

  // -------------------------------------------------------------
  // 8. AUSTRALIA CONTINENT & TASMANIA
  // -------------------------------------------------------------
  // Continental Australia
  [
    [131.0, -12.2], // Darwin
    [136.0, -12.0], [137.0, -16.5], [141.5, -17.5], // Gulf of Carpentaria
    [142.5, -10.8], // Cape York (Northernmost point)
    [145.5, -15.0], [149.0, -20.5], [153.2, -27.5], // Brisbane
    [153.6, -28.5], // Cape Byron (Easternmost point)
    [151.2, -33.8], // Sydney
    [149.9, -37.5], [145.0, -38.5], // Melbourne & Port Phillip
    [140.5, -38.0], [138.5, -35.5], [136.0, -34.0], // Adelaide & Spencer Gulf
    [131.0, -31.5], [125.0, -32.5], [120.0, -34.0], // Great Australian Bight
    [115.0, -34.3], // Cape Leeuwin (SW corner)
    [115.8, -32.0], // Perth
    [114.0, -28.0], [113.5, -25.0], // Shark Bay
    [114.0, -21.8], // North West Cape
    [118.0, -20.0], [122.0, -17.5], // Broome
    [125.0, -14.5], [128.0, -14.8], [131.0, -12.2],
  ],
  // Tasmania
  [
    [145.0, -41.0], [148.0, -41.0], [148.2, -43.0], [146.5, -43.6], [144.8, -42.2], [145.0, -41.0],
  ],

  // -------------------------------------------------------------
  // 9. NEW ZEALAND
  // -------------------------------------------------------------
  // North Island
  [
    [173.0, -34.5], [175.0, -36.5], [178.0, -37.5], [177.0, -39.5],
    [175.5, -41.5], [174.5, -41.0], [174.8, -39.0], [173.0, -36.0], [173.0, -34.5],
  ],
  // South Island
  [
    [173.5, -41.0], [174.0, -42.0], [172.5, -44.0], [170.5, -46.0],
    [168.0, -46.5], [166.5, -45.5], [168.0, -43.5], [171.5, -41.5], [173.5, -41.0],
  ],

  // -------------------------------------------------------------
  // 10. MADAGASCAR
  // -------------------------------------------------------------
  [
    [49.3, -12.0], [50.5, -15.5], [49.5, -20.0], [47.5, -25.0],
    [45.5, -25.5], [43.5, -22.5], [44.0, -16.0], [47.0, -13.5], [49.3, -12.0],
  ],

  // -------------------------------------------------------------
  // 11. GREENLAND & ICELAND
  // -------------------------------------------------------------
  // Greenland
  [
    [-44.0, 60.0], [-38.0, 65.0], [-25.0, 71.0], [-18.0, 77.0],
    [-22.0, 82.0], [-40.0, 83.5], [-55.0, 82.0], [-68.0, 76.5],
    [-58.0, 71.0], [-52.0, 64.0], [-44.0, 60.0],
  ],
  // Iceland
  [
    [-24.0, 65.0], [-21.5, 66.5], [-14.5, 66.0], [-13.5, 65.0],
    [-17.0, 63.5], [-22.5, 64.0], [-24.0, 65.0],
  ],

  // -------------------------------------------------------------
  // 12. MAJOR ISLANDS: CUBA, TAIWAN, SICILY, SRI LANKA, INDONESIA & PHILIPPINES
  // -------------------------------------------------------------
  // Cuba
  [
    [-84.5, 21.8], [-82.0, 23.0], [-78.0, 22.5], [-74.5, 20.2],
    [-77.0, 19.8], [-80.5, 21.5], [-84.5, 21.8],
  ],
  // Hispaniola (Haiti & Dominican Republic)
  [
    [-74.0, 18.5], [-72.0, 19.8], [-68.5, 18.5], [-71.5, 17.6], [-74.0, 18.5],
  ],
  // Taiwan
  [
    [120.0, 22.0], [121.0, 22.5], [122.0, 25.0], [121.5, 25.3], [120.2, 23.5], [120.0, 22.0],
  ],
  // Sicily
  [
    [12.5, 38.0], [15.6, 38.2], [15.3, 36.6], [13.2, 37.0], [12.5, 38.0],
  ],
  // Sri Lanka
  [
    [80.0, 9.8], [81.8, 7.5], [80.5, 5.9], [79.8, 6.9], [80.0, 9.8],
  ],
  // Sumatra (Indonesia)
  [
    [95.3, 5.5], [99.0, 2.0], [105.0, -5.5], [104.0, -4.5], [100.0, -1.0], [96.0, 3.5], [95.3, 5.5],
  ],
  // Java (Indonesia)
  [
    [106.0, -6.0], [110.0, -7.0], [114.5, -8.5], [112.5, -8.5], [107.0, -7.5], [106.0, -6.0],
  ],
  // Borneo (Indonesia / Malaysia)
  [
    [109.5, 1.5], [117.0, 4.0], [119.0, 1.5], [116.0, -4.0], [111.0, -3.0], [109.0, -1.0], [109.5, 1.5],
  ],
  // Philippines (Luzon & Mindanao)
  [
    [120.5, 18.5], [122.5, 16.5], [124.0, 13.0], [121.0, 14.0], [120.0, 16.0], [120.5, 18.5],
  ],
  [
    [122.0, 7.5], [126.0, 7.5], [125.5, 6.0], [122.0, 6.5], [122.0, 7.5],
  ],

  // -------------------------------------------------------------
  // 13. ANTARCTICA CONTINENT
  // -------------------------------------------------------------
  [
    [-180.0, -72.0], [-150.0, -74.0], [-120.0, -73.0], [-90.0, -71.0],
    [-65.0, -64.0], [-57.0, -63.5], // Antarctic Peninsula reaching toward South America
    [-60.0, -74.0], [-30.0, -75.0], [0.0, -70.0], [30.0, -69.0],
    [60.0, -68.0], [90.0, -66.0], [120.0, -66.0], [150.0, -68.0],
    [170.0, -72.0], [180.0, -72.0],
    [180.0, -88.0], [-180.0, -88.0], [-180.0, -72.0],
  ],
];

/**
 * Cutout Inland Water Bodies (Lakes & Seas).
 * In procedural canvas and vector rendering, these are drawn with the ocean base color
 * to create recognizable interior features like the North American Great Lakes,
 * Black Sea, Caspian Sea, and Lake Victoria.
 */
export const INLAND_WATER_POLYGONS: LandPolygon[] = [
  // -------------------------------------------------------------
  // NORTH AMERICAN GREAT LAKES (Superior, Michigan, Huron, Erie, Ontario)
  // -------------------------------------------------------------
  // Lake Superior
  [
    [-92.1, 46.8], [-90.3, 47.7], [-89.2, 48.4], [-88.0, 48.8],
    [-86.4, 48.7], [-84.4, 46.5], [-86.6, 46.4], [-87.4, 46.5],
    [-88.0, 47.4], [-89.3, 46.9], [-90.8, 46.8], [-92.1, 46.8],
  ],
  // Lake Michigan & Lake Huron (Precisely sculpts the iconic Michigan mitten & thumb!)
  [
    [-87.0, 45.3], [-88.0, 44.5], [-87.9, 43.0], [-87.6, 41.9], // Chicago West Coast
    [-87.3, 41.6], [-86.5, 42.1], [-86.2, 43.0], [-86.4, 43.9], // Western Mitten Coast
    [-85.6, 45.0], [-84.7, 45.8], // Straits of Mackinac
    [-84.5, 45.6], [-83.4, 45.1],
    [-83.8, 43.7], [-83.0, 44.0], // Saginaw Bay (The Thumb of Michigan)
    [-82.4, 43.0], [-81.7, 43.7], [-81.7, 45.3], // Canadian side & Bruce Peninsula
    [-80.2, 44.5], [-80.0, 45.3], [-82.5, 45.9], [-84.0, 46.2], // Georgian Bay
    [-85.0, 45.8], [-87.0, 45.3],
  ],
  // Lake Erie
  [
    [-83.5, 41.7], [-82.7, 41.5], [-81.7, 41.5], [-80.1, 42.1],
    [-78.9, 42.9], // Buffalo, NY
    [-80.1, 42.6], [-81.8, 42.3], [-82.5, 42.0], [-83.1, 42.3], [-83.5, 41.7],
  ],
  // Lake Ontario
  [
    [-79.9, 43.3], [-79.4, 43.7], [-78.9, 43.9], [-76.5, 44.2], // Toronto / Kingston
    [-76.5, 43.5], [-77.6, 43.2], [-79.1, 43.3], [-79.9, 43.3], // Rochester / Niagara
  ],

  // -------------------------------------------------------------
  // BLACK SEA
  // -------------------------------------------------------------
  [
    [28.0, 42.0], [30.0, 46.5], [33.5, 45.0], [35.5, 45.0], // Crimea
    [37.5, 45.0], [41.5, 42.0], [41.0, 41.5], [35.0, 41.5],
    [31.0, 41.5], [28.5, 41.8], [28.0, 42.0],
  ],

  // -------------------------------------------------------------
  // CASPIAN SEA
  // -------------------------------------------------------------
  [
    [50.0, 47.0], [52.0, 45.5], [53.0, 41.0], [53.5, 37.0],
    [51.0, 36.8], [49.5, 39.0], [50.0, 40.5], // Baku Peninsula
    [48.0, 42.5], [47.5, 45.0], [50.0, 47.0],
  ],

  // -------------------------------------------------------------
  // LAKE VICTORIA (East Africa)
  // -------------------------------------------------------------
  [
    [31.5, -0.5], [33.0, -0.2], [34.2, -0.5], [34.0, -1.8],
    [33.0, -2.5], [32.0, -2.5], [31.6, -1.5], [31.5, -0.5],
  ],
];

/**
 * Draws ultra-accurate continents, coastlines, and inland lakes onto an HTML5 2D Canvas.
 * Incorporates:
 * 1. Midpoint quadratic spline smoothing (eliminates polygonal jaggedness).
 * 2. Multi-layer bathymetric shelf glow (shallow turquoise shelf around continents).
 * 3. Exact inland water cutouts (Great Lakes, Caspian, Black Sea, Lake Victoria).
 */
export function drawWorldPolygonsToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    landFill: string;
    landStroke: string;
    waterFill: string;
    strokeWidth?: number;
    showBathymetry?: boolean;
  }
) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  const strokeW = options.strokeWidth ?? 2.0;

  // Helper to trace smooth closed polygon using midpoint quadratic curves
  const traceSmoothPolygon = (poly: LandPolygon) => {
    if (poly.length < 3) return;
    const last = poly[poly.length - 1];
    const first = poly[0];
    const startX = (toX(last[0]) + toX(first[0])) / 2;
    const startY = (toY(last[1]) + toY(first[1])) / 2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    for (let i = 0; i < poly.length; i++) {
      const curr = poly[i];
      const next = poly[(i + 1) % poly.length];
      const currX = toX(curr[0]);
      const currY = toY(curr[1]);
      const nextX = toX(next[0]);
      const nextY = toY(next[1]);
      const midX = (currX + nextX) / 2;
      const midY = (currY + nextY) / 2;

      ctx.quadraticCurveTo(currX, currY, midX, midY);
    }
    ctx.closePath();
  };

  // 1. Bathymetric Shallow Water Glow (Subtle shelf aura around landmasses)
  if (options.showBathymetry !== false) {
    ctx.strokeStyle = options.landStroke;

    // Broad outer shelf
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = strokeW * 4.5;
    for (const poly of WORLD_LAND_POLYGONS) {
      traceSmoothPolygon(poly);
      ctx.stroke();
    }

    // Mid shelf
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = strokeW * 2.2;
    for (const poly of WORLD_LAND_POLYGONS) {
      traceSmoothPolygon(poly);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  // 2. Solid Land Fill & Shoreline Outline
  ctx.fillStyle = options.landFill;
  ctx.strokeStyle = options.landStroke;
  ctx.lineWidth = strokeW;

  for (const poly of WORLD_LAND_POLYGONS) {
    traceSmoothPolygon(poly);
    ctx.fill();
    ctx.stroke();
  }

  // 3. Inland Water Cutouts (Great Lakes, Caspian Sea, Black Sea, Lake Victoria)
  ctx.fillStyle = options.waterFill;
  ctx.strokeStyle = options.landStroke;
  ctx.lineWidth = strokeW * 0.75;

  for (const lake of INLAND_WATER_POLYGONS) {
    traceSmoothPolygon(lake);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Returns SVG path definitions for landmasses and lakes for 2D panoramic map views.
 */
export function getWorldSvgPath(viewBoxWidth: number = 1000, viewBoxHeight: number = 500): {
  landPath: string;
  lakesPath: string;
} {
  const toX = (lng: number) => ((lng + 180) / 360) * viewBoxWidth;
  const toY = (lat: number) => ((90 - lat) / 180) * viewBoxHeight;

  const polyToSmoothSvg = (poly: LandPolygon): string => {
    if (poly.length < 3) return '';
    const last = poly[poly.length - 1];
    const first = poly[0];
    const startX = (toX(last[0]) + toX(first[0])) / 2;
    const startY = (toY(last[1]) + toY(first[1])) / 2;

    let path = `M ${startX.toFixed(1)} ${startY.toFixed(1)} `;
    for (let i = 0; i < poly.length; i++) {
      const curr = poly[i];
      const next = poly[(i + 1) % poly.length];
      const currX = toX(curr[0]);
      const currY = toY(curr[1]);
      const nextX = toX(next[0]);
      const nextY = toY(next[1]);
      const midX = (currX + nextX) / 2;
      const midY = (currY + nextY) / 2;

      path += `Q ${currX.toFixed(1)} ${currY.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)} `;
    }
    path += 'Z ';
    return path;
  };

  let landPath = '';
  for (const poly of WORLD_LAND_POLYGONS) {
    landPath += polyToSmoothSvg(poly);
  }

  let lakesPath = '';
  for (const lake of INLAND_WATER_POLYGONS) {
    lakesPath += polyToSmoothSvg(lake);
  }

  return {
    landPath: landPath.trim(),
    lakesPath: lakesPath.trim(),
  };
}
