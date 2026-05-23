const storageKey = "btk.keto.entries.v1";
const goalKey = "btk.keto.goal.v1";
const syncCodeKey = "btk.keto.syncCode.v1";
const macroTargetsKey = "btk.keto.macroTargets.v1";
const weeklyCheckinsKey = "btk.keto.weeklyCheckins.v1";
const defaultMacroTargets = { proteinMin: 140, proteinMax: 140, fatMin: 140, fatMax: 150, carbsMin: 16, carbsMax: 16 };
const appVersion = "159";
const appDisplayVersion = `v1.0 beta · build ${appVersion}`;
let activeDate = "";
let supabaseClient = null;
let cloudSyncTimer = null;
let applyingRemoteData = false;

const electrolyteTargets = { sodiumMg: 4000, potassiumMg: 3500, magnesiumMg: 400 };

const electrolyteKeywords = {
  sodium: [
    "salt",
    "saltar",
    "saltat",
    "buljong",
    "seltin",
    "pansalt",
    "natrium",
    "feta",
    "fetaost",
    "halloumi",
    "bacon",
    "skinka",
    "lax",
    "sill",
    "kaviar",
    "kalamata",
    "oliver",
    "salami",
    "korv",
  ],
  potassium: [
    "kalium",
    "seltin",
    "pansalt",
    "avokado",
    "avocado",
    "spenat",
    "lax",
    "nötkött",
    "notkott",
    "nötfärs",
    "notfars",
    "köttfärs",
    "kottfars",
    "entrecote",
    "svamp",
    "champinjon",
    "tomat",
    "broccoli",
  ],
  magnesium: [
    "magnesium",
    "magnesiumglycinat",
    "magnesiumcitrat",
    "pumpakärnor",
    "pumpakarnor",
    "mandel",
    "spenat",
    "avokado",
    "avocado",
    "lax",
  ],
};

const symptomKeywords = ["huvudvärk", "huvudvark", "kramp", "yrsel", "trött", "trott", "seg", "orkeslös", "orkeslos", "hjärtklappning", "hjartklappning"];

const electrolyteSuggestions = {
  sodium: "natrium: buljong/salta maten, feta, halloumi, bacon, skinka, lax eller sill",
  potassium: "kalium: avokado, spenat, lax, nötkött, svamp, tomat eller broccoli",
  magnesium: "magnesium: pumpakärnor, mandel, spenat, avokado, lax eller tillskott",
};

const foodSignals = [
  { match: /(^|[^a-zåäö])(?:ägg|agg)(?:[^a-zåäö]|$)/i, quantity: /(\d+(?:[,.]\d+)?)\s*(?:st\s*)?(?:(?:stekta?|kokta?|pocherade?|äggröra|aggrora)\s+){0,3}(?:ägg|agg)/gi, kcal: 70, protein: 6.2, fat: 5, carbs: 0.5, sodiumMg: 70, potassiumMg: 65, magnesiumMg: 6, keto: 2 },
  { match: /makrill/i, kcal: 238, protein: 15, fat: 17.5, carbs: 4.9, sodiumMg: 550, potassiumMg: 250, magnesiumMg: 35, servingGrams: 125, keto: 2 },
  { match: /aioli/i, kcal: 105, protein: 0.2, fat: 11.5, carbs: 0.4, servingGrams: 15, mskGrams: 15, keto: 2 },
  { match: /hollandaise(?:sås|sas)?/i, kcal: 80, protein: 0.2, fat: 8.5, carbs: 0.5, servingGrams: 15, mskGrams: 15, keto: 2 },
  { match: /majonnäs|majonnas/i, kcal: 108, protein: 0.2, fat: 11.9, carbs: 0.2, servingGrams: 15, mskGrams: 15, tskGrams: 5, keto: 2 },
  { match: /pesto/i, kcal: 70, protein: 0.8, fat: 7, carbs: 1, servingGrams: 15, mskGrams: 15, keto: 1 },
  { match: /brie/i, kcal: 100, protein: 6, fat: 8, carbs: 0.1, servingGrams: 30, sliceGrams: 10, keto: 2 },
  { match: /cheddar/i, kcal: 120, protein: 7.5, fat: 10, carbs: 0.4, servingGrams: 30, sliceGrams: 10, keto: 2 },
  { match: /fetaost|feta/i, kcal: 80, protein: 4.3, fat: 6.4, carbs: 1.2, sodiumMg: 340, potassiumMg: 20, magnesiumMg: 6, servingGrams: 30, keto: 1 },
  { match: /gouda/i, kcal: 110, protein: 7.5, fat: 8.5, carbs: 0.7, servingGrams: 30, sliceGrams: 10, keto: 2 },
  { match: /(^|[^a-zåäö])ost(?:[a-zåäö]*)?|gruyere|parmesan/i, kcal: 120, protein: 7, fat: 10, carbs: 0.5, servingGrams: 30, sliceGrams: 10, keto: 2 },
  { match: /smör|smor/i, kcal: 75, protein: 0.1, fat: 8.2, carbs: 0.1, servingGrams: 10, mskGrams: 14, keto: 2 },
  { match: /grädde|gradde/i, kcal: 100, protein: 0.6, fat: 10, carbs: 0.9, servingGrams: 30, dlGrams: 100, mskGrams: 15, keto: 2 },
  { match: /baconlindad(?:e)?\s+(?:köttfärs|kottfars)?(?:bit|bitar|biff|biffar)/i, quantity: /(\d+(?:[,.]\d+)?)\s*(?:st\s*)?baconlindad(?:e)?\s+(?:köttfärs|kottfars)?(?:bit|bitar|biff|biffar)/gi, kcal: 220, protein: 16.5, fat: 17.5, carbs: 0.8, servingGrams: 100, keto: 2 },
  { match: /bacon/i, exclude: /baconlindad/i, quantity: [/(\d+(?:[,.]\d+)?)\s*(?:skivor?|st)\s*bacon/gi, /bacon\s*(?:ca\s*)?(\d+(?:[,.]\d+)?)\s*(?:skivor?|st)/gi], kcal: 55, protein: 3.5, fat: 4.5, carbs: 0.1, sodiumMg: 180, potassiumMg: 55, magnesiumMg: 3, servingGrams: 12, keto: 2 },
  { match: /bearnaise(?:sås|sas)?|bea|bea-?sås|bea-?sas|bearnie(?:sås|sas)?/i, quantity: [/(\d+(?:[,.]\d+)?)\s*msk\s*(?:bearnaise(?:sås|sas)?|bea|bea-?sås|bea-?sas|bearnie(?:sås|sas)?)/gi, /(?:bearnaise(?:sås|sas)?|bea|bea-?sås|bea-?sas|bearnie(?:sås|sas)?)\s*(?:ca|minst)?\s*(\d+(?:[,.]\d+)?)\s*msk/gi], kcal: 85, protein: 0.2, fat: 9, carbs: 0.4, keto: 2 },
  { match: /salami/i, kcal: 120, protein: 7, fat: 10, carbs: 0.5, servingGrams: 30, keto: 1 },
  { match: /hamburgare\s*90\s*g/i, kcal: 230, protein: 17, fat: 18, carbs: 0, keto: 2 },
  { match: /hamburgare\s*150\s*g/i, kcal: 385, protein: 28, fat: 30, carbs: 0, keto: 2 },
  { match: /grillkorv\s*85\s*%?\s*(?:kött|kott)?/i, kcal: 260, protein: 12, fat: 23, carbs: 2, servingGrams: 100, keto: 1 },
  { match: /korv\s*75\s*%?\s*(?:kött|kott)?/i, exclude: /falukorv/i, kcal: 250, protein: 11, fat: 22, carbs: 4, servingGrams: 100, keto: 0 },
  { match: /gräddfil\s*12\s*%|graddfil\s*12\s*%/i, kcal: 135, protein: 3, fat: 12, carbs: 3.5, servingGrams: 100, dlGrams: 100, mskGrams: 15, keto: 1 },
  { match: /cr[eèé]me\s*fraiche|creme\s*fraiche|cr[eèé]mefraiche|cremefraiche/i, kcal: 340, protein: 2.4, fat: 34, carbs: 2.8, servingGrams: 100, dlGrams: 100, mskGrams: 15, keto: 2 },
  { match: /grekisk\s+(?:yoghurt|youghurt|yogurt)(?:\s*10\s*%|\s*10\s*procent)?/i, kcal: 121, protein: 4.6, fat: 10, carbs: 3.2, servingGrams: 100, dlGrams: 100, keto: 1 },
  { match: /halloumi/i, kcal: 160, protein: 11, fat: 12.5, carbs: 1, sodiumMg: 650, potassiumMg: 50, magnesiumMg: 12, servingGrams: 50, keto: 1 },
  { match: /färskost|farskost|cream cheese/i, kcal: 252, protein: 4.5, fat: 25, carbs: 3, servingGrams: 100, mskGrams: 15, keto: 2 },
  { match: /keso|cottage cheese/i, kcal: 90, protein: 12, fat: 4, carbs: 2.7, servingGrams: 100, dlGrams: 100, keto: 1 },
  { match: /mozzarella/i, kcal: 150, protein: 10, fat: 11, carbs: 1.5, servingGrams: 60, keto: 2 },
  { match: /entrecote|entrecôte/i, kcal: 430, protein: 30, fat: 34, carbs: 0, servingGrams: 150, keto: 2 },
  { match: /oxfil[eé]/i, kcal: 170, protein: 26, fat: 7, carbs: 0, servingGrams: 100, keto: 2 },
  { match: /fläskfil[eé]|flaskfil[eé]/i, kcal: 120, protein: 22, fat: 3, carbs: 0, servingGrams: 100, keto: 1 },
  { match: /(?:benfria?\s*)?(?:fläsk|flask)?\s*kotlett(?:er|erna)?/i, kcal: 256, protein: 33.8, fat: 13.8, carbs: 0, servingGrams: 125, keto: 1 },
  { label: "Köttfärsbit", match: /köttfärs\s*(?:bit|bitar|biff|biffar)|kottfars\s*(?:bit|bitar|biff|biffar)/i, skipBefore: /baconlindad(?:e)?\s*$/i, quantity: /(\d+(?:[,.]\d+)?)\s*(?:st\s*)?(?:köttfärs\s*(?:bit|bitar|biff|biffar)|kottfars\s*(?:bit|bitar|biff|biffar))/gi, kcal: 196, protein: 15.2, fat: 14.4, carbs: 0, servingGrams: 80, keto: 2 },
  { match: /nötfärs|notfars|köttfärs|kottfars/i, skipBefore: /baconlindad(?:e)?\s*$/i, skipAfter: /^\s*(?:bit|bitar|biff|biffar)/i, kcal: 245, protein: 19, fat: 18, carbs: 0, servingGrams: 100, keto: 2 },
  { match: /kycklingfil[eé]|kyckling\s*\(?\s*fil[eé](?:\s+utan\s+skinn)?\s*\)?|kycklingbröst|kycklingbrost/i, kcal: 165, protein: 31, fat: 3.6, carbs: 0, potassiumMg: 256, magnesiumMg: 29, servingGrams: 100, keto: 1 },
  { label: "Tonfisk i vatten", match: /tonfisk(?:bitar)?\s+i\s+vatten|tonfisk.*vatten/i, quantity: [/(\d+(?:[,.]\d+)?)\s*(?:burkar?|st)\s*tonfisk(?:bitar)?\s+i\s+vatten/gi, /tonfisk(?:bitar)?\s+i\s+vatten\s*(\d+(?:[,.]\d+)?)\s*(?:burkar?|st)?/gi], kcal: 132, protein: 28.8, fat: 1.2, carbs: 0, sodiumMg: 470, potassiumMg: 300, magnesiumMg: 38, servingGrams: 120, keto: 1 },
  { match: /tonfisk/i, exclude: /tonfisk(?:bitar)?\s+i\s+vatten|tonfisk.*vatten/i, kcal: 116, protein: 26, fat: 1, carbs: 0, potassiumMg: 250, magnesiumMg: 32, servingGrams: 100, keto: 1 },
  { match: /torsk/i, kcal: 82, protein: 18, fat: 0.7, carbs: 0, servingGrams: 100, keto: 1 },
  { match: /leverpastej/i, kcal: 95, protein: 3, fat: 8, carbs: 2.5, servingGrams: 30, keto: 0 },
  { match: /blodpudding/i, kcal: 215, protein: 9, fat: 8, carbs: 27, servingGrams: 100, keto: -2 },
  { match: /cashewnötter\s*saltade|cashewnotter\s*saltade/i, kcal: 175, protein: 5.5, fat: 13, carbs: 9, servingGrams: 30, keto: -1 },
  { match: /cashewnötter\s*osaltade|cashewnotter\s*osaltade|cashewnötter|cashewnotter/i, exclude: /cashewnötter\s*saltade|cashewnotter\s*saltade/i, kcal: 175, protein: 5.5, fat: 13, carbs: 9, servingGrams: 30, keto: -1 },
  { match: /jordnötter\s*saltade|jordnotter\s*saltade|jordnötter|jordnotter/i, kcal: 180, protein: 8, fat: 15, carbs: 4.5, servingGrams: 30, keto: 0 },
  { match: /mandel/i, kcal: 180, protein: 6.3, fat: 15, carbs: 2.7, potassiumMg: 220, magnesiumMg: 80, servingGrams: 30, keto: 1 },
  { match: /pumpakärnor|pumpakarnor/i, kcal: 170, protein: 9, fat: 14, carbs: 3, potassiumMg: 240, magnesiumMg: 160, servingGrams: 30, keto: 1 },
  { match: /(?:\d+(?:[,.]\d+)?\s*glas\s*)?chianti\s*(?:\(?\s*\d+(?:[,.]\d+)?\s*x\s*15\s*cl\s*\)?)?|(?:\d+(?:[,.]\d+)?\s*x\s*)?15\s*cl\s*chianti/i, quantityFirst: true, quantity: [/(\d+(?:[,.]\d+)?)\s*glas\s*chianti/gi, /(\d+(?:[,.]\d+)?)\s*x\s*15\s*cl\s*chianti/gi, /chianti\s*\(?\s*(\d+(?:[,.]\d+)?)\s*x\s*15\s*cl\s*\)?/gi], kcal: 125, protein: 0, fat: 0, carbs: 3, alcohol: 113, keto: 0 },
  { match: /lätt\s*öl|latt\s*ol/i, kcal: 90, protein: 1, fat: 0, carbs: 10, alcohol: 28, keto: -1 },
  { match: /laxfilé\s*125\s*g|laxfile\s*125\s*g/i, kcal: 260, protein: 25, fat: 17, carbs: 0, potassiumMg: 450, magnesiumMg: 38, keto: 2 },
  { match: /avokado|avocado/i, kcal: 320, protein: 4, fat: 30, carbs: 4, sodiumMg: 14, potassiumMg: 970, magnesiumMg: 58, servingGrams: 200, keto: 2 },
  { match: /olivolja|olive oil/i, kcal: 120, protein: 0, fat: 13.5, carbs: 0, servingGrams: 15, mskGrams: 15, tskGrams: 5, keto: 2 },
  { match: /kalamata(?:oliver)?|oliver|oliv(?!olja)/i, kcal: 11, protein: 0.1, fat: 1.1, carbs: 0, sodiumMg: 52, keto: 1 },
  { match: /valnötter|valnotter|valnöt|valnot/i, kcal: 196, protein: 4.5, fat: 19.5, carbs: 4.2, sodiumMg: 1, potassiumMg: 132, magnesiumMg: 47, servingGrams: 30, keto: 1 },
  { match: /påläggsskinka|palaggsskinka|skinka|kalkonpålägg|kalkonpalagg|kycklingpålägg|kycklingpalagg/i, quantity: [/(\d+(?:[,.]\d+)?)\s*(?:skivor?|skiva|st)\s*(?:påläggsskinka|palaggsskinka|skinka|kalkonpålägg|kalkonpalagg|kycklingpålägg|kycklingpalagg)/gi, /(?:påläggsskinka|palaggsskinka|skinka|kalkonpålägg|kalkonpalagg|kycklingpålägg|kycklingpalagg)\s*(\d+(?:[,.]\d+)?)\s*(?:skivor?|skiva|st)/gi], kcal: 30, protein: 5, fat: 1, carbs: 0.3, sodiumMg: 250, potassiumMg: 70, magnesiumMg: 5, keto: 1 },
  { match: /kaviar/i, kcal: 18, protein: 0.4, fat: 1.6, carbs: 0.8, sodiumMg: 110, potassiumMg: 15, magnesiumMg: 2, servingGrams: 5, tskGrams: 5, mskGrams: 15, keto: 0 },
  { match: /collagen|kollagen/i, kcal: 55, protein: 13.7, fat: 0, carbs: 0, servingGrams: 15, mskGrams: 15, keto: 1 },
  { match: /pulled pork/i, kcal: 375, protein: 34, fat: 25, carbs: 3, servingGrams: 150, keto: 1 },
  { match: /falukorv/i, kcal: 260, protein: 10, fat: 23, carbs: 4, servingGrams: 100, sliceGrams: 20, keto: 0 },
  { match: /inlagd\s+sill|sill/i, kcal: 110, protein: 6, fat: 7, carbs: 4, sodiumMg: 550, potassiumMg: 80, magnesiumMg: 14, servingGrams: 50, keto: 0 },
  { match: /gräddfil|graddfil/i, exclude: /gräddfil\s*12|graddfil\s*12/i, kcal: 70, protein: 1.5, fat: 6, carbs: 2, servingGrams: 50, dlGrams: 100, mskGrams: 15, keto: 1 },
  { match: /yoghurt|youghurt|yogurt/i, exclude: /grekisk\s+(?:yoghurt|youghurt|yogurt)/i, kcal: 56, protein: 3.5, fat: 3, carbs: 3.7, servingGrams: 100, dlGrams: 100, keto: -1 },
  { match: /röda?\s+vinbär|roda?\s+vinbar|vinbär|vinbar/i, kcal: 45, protein: 0.8, fat: 0.4, carbs: 8, servingGrams: 100, berryGrams: 0.5, keto: -1 },
  { match: /björnbär|bjornbar/i, kcal: 45, protein: 0.8, fat: 0.4, carbs: 8, servingGrams: 100, berryGrams: 5, keto: -1 },
  { match: /blåbär|blabar/i, kcal: 57, protein: 0.7, fat: 0.3, carbs: 12, servingGrams: 100, berryGrams: 1, keto: -1 },
  { match: /hjortron/i, kcal: 51, protein: 1.6, fat: 0.8, carbs: 8.6, servingGrams: 100, berryGrams: 1, keto: -1 },
  { match: /bär|bar|jordgubb|hallon/i, exclude: /björnbär|bjornbar|röda?\s+vinbär|roda?\s+vinbar|vinbär|vinbar|blåbär|blabar|hjortron|jordgubb|hallon/i, kcal: 45, protein: 0.8, fat: 0.4, carbs: 8, servingGrams: 100, keto: -1 },
  { match: /äpple|apple/i, kcal: 70, protein: 0.3, fat: 0.2, carbs: 17, servingGrams: 135, keto: -2 },
  { match: /apelsin/i, kcal: 62, protein: 1.2, fat: 0.2, carbs: 15, servingGrams: 130, keto: -2 },
  { match: /spetskål|spetskal/i, kcal: 30, protein: 1.5, fat: 0.2, carbs: 5, potassiumMg: 170, magnesiumMg: 12, servingGrams: 100, keto: 1 },
  { match: /broccoli/i, kcal: 35, protein: 3, fat: 0.4, carbs: 4, potassiumMg: 300, magnesiumMg: 20, servingGrams: 100, keto: 1 },
  { match: /blomkål|blomkal/i, kcal: 25, protein: 2, fat: 0.3, carbs: 3, servingGrams: 100, keto: 1 },
  { match: /vitkål|vitkal/i, kcal: 30, protein: 1.5, fat: 0.2, carbs: 5, servingGrams: 100, keto: 1 },
  { match: /zucchini/i, kcal: 17, protein: 1.2, fat: 0.3, carbs: 3, servingGrams: 100, keto: 1 },
  { match: /sparris/i, kcal: 20, protein: 2.2, fat: 0.1, carbs: 2, servingGrams: 100, keto: 1 },
  { match: /svamp|champinjon/i, kcal: 22, protein: 3, fat: 0.3, carbs: 3, potassiumMg: 320, magnesiumMg: 9, servingGrams: 100, keto: 1 },
  { match: /spenat/i, kcal: 23, protein: 2.9, fat: 0.4, carbs: 1.4, potassiumMg: 560, magnesiumMg: 79, servingGrams: 100, keto: 1 },
  { match: /bladgrönt|bladgront|sallad|ruccola/i, kcal: 20, protein: 2, fat: 0.3, carbs: 1.5, servingGrams: 100, keto: 1 },
  { match: /gurka/i, kcal: 15, protein: 0.7, fat: 0.1, carbs: 3, servingGrams: 100, keto: 1 },
  { match: /surkål|surkal|sauerkraut/i, kcal: 20, protein: 1, fat: 0.1, carbs: 2, servingGrams: 100, keto: 1 },
  { label: "Seltin", match: /(?:\d+(?:[,.]\d+)?\s*)?krm\s+seltin|seltin\s*(?:\d+(?:[,.]\d+)?\s*)?krm/i, quantity: [/(\d+(?:[,.]\d+)?)\s*krm\s+seltin/gi, /seltin\s*(\d+(?:[,.]\d+)?)\s*krm/gi], kcal: 0, protein: 0, fat: 0, carbs: 0, sodiumMg: 240, potassiumMg: 252, magnesiumMg: 12, keto: 1 },
  { label: "Seltin", match: /(?:\d+(?:[,.]\d+)?\s*)?tsk\s+seltin|seltin\s*(?:\d+(?:[,.]\d+)?\s*)?tsk/i, quantity: [/(\d+(?:[,.]\d+)?)\s*tsk\s+seltin/gi, /seltin\s*(\d+(?:[,.]\d+)?)\s*tsk/gi], kcal: 0, protein: 0, fat: 0, carbs: 0, sodiumMg: 1200, potassiumMg: 1260, magnesiumMg: 61, keto: 1 },
  { label: "Magnesiumtablett", match: /(?:mg-?\s*)?magnesium(?:tablett|tabletter|tillskott)?|mg-?tablett/i, quantity: [/(\d+(?:[,.]\d+)?)\s*(?:st\s*)?(?:tabletter?\s+)?magnesium(?:tabletter?|tillskott)?/gi, /(\d+(?:[,.]\d+)?)\s*(?:st\s*)?mg-?tabletter?/gi], kcal: 0, protein: 0, fat: 0, carbs: 0, magnesiumMg: 200, keto: 1 },
  { label: "Salt", match: /(?:\d+(?:[,.]\d+)?\s*)?krm\s+salt|salt\s*(?:\d+(?:[,.]\d+)?\s*)?krm/i, quantity: [/(\d+(?:[,.]\d+)?)\s*krm\s+salt/gi, /salt\s*(\d+(?:[,.]\d+)?)\s*krm/gi], kcal: 0, protein: 0, fat: 0, carbs: 0, sodiumMg: 460, keto: 1 },
  { label: "Salt", match: /(?:\d+(?:[,.]\d+)?\s*)?tsk\s+salt|salt\s*(?:\d+(?:[,.]\d+)?\s*)?tsk/i, quantity: [/(\d+(?:[,.]\d+)?)\s*tsk\s+salt/gi, /salt\s*(\d+(?:[,.]\d+)?)\s*tsk/gi], kcal: 0, protein: 0, fat: 0, carbs: 0, sodiumMg: 2300, keto: 1 },
  { match: /buljong(?:tärning|tarning)?|köttbuljong|kottbuljong/i, quantity: [/(\d+(?:[,.]\d+)?)\s*glas\s*(?:buljong|köttbuljong|kottbuljong)/gi, /(\d+(?:[,.]\d+)?)\s*(?:st\s*)?(?:buljong)?(?:tärningar?|tarningar?)/gi, /(?:buljong(?:tärning|tarning)?|köttbuljong|kottbuljong)\s*(\d+(?:[,.]\d+)?)\s*(?:st|tärningar?|tarningar?)?/gi], kcal: 32, protein: 0.7, fat: 2.2, carbs: 2.3, sodiumMg: 1100, keto: 1 },
  { match: /balsamico/i, kcal: 5, protein: 0, fat: 0, carbs: 1, servingGrams: 5, mskGrams: 15, keto: -1 },
  { match: /osötad\s+ketchup|osotad\s+ketchup|felix\s+(?:tomat)?ketchup\s+osötad|felix\s+(?:tomat)?ketchup\s+osotad/i, kcal: 7.5, protein: 0.2, fat: 0, carbs: 1.5, servingGrams: 15, mskGrams: 15, keto: 0 },
  { match: /ketchup/i, exclude: /osötad\s+ketchup|osotad\s+ketchup|felix\s+(?:tomat)?ketchup\s+osötad|felix\s+(?:tomat)?ketchup\s+osotad/i, kcal: 17, protein: 0.2, fat: 0, carbs: 4, servingGrams: 15, mskGrams: 15, keto: -1 },
  { match: /plommontomater?|plommon\s*tomater?/i, quantity: /(\d+(?:[,.]\d+)?)\s*(?:st\s*)?(?:plommontomater?|plommon\s*tomater?)/gi, kcal: 4, protein: 0.1, fat: 0, carbs: 0.8, servingGrams: 20, keto: -1 },
  { match: /tomat|tomatsås|tomatsas/i, exclude: /ketchup|makrill|plommontomat|plommon\s*tomat/i, kcal: 20, protein: 0.7, fat: 0.1, carbs: 4, servingGrams: 100, keto: -1 },
];

const electrolyteSignalUpdates = [
  { label: "Aioli", test: /aioli/, sodiumMg: 90, potassiumMg: 5, magnesiumMg: 1 },
  { label: "Bearnaise", test: /bearnaise|bearnie|bea/, sodiumMg: 72, potassiumMg: 4, magnesiumMg: 1 },
  { label: "Brie", test: /brie/, sodiumMg: 189, potassiumMg: 45, magnesiumMg: 6 },
  { label: "Cheddar", test: /cheddar/, sodiumMg: 195, potassiumMg: 30, magnesiumMg: 8 },
  { label: "Crème fraiche", test: /fraiche/, sodiumMg: 35, potassiumMg: 90, magnesiumMg: 8 },
  { label: "Fetaost", test: /fetaost|feta/, sodiumMg: 340, potassiumMg: 20, magnesiumMg: 6 },
  { label: "Färskost", test: /färskost|farskost|cream cheese/, sodiumMg: 380, potassiumMg: 130, magnesiumMg: 9 },
  { label: "Gouda", test: /gouda/, sodiumMg: 246, potassiumMg: 36, magnesiumMg: 9 },
  { label: "Grädde", test: /grädde|gradde/, sodiumMg: 9, potassiumMg: 23, magnesiumMg: 2 },
  { label: "Gräddfil", test: /gräddfil|graddfil/, sodiumMg: 40, potassiumMg: 120, magnesiumMg: 11 },
  { label: "Grekisk yoghurt 10%", test: /grekisk/, sodiumMg: 36, potassiumMg: 140, magnesiumMg: 11 },
  { label: "Hollandaise", test: /hollandaise/, sodiumMg: 68, potassiumMg: 4, magnesiumMg: 1 },
  { label: "Keso", test: /keso|cottage cheese/, sodiumMg: 360, potassiumMg: 100, magnesiumMg: 8 },
  { label: "Majonnäs", test: /majonn/, sodiumMg: 105, potassiumMg: 4, magnesiumMg: 0.5 },
  { label: "Mozzarella", test: /mozzarella/, sodiumMg: 318, potassiumMg: 48, magnesiumMg: 12 },
  { label: "Ost", test: /ost|gruyere|parmesan/, sodiumMg: 480, potassiumMg: 27, magnesiumMg: 13 },
  { label: "Olivolja", test: /olivolja|olive oil/, sodiumMg: 0, potassiumMg: 0, magnesiumMg: 0 },
  { label: "Pesto", test: /pesto/, sodiumMg: 105, potassiumMg: 17, magnesiumMg: 5 },
  { label: "Smör", test: /smör|smor/, sodiumMg: 1, potassiumMg: 3, magnesiumMg: 0 },
  { label: "Yoghurt", test: /yoghurt|youghurt|yogurt/, sodiumMg: 45, potassiumMg: 160, magnesiumMg: 13 },
  { label: "Baconlindad köttfärsbit", test: /baconlindad/, sodiumMg: 600, potassiumMg: 280, magnesiumMg: 18 },
  { label: "Benfri fläskkotlett", test: /kotlett/, sodiumMg: 81, potassiumMg: 475, magnesiumMg: 34 },
  { label: "Blodpudding", test: /blodpudding/, sodiumMg: 750, potassiumMg: 280, magnesiumMg: 28 },
  { label: "Collagen", test: /collagen|kollagen/, sodiumMg: 8, potassiumMg: 0, magnesiumMg: 0 },
  { label: "Entrecote", test: /entrecote|entrecôte/, sodiumMg: 90, potassiumMg: 480, magnesiumMg: 32 },
  { label: "Falukorv", test: /falukorv/, sodiumMg: 220, potassiumMg: 36, magnesiumMg: 3 },
  { label: "Fläskfilé", test: /fläskfil|flaskfil/, sodiumMg: 60, potassiumMg: 380, magnesiumMg: 28 },
  { label: "Grillkorv 85%", test: /grillkorv/, sodiumMg: 1050, potassiumMg: 180, magnesiumMg: 14 },
  { label: "Hamburgare", test: /hamburgare/, sodiumMg: 75, potassiumMg: 320, magnesiumMg: 22 },
  { label: "Kaviar", test: /kaviar/, sodiumMg: 90, potassiumMg: 10, magnesiumMg: 1 },
  { label: "Korv 75%", test: /korv/, sodiumMg: 1000, potassiumMg: 170, magnesiumMg: 13 },
  { label: "Kycklingfilé", test: /kyckling/, sodiumMg: 70, potassiumMg: 370, magnesiumMg: 28 },
  { label: "Köttfärsbit", exactLabel: "Köttfärsbit", test: /köttfärs|kottfars/, sodiumMg: 60, potassiumMg: 256, magnesiumMg: 18 },
  { label: "Köttfärs/nötfärs", test: /nötfärs|notfars|köttfärs|kottfars/, sodiumMg: 75, potassiumMg: 320, magnesiumMg: 22 },
  { label: "Laxfilé", test: /laxfil/, sodiumMg: 56, potassiumMg: 500, magnesiumMg: 38 },
  { label: "Leverpastej", test: /leverpastej/, sodiumMg: 255, potassiumMg: 54, magnesiumMg: 5 },
  { label: "Makrill", test: /makrill/, sodiumMg: 600, potassiumMg: 325, magnesiumMg: 38 },
  { label: "Oxfilé", test: /oxfil/, sodiumMg: 60, potassiumMg: 360, magnesiumMg: 24 },
  { label: "Pulled pork", test: /pulled pork/, sodiumMg: 900, potassiumMg: 480, magnesiumMg: 30 },
  { label: "Påläggsskinka", test: /påläggsskinka|palaggsskinka|skinka|kalkon|kycklingpålägg|kycklingpalagg/, sodiumMg: 220, potassiumMg: 56, magnesiumMg: 4 },
  { label: "Salami", test: /salami/, sodiumMg: 570, potassiumMg: 90, magnesiumMg: 5 },
  { label: "Tonfisk i vatten", test: /tonfisk.*vatten|vatten.*tonfisk/, sodiumMg: 384, potassiumMg: 288, magnesiumMg: 36 },
  { label: "Tonfisk", test: /tonfisk/, sodiumMg: 50, potassiumMg: 250, magnesiumMg: 50 },
  { label: "Torsk", test: /torsk/, sodiumMg: 80, potassiumMg: 380, magnesiumMg: 30 },
  { label: "Ägg", test: /ägg|agg/, sodiumMg: 75, potassiumMg: 80, magnesiumMg: 7 },
  { label: "Avokado", test: /avokado|avocado/, sodiumMg: 14, potassiumMg: 970, magnesiumMg: 58 },
  { label: "Balsamico", test: /balsamico/, sodiumMg: 1, potassiumMg: 6, magnesiumMg: 1 },
  { label: "Cashewnötter", test: /cashewn/, sodiumMg: 4, potassiumMg: 198, magnesiumMg: 87 },
  { label: "Broccoli", test: /broccoli/, sodiumMg: 30, potassiumMg: 320, magnesiumMg: 21 },
  { label: "Gurka", test: /gurka/, sodiumMg: 2, potassiumMg: 150, magnesiumMg: 13 },
  { label: "Jordnötter", test: /jordn/, sodiumMg: 5, potassiumMg: 210, magnesiumMg: 51 },
  { label: "Kalamataoliver", test: /kalamata|oliver|oliv/, sodiumMg: 64, potassiumMg: 0, magnesiumMg: 0 },
  { label: "Osötad ketchup", test: /osötad|osotad/, sodiumMg: 165, potassiumMg: 42, magnesiumMg: 2 },
  { label: "Ketchup", test: /ketchup/, sodiumMg: 165, potassiumMg: 42, magnesiumMg: 2 },
  { label: "Mandel", test: /mandel/, sodiumMg: 0, potassiumMg: 219, magnesiumMg: 81 },
  { label: "Plommontomat", test: /plommontomat|plommon\s*tomat/, sodiumMg: 1, potassiumMg: 48, magnesiumMg: 2 },
  { label: "Pumpakärnor", test: /pumpak/, sodiumMg: 2, potassiumMg: 243, magnesiumMg: 162 },
  { label: "Spenat", test: /spenat/, sodiumMg: 80, potassiumMg: 560, magnesiumMg: 80 },
  { label: "Spetskål", test: /spetskål|spetskal/, sodiumMg: 18, potassiumMg: 240, magnesiumMg: 15 },
  { label: "Surkål", test: /surkål|surkal|sauerkraut/, sodiumMg: 660, potassiumMg: 170, magnesiumMg: 13 },
  { label: "Svamp", test: /svamp|champinjon/, sodiumMg: 5, potassiumMg: 320, magnesiumMg: 9 },
  { label: "Tomat/tomatsås", test: /tomat|tomatsås|tomatsas/, sodiumMg: 5, potassiumMg: 240, magnesiumMg: 11 },
  { label: "Vitkål", test: /vitkål|vitkal/, sodiumMg: 18, potassiumMg: 240, magnesiumMg: 12 },
  { label: "Zucchini", test: /zucchini/, sodiumMg: 8, potassiumMg: 260, magnesiumMg: 18 },
  { label: "Björnbär", test: /björnbär|bjornbar/, sodiumMg: 0, potassiumMg: 8, magnesiumMg: 1 },
  { label: "Blåbär", test: /blåbär|blabar/, sodiumMg: 0, potassiumMg: 1, magnesiumMg: 0 },
  { label: "Hjortron", test: /hjortron/, sodiumMg: 0, potassiumMg: 1, magnesiumMg: 0 },
  { label: "Röda vinbär", test: /vinbär|vinbar/, sodiumMg: 0, potassiumMg: 1, magnesiumMg: 0 },
  { label: "Äpple", test: /äpple|apple/, sodiumMg: 1, potassiumMg: 149, magnesiumMg: 7 },
  { label: "Apelsin", test: /apelsin/, sodiumMg: 0, potassiumMg: 234, magnesiumMg: 13 },
  { label: "Chianti", test: /chianti/, sodiumMg: 8, potassiumMg: 191, magnesiumMg: 27 },
  { label: "Lättöl", test: /lätt|latt/, sodiumMg: 17, potassiumMg: 99, magnesiumMg: 20 },
  { label: "Buljong", test: /buljong/, sodiumMg: 1000, potassiumMg: 5, magnesiumMg: 1 },
];

const additionalFoodSignals = [
  { label: "Ghee", match: /ghee/i, kcal: 135, protein: 0, fat: 15, carbs: 0, sodiumMg: 0, potassiumMg: 1, magnesiumMg: 0, servingGrams: 15, mskGrams: 15, keto: 2 },
  { label: "Kokosolja", match: /kokosolja/i, kcal: 135, protein: 0, fat: 15, carbs: 0, sodiumMg: 0, potassiumMg: 0, magnesiumMg: 0, servingGrams: 15, mskGrams: 15, keto: 2 },
  { label: "MCT-olja", match: /mct-?olja/i, kcal: 120, protein: 0, fat: 13.5, carbs: 0, sodiumMg: 0, potassiumMg: 0, magnesiumMg: 0, servingGrams: 15, mskGrams: 15, keto: 2 },
  { label: "Tahini", match: /tahini|sesampasta/i, kcal: 89, protein: 2.6, fat: 8.1, carbs: 3.2, sodiumMg: 15, potassiumMg: 62, magnesiumMg: 14, servingGrams: 15, mskGrams: 15, keto: 0 },
  { label: "Kvarg", match: /kvarg|quark/i, kcal: 65, protein: 12, fat: 0.2, carbs: 4, sodiumMg: 35, potassiumMg: 150, magnesiumMg: 12, servingGrams: 100, dlGrams: 100, keto: 0 },
  { label: "Skyr", match: /skyr/i, kcal: 60, protein: 11, fat: 0.2, carbs: 4, sodiumMg: 50, potassiumMg: 150, magnesiumMg: 11, servingGrams: 100, dlGrams: 100, keto: 0 },
  { label: "Anka", match: /anka|ankbröst|ankbrost/i, kcal: 337, protein: 19, fat: 28, carbs: 0, sodiumMg: 75, potassiumMg: 270, magnesiumMg: 17, servingGrams: 100, keto: 2 },
  { label: "Ankfett/ister", match: /ankfett|ister/i, kcal: 135, protein: 0, fat: 15, carbs: 0, sodiumMg: 0, potassiumMg: 0, magnesiumMg: 0, servingGrams: 15, mskGrams: 15, keto: 2 },
  { label: "Ansjovis", match: /ansjovis/i, kcal: 11, protein: 1.5, fat: 0.5, carbs: 0, sodiumMg: 175, potassiumMg: 27, magnesiumMg: 2, servingGrams: 5, keto: 1 },
  { label: "Korv 100% kött", match: /korv\s*100\s*%|nötkorv|notkorv/i, kcal: 290, protein: 16, fat: 24, carbs: 0, sodiumMg: 950, potassiumMg: 230, magnesiumMg: 18, servingGrams: 100, keto: 1 },
  { label: "Lammfärs", match: /lammfärs|lammfars/i, kcal: 282, protein: 17, fat: 23, carbs: 0, sodiumMg: 67, potassiumMg: 280, magnesiumMg: 21, servingGrams: 100, keto: 2 },
  { label: "Lammkotlett", match: /lammkotlett/i, kcal: 294, protein: 25, fat: 21, carbs: 0, sodiumMg: 72, potassiumMg: 310, magnesiumMg: 26, servingGrams: 100, keto: 2 },
  { label: "Räkor", match: /räkor|rakor/i, kcal: 99, protein: 24, fat: 0.3, carbs: 0, sodiumMg: 280, potassiumMg: 264, magnesiumMg: 39, servingGrams: 100, keto: 1 },
  { label: "Sardiner i olja", match: /sardiner/i, kcal: 177, protein: 21.3, fat: 9.4, carbs: 0, sodiumMg: 434, potassiumMg: 337, magnesiumMg: 33, servingGrams: 85, keto: 2 },
  { label: "Stenbitsrom", match: /stenbitsrom/i, kcal: 17, protein: 2.1, fat: 0.9, carbs: 0, sodiumMg: 180, potassiumMg: 32, magnesiumMg: 5, servingGrams: 15, mskGrams: 15, keto: 1 },
  { label: "Löjrom", match: /löjrom|lojrom/i, kcal: 35, protein: 4.1, fat: 2.1, carbs: 0, sodiumMg: 225, potassiumMg: 35, magnesiumMg: 5, servingGrams: 15, mskGrams: 15, keto: 1 },
  { label: "Vilt/älg", match: /vilt|älg|alg|renkött|renkott|hjort|rådjur|radjur/i, kcal: 120, protein: 23, fat: 3, carbs: 0, sodiumMg: 70, potassiumMg: 350, magnesiumMg: 25, servingGrams: 100, keto: 2 },
  { label: "Hjärta", match: /hjärta|hjarta/i, kcal: 109, protein: 17, fat: 4, carbs: 0, sodiumMg: 110, potassiumMg: 280, magnesiumMg: 21, servingGrams: 100, keto: 1 },
  { label: "Lever", match: /kalvlever|kycklinglever|lever(?!pastej)/i, kcal: 140, protein: 18, fat: 5, carbs: 2, sodiumMg: 75, potassiumMg: 290, magnesiumMg: 19, servingGrams: 100, keto: 0 },
  { label: "Aubergine", match: /aubergine/i, kcal: 25, protein: 1, fat: 0.2, carbs: 6, sodiumMg: 2, potassiumMg: 230, magnesiumMg: 14, servingGrams: 100, keto: 0 },
  { label: "Brysselkål", match: /brysselkål|brysselkal/i, kcal: 43, protein: 3.4, fat: 0.3, carbs: 6, sodiumMg: 25, potassiumMg: 389, magnesiumMg: 23, servingGrams: 100, keto: 0 },
  { label: "Endive", match: /endive|cikoria|witlof/i, kcal: 17, protein: 1.2, fat: 0.2, carbs: 3, sodiumMg: 22, potassiumMg: 211, magnesiumMg: 10, servingGrams: 100, keto: 1 },
  { label: "Fänkål", match: /fänkål|fankal/i, kcal: 31, protein: 1.2, fat: 0.2, carbs: 5, sodiumMg: 52, potassiumMg: 414, magnesiumMg: 17, servingGrams: 100, keto: 0 },
  { label: "Grönkål", match: /grönkål|gronkal/i, kcal: 49, protein: 4.3, fat: 0.9, carbs: 4, sodiumMg: 38, potassiumMg: 491, magnesiumMg: 47, servingGrams: 100, keto: 1 },
  { label: "Mangold", match: /mangold/i, kcal: 19, protein: 1.8, fat: 0.2, carbs: 2, sodiumMg: 213, potassiumMg: 379, magnesiumMg: 81, servingGrams: 100, keto: 1 },
  { label: "Kålrot", match: /kålrot|kalrot/i, kcal: 38, protein: 1.1, fat: 0.2, carbs: 7, sodiumMg: 12, potassiumMg: 305, magnesiumMg: 20, servingGrams: 100, keto: -1 },
  { label: "Rättika/rädisor", match: /rättika|rattika|rädis|radis/i, kcal: 16, protein: 0.7, fat: 0.1, carbs: 2, sodiumMg: 39, potassiumMg: 233, magnesiumMg: 10, servingGrams: 100, keto: 1 },
  { label: "Selleristjälk", match: /selleri(?:stjälk|stjalk)?/i, kcal: 16, protein: 0.7, fat: 0.2, carbs: 3, sodiumMg: 80, potassiumMg: 260, magnesiumMg: 11, servingGrams: 100, keto: 1 },
  { label: "Chiafrön", match: /chiafrön|chiafron/i, kcal: 73, protein: 2.6, fat: 4.7, carbs: 6.3, sodiumMg: 2, potassiumMg: 61, magnesiumMg: 50, servingGrams: 15, mskGrams: 15, keto: 0 },
  { label: "Hampafrön", match: /hampafrön|hampafron/i, kcal: 83, protein: 4.8, fat: 7.4, carbs: 1.4, sodiumMg: 1, potassiumMg: 180, magnesiumMg: 105, servingGrams: 15, mskGrams: 15, keto: 1 },
  { label: "Hasselnötter", match: /hasselnötter|hasselnotter/i, kcal: 188, protein: 4.5, fat: 18.3, carbs: 5.1, sodiumMg: 0, potassiumMg: 204, magnesiumMg: 49, servingGrams: 30, keto: 1 },
  { label: "Linfrön", match: /linfrön|linfron/i, kcal: 80, protein: 2.7, fat: 6.3, carbs: 4.4, sodiumMg: 5, potassiumMg: 122, magnesiumMg: 59, servingGrams: 15, mskGrams: 15, tskGrams: 5, keto: 0 },
  { label: "Macadamia", match: /macadamia/i, kcal: 215, protein: 2.4, fat: 22.8, carbs: 4.2, sodiumMg: 2, potassiumMg: 111, magnesiumMg: 39, servingGrams: 30, keto: 1 },
  { label: "Paranötter", match: /paranötter|paranotter/i, kcal: 33, protein: 0.7, fat: 3.3, carbs: 0.6, sodiumMg: 0, potassiumMg: 33, magnesiumMg: 19, servingGrams: 5, keto: 1 },
  { label: "Pekannötter", match: /pekannötter|pekannotter/i, kcal: 207, protein: 2.7, fat: 21.6, carbs: 4.2, sodiumMg: 0, potassiumMg: 123, magnesiumMg: 36, servingGrams: 30, keto: 1 },
  { label: "Sesamfrön", match: /sesamfrön|sesamfron/i, kcal: 86, protein: 2.7, fat: 7.5, carbs: 3.5, sodiumMg: 2, potassiumMg: 70, magnesiumMg: 53, servingGrams: 15, mskGrams: 15, keto: 0 },
  { label: "Solrosfrön", match: /solrosfrön|solrosfron/i, kcal: 88, protein: 3.1, fat: 7.7, carbs: 3, sodiumMg: 1, potassiumMg: 97, magnesiumMg: 49, servingGrams: 15, mskGrams: 15, tskGrams: 5, keto: 0 },
  { label: "Hallon", match: /hallon/i, kcal: 52, protein: 1.2, fat: 0.7, carbs: 12, sodiumMg: 1, potassiumMg: 151, magnesiumMg: 22, servingGrams: 100, keto: -1 },
  { label: "Jordgubbar", match: /jordgubb/i, kcal: 32, protein: 0.7, fat: 0.3, carbs: 8, sodiumMg: 1, potassiumMg: 153, magnesiumMg: 13, servingGrams: 100, keto: -1 },
  { label: "Dijonsenap", match: /dijon|senap/i, kcal: 3, protein: 0.2, fat: 0.2, carbs: 0.3, sodiumMg: 85, potassiumMg: 7, magnesiumMg: 3, servingGrams: 5, tskGrams: 5, keto: 0 },
  { label: "Kapris", match: /kapris/i, kcal: 2, protein: 0.2, fat: 0.1, carbs: 0.5, sodiumMg: 296, potassiumMg: 4, magnesiumMg: 3, servingGrams: 10, mskGrams: 10, keto: 0 },
  { label: "Kimchi", match: /kimchi/i, kcal: 15, protein: 1.1, fat: 0.5, carbs: 2.4, sodiumMg: 670, potassiumMg: 222, magnesiumMg: 14, servingGrams: 100, keto: 1 },
  { label: "Pickles/cornichoner", match: /pickles|cornichon/i, kcal: 12, protein: 0.3, fat: 0.2, carbs: 2.3, sodiumMg: 1208, potassiumMg: 23, magnesiumMg: 4, servingGrams: 100, keto: 0 },
  { label: "Sojasås/tamari", match: /sojasås|sojasas|tamari/i, kcal: 9, protein: 1.2, fat: 0, carbs: 0.8, sodiumMg: 825, potassiumMg: 33, magnesiumMg: 6, servingGrams: 15, mskGrams: 15, keto: 0 },
  { label: "Champagne/cava", match: /champagne|cava|brut/i, kcal: 105, protein: 0.2, fat: 0, carbs: 2.3, sodiumMg: 9, potassiumMg: 75, magnesiumMg: 15, servingGrams: 150, keto: 0 },
  { label: "Rödvin torrt", match: /rödvin|rodvin|torrt vin/i, exclude: /chianti/i, kcal: 128, protein: 0.2, fat: 0, carbs: 3, sodiumMg: 6, potassiumMg: 191, magnesiumMg: 27, servingGrams: 150, keto: 0 },
  { label: "Vitt vin torrt", match: /vitt vin|vitvin/i, kcal: 123, protein: 0.2, fat: 0, carbs: 3.9, sodiumMg: 8, potassiumMg: 107, magnesiumMg: 15, servingGrams: 150, keto: 0 },
  { label: "Whisky/vodka/gin", match: /whisky|vodka|gin/i, kcal: 90, protein: 0, fat: 0, carbs: 0, sodiumMg: 0, potassiumMg: 1, magnesiumMg: 0, servingGrams: 40, keto: 0 },
  { label: "Mörk choklad 85%", match: /mörk choklad\s*85|mork choklad\s*85/i, kcal: 118, protein: 1.6, fat: 10, carbs: 5.6, sodiumMg: 5, potassiumMg: 143, magnesiumMg: 46, servingGrams: 20, keto: -1 },
  { label: "Mörk choklad 90%", match: /mörk choklad\s*90|mork choklad\s*90/i, kcal: 120, protein: 1.8, fat: 11, carbs: 4.8, sodiumMg: 4, potassiumMg: 150, magnesiumMg: 50, servingGrams: 20, keto: 0 },
  { label: "Vassleisolat", match: /vassleisolat|whey isolate/i, kcal: 108, protein: 27, fat: 0.3, carbs: 0.6, sodiumMg: 60, potassiumMg: 105, magnesiumMg: 12, servingGrams: 30, keto: 1 },
];

for (const signal of foodSignals) {
  const source = signal.match.source;
  const update = electrolyteSignalUpdates.find((candidate) =>
    candidate.exactLabel ? signal.label === candidate.exactLabel : candidate.test.test(source)
  );
  if (update) Object.assign(signal, update);
}
foodSignals.push(...additionalFoodSignals);

const form = document.querySelector("#entryForm");
const saveButton = document.querySelector("#saveButton");
const fields = {
  date: document.querySelector("#dateInput"),
  weight: document.querySelector("#weightInput"),
  sleep: document.querySelector("#sleepInput"),
  breakfast: document.querySelector("#breakfastInput"),
  lunch: document.querySelector("#lunchInput"),
  dinner: document.querySelector("#dinnerInput"),
  extras: document.querySelector("#extrasInput"),
  fat: document.querySelector("#fatInput"),
  protein: document.querySelector("#proteinInput"),
  carbs: document.querySelector("#carbsInput"),
  water: document.querySelector("#waterInput"),
  coffee: document.querySelector("#coffeeInput"),
  walk: document.querySelectorAll('input[name="walk"]'),
  bloodGlucose: document.querySelector("#bloodGlucoseInput"),
  ketones: document.querySelector("#ketonesInput"),
  notes: document.querySelector("#notesInput"),
};
const goalInput = document.querySelector("#goalInput");
const macroTargetInputs = {
  proteinMin: document.querySelector("#targetProteinMinInput"),
  proteinMax: document.querySelector("#targetProteinMaxInput"),
  fatMin: document.querySelector("#targetFatMinInput"),
  fatMax: document.querySelector("#targetFatMaxInput"),
  carbsMin: document.querySelector("#targetCarbsMinInput"),
  carbsMax: document.querySelector("#targetCarbsMaxInput"),
};
const syncCodeInput = document.querySelector("#syncCodeInput");
const syncStatus = document.querySelector("#syncStatus");
const quickSyncStatus = document.querySelector("#quickSyncStatus");
const saveSyncCodeButton = document.querySelector("#saveSyncCodeButton");
const clearSyncCodeButton = document.querySelector("#clearSyncCodeButton");
const syncNowButton = document.querySelector("#syncNowButton");
const quickSyncButton = document.querySelector("#quickSyncButton");
const reportButton = document.querySelector("#reportButton");
const weekReportButton = document.querySelector("#weekReportButton");
const weeklyCheckinButton = document.querySelector("#weeklyCheckinButton");
const saveWeeklyCheckinButton = document.querySelector("#saveWeeklyCheckinButton");
const weeklyCheckinPanel = document.querySelector("#weeklyCheckinPanel");
const weeklyCheckinStatus = document.querySelector("#weeklyCheckinStatus");
const weeklyCheckinInputs = {
  averageWeight: document.querySelector("#checkinAverageWeightInput"),
  waist: document.querySelector("#checkinWaistInput"),
  belly: document.querySelector("#checkinBellyInput"),
  bloodGlucose: document.querySelector("#checkinBloodGlucoseInput"),
  ketones: document.querySelector("#checkinKetonesInput"),
  energy: document.querySelector("#checkinEnergyInput"),
  craving: document.querySelector("#checkinCravingInput"),
  notes: document.querySelector("#checkinNotesInput"),
};
const printTrendButton = document.querySelector("#printTrendButton");
const saveTrendPngButton = document.querySelector("#saveTrendPngButton");
const trendModeInput = document.querySelector("#trendModeInput");
const trendStartWeekInput = document.querySelector("#trendStartWeekInput");
const trendEndWeekInput = document.querySelector("#trendEndWeekInput");
let autosaveTimer = null;

function stableAppUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function decimal(value) {
  return Number(value).toLocaleString("sv-SE", { maximumFractionDigits: 1 });
}

function decimalMeasure(value) {
  return Number(value).toLocaleString("sv-SE", { maximumFractionDigits: 2 });
}

function numberFromText(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(",", ".");
  const words = {
    en: 1,
    ett: 1,
    två: 2,
    tva: 2,
    tre: 3,
    fyra: 4,
    fem: 5,
    sex: 6,
    sju: 7,
    åtta: 8,
    atta: 8,
    nio: 9,
    tio: 10,
  };
  if (Object.prototype.hasOwnProperty.call(words, normalized)) return words[normalized];
  const fraction = normalized.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function todayIso() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
}

function nowStamp() {
  const now = new Date();
  const date = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
  const time = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });
  return `${date} kl. ${time}`;
}

function isoWeekInfo(dateText) {
  const [year, month, day] = String(dateText || todayIso()).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);
  const weekYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return { year: weekYear, week };
}

function isoDateFromUtc(date) {
  return date.toISOString().slice(0, 10);
}

function weekRange(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: isoDateFromUtc(monday), end: isoDateFromUtc(sunday) };
}

function weekInputFromDate(dateText) {
  const { year, week } = isoWeekInfo(dateText);
  return `${year}-${String(week).padStart(2, "0")}`;
}

function parseWeekInput(value) {
  const match = String(value || "").trim().match(/^(\d{4})\s*[- ]?\s*(?:v|vecka|w)?\s*(\d{1,2})$/i);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > 53) return null;
  return { year, week };
}

function emptyEntry(date = todayIso()) {
  return {
    date,
    weight: "",
    sleep: "",
    breakfast: "",
    lunch: "",
    dinner: "",
    extras: "",
    fat: "",
    protein: "",
    carbs: "",
    water: "",
    coffee: "",
    walk: "",
    bloodGlucose: "",
    ketones: "",
    notes: "",
  };
}

function getEntries() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [emptyEntry()];
  try {
    const stored = JSON.parse(raw);
    return Array.isArray(stored) ? stored : [emptyEntry()];
  } catch {
    return [emptyEntry()];
  }
}

function saveEntries(entries) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
  queueCloudSync();
}

function getWeeklyCheckins() {
  try {
    const stored = JSON.parse(localStorage.getItem(weeklyCheckinsKey) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function saveWeeklyCheckins(checkins) {
  localStorage.setItem(weeklyCheckinsKey, JSON.stringify(checkins || {}));
  queueCloudSync();
}

function currentWeekKey() {
  return weekInputFromDate(fields.date?.value || activeDate || todayIso());
}

function numberInputValue(input) {
  const value = input?.value?.trim() || "";
  return value ? Number(value) : "";
}

function weeklyAverageWeight(weekKey = currentWeekKey()) {
  const parsed = parseWeekInput(weekKey);
  if (!parsed) return null;
  const { entries } = entriesForWeek(parsed.year, parsed.week);
  return average(entries.map((entry) => (Number(entry.weight) > 0 ? Number(entry.weight) : NaN)));
}

function fillWeeklyCheckin(weekKey = currentWeekKey()) {
  const checkin = getWeeklyCheckins()[weekKey] || {};
  const averageWeight = weeklyAverageWeight(weekKey);
  if (weeklyCheckinInputs.averageWeight) weeklyCheckinInputs.averageWeight.value = averageWeight === null ? "" : decimal(averageWeight);
  if (weeklyCheckinInputs.waist) weeklyCheckinInputs.waist.value = checkin.waist ?? "";
  if (weeklyCheckinInputs.belly) weeklyCheckinInputs.belly.value = checkin.belly ?? "";
  if (weeklyCheckinInputs.bloodGlucose) weeklyCheckinInputs.bloodGlucose.value = checkin.bloodGlucose ?? "";
  if (weeklyCheckinInputs.ketones) weeklyCheckinInputs.ketones.value = checkin.ketones ?? "";
  if (weeklyCheckinInputs.energy) weeklyCheckinInputs.energy.value = checkin.energy ?? "";
  if (weeklyCheckinInputs.craving) weeklyCheckinInputs.craving.value = checkin.craving ?? "";
  if (weeklyCheckinInputs.notes) weeklyCheckinInputs.notes.value = checkin.notes ?? "";
  if (weeklyCheckinStatus) {
    const weightText = averageWeight === null ? " Ingen vikt registrerad ännu." : ` Medelvikt: ${decimal(averageWeight)} kg.`;
    weeklyCheckinStatus.textContent = `Veckoincheckning för vecka ${weekKey}.${weightText}`;
  }
}

function saveCurrentWeeklyCheckin() {
  const weekKey = currentWeekKey();
  const checkins = getWeeklyCheckins();
  checkins[weekKey] = {
    week: weekKey,
    waist: numberInputValue(weeklyCheckinInputs.waist),
    belly: numberInputValue(weeklyCheckinInputs.belly),
    bloodGlucose: numberInputValue(weeklyCheckinInputs.bloodGlucose),
    ketones: numberInputValue(weeklyCheckinInputs.ketones),
    energy: numberInputValue(weeklyCheckinInputs.energy),
    craving: numberInputValue(weeklyCheckinInputs.craving),
    notes: weeklyCheckinInputs.notes?.value?.trim() || "",
    savedAt: nowStamp(),
  };
  saveWeeklyCheckins(checkins);
  const averageWeight = weeklyAverageWeight(weekKey);
  if (weeklyCheckinStatus) {
    const weightText = averageWeight === null ? "" : ` Medelvikt: ${decimal(averageWeight)} kg.`;
    weeklyCheckinStatus.textContent = `Veckoincheckning sparad för vecka ${weekKey}.${weightText}`;
  }
  setSaveStatus(`Veckoincheckning sparad för vecka ${weekKey}`);
}

function getGoalWeight() {
  const goal = Number(localStorage.getItem(goalKey));
  return Number.isFinite(goal) && goal > 0 ? goal : null;
}

function saveGoalWeight(value) {
  const goal = Number(value);
  if (Number.isFinite(goal) && goal > 0) {
    localStorage.setItem(goalKey, String(goal));
    queueCloudSync();
    return goal;
  }
  localStorage.removeItem(goalKey);
  queueCloudSync();
  return null;
}

function normalizeMacroTargets(targets = {}) {
  const migrated = {
    ...targets,
    proteinMin: targets.proteinMin ?? targets.protein,
    proteinMax: targets.proteinMax ?? targets.protein,
    carbsMin: targets.carbsMin ?? targets.carbs,
    carbsMax: targets.carbsMax ?? targets.carbs,
  };
  const next = { ...defaultMacroTargets };
  for (const key of Object.keys(next)) {
    const value = Number(migrated[key]);
    if (Number.isFinite(value) && value > 0) next[key] = value;
  }
  if (next.proteinMax < next.proteinMin) {
    [next.proteinMin, next.proteinMax] = [next.proteinMax, next.proteinMin];
  }
  if (next.fatMax < next.fatMin) {
    [next.fatMin, next.fatMax] = [next.fatMax, next.fatMin];
  }
  if (next.carbsMax < next.carbsMin) {
    [next.carbsMin, next.carbsMax] = [next.carbsMax, next.carbsMin];
  }
  return next;
}

function getMacroTargets() {
  try {
    return normalizeMacroTargets(JSON.parse(localStorage.getItem(macroTargetsKey) || "{}"));
  } catch {
    return { ...defaultMacroTargets };
  }
}

function saveMacroTargets(targets) {
  const normalized = normalizeMacroTargets(targets);
  localStorage.setItem(macroTargetsKey, JSON.stringify(normalized));
  queueCloudSync();
  return normalized;
}

function macroKcalRange(targets = getMacroTargets()) {
  const min = targets.proteinMin * 4 + targets.fatMin * 9 + targets.carbsMin * 4;
  const max = targets.proteinMax * 4 + targets.fatMax * 9 + targets.carbsMax * 4;
  return { min, max };
}

function roundedKcal(value) {
  return Math.round(value / 10) * 10;
}

function fatEnergyShareLabel(targets, kcalRange) {
  const minShare = Math.round(((targets.fatMin * 9) / kcalRange.min) * 100);
  const maxShare = Math.round(((targets.fatMax * 9) / kcalRange.max) * 100);
  if (Number(targets.fatMin) === Number(targets.fatMax)) return `${minShare} %`;
  return minShare === maxShare ? `${minShare} %` : `${minShare}-${maxShare} %`;
}

function targetRangeLabel(min, max) {
  return Number(min) === Number(max) ? decimal(min) : `${decimal(min)}-${decimal(max)}`;
}

function hasEntryContent(entry) {
  return Object.entries(entry).some(([key, value]) => key !== "date" && value !== "" && value !== null && value !== undefined);
}

function findEntry(date) {
  return getEntries().find((entry) => entry.date === date);
}

function baselineWeight(entries) {
  const firstWeightedEntry = entries.find((entry) => Number(entry.weight) > 0);
  return firstWeightedEntry ? Number(firstWeightedEntry.weight) : null;
}

function mealText(entry) {
  return [entry.breakfast, entry.lunch, entry.dinner, entry.extras, entry.notes].filter(Boolean).join(" ");
}

function formEntry() {
  const entry = {};
  for (const [key, input] of Object.entries(fields)) {
    if (!input) continue;
    const value =
      input instanceof NodeList
        ? [...input].find((option) => option.checked)?.value || ""
        : input.value.trim();
    entry[key] = ["weight", "fat", "protein", "carbs", "bloodGlucose", "ketones"].includes(key) && value ? Number(value) : value;
  }
  entry.date ||= todayIso();
  return entry;
}

function measuredAmount(text, signal) {
  if (!signal.servingGrams) return null;
  const matcher = new RegExp(signal.match.source, signal.match.flags.includes("g") ? signal.match.flags : `${signal.match.flags}g`);
  let count = 0;
  const amounts = { g: 0, dl: 0, msk: 0, tsk: 0, skivor: 0 };
  for (const match of text.matchAll(matcher)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (shouldSkipSignalMatch(text, signal, start, end)) continue;
    const before = text.slice(Math.max(0, start - 24), start);
    const after = text.slice(end, Math.min(text.length, end + 24));
    if (signal.dlGrams) {
      const beforeDl = before.match(/(\d+(?:[,.]\d+)?)\s*dl(?:\s|[a-zåäö%])*$/i);
      const afterDl = after.match(/^(?:\s|[a-zåäö%]){0,18}(\d+(?:[,.]\d+)?)\s*dl/i);
      const dlAmount = beforeDl?.[1] || afterDl?.[1];
      if (dlAmount) {
        const dl = Number(dlAmount.replace(",", "."));
        if (Number.isFinite(dl) && dl > 0) {
          count += (dl * signal.dlGrams) / signal.servingGrams;
          amounts.dl += dl;
          continue;
        }
      }
    }
    if (signal.mskGrams) {
      const beforeMsk = before.match(/(\d+(?:[,.]\d+)?|\d+\s*\/\s*\d+)\s*msk(?:\s|[a-zåäö%])*$/i);
      const afterMsk = after.match(/^(?:\s|[a-zåäö%]){0,18}(\d+(?:[,.]\d+)?|\d+\s*\/\s*\d+)\s*msk/i);
      const mskAmount = beforeMsk?.[1] || afterMsk?.[1];
      if (mskAmount) {
        const msk = numberFromText(mskAmount);
        if (Number.isFinite(msk) && msk > 0) {
          count += (msk * signal.mskGrams) / signal.servingGrams;
          amounts.msk += msk;
          continue;
        }
      }
    }
    if (signal.tskGrams) {
      const beforeTsk = before.match(/(\d+(?:[,.]\d+)?|\d+\s*\/\s*\d+)\s*tsk(?:\s|[a-zåäö%])*$/i);
      const afterTsk = after.match(/^(?:\s|[a-zåäö%]){0,18}(\d+(?:[,.]\d+)?|\d+\s*\/\s*\d+)\s*tsk/i);
      const tskAmount = beforeTsk?.[1] || afterTsk?.[1];
      if (tskAmount) {
        const tsk = numberFromText(tskAmount);
        if (Number.isFinite(tsk) && tsk > 0) {
          count += (tsk * signal.tskGrams) / signal.servingGrams;
          amounts.tsk += tsk;
          continue;
        }
      }
    }
    if (signal.sliceGrams) {
      const beforeSlice = before.match(/(\d+(?:[,.]\d+)?|en|ett|två|tva|tre|fyra|fem|sex|sju|åtta|atta|nio|tio)\s*(?:[a-zåäö]*skivor?|[a-zåäö]*skiva)\s*$/i);
      const beforeNumber = before.match(/(\d+(?:[,.]\d+)?|en|ett|två|tva|tre|fyra|fem|sex|sju|åtta|atta|nio|tio)\s*$/i);
      const afterSlice = after.match(/^\s*s?(?:skivor?|skiva)/i);
      const sliceAmount = beforeSlice?.[1] || (afterSlice ? beforeNumber?.[1] : null);
      if (sliceAmount) {
        const slices = numberFromText(sliceAmount);
        if (Number.isFinite(slices) && slices > 0) {
          count += (slices * signal.sliceGrams) / signal.servingGrams;
          amounts.skivor += slices;
          continue;
        }
      }
    }
    const beforeAmount = before.match(/(\d+(?:[,.]\d+)?)\s*g(?:ram)?(?:\s|[a-zåäö%])*$/i);
    const afterAmount = after.match(/^(?:\s|[a-zåäö%]){0,18}(\d+(?:[,.]\d+)?)\s*g(?:ram)?/i);
    const amount = beforeAmount?.[1] || afterAmount?.[1];
    if (!amount) continue;
    const grams = Number(amount.replace(",", "."));
    if (Number.isFinite(grams) && grams > 0) {
      count += grams / signal.servingGrams;
      amounts.g += grams;
    }
  }
  if (count <= 0) return null;
  const measuredUnits = Object.entries(amounts).filter(([, value]) => value > 0);
  const amountLabel = measuredUnits.length === 1 ? `${decimalMeasure(measuredUnits[0][1])} ${measuredUnits[0][0]}` : null;
  return { count, amountLabel };
}

function shouldSkipSignalMatch(text, signal, start, end = start) {
  if (!signal.skipBefore && !signal.skipAfter) return false;
  const before = text.slice(Math.max(0, start - 32), start);
  const after = text.slice(end, Math.min(text.length, end + 32));
  return Boolean(signal.skipBefore?.test(before) || signal.skipAfter?.test(after));
}

function multiplierAmount(text, signal) {
  const matcher = new RegExp(signal.match.source, signal.match.flags.includes("g") ? signal.match.flags : `${signal.match.flags}g`);
  let count = 0;
  for (const match of text.matchAll(matcher)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (shouldSkipSignalMatch(text, signal, start, end)) continue;
    const before = text.slice(Math.max(0, start - 18), start);
    const after = text.slice(end, Math.min(text.length, end + 18));
    const beforeAmount = before.match(/(\d+(?:[,.]\d+)?|en|ett|två|tva|tre|fyra|fem|sex|sju|åtta|atta|nio|tio)\s*(?:x|st|stycken)?\s*$/i);
    const afterAmount = after.match(/^\s*(?:x|st|stycken)?\s*(\d+(?:[,.]\d+)?|en|ett|två|tva|tre|fyra|fem|sex|sju|åtta|atta|nio|tio)(?!\s*(?:g|gram|mg|dl|msk|%))/i);
    const amount = beforeAmount?.[1] || afterAmount?.[1];
    if (!amount) continue;
    const value = numberFromText(amount);
    if (Number.isFinite(value) && value > 0) {
      count += signal.berryGrams ? (value * signal.berryGrams) / signal.servingGrams : value;
    }
  }
  return count > 0 ? { count, amountLabel: null } : null;
}

function countSignal(text, signal) {
  if (signal.exclude?.test(text)) return { count: 0, amountLabel: null };
  if (signal.quantity) {
    const quantityPatterns = Array.isArray(signal.quantity) ? signal.quantity : [signal.quantity];
    const quantities = [];
    for (const pattern of quantityPatterns) {
      for (const match of text.matchAll(pattern)) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        if (shouldSkipSignalMatch(text, signal, start, end)) continue;
        const amount = match.find((part, index) => index > 0 && part);
        const value = Number(amount?.replace(",", "."));
        if (signal.quantityFirst && Number.isFinite(value) && value > 0) return { count: value, amountLabel: null };
        quantities.push(value);
      }
    }
    const total = quantities.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
    if (total > 0) return { count: total, amountLabel: null };
  }
  const measured = measuredAmount(text, signal);
  if (measured) return measured;
  const multiplier = multiplierAmount(text, signal);
  if (multiplier) return multiplier;
  const matcher = new RegExp(signal.match.source, "gi");
  const matches = [...text.matchAll(matcher)].filter((match) => {
    const start = match.index ?? 0;
    return !shouldSkipSignalMatch(text, signal, start, start + match[0].length);
  });
  return { count: matches.length, amountLabel: null };
}

function signalLabel(signal) {
  if (signal.label) return signal.label;
  const source = signal.match.source;
  const labels = [
    [/(^|[^a-zåäö])(?:ägg|agg)(?:[^a-zåäö]|$)/, "Ägg"],
    [/makrill/, "Makrill"],
    [/aioli/, "Aioli"],
    [/hollandaise/, "Hollandaise"],
    [/majonn/, "Majonnäs"],
    [/pesto/, "Pesto"],
    [/brie/, "Brie"],
    [/cheddar/, "Cheddar"],
    [/feta/, "Fetaost"],
    [/gouda/, "Gouda"],
    [/smör|smor/, "Smör"],
    [/grädde|gradde/, "Grädde"],
    [/baconlindad/, "Baconlindad köttfärsbit"],
    [/bacon/, "Bacon"],
    [/bearnaise|bearnie|bea/, "Bearnaise"],
    [/salami/, "Salami"],
    [/hamburgare/, "Hamburgare"],
    [/grillkorv/, "Grillkorv 85%"],
    [/falukorv/, "Falukorv"],
    [/korv/, "Korv 75%"],
    [/gräddfil|graddfil/, "Gräddfil"],
    [/fraiche/, "Crème fraiche"],
    [/grekisk/, "Grekisk yoghurt 10%"],
    [/halloumi/, "Halloumi"],
    [/färskost|farskost|cream cheese/, "Färskost"],
    [/keso|cottage cheese/, "Keso"],
    [/mozzarella/, "Mozzarella"],
    [/entrecote|entrecôte/, "Entrecote"],
    [/oxfil/, "Oxfilé"],
    [/fläskfil|flaskfil/, "Fläskfilé"],
    [/kotlett/, "Benfri fläskkotlett"],
    [/köttfärs\s*(?:bit|biff)|kottfars\s*(?:bit|biff)/, "Köttfärsbit"],
    [/nötfärs|notfars|köttfärs|kottfars/, "Köttfärs/nötfärs"],
    [/påläggsskinka|palaggsskinka|skinka|kalkon|kycklingpålägg|kycklingpalagg/, "Påläggsskinka"],
    [/kyckling/, "Kycklingfilé"],
    [/tonfisk.*vatten|vatten.*tonfisk/, "Tonfisk i vatten"],
    [/tonfisk/, "Tonfisk"],
    [/sill/, "Inlagd sill"],
    [/ost|gruyere|parmesan/, "Ost"],
    [/torsk/, "Torsk"],
    [/leverpastej/, "Leverpastej"],
    [/blodpudding/, "Blodpudding"],
    [/cashewn/, "Cashewnötter"],
    [/jordn/, "Jordnötter"],
    [/mandel/, "Mandel"],
    [/valnöt|valnot/, "Valnötter"],
    [/macadamia/, "Macadamia"],
    [/pumpak/, "Pumpakärnor"],
    [/chianti/, "Chianti"],
    [/lätt|latt/, "Lättöl"],
    [/laxfil/, "Laxfilé"],
    [/avokado|avocado/, "Avokado"],
    [/olivolja|olive oil/, "Olivolja"],
    [/kalamata|oliver|oliv/, "Kalamataoliver"],
    [/nötter|notter|valnöt|valnot|macadamia/, "Nötter"],
    [/pulled pork/, "Pulled pork"],
    [/kaviar/, "Kaviar"],
    [/collagen|kollagen/, "Collagen"],
    [/vinbär|vinbar/, "Röda vinbär"],
    [/björnbär|bjornbar/, "Björnbär"],
    [/blåbär|blabar/, "Blåbär"],
    [/hjortron/, "Hjortron"],
    [/yoghurt|youghurt|yogurt/, "Yoghurt"],
    [/bär|bar|jordgubb|hallon/, "Bär"],
    [/plommontomat|plommon\s*tomat/, "Plommontomat"],
    [/äpple|apple/, "Äpple"],
    [/apelsin/, "Apelsin"],
    [/spetskål|spetskal/, "Spetskål"],
    [/broccoli/, "Broccoli"],
    [/blomkål|blomkal/, "Blomkål"],
    [/vitkål|vitkal/, "Vitkål"],
    [/zucchini/, "Zucchini"],
    [/sparris/, "Sparris"],
    [/svamp|champinjon/, "Svamp"],
    [/spenat/, "Spenat"],
    [/bladgrönt|bladgront|sallad|ruccola/, "Bladgrönt"],
    [/gurka/, "Gurka"],
    [/surkål|surkal|sauerkraut/, "Surkål"],
    [/seltin/, "Seltin"],
    [/salt/, "Salt"],
    [/buljong/, "Buljong"],
    [/balsamico/, "Balsamico"],
    [/osötad|osotad/, "Osötad ketchup"],
    [/ketchup/, "Ketchup"],
    [/tomat|tomatsås|tomatsas/, "Tomat/tomatsås"],
  ];
  return labels.find(([pattern]) => pattern.test(source))?.[1] || "Okänd träff";
}

function estimateMacros(entry) {
  const manualFat = Number(entry.fat);
  const manualProtein = Number(entry.protein);
  const manualCarbs = Number(entry.carbs);
  const hasManualMacros = [manualFat, manualProtein, manualCarbs].some((value) => Number.isFinite(value) && value > 0);
  if (hasManualMacros) {
    const fat = Number.isFinite(manualFat) ? manualFat : 0;
    const protein = Number.isFinite(manualProtein) ? manualProtein : 0;
    const carbs = Number.isFinite(manualCarbs) ? manualCarbs : 0;
    const macroCalories = { protein: protein * 4, fat: fat * 9, carbs: carbs * 4 };
    const macroTotal = macroCalories.protein + macroCalories.fat + macroCalories.carbs || 1;
    return {
      kcal: Math.round(macroTotal),
      protein,
      fat,
      carbs,
      sodiumMg: 0,
      potassiumMg: 0,
      magnesiumMg: 0,
      score: 0,
      source: "manual",
      items: [],
      proteinPct: Math.round((macroCalories.protein / macroTotal) * 100),
      fatPct: Math.round((macroCalories.fat / macroTotal) * 100),
      carbPct: Math.round((macroCalories.carbs / macroTotal) * 100),
    };
  }

  const text = mealText(entry);
  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0, alcohol: 0, sodiumMg: 0, potassiumMg: 0, magnesiumMg: 0, score: 0 };
  const items = [];

  for (const signal of foodSignals) {
    const { count, amountLabel } = countSignal(text, signal);
    if (count > 0) {
      const item = {
        label: signalLabel(signal),
        count,
        amountLabel,
        kcal: signal.kcal * count,
        protein: signal.protein * count,
        fat: signal.fat * count,
        carbs: signal.carbs * count,
        sodiumMg: (signal.sodiumMg || 0) * count,
        potassiumMg: (signal.potassiumMg || 0) * count,
        magnesiumMg: (signal.magnesiumMg || 0) * count,
      };
      items.push(item);
      totals.kcal += item.kcal;
      totals.protein += item.protein;
      totals.fat += item.fat;
      totals.carbs += item.carbs;
      totals.alcohol += (signal.alcohol || 0) * count;
      totals.sodiumMg += item.sodiumMg;
      totals.potassiumMg += item.potassiumMg;
      totals.magnesiumMg += item.magnesiumMg;
      totals.score += signal.keto * count;
    }
  }

  if (totals.kcal === 0) {
    totals.kcal = 1;
  }

  const macroCalories = {
    protein: totals.protein * 4,
    fat: totals.fat * 9,
    carbs: totals.carbs * 4,
  };
  const macroTotal = macroCalories.protein + macroCalories.fat + macroCalories.carbs || 1;

  return {
    ...totals,
    items,
    source: "estimate",
    proteinPct: Math.round((macroCalories.protein / macroTotal) * 100),
    fatPct: Math.round((macroCalories.fat / macroTotal) * 100),
    carbPct: Math.round((macroCalories.carbs / macroTotal) * 100),
  };
}

function partialEntry(entry, keys) {
  const partial = emptyEntry(entry.date || todayIso());
  for (const key of keys) {
    partial[key] = entry[key] || "";
  }
  return partial;
}

function fullProtein(macros) {
  if (macros.source === "manual") return macros.protein || 0;
  return (macros.items || [])
    .filter((item) => item.label !== "Collagen")
    .reduce((sum, item) => sum + item.protein, 0);
}

function collagenProtein(macros) {
  if (macros.source === "manual") return 0;
  return (macros.items || [])
    .filter((item) => item.label === "Collagen")
    .reduce((sum, item) => sum + item.protein, 0);
}

function parseLiters(text = "") {
  const match = text.match(/(\d+(?:[,.]\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function hasKeywordSignal(text = "", keywords = []) {
  const normalized = ` ${String(text).toLowerCase()} `;
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function hasSymptomSignal(entry) {
  return hasKeywordSignal(entry.notes || "", symptomKeywords);
}

function hasElectrolyteSignal(text, type) {
  return hasKeywordSignal(text, electrolyteKeywords[type] || []);
}

function dinnerElectrolyteAdvice(macros, entry) {
  const sodiumGap = Math.max(0, electrolyteTargets.sodiumMg - (macros.sodiumMg || 0));
  const potassiumGap = Math.max(0, electrolyteTargets.potassiumMg - (macros.potassiumMg || 0));
  const magnesiumGap = Math.max(0, electrolyteTargets.magnesiumMg - (macros.magnesiumMg || 0));
  const liters = parseLiters(entry.water || "");
  const symptoms = hasSymptomSignal(entry);
  const advice = [];

  if (sodiumGap > 600 || symptoms || (Number.isFinite(liters) && liters < 1.5)) {
    advice.push("natrium: buljong eller salta maten");
  }
  if (potassiumGap >= 800) {
    advice.push("uppmärksamma kalium inför middagen: avokado, spenat, lax, svamp eller broccoli");
  }
  if (magnesiumGap >= 120) {
    advice.push("ta en magnesiumtablett om 200 mg");
  }

  return advice.length ? `Elektrolyter: ${advice.join("; ")}.` : "Elektrolyter: okej.";
}

function dinnerCompass(entry) {
  if (!entry.lunch?.trim()) {
    return null;
  }

  const targets = getMacroTargets();
  const beforeDinnerEntry = partialEntry(entry, ["breakfast", "lunch", "extras"]);
  const macros = estimateMacros(beforeDinnerEntry);
  const completeProtein = fullProtein(macros);
  const collagen = collagenProtein(macros);
  const proteinTarget = targets.proteinMin;
  const proteinNeeded = Math.max(0, proteinTarget - completeProtein);
  const carbRoom = Math.max(0, targets.carbsMax - macros.carbs);

  const proteinAdvice = proteinNeeded >= 35 ? `Protein: ca ${Math.round(proteinNeeded)} g kvar.` : "Protein: läget är okej.";
  const carbAdvice = macros.carbs >= targets.carbsMax - 2 ? "Kolhydrater: håll middagen strikt." : `Kolhydrater: ca ${decimal(carbRoom)} g kvar.`;
  const electrolyteAdvice = dinnerElectrolyteAdvice(macros, entry);
  const collagenAdvice = collagen > 0 ? ` Kollagen (${decimal(collagen)} g) räknas inte som fullvärdigt protein.` : "";

  return `${proteinAdvice} ${carbAdvice} ${electrolyteAdvice}${collagenAdvice}`;
}

function classify(entry, macros) {
  const targets = getMacroTargets();
  if (macros.carbs <= targets.carbsMax && macros.fatPct >= 65) return "strikt keto";
  if (macros.carbs <= targets.carbsMax + 10 && macros.fatPct >= 55) return "keto-ish";
  return "riskzon";
}

function coach(entry, macros, kind) {
  const notes = [];
  const isToday = entry.date === todayIso();
  if (kind === "strikt keto") notes.push("Stark keto-dag: låg kolhydratnivå och bra fettbas.");
  if (kind === "keto-ish") notes.push("Bra riktning, men håll koll på yoghurt, bär, tomat och processat.");
  if (kind === "riskzon") notes.push("Här behöver nästa måltid bli enklare: protein plus tydlig fettkälla, minimalt med kolhydrater.");
  if (entry.sleep === "-6 timmar") notes.push("Kort sömn kan öka hunger, så prioritera salt, vatten och enkel mat idag.");
  if (/1 liter/i.test(entry.water || "")) {
    notes.push(isToday ? "Vatten hittills: fyll gärna på mot 2,5-3 liter under dagen." : "Vattenintaget var lågt; sikta hellre runt 2,5-3 liter.");
  }
  if (entry.walk === "+60 min") notes.push("Stark promenadbonus idag: bra stöd för blodsocker, energi och fettförbränning.");
  if (entry.walk === "+30 min") notes.push("Promenad registrerad: snyggt stöd för rutinen utan att behöva krångla till maten.");
  return notes.join(" ");
}

function foodItemSort(a, b) {
  return b.fat - a.fat || b.protein - a.protein || a.label.localeCompare(b.label, "sv");
}

function renderMacroBreakdown(macros, hasContent) {
  const breakdown = document.querySelector("#macroBreakdown");
  if (!breakdown) return;
  if (!hasContent) {
    breakdown.textContent = "Inga matposter beräknade ännu.";
    return;
  }
  if (macros.source === "manual") {
    breakdown.textContent = "Makron är manuellt ifyllda för hela dagen.";
    return;
  }
  if (!macros.items?.length) {
    breakdown.textContent = "Inga kända livsmedel hittades i dagens text.";
    return;
  }
  const rows = [...macros.items]
    .sort(foodItemSort)
    .map((item) => {
      const count = Number.isInteger(item.count) ? item.count : decimal(item.count);
      return `<div><strong>${item.label}</strong><span class="macro-count">${item.amountLabel || `x ${count}`}</span><span class="macro-value">${decimal(item.fat)} g F</span><span class="macro-value">${decimal(item.protein)} g P</span><span class="macro-value">${decimal(item.carbs)} g K</span></div>`;
    })
    .join("");
  breakdown.innerHTML = rows;
}

function renderElectrolyteBreakdown(macros, hasContent) {
  const breakdown = document.querySelector("#electrolyteBreakdown");
  if (!breakdown) return;
  if (!hasContent) {
    breakdown.textContent = "Inga matposter beräknade ännu.";
    return;
  }
  if (macros.source === "manual") {
    breakdown.textContent = "Elektrolyter beräknas inte från manuella makron.";
    return;
  }
  const electrolyteItems = macros.items || [];
  if (!electrolyteItems.length) {
    breakdown.textContent = "Inga matposter beräknade ännu.";
    return;
  }
  const rows = electrolyteItems
    .sort(foodItemSort)
    .map((item) => {
      const count = Number.isInteger(item.count) ? item.count : decimal(item.count);
      const sodium = item.sodiumMg > 0 ? Math.round(item.sodiumMg) : "--";
      const potassium = item.potassiumMg > 0 ? Math.round(item.potassiumMg) : "--";
      const magnesium = item.magnesiumMg > 0 ? Math.round(item.magnesiumMg) : "--";
      return `<div><strong>${item.label}</strong><span class="macro-count">${item.amountLabel || `x ${count}`}</span><span class="macro-value">Na ${sodium}</span><span class="macro-value">Ka ${potassium}</span><span class="macro-value">Mg ${magnesium}</span></div>`;
    })
    .join("");
  breakdown.innerHTML = rows;
}

function chartPath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

function trendSelection(entries) {
  const mode = trendModeInput?.value || "all";
  const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
  if (mode === "all") {
    return {
      entries: sorted,
      badge: `${sorted[0]?.date || todayIso()}--${todayIso()}`,
      notePrefix: "",
    };
  }
  const startWeek = parseWeekInput(trendStartWeekInput?.value || weekInputFromDate(fields.date.value || todayIso()));
  const endWeek = mode === "weeks" ? parseWeekInput(trendEndWeekInput?.value || trendStartWeekInput?.value) : startWeek;
  if (!startWeek || !endWeek) {
    return { entries: [], badge: "Välj vecka", notePrefix: "Ange vecka som ÅÅÅÅ-VV." };
  }
  const startRange = weekRange(startWeek.year, startWeek.week);
  const endRange = weekRange(endWeek.year, endWeek.week);
  const start = startRange.start <= endRange.start ? startRange.start : endRange.start;
  const end = startRange.start <= endRange.start ? endRange.end : startRange.end;
  const label =
    mode === "week"
      ? `${startWeek.year} v${String(startWeek.week).padStart(2, "0")}`
      : `${startWeek.year} v${String(startWeek.week).padStart(2, "0")}--${endWeek.year} v${String(endWeek.week).padStart(2, "0")}`;
  return {
    entries: sorted.filter((entry) => entry.date >= start && entry.date <= end),
    badge: label,
    notePrefix: `${start}--${end}. `,
  };
}

function renderTrendChart(entries) {
  const chart = document.querySelector("#trendChart");
  const note = document.querySelector("#trendNote");
  if (!chart || !note) return;

  const selection = trendSelection(entries);
  document.querySelector("#trendRange").textContent = selection.badge;

  const rows = selection.entries
    .map((entry) => {
      const macros = estimateMacros(entry);
      return {
        date: entry.date,
        weight: Number(entry.weight),
        fat: hasEntryContent(entry) ? macros.fat : null,
        protein: hasEntryContent(entry) ? macros.protein : null,
        carbs: hasEntryContent(entry) ? macros.carbs : null,
      };
    })
    .filter((row) => Number.isFinite(row.weight) || Number.isFinite(row.fat) || Number.isFinite(row.protein) || Number.isFinite(row.carbs));

  if (rows.length < 2) {
    chart.innerHTML = '<p class="empty-chart">Diagrammet visas när minst två dagar har data.</p>';
    note.textContent = selection.notePrefix || "Spara minst två dagar med vikt eller matposter för att se utvecklingen.";
    return;
  }

  const width = 640;
  const height = 276;
  const pad = { top: 34, right: 48, bottom: 42, left: 48 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const xFor = (index) => pad.left + (rows.length === 1 ? plotWidth / 2 : (index / (rows.length - 1)) * plotWidth);

  const weightMin = 80;
  const weightMax = 92;
  const gramMax = 200;
  const yWeight = (value) => pad.top + ((weightMax - value) / (weightMax - weightMin)) * plotHeight;
  const yGram = (value) => pad.top + ((gramMax - value) / gramMax) * plotHeight;

  const weightPoints = rows
    .map((row, index) => (Number.isFinite(row.weight) ? { x: xFor(index), y: yWeight(row.weight), value: row.weight } : null))
    .filter(Boolean);
  const fatPoints = rows
    .map((row, index) => (Number.isFinite(row.fat) ? { x: xFor(index), y: yGram(row.fat), value: row.fat } : null))
    .filter(Boolean);
  const proteinPoints = rows
    .map((row, index) => (Number.isFinite(row.protein) ? { x: xFor(index), y: yGram(row.protein), value: row.protein } : null))
    .filter(Boolean);
  const carbPoints = rows
    .map((row, index) => (Number.isFinite(row.carbs) ? { x: xFor(index), y: yGram(row.carbs), value: row.carbs } : null))
    .filter(Boolean);
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = pad.top + ratio * plotHeight;
    const leftValue = weightMax - ratio * (weightMax - weightMin);
    const rightValue = gramMax - ratio * gramMax;
    return { y, leftValue, rightValue };
  });
  const carbLimitY = yGram(20);
  const labelIndexes = rows.length <= 5 ? rows.map((_, index) => index) : [0, Math.floor((rows.length - 1) / 2), rows.length - 1];
  const chartDateLabel = (index, labelPosition) => {
    const [, , monthText, dayText] = rows[index].date.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
    if (!monthText || !dayText) return rows[index].date.slice(5);
    const month = Number(monthText);
    const day = Number(dayText);
    const previousLabelIndex = labelIndexes[labelPosition - 1];
    const previousLabelMonth = Number(rows[previousLabelIndex]?.date.slice(5, 7));
    return labelPosition === 0 || month !== previousLabelMonth ? `${day}/${month}` : `${day}`;
  };
  const latest = rows.at(-1);

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <g class="chart-grid">
        ${gridLines
          .map(
            (line) => `
              <line x1="${pad.left}" y1="${line.y.toFixed(1)}" x2="${width - pad.right}" y2="${line.y.toFixed(1)}"></line>
              <text x="${pad.left - 8}" y="${(line.y + 4).toFixed(1)}" text-anchor="end">${decimal(line.leftValue)}</text>
              <text x="${width - pad.right + 8}" y="${(line.y + 4).toFixed(1)}">${Math.round(line.rightValue)}</text>
            `
          )
          .join("")}
      </g>
      <line class="carb-limit-line" x1="${pad.left}" y1="${carbLimitY.toFixed(1)}" x2="${width - pad.right}" y2="${carbLimitY.toFixed(1)}"></line>
      <text class="carb-limit-label" x="${width - pad.right + 8}" y="${(carbLimitY + 4).toFixed(1)}">20</text>
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}"></line>
      <line class="chart-axis" x1="${width - pad.right}" y1="${pad.top}" x2="${width - pad.right}" y2="${height - pad.bottom}"></line>
      <line class="chart-axis" x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}"></line>
      <path class="chart-line weight-line" d="${chartPath(weightPoints)}"></path>
      <path class="chart-line fat-line" d="${chartPath(fatPoints)}"></path>
      <path class="chart-line protein-line" d="${chartPath(proteinPoints)}"></path>
      <path class="chart-line carb-line" d="${chartPath(carbPoints)}"></path>
      ${weightPoints.map((point) => `<circle class="weight-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2.2"></circle>`).join("")}
      ${fatPoints.map((point) => `<circle class="fat-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2"></circle>`).join("")}
      ${proteinPoints.map((point) => `<circle class="protein-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2"></circle>`).join("")}
      ${carbPoints.map((point) => `<circle class="carb-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2"></circle>`).join("")}
      ${labelIndexes
        .map(
          (index, labelPosition) =>
            `<text class="chart-date" x="${xFor(index).toFixed(1)}" y="${height - 14}" text-anchor="middle">${chartDateLabel(index, labelPosition)}</text>`
        )
        .join("")}
      <text class="axis-label" x="${pad.left - 8}" y="22" text-anchor="end">kg</text>
      <text class="axis-label" x="${width - pad.right + 8}" y="22">gram</text>
    </svg>
  `;
  note.textContent = `${selection.notePrefix}Senast i urvalet: ${latest.weight ? `${decimal(latest.weight)} kg, ` : ""}${decimal(latest.fat || 0)} g fett, ${decimal(latest.protein || 0)} g protein, ${decimal(latest.carbs || 0)} g kolhydrater.`;
}

function render(selectedDate = activeDate) {
  const entries = getEntries().sort((a, b) => a.date.localeCompare(b.date));
  const latest = entries.find((entry) => entry.date === selectedDate) || entries.at(-1) || emptyEntry();
  activeDate = latest.date;
  const hasContent = hasEntryContent(latest);
  const macros = estimateMacros(latest);
  const kind = hasContent ? classify(latest, macros) : "ny logg";
  const startWeight = baselineWeight(entries);
  const startDate = entries[0]?.date || latest.date || todayIso();
  const delta = latest.weight && startWeight ? latest.weight - startWeight : 0;
  const goalWeight = getGoalWeight();
  const targets = getMacroTargets();
  const kcalRange = macroKcalRange(targets);
  const toGoal = latest.weight && goalWeight ? latest.weight - goalWeight : 0;

  document.querySelector("#todayDate").textContent = latest.date;
  document.querySelector("#currentWeight").textContent = latest.weight ? decimal(latest.weight) : "--";
  document.querySelector("#deltaWeight").textContent =
    latest.weight && startWeight ? `${delta > 0 ? "+" : ""}${decimal(delta)} kg` : "--";
  document.querySelector("#goalMetricLabel").textContent = goalWeight ? `Till målvikt ${decimal(goalWeight)} kg` : "Till målvikt";
  document.querySelector("#toGoal").textContent = latest.weight && goalWeight ? `${decimal(toGoal)} kg` : "--";
  if (goalInput) goalInput.value = goalWeight ? goalWeight : "";
  if (macroTargetInputs.proteinMin) macroTargetInputs.proteinMin.value = targets.proteinMin;
  if (macroTargetInputs.proteinMax) macroTargetInputs.proteinMax.value = targets.proteinMax;
  if (macroTargetInputs.fatMin) macroTargetInputs.fatMin.value = targets.fatMin;
  if (macroTargetInputs.fatMax) macroTargetInputs.fatMax.value = targets.fatMax;
  if (macroTargetInputs.carbsMin) macroTargetInputs.carbsMin.value = targets.carbsMin;
  if (macroTargetInputs.carbsMax) macroTargetInputs.carbsMax.value = targets.carbsMax;
  const macroTargetKcalNote = document.querySelector("#macroTargetKcalNote");
  if (macroTargetKcalNote) {
    macroTargetKcalNote.textContent =
      `Dessa makron ger ett uppskattat kaloriintag på ${roundedKcal(kcalRange.min)} till ${roundedKcal(kcalRange.max)} kcal och ${fatEnergyShareLabel(targets, kcalRange)} av det totala kaloriintaget utgörs av fett.`;
  }
  const marker = macros.source === "manual" ? "" : "~";
  document.querySelector("#carbMetric").textContent = hasContent ? `${marker}${decimal(macros.carbs)} g` : "--";
  document.querySelector("#fatMetric").textContent = hasContent ? `${marker}${macros.fatPct}%` : "--";
  const alcoholKcal = Math.round(macros.alcohol || 0);
  const energyMetricLabel = document.querySelector("#energyMetricLabel");
  if (energyMetricLabel) {
    energyMetricLabel.textContent = hasContent
      ? `Dagens energiintag (varav alkh. ${alcoholKcal} kcal)`
      : "Dagens energiintag";
  }
  document.querySelector("#energyMetric").textContent = hasContent ? `${marker}${Math.round(macros.kcal)} kcal` : "--";
  document.querySelector("#coachLine").textContent = hasContent
    ? coach(latest, macros, kind)
    : "Fyll i dagens mat, vikt, sömn och vätska så börjar coachningen.";
  const compass = document.querySelector("#dinnerCompass");
  const compassText = document.querySelector("#dinnerCompassText");
  if (compass) {
    const compassMessage = hasContent ? dinnerCompass(latest) : null;
    compass.hidden = !compassMessage;
    if (compassText) compassText.textContent = compassMessage || "";
  }

  const badge = document.querySelector("#strictnessBadge");
  badge.textContent = kind;
  badge.className = `badge ${kind === "strikt keto" ? "strict" : kind === "riskzon" ? "risk" : ""}`;
  document.querySelector("#fatBar").style.width = `${Math.min(macros.fatPct, 100)}%`;
  document.querySelector("#proteinBar").style.width = `${Math.min(macros.proteinPct, 100)}%`;
  document.querySelector("#carbBar").style.width = `${Math.min(macros.carbPct, 100)}%`;
  document.querySelector("#proteinGramBar").style.width = `${Math.min((macros.protein / targets.proteinMax) * 100, 100)}%`;
  document.querySelector("#fatGramBar").style.width = `${Math.min((macros.fat / targets.fatMax) * 100, 100)}%`;
  document.querySelector("#carbGramBar").style.width = `${Math.min((macros.carbs / targets.carbsMax) * 100, 100)}%`;
  document.querySelector("#proteinTargetLabel").textContent = `Protein mot ${targetRangeLabel(targets.proteinMin, targets.proteinMax)} g`;
  document.querySelector("#fatTargetLabel").textContent = `Fett mot ${targetRangeLabel(targets.fatMin, targets.fatMax)} g`;
  document.querySelector("#carbTargetLabel").textContent = `Kolhydrater mot ${targetRangeLabel(targets.carbsMin, targets.carbsMax)} g`;
  document.querySelector("#fatText").textContent = hasContent ? `${macros.fatPct}%` : "--";
  document.querySelector("#proteinText").textContent = hasContent ? `${macros.proteinPct}%` : "--";
  document.querySelector("#carbText").textContent = hasContent ? `${macros.carbPct}%` : "--";
  document.querySelector("#proteinGramText").textContent = hasContent ? `${decimal(macros.protein)} g` : "--";
  document.querySelector("#fatGramText").textContent = hasContent ? `${decimal(macros.fat)} g` : "--";
  document.querySelector("#carbGramText").textContent = hasContent ? `${decimal(macros.carbs)} g` : "--";
  document.querySelector("#sodiumBar").style.width = `${Math.min((macros.sodiumMg / electrolyteTargets.sodiumMg) * 100, 100)}%`;
  document.querySelector("#potassiumBar").style.width = `${Math.min((macros.potassiumMg / electrolyteTargets.potassiumMg) * 100, 100)}%`;
  document.querySelector("#magnesiumBar").style.width = `${Math.min((macros.magnesiumMg / electrolyteTargets.magnesiumMg) * 100, 100)}%`;
  document.querySelector("#sodiumText").textContent = hasContent ? `${Math.round(macros.sodiumMg)} mg` : "--";
  document.querySelector("#potassiumText").textContent = hasContent ? `${Math.round(macros.potassiumMg)} mg` : "--";
  document.querySelector("#magnesiumText").textContent = hasContent ? `${Math.round(macros.magnesiumMg)} mg` : "--";
  document.querySelector("#electrolyteNote").textContent = hasContent
    ? "Elektrolyter uppskattas från kända poster i livsmedelslistan. Matvaror utan elektrolytvärden räknas inte här ännu."
    : "Fyll i mat och dryck så visar appen uppskattad elektrolytbild från kända poster.";
  document.querySelector("#macroNote").textContent =
    macros.source === "manual"
      ? "Makron bygger på manuellt inmatade gram för fett, protein och kolhydrater."
      : macros.alcohol > 0
        ? "Övre staplarna visar kaloriprocent. Alkohol ger energi men visas inte som fett, protein eller kolhydrater."
        : `Automatisk uppskattning. Personligt mål: ${targetRangeLabel(targets.proteinMin, targets.proteinMax)} g protein, ${targetRangeLabel(targets.fatMin, targets.fatMax)} g fett, ${targetRangeLabel(targets.carbsMin, targets.carbsMax)} g kolhydrater (${roundedKcal(kcalRange.min)}-${roundedKcal(kcalRange.max)} kcal).`;
  renderMacroBreakdown(macros, hasContent);
  renderElectrolyteBreakdown(macros, hasContent);
  renderTrendChart(entries);

  const history = document.querySelector("#historyList");
  history.innerHTML = "";
  for (const entry of entries.slice(-7).reverse()) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "day-row";
    row.innerHTML = `<time>${entry.date}</time><span>${entry.sleep || "sömn saknas"}</span><strong>${entry.weight ? `${decimal(entry.weight)} kg` : "--"}</strong>`;
    row.addEventListener("click", () => fillForm(entry));
    history.append(row);
  }
}

function fillForm(entry) {
  activeDate = entry.date || activeDate || todayIso();
  for (const [key, input] of Object.entries(fields)) {
    if (!input) continue;
    if (input instanceof NodeList) {
      input.forEach((option) => {
        option.checked = option.value === (entry[key] ?? "");
      });
    } else {
      input.value = entry[key] ?? "";
    }
  }
  if (goalInput) goalInput.value = getGoalWeight() || "";
  const targets = getMacroTargets();
  if (macroTargetInputs.proteinMin) macroTargetInputs.proteinMin.value = targets.proteinMin;
  if (macroTargetInputs.proteinMax) macroTargetInputs.proteinMax.value = targets.proteinMax;
  if (macroTargetInputs.fatMin) macroTargetInputs.fatMin.value = targets.fatMin;
  if (macroTargetInputs.fatMax) macroTargetInputs.fatMax.value = targets.fatMax;
  if (macroTargetInputs.carbsMin) macroTargetInputs.carbsMin.value = targets.carbsMin;
  if (macroTargetInputs.carbsMax) macroTargetInputs.carbsMax.value = targets.carbsMax;
}

function setSaveStatus(message, isError = false) {
  const status = document.querySelector("#saveStatus");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function saveCurrentEntry(options = {}) {
  const entry = formEntry();
  if (goalInput) saveGoalWeight(goalInput.value.trim());
  if (Object.values(macroTargetInputs).some(Boolean)) saveMacroTargets(currentMacroTargetInputs());
  activeDate = entry.date;
  const entries = getEntries().filter((item) => item.date !== entry.date);
  entries.push(entry);
  saveEntries(entries);
  render(entry.date);
  fillForm(entry);
  if (weeklyCheckinPanel && !weeklyCheckinPanel.hidden) fillWeeklyCheckin();
  if (options.silent) return;
  setSaveStatus(`Sparat ${nowStamp()} · dag ${entry.date}`);
}

function queueAutosave() {
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    saveCurrentEntry({ silent: true });
    setSaveStatus(`Autosparat ${nowStamp()} · dag ${activeDate || todayIso()}`);
  }, 800);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrentEntry();
});

saveButton.addEventListener("click", saveCurrentEntry);

saveButton.addEventListener("pointerup", () => {
  window.clearTimeout(autosaveTimer);
  saveCurrentEntry();
});

window.addEventListener("error", (event) => {
  setSaveStatus(`Appfel: ${event.message}`, true);
});

function mealReportRows(entry) {
  const meals = [
    ["Frukost", "breakfast"],
    ["Lunch", "lunch"],
    ["Middag", "dinner"],
    ["Övrigt matintag", "extras"],
  ];
  return meals.map(([label, key]) => {
    const text = entry[key] || "";
    const mealEntry = emptyEntry(entry.date);
    mealEntry[key] = text;
    const macros = text.trim() ? estimateMacros(mealEntry) : { kcal: 0, fat: 0, carbs: 0, protein: 0 };
    return { label, text, macros };
  });
}

function dailyReportData(entry) {
  const rows = mealReportRows(entry).map((row) => ({
    label: row.label,
    text: row.text,
    kcal: row.macros.kcal,
    fat: row.macros.fat,
    carbs: row.macros.carbs,
    protein: row.macros.protein,
  }));
  const totals = rows.reduce(
    (sum, row) => ({
      kcal: sum.kcal + row.kcal,
      fat: sum.fat + row.fat,
      carbs: sum.carbs + row.carbs,
      protein: sum.protein + row.protein,
    }),
    { kcal: 0, fat: 0, carbs: 0, protein: 0 }
  );
  return { kind: "daily", entry, rows, totals, generatedAt: nowStamp(), version: appDisplayVersion };
}

function openDailyReport() {
  const entry = formEntry();
  openReport(dailyReportData(entry), { date: entry.date });
  setSaveStatus(`Rapport skapad för ${entry.date}`);
}

function numberFromFreeText(text) {
  const match = String(text || "").replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : NaN;
}

function mode(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "--";
}

function sleepMode(values) {
  return mode(values.map((value) => (value === "-6 timmar" || value === "+6 timmar" ? "6 timmar" : value)));
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function entriesForWeek(year, week) {
  const range = weekRange(year, week);
  const current = formEntry();
  const entries = getEntries().filter((entry) => entry.date !== current.date);
  entries.push(current);
  return {
    range,
    entries: entries
      .filter((entry) => entry.date >= range.start && entry.date <= range.end && hasEntryContent(entry))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function weeklyReportData(year, week) {
  const { range, entries } = entriesForWeek(year, week);
  const weekKey = `${year}-${String(week).padStart(2, "0")}`;
  const checkin = getWeeklyCheckins()[weekKey] || null;
  const weightAverage = average(entries.map((entry) => (Number(entry.weight) > 0 ? Number(entry.weight) : NaN)));
  const meals = [
    ["Frukost", "breakfast"],
    ["Lunch", "lunch"],
    ["Middag", "dinner"],
    ["Övrigt matintag", "extras"],
  ];
  const rows = meals.map(([label, key]) => {
    const macros = entries
      .filter((entry) => (entry[key] || "").trim())
      .map((entry) => {
        const mealEntry = emptyEntry(entry.date);
        mealEntry[key] = entry[key];
        return estimateMacros(mealEntry);
      });
    return {
      label,
      count: macros.length,
      kcal: average(macros.map((item) => item.kcal)),
      fat: average(macros.map((item) => item.fat)),
      carbs: average(macros.map((item) => item.carbs)),
      protein: average(macros.map((item) => item.protein)),
    };
  });
  const waterAverage = average(entries.map((entry) => numberFromFreeText(entry.water)));
  const coffeeAverage = average(entries.map((entry) => numberFromFreeText(entry.coffee)));
  const bloodGlucoseAverage = average(entries.map((entry) => (entry.bloodGlucose === "" ? NaN : Number(entry.bloodGlucose))));
  const ketonesAverage = average(entries.map((entry) => (entry.ketones === "" ? NaN : Number(entry.ketones))));
  const totals = rows.reduce(
    (sum, row) => ({
      kcal: sum.kcal + (row.kcal || 0),
      fat: sum.fat + (row.fat || 0),
      carbs: sum.carbs + (row.carbs || 0),
      protein: sum.protein + (row.protein || 0),
    }),
    { kcal: 0, fat: 0, carbs: 0, protein: 0 }
  );
  return {
    kind: "weekly",
    year,
    week,
    checkin,
    weightAverage,
    range,
    days: entries.length,
    rows,
    totals,
    sleepMode: sleepMode(entries.map((entry) => entry.sleep)),
    walkMode: mode(entries.map((entry) => entry.walk || "Ingen")),
    waterAverage,
    coffeeAverage,
    bloodGlucoseAverage,
    ketonesAverage,
    generatedAt: nowStamp(),
    version: appDisplayVersion,
  };
}

function openReport(data, params = {}) {
  const reportPayload = JSON.stringify(data);
  localStorage.setItem("btk.dailyReport.v1", reportPayload);
  sessionStorage.setItem("btk.dailyReport.v1", reportPayload);
  const reportUrl = new URL("report.html", window.location.href);
  for (const [key, value] of Object.entries(params)) {
    reportUrl.searchParams.set(key, value);
  }
  reportUrl.searchParams.set("v", appVersion);
  window.location.assign(reportUrl.toString());
}

function openWeekReport() {
  const suggested = weekInputFromDate(fields.date.value || todayIso());
  const answer = window.prompt("Ange vecka som ÅÅÅÅ-VV, t.ex. 2026-21", suggested);
  if (answer === null) return;
  const parsed = parseWeekInput(answer);
  if (!parsed) {
    setSaveStatus("Veckan kunde inte tolkas. Använd formatet ÅÅÅÅ-VV, t.ex. 2026-21.", true);
    return;
  }
  const report = weeklyReportData(parsed.year, parsed.week);
  openReport(report, { week: `${parsed.year}-${String(parsed.week).padStart(2, "0")}` });
  setSaveStatus(`Veckorapport skapad för vecka ${parsed.week}, ${parsed.year}`);
}

reportButton?.addEventListener("click", openDailyReport);
weekReportButton?.addEventListener("click", openWeekReport);
weeklyCheckinButton?.addEventListener("click", () => {
  if (!weeklyCheckinPanel) return;
  const willOpen = weeklyCheckinPanel.hidden;
  weeklyCheckinPanel.hidden = !willOpen;
  weeklyCheckinButton?.classList.toggle("active", willOpen);
  if (willOpen) fillWeeklyCheckin();
});
saveWeeklyCheckinButton?.addEventListener("click", saveCurrentWeeklyCheckin);

function printTrendChart() {
  document.querySelector(".trend-panel details")?.setAttribute("open", "");
  document.body.classList.add("print-trend");
  const cleanup = () => document.body.classList.remove("print-trend");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  window.setTimeout(cleanup, 1500);
}

async function saveTrendPng() {
  const svg = document.querySelector("#trendChart svg");
  if (!svg) {
    setSaveStatus("Det finns inget tidsseriediagram att spara ännu.", true);
    return;
  }
  const clone = svg.cloneNode(true);
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    .chart-grid line{stroke:#e9dfcf;stroke-width:1}
    .chart-grid text,.carb-limit-label,.chart-date,.axis-label{fill:#69736d;font-size:13px;font-weight:400;stroke:none}
    .carb-limit-line{stroke:#d9cfbf;stroke-width:1;stroke-dasharray:4 5}
    .chart-axis{stroke:#d5cabb;stroke-width:1.4}
    .chart-line{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2.4}
    .weight-line{stroke:#2563eb}.fat-line{stroke:#274a3c;stroke-dasharray:7 5}.protein-line{stroke:#8d3756;stroke-dasharray:7 5}.carb-line{stroke:#c9953d;stroke-dasharray:7 5}
    .weight-dot{fill:transparent;stroke:#2563eb;stroke-width:1.15}.fat-dot{fill:transparent;stroke:#274a3c;stroke-width:1.05}.protein-dot{fill:transparent;stroke:#8d3756;stroke-width:1.05}.carb-dot{fill:transparent;stroke:#c9953d;stroke-width:1.05}
  `;
  clone.insertBefore(style, clone.firstChild);
  const serialized = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  const width = Number(svg.viewBox.baseVal.width || 640);
  const height = Number(svg.viewBox.baseVal.height || 276);
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffaf2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(2, 2);
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob((pngBlob) => {
      URL.revokeObjectURL(url);
      if (!pngBlob) {
        setSaveStatus("PNG-exporten fungerade inte i den här browsern.", true);
        return;
      }
      const link = document.createElement("a");
      const datePart = activeDate || todayIso();
      link.href = URL.createObjectURL(pngBlob);
      link.download = `btk-tidsserie-${datePart}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setSaveStatus("Tidsseriediagram sparat som PNG.");
    }, "image/png");
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    setSaveStatus("PNG-exporten fungerade inte i den här browsern.", true);
  };
  image.src = url;
}

printTrendButton?.addEventListener("click", printTrendChart);
saveTrendPngButton?.addEventListener("click", saveTrendPng);

function updateTrendFilterState() {
  const suggestedWeek = weekInputFromDate(fields.date.value || activeDate || todayIso());
  if (trendStartWeekInput && !trendStartWeekInput.value) trendStartWeekInput.value = suggestedWeek;
  if (trendEndWeekInput && !trendEndWeekInput.value) trendEndWeekInput.value = suggestedWeek;
  if (trendEndWeekInput) {
    trendEndWeekInput.disabled = trendModeInput?.value !== "weeks";
  }
}

function rerenderTrendFilter() {
  updateTrendFilterState();
  render(activeDate);
}

trendModeInput?.addEventListener("change", rerenderTrendFilter);
trendStartWeekInput?.addEventListener("change", rerenderTrendFilter);
trendEndWeekInput?.addEventListener("change", rerenderTrendFilter);

fields.date.addEventListener("change", () => {
  const date = fields.date.value || todayIso();
  const existing = findEntry(date);
  fillForm(existing || emptyEntry(date));
  if (weeklyCheckinPanel && !weeklyCheckinPanel.hidden) fillWeeklyCheckin();
  updateTrendFilterState();
  render(date);
  setSaveStatus(existing ? `Visar sparad rad för ${date}` : `Ny tom rad för ${date}`);
});

form.addEventListener("input", (event) => {
  if (event.target === goalInput) return;
  if (Object.values(macroTargetInputs).includes(event.target)) return;
  queueAutosave();
});

if (goalInput) {
  goalInput.addEventListener("change", () => {
    const goal = saveGoalWeight(goalInput.value.trim());
    render(activeDate);
    setSaveStatus(goal ? `Målvikt sparad: ${decimal(goal)} kg` : "Målvikt rensad");
  });

  goalInput.addEventListener("input", () => {
    saveGoalWeight(goalInput.value.trim());
    render(activeDate);
  });
}

function currentMacroTargetInputs() {
  return {
    proteinMin: macroTargetInputs.proteinMin?.value,
    proteinMax: macroTargetInputs.proteinMax?.value,
    fatMin: macroTargetInputs.fatMin?.value,
    fatMax: macroTargetInputs.fatMax?.value,
    carbsMin: macroTargetInputs.carbsMin?.value,
    carbsMax: macroTargetInputs.carbsMax?.value,
  };
}

for (const input of Object.values(macroTargetInputs)) {
  input?.addEventListener("change", () => {
    const targets = saveMacroTargets(currentMacroTargetInputs());
    render(activeDate);
    setSaveStatus(
      `Makromål sparade: ${targetRangeLabel(targets.proteinMin, targets.proteinMax)} g protein, ${targetRangeLabel(targets.fatMin, targets.fatMax)} g fett, ${targetRangeLabel(targets.carbsMin, targets.carbsMax)} g kolhydrater`
    );
  });

  input?.addEventListener("input", () => {
    saveMacroTargets(currentMacroTargetInputs());
    render(activeDate);
  });
}

document.querySelector("#blankLinkButton").addEventListener("click", async () => {
  const appUrl = stableAppUrl();
  await navigator.clipboard.writeText(appUrl);
  document.querySelector("#toolsNote").textContent = "App-länk kopierad. Den öppnar senaste publicerade versionen; lokala loggar och inställningar följer inte med länken.";
});

function setSyncStatus(message, isError = false) {
  if (syncStatus) {
    syncStatus.textContent = message;
    syncStatus.classList.toggle("error", isError);
  }
  if (quickSyncStatus) {
    quickSyncStatus.textContent = message;
    quickSyncStatus.classList.toggle("error", isError);
  }
}

function getSyncCode() {
  return localStorage.getItem(syncCodeKey) || "";
}

function saveSyncCode(value) {
  const code = value.trim();
  if (code.length < 8) {
    setSyncStatus("Välj en synkkod med minst 8 tecken.", true);
    return "";
  }
  localStorage.setItem(syncCodeKey, code);
  if (syncCodeInput) syncCodeInput.value = code;
  setSyncStatus("Synkkod sparad. Tryck Synka nu för att hämta eller skicka molndata.");
  return code;
}

function queueCloudSync() {
  if (applyingRemoteData || !supabaseClient || !getSyncCode()) return;
  window.clearTimeout(cloudSyncTimer);
  cloudSyncTimer = window.setTimeout(() => {
    pushCloudData({ silent: true });
  }, 900);
}

async function pushCloudData({ silent = false } = {}) {
  const syncCode = getSyncCode();
  if (!supabaseClient || !syncCode) return;
  const payload = {
    sync_key: syncCode,
    profile_entries: getEntries(),
    profile_goal_weight: getGoalWeight(),
    profile_macro_targets: getMacroTargets(),
    profile_weekly_checkins: getWeeklyCheckins(),
  };
  let { error } = await supabaseRpc("keto_sync_push", payload);
  if (error && /profile_macro_targets|profile_weekly_checkins|function public\.keto_sync_push|Could not find the function/i.test(error.message || "")) {
    const fallback = await supabaseRpc("keto_sync_push", {
      sync_key: payload.sync_key,
      profile_entries: payload.profile_entries,
      profile_goal_weight: payload.profile_goal_weight,
    });
    error = fallback.error;
  }
  if (error) {
    setSyncStatus(`Synkfel: ${error.message}`, true);
    return;
  }
  if (!silent) setSyncStatus(`Synkat ${new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`);
}

async function pullCloudData() {
  const syncCode = getSyncCode();
  if (!supabaseClient || !syncCode) return false;
  const { data, error } = await supabaseRpc("keto_sync_pull", { sync_key: syncCode });
  if (error) {
    setSyncStatus(`Synkfel: ${error.message}`, true);
    return false;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    await pushCloudData({ silent: true });
    setSyncStatus("Molnprofil skapad från den här enheten.");
    return true;
  }
  applyingRemoteData = true;
  localStorage.setItem(storageKey, JSON.stringify(Array.isArray(row.entries) ? row.entries : [emptyEntry()]));
  if (row.goal_weight) {
    localStorage.setItem(goalKey, String(row.goal_weight));
  } else {
    localStorage.removeItem(goalKey);
  }
  if (row.macro_targets) {
    localStorage.setItem(macroTargetsKey, JSON.stringify(normalizeMacroTargets(row.macro_targets)));
  }
  if (row.weekly_checkins) {
    saveWeeklyCheckins(row.weekly_checkins);
  }
  applyingRemoteData = false;
  const nextEntry = getEntries().at(-1) || emptyEntry();
  fillForm(nextEntry);
  render(nextEntry.date);
  setSyncStatus(`Synkat från molnet ${new Date(row.updated_at).toLocaleString("sv-SE")}`);
  return true;
}

async function supabaseRpc(functionName, payload) {
  const response = await fetch(`${supabaseClient.url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: supabaseClient.anonKey,
      authorization: `Bearer ${supabaseClient.anonKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    return { data: null, error: { message: data?.message || response.statusText } };
  }
  return { data, error: null };
}

async function syncNow() {
  if (!supabaseClient) {
    setSyncStatus("Supabase är inte konfigurerat ännu.", true);
    return;
  }
  if (!getSyncCode()) {
    setSyncStatus("Skriv och spara en synkkod först.", true);
    return;
  }
  setSyncStatus("Synkar...");
  await pullCloudData();
}

async function initSync() {
  try {
    const { supabaseConfig } = await import(`./supabase-config.js?v=${appVersion}`);
    if (!supabaseConfig?.url || !supabaseConfig?.anonKey) {
      setSyncStatus("Synk är redo i appen, men Supabase-url och anon key saknas.");
      return;
    }
    supabaseClient = {
      url: supabaseConfig.url.replace(/\/$/, ""),
      anonKey: supabaseConfig.anonKey,
    };
    const savedCode = getSyncCode();
    if (savedCode) {
      if (syncCodeInput) syncCodeInput.value = savedCode;
      setSyncStatus("Synk är redo. Tryck Synka nu.");
    } else {
      setSyncStatus("Synk är redo. Skriv samma synkkod på varje enhet som ska dela data.");
    }
  } catch (error) {
    setSyncStatus(`Synk kunde inte laddas: ${error.message}`, true);
  }
}

async function checkForAppUpdate() {
  try {
    const response = await fetch(`./version.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const latest = await response.json();
    const latestVersion = Number(latest?.version);
    const currentVersion = Number(appVersion);
    if (!latestVersion || latestVersion <= currentVersion) return;
    const currentCacheVersion = Number(new URL(window.location.href).searchParams.get("cache"));
    if (currentCacheVersion === latestVersion) {
      document.querySelector(".version-pill").textContent = `${appDisplayVersion} · ladda om appen`;
      return;
    }
    const target = new URL("./", window.location.href);
    target.searchParams.set("cache", String(latestVersion));
    document.querySelector(".version-pill").textContent = `${appDisplayVersion} -> build ${latestVersion}`;
    window.setTimeout(() => {
      window.location.replace(target.toString());
    }, 700);
  } catch {
    // Version checks should never interrupt logging.
  }
}

saveSyncCodeButton?.addEventListener("click", () => {
  saveSyncCode(syncCodeInput?.value || "");
});

clearSyncCodeButton?.addEventListener("click", () => {
  localStorage.removeItem(syncCodeKey);
  if (syncCodeInput) syncCodeInput.value = "";
  setSyncStatus("Kopplad från molnsynk på den här enheten. Lokal data finns kvar.");
});

syncNowButton?.addEventListener("click", syncNow);
quickSyncButton?.addEventListener("click", syncNow);

document.querySelector("#importButton").addEventListener("click", () => {
  const input = document.querySelector("#importInput");
  try {
    const imported = JSON.parse(input.value);
    const importedEntries = Array.isArray(imported) ? imported : imported.entries;
    if (!Array.isArray(importedEntries)) throw new Error("Expected entries");
    const cleaned = importedEntries
      .filter((entry) => entry && entry.date)
      .map((entry) => ({ ...emptyEntry(entry.date), ...entry }));
    if (cleaned.length === 0) throw new Error("No dated entries");
    saveEntries(cleaned);
    if (imported.goalWeight) saveGoalWeight(imported.goalWeight);
    if (imported.macroTargets) saveMacroTargets(imported.macroTargets);
    if (imported.weeklyCheckins) saveWeeklyCheckins(imported.weeklyCheckins);
    fillForm(cleaned.sort((a, b) => a.date.localeCompare(b.date)).at(-1));
    render();
    document.querySelector("#toolsNote").textContent = "Importerad data sparad i den här browsern.";
  } catch {
    document.querySelector("#toolsNote").textContent = "Importen fungerade inte. Kontrollera att du klistrat in exporterad data.";
  }
});

document.querySelector("#resetButton").addEventListener("click", () => {
  if (!window.confirm("Rensa din lokala data i den här browsern?")) return;
  localStorage.removeItem(storageKey);
  localStorage.removeItem(goalKey);
  localStorage.removeItem(macroTargetsKey);
  localStorage.removeItem(weeklyCheckinsKey);
  fillForm(emptyEntry());
  render();
});

document.querySelector("#exportButton").addEventListener("click", async () => {
  const payload = JSON.stringify({ entries: getEntries(), goalWeight: getGoalWeight(), macroTargets: getMacroTargets(), weeklyCheckins: getWeeklyCheckins() }, null, 2);
  await navigator.clipboard.writeText(payload);
  document.querySelector("#coachLine").textContent = "Data kopierad. Den kan importeras i appen på en annan enhet.";
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

const initialEntry = getEntries().at(-1) || emptyEntry();
fillForm(initialEntry);
updateTrendFilterState();
render(initialEntry.date);
initSync();
checkForAppUpdate();
