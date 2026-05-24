export const SUPPORTED_LOCALES = Object.freeze(["sv-SE", "en-GB"]);
export const DEFAULT_LOCALE = "sv-SE";

function translations(sv, en) {
  return Object.freeze({ "sv-SE": sv, "en-GB": en });
}

export const NUTRITION_CATEGORIES = Object.freeze({
  fats: translations("Matfett och oljor", "Fats and oils"),
  dairy: translations("Mejeri och ost", "Dairy and cheese"),
  meat: translations("Kött, fågel och ägg", "Meat, poultry and eggs"),
  charcuterie: translations("Chark, korv och pålägg", "Charcuterie, sausages and cold cuts"),
  seafood: translations("Fisk och skaldjur", "Fish and seafood"),
  vegetables: translations("Grönsaker, svamp och fermenterat", "Vegetables, mushrooms and fermented foods"),
  nutsSeeds: translations("Nötter, frön och kärnor", "Nuts and seeds"),
  fruitBerries: translations("Frukt och bär", "Fruit and berries"),
  seasonings: translations("Såser, kryddor och smaksättning", "Sauces, seasonings and condiments"),
  drinks: translations("Dryck, buljong och alkohol", "Drinks, stock and alcohol"),
  supplements: translations("Tillskott", "Supplements"),
  recipes: translations("Egna standardrätter", "Saved recipes"),
});

export const UNIT_DEFINITIONS = Object.freeze({
  g: { labels: translations("g", "g"), aliases: { "sv-SE": ["g", "gram"], "en-GB": ["g", "gram", "grams"] } },
  kg: { labels: translations("kg", "kg"), aliases: { "sv-SE": ["kg", "kilo"], "en-GB": ["kg", "kilogram", "kilograms"] } },
  ml: { labels: translations("ml", "ml"), aliases: { "sv-SE": ["ml"], "en-GB": ["ml"] } },
  cl: { labels: translations("cl", "cl"), aliases: { "sv-SE": ["cl"], "en-GB": ["cl"] } },
  dl: { labels: translations("dl", "dl"), aliases: { "sv-SE": ["dl"], "en-GB": ["dl"] } },
  litre: { labels: translations("liter", "litre"), aliases: { "sv-SE": ["l", "liter"], "en-GB": ["l", "litre", "litres"] } },
  tablespoon: { labels: translations("msk", "tbsp"), aliases: { "sv-SE": ["msk", "matsked"], "en-GB": ["tbsp", "tablespoon", "tablespoons"] } },
  teaspoon: { labels: translations("tsk", "tsp"), aliases: { "sv-SE": ["tsk", "tesked"], "en-GB": ["tsp", "teaspoon", "teaspoons"] } },
  pinch: { labels: translations("krm", "pinch"), aliases: { "sv-SE": ["krm", "kryddmått"], "en-GB": ["pinch", "pinches"] } },
  piece: { labels: translations("st", "piece"), aliases: { "sv-SE": ["st", "styck", "stycken"], "en-GB": ["piece", "pieces"] } },
  portion: { labels: translations("portion", "portion"), aliases: { "sv-SE": ["portion", "portioner"], "en-GB": ["portion", "portions"] } },
  tin: { labels: translations("burk", "tin"), aliases: { "sv-SE": ["burk", "burkar"], "en-GB": ["tin", "tins", "can", "cans"] } },
  glass: { labels: translations("glas", "glass"), aliases: { "sv-SE": ["glas"], "en-GB": ["glass", "glasses"] } },
  bottle: { labels: translations("flaska", "bottle"), aliases: { "sv-SE": ["flaska", "flaskor"], "en-GB": ["bottle", "bottles"] } },
  tablet: { labels: translations("tablett", "tablet"), aliases: { "sv-SE": ["tablett", "tabletter"], "en-GB": ["tablet", "tablets"] } },
  slice: { labels: translations("skiva", "slice"), aliases: { "sv-SE": ["skiva", "skivor"], "en-GB": ["slice", "slices"] } },
  cube: { labels: translations("tärning", "cube"), aliases: { "sv-SE": ["tärning", "tärningar"], "en-GB": ["cube", "cubes"] } },
});

export const SOURCE_TYPES = Object.freeze({
  productLabel: "product_label",
  livsmedelsverket: "livsmedelsverket",
  producer: "producer",
  officialFallback: "official_fallback",
  proxy: "proxy",
  estimatedRecipe: "estimated_recipe",
  unknown: "unknown",
});

export const CONFIDENCE_LEVELS = Object.freeze({
  label: "label",
  analysed: "analysed",
  calculated: "calculated",
  proxy: "proxy",
  estimated: "estimated",
});

function measure(unit, amount, grams, labels = null) {
  return Object.freeze({ unit, amount, grams, labels });
}

function source(type, name, verifiedDate, confidence, note = "") {
  return Object.freeze({ type, name, verifiedDate, confidence, note });
}

function defineFood(food) {
  return Object.freeze({
    names: null,
    aliases: { "sv-SE": [], "en-GB": [] },
    tags: [],
    measures: [],
    nutrientsPer100g: {},
    electrolyteSource: null,
    ...food,
  });
}

// Initial high-confidence cohort: products whose labels have been supplied in
// this project. This catalog is intentionally not wired into calculations yet.
export const NUTRITION_CATALOG = Object.freeze([
  defineFood({
    id: "hellmanns-majonnas",
    names: translations("Hellmann's majonnäs", "Hellmann's mayonnaise"),
    category: "seasonings",
    aliases: {
      "sv-SE": ["majonnäs", "majonnas", "majonnäs hellmanns", "hellmanns majonnäs", "hellmanns majonnas"],
      "en-GB": ["mayonnaise", "mayo", "hellmann's mayonnaise", "hellmanns mayonnaise"],
    },
    nutrientsPer100g: { kcal: 720, fat: 79, protein: 1.3, carbs: 1.4 },
    measures: [measure("tablespoon", 1, 15), measure("teaspoon", 1, 5)],
    macroSource: source(SOURCE_TYPES.productLabel, "Hellmann's Majonnäs", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy, "Kompletteras separat med verifierad mineraldata."),
    tags: ["fat_source", "sauce"],
  }),
  defineFood({
    id: "felix-ketchup-osotad",
    names: translations("Felix tomatketchup osötad", "Felix unsweetened tomato ketchup"),
    category: "seasonings",
    aliases: {
      "sv-SE": ["osötad ketchup", "osotad ketchup", "felix osötad ketchup", "felix osotad ketchup"],
      "en-GB": ["unsweetened ketchup", "felix unsweetened ketchup"],
    },
    nutrientsPer100g: { kcal: 50, fat: 0, protein: 1.5, carbs: 9.7 },
    measures: [measure("tablespoon", 1, 15), measure("teaspoon", 1, 5)],
    macroSource: source(SOURCE_TYPES.productLabel, "Felix Tomatketchup Osötad", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy, "Salt finns på etiketten men natrium/magnesium/kalium verifieras i migreringen."),
    tags: ["sauce", "carb_watch"],
  }),
  defineFood({
    id: "grekisk-yoghurt-10",
    names: translations("Grekisk yoghurt 10%", "Greek yoghurt 10%"),
    category: "dairy",
    aliases: {
      "sv-SE": ["grekisk yoghurt", "grekisk yoghurt 10%", "grekisk youghurt"],
      "en-GB": ["greek yoghurt", "greek yoghurt 10%", "full-fat greek yoghurt"],
    },
    nutrientsPer100g: { kcal: 121, fat: 10, protein: 4.6, carbs: 3.2 },
    measures: [measure("dl", 1, 100), measure("portion", 1, 150, translations("1 portion", "1 portion"))],
    macroSource: source(SOURCE_TYPES.productLabel, "Grekisk yoghurt 10%", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["dairy"],
  }),
  defineFood({
    id: "yoghurt-naturell-3",
    names: translations("Yoghurt naturell 3%", "Natural yoghurt 3%"),
    category: "dairy",
    aliases: {
      "sv-SE": ["yoghurt", "yoghurt 3%", "youghurt 3%"],
      "en-GB": ["natural yoghurt", "yoghurt 3%", "plain yoghurt"],
    },
    nutrientsPer100g: { kcal: 56, fat: 3, protein: 3.5, carbs: 3.7 },
    measures: [measure("dl", 1, 100)],
    macroSource: source(SOURCE_TYPES.productLabel, "Mild yoghurt naturell 3%", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["dairy"],
  }),
  defineFood({
    id: "vispgradde-36",
    names: translations("Vispgrädde 36%", "Whipping cream 36%"),
    category: "dairy",
    aliases: {
      "sv-SE": ["grädde 36%", "vispgrädde 36%", "vispgradde 36%"],
      "en-GB": ["cream 36%", "whipping cream 36%"],
    },
    nutrientsPer100g: { kcal: 340, fat: 36, protein: 2.3, carbs: 2.9 },
    measures: [measure("dl", 1, 100), measure("tablespoon", 1, 15)],
    macroSource: source(SOURCE_TYPES.producer, "Arla Köket Vispgrädde 36%", "2026-05-24", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Salt deklarerat; mineralprofil ej verifierad", "2026-05-24", CONFIDENCE_LEVELS.proxy),
    tags: ["dairy", "fat_source"],
  }),
  defineFood({
    id: "vispgradde-40",
    names: translations("Vispgrädde 40%", "Whipping cream 40%"),
    category: "dairy",
    aliases: {
      "sv-SE": ["grädde 40%", "vispgrädde 40%", "vispgradde 40%"],
      "en-GB": ["cream 40%", "whipping cream 40%"],
    },
    nutrientsPer100g: { kcal: 375, fat: 40, protein: 2.2, carbs: 2.9 },
    measures: [measure("dl", 1, 100), measure("tablespoon", 1, 15)],
    macroSource: source(SOURCE_TYPES.producer, "Arla Ko Färsk vispgrädde 40%", "2026-05-24", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Salt deklarerat; mineralprofil ej verifierad", "2026-05-24", CONFIDENCE_LEVELS.proxy),
    tags: ["dairy", "fat_source"],
  }),
  defineFood({
    id: "farskost-etikett",
    names: translations("Färskost", "Cream cheese"),
    category: "dairy",
    aliases: {
      "sv-SE": ["färskost", "farskost"],
      "en-GB": ["cream cheese"],
    },
    nutrientsPer100g: { kcal: 252, fat: 25, protein: 4.5, carbs: 3 },
    measures: [measure("tablespoon", 1, 15)],
    macroSource: source(SOURCE_TYPES.productLabel, "Färskost fotograferad etikett", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["dairy", "fat_source"],
  }),
  defineFood({
    id: "halloumi-zeta",
    names: translations("Halloumi", "Halloumi"),
    category: "dairy",
    aliases: {
      "sv-SE": ["halloumi", "haloumi"],
      "en-GB": ["halloumi"],
    },
    nutrientsPer100g: { kcal: 320, fat: 24, protein: 23, carbs: 2.6 },
    measures: [measure("portion", 1, 50, translations("standardportion", "standard portion"))],
    macroSource: source(SOURCE_TYPES.productLabel, "Zeta Halloumi", "2026-05-22", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Salt deklarerat; mineralprofil ej verifierad", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["dairy", "sodium_source", "protein"],
  }),
  defineFood({
    id: "ica-makrill-tomatsas",
    names: translations("ICA spansk makrillfilé i tomatsås", "ICA Spanish mackerel fillet in tomato sauce"),
    category: "seafood",
    aliases: {
      "sv-SE": ["makrill", "makrill i tomatsås", "makrill i tomatsas", "ica makrill"],
      "en-GB": ["mackerel", "mackerel in tomato sauce", "ica mackerel"],
    },
    nutrientsPer100g: { kcal: 190, fat: 14, protein: 12, carbs: 3.9 },
    measures: [measure("tin", 1, 125, translations("1 burk", "1 tin"))],
    macroSource: source(SOURCE_TYPES.productLabel, "ICA Spansk Makrillfilé i tomatsås", "2026-05-19", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Salt deklarerat; mineralprofil ej verifierad", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["fish", "protein"],
  }),
  defineFood({
    id: "ica-tonfisk-i-vatten",
    names: translations("ICA tonfisk i vatten", "ICA tuna in spring water"),
    category: "seafood",
    aliases: {
      "sv-SE": ["tonfisk i vatten", "tonfiskbitar i vatten"],
      "en-GB": ["tuna in water", "tuna in spring water"],
    },
    nutrientsPer100g: { kcal: 110, fat: 1, protein: 24, carbs: 0 },
    measures: [measure("tin", 1, 120, translations("1 burk, uppskattad avrunnen vikt", "1 tin, estimated drained weight"))],
    macroSource: source(SOURCE_TYPES.productLabel, "ICA Tonfisk i vatten", "2026-05-21", CONFIDENCE_LEVELS.label, "Värden per 100 g avrunnen vikt; burkens avrunna standardvikt måste bekräftas."),
    electrolyteSource: source(SOURCE_TYPES.proxy, "Nuvarande BTK-schablon tills natrium/mineraler kontrollerats", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["fish", "complete_protein"],
  }),
  defineFood({
    id: "kalamataoliver-etikett",
    names: translations("Kalamataoliver", "Kalamata olives"),
    category: "vegetables",
    aliases: {
      "sv-SE": ["kalamataoliver", "kalamata", "oliver"],
      "en-GB": ["kalamata olives", "olives"],
    },
    nutrientsPer100g: { kcal: 271, fat: 28.7, protein: 1.6, carbs: 0.6 },
    measures: [measure("piece", 1, 4, translations("1 oliv", "1 olive"))],
    macroSource: source(SOURCE_TYPES.productLabel, "Kalamataoliver fotograferad etikett", "2026-05-21", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.productLabel, "Kalamataoliver fotograferad etikett, salt 3,30 g/100 g", "2026-05-21", CONFIDENCE_LEVELS.calculated, "Natrium kan härledas från deklarerat salt; Ka/Mg saknas."),
    tags: ["side", "sodium_source"],
  }),
  defineFood({
    id: "seltin",
    names: translations("Seltin", "Seltin reduced-sodium salt"),
    category: "seasonings",
    aliases: {
      "sv-SE": ["seltin"],
      "en-GB": ["seltin", "reduced-sodium salt"],
    },
    nutrientsPer100g: { kcal: 0, fat: 0, protein: 0, carbs: 0, sodiumMg: 20000, potassiumMg: 21000, magnesiumMg: 1020 },
    measures: [measure("pinch", 1, 1.2), measure("teaspoon", 1, 6)],
    macroSource: source(SOURCE_TYPES.productLabel, "Seltin", "2026-05-22", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.productLabel, "Seltin", "2026-05-22", CONFIDENCE_LEVELS.label),
    tags: ["sodium_source", "potassium_source", "magnesium_source"],
  }),
  defineFood({
    id: "collagen-nyttoteket",
    names: translations("Collagen", "Collagen"),
    category: "supplements",
    aliases: {
      "sv-SE": ["collagen", "kollagen"],
      "en-GB": ["collagen"],
    },
    nutrientsPer100g: { kcal: 364, fat: 0, protein: 91, carbs: 0 },
    measures: [measure("tablespoon", 1, 15)],
    macroSource: source(SOURCE_TYPES.productLabel, "Nyttoteket Clean Collagen", "2026-05-21", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Mineraler ej relevanta/deklarerade", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["supplement", "incomplete_protein"],
  }),
]);

export function textForLocale(texts, locale = DEFAULT_LOCALE) {
  return texts?.[locale] || texts?.[DEFAULT_LOCALE] || "";
}

export function categoryName(categoryId, locale = DEFAULT_LOCALE) {
  return textForLocale(NUTRITION_CATEGORIES[categoryId], locale);
}

export function foodName(food, locale = DEFAULT_LOCALE) {
  return textForLocale(food.names, locale);
}

export function foodAliases(food) {
  return SUPPORTED_LOCALES.flatMap((locale) => food.aliases[locale] || []);
}

export function findFoodById(id) {
  return NUTRITION_CATALOG.find((food) => food.id === id) || null;
}
