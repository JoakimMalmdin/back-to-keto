export const NUTRITION_CATEGORIES = Object.freeze({
  fats: "Matfett och oljor",
  dairy: "Mejeri och ost",
  meat: "Kött, fågel och ägg",
  charcuterie: "Chark, korv och pålägg",
  seafood: "Fisk och skaldjur",
  vegetables: "Grönsaker, svamp och fermenterat",
  nutsSeeds: "Nötter, frön och kärnor",
  fruitBerries: "Frukt och bär",
  seasonings: "Såser, kryddor och smaksättning",
  drinks: "Dryck, buljong och alkohol",
  supplements: "Tillskott",
  recipes: "Egna standardrätter",
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
  label: "etikett",
  analysed: "analyserat",
  calculated: "beräknat",
  proxy: "proxy",
  estimated: "egen_uppskattning",
});

function measure(unit, amount, grams, label = null) {
  return Object.freeze({ unit, amount, grams, label });
}

function source(type, name, verifiedDate, confidence, note = "") {
  return Object.freeze({ type, name, verifiedDate, confidence, note });
}

function defineFood(food) {
  return Object.freeze({
    aliases: [],
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
    name: "Hellmann's majonnäs",
    category: "seasonings",
    aliases: ["majonnäs", "majonnas", "majonnäs hellmanns", "hellmanns majonnäs", "hellmanns majonnas"],
    nutrientsPer100g: { kcal: 720, fat: 79, protein: 1.3, carbs: 1.4 },
    measures: [measure("msk", 1, 15), measure("tsk", 1, 5)],
    macroSource: source(SOURCE_TYPES.productLabel, "Hellmann's Majonnäs", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy, "Kompletteras separat med verifierad mineraldata."),
    tags: ["fettkälla", "sås"],
  }),
  defineFood({
    id: "felix-ketchup-osotad",
    name: "Felix tomatketchup osötad",
    category: "seasonings",
    aliases: ["osötad ketchup", "osotad ketchup", "felix osötad ketchup", "felix osotad ketchup"],
    nutrientsPer100g: { kcal: 50, fat: 0, protein: 1.5, carbs: 9.7 },
    measures: [measure("msk", 1, 15), measure("tsk", 1, 5)],
    macroSource: source(SOURCE_TYPES.productLabel, "Felix Tomatketchup Osötad", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy, "Salt finns på etiketten men natrium/magnesium/kalium verifieras i migreringen."),
    tags: ["sås", "kolhydratkontroll"],
  }),
  defineFood({
    id: "grekisk-yoghurt-10",
    name: "Grekisk yoghurt 10%",
    category: "dairy",
    aliases: ["grekisk yoghurt", "grekisk yoghurt 10%", "grekisk youghurt"],
    nutrientsPer100g: { kcal: 121, fat: 10, protein: 4.6, carbs: 3.2 },
    measures: [measure("dl", 1, 100), measure("portion", 1, 150, "1 portion")],
    macroSource: source(SOURCE_TYPES.productLabel, "Grekisk yoghurt 10%", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["mejeri"],
  }),
  defineFood({
    id: "yoghurt-naturell-3",
    name: "Yoghurt naturell 3%",
    category: "dairy",
    aliases: ["yoghurt", "yoghurt 3%", "youghurt 3%"],
    nutrientsPer100g: { kcal: 56, fat: 3, protein: 3.5, carbs: 3.7 },
    measures: [measure("dl", 1, 100)],
    macroSource: source(SOURCE_TYPES.productLabel, "Mild yoghurt naturell 3%", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["mejeri"],
  }),
  defineFood({
    id: "farskost-etikett",
    name: "Färskost",
    category: "dairy",
    aliases: ["färskost", "farskost", "cream cheese"],
    nutrientsPer100g: { kcal: 252, fat: 25, protein: 4.5, carbs: 3 },
    measures: [measure("msk", 1, 15)],
    macroSource: source(SOURCE_TYPES.productLabel, "Färskost fotograferad etikett", "2026-05-20", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Ej deklarerat på etikett", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["mejeri", "fettkälla"],
  }),
  defineFood({
    id: "halloumi-zeta",
    name: "Halloumi",
    category: "dairy",
    aliases: ["halloumi", "haloumi"],
    nutrientsPer100g: { kcal: 320, fat: 24, protein: 23, carbs: 2.6 },
    measures: [measure("portion", 1, 50, "standardportion")],
    macroSource: source(SOURCE_TYPES.productLabel, "Zeta Halloumi", "2026-05-22", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Salt deklarerat; mineralprofil ej verifierad", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["mejeri", "natriumkälla", "protein"],
  }),
  defineFood({
    id: "ica-makrill-tomatsas",
    name: "ICA spansk makrillfilé i tomatsås",
    category: "seafood",
    aliases: ["makrill", "makrill i tomatsås", "makrill i tomatsas", "ica makrill"],
    nutrientsPer100g: { kcal: 190, fat: 14, protein: 12, carbs: 3.9 },
    measures: [measure("burk", 1, 125, "1 burk")],
    macroSource: source(SOURCE_TYPES.productLabel, "ICA Spansk Makrillfilé i tomatsås", "2026-05-19", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Salt deklarerat; mineralprofil ej verifierad", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["fisk", "protein"],
  }),
  defineFood({
    id: "ica-tonfisk-i-vatten",
    name: "ICA tonfisk i vatten",
    category: "seafood",
    aliases: ["tonfisk i vatten", "tonfiskbitar i vatten"],
    nutrientsPer100g: { kcal: 110, fat: 1, protein: 24, carbs: 0 },
    measures: [measure("burk", 1, 120, "1 burk, uppskattad avrunnen vikt")],
    macroSource: source(SOURCE_TYPES.productLabel, "ICA Tonfisk i vatten", "2026-05-21", CONFIDENCE_LEVELS.label, "Värden per 100 g avrunnen vikt; burkens avrunna standardvikt måste bekräftas."),
    electrolyteSource: source(SOURCE_TYPES.proxy, "Nuvarande BTK-schablon tills natrium/mineraler kontrollerats", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["fisk", "fullvärdigt_protein"],
  }),
  defineFood({
    id: "kalamataoliver-etikett",
    name: "Kalamataoliver",
    category: "vegetables",
    aliases: ["kalamataoliver", "kalamata", "oliver"],
    nutrientsPer100g: { kcal: 271, fat: 28.7, protein: 1.6, carbs: 0.6 },
    measures: [measure("st", 1, 4, "1 oliv")],
    macroSource: source(SOURCE_TYPES.productLabel, "Kalamataoliver fotograferad etikett", "2026-05-21", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.productLabel, "Kalamataoliver fotograferad etikett, salt 3,30 g/100 g", "2026-05-21", CONFIDENCE_LEVELS.calculated, "Natrium kan härledas från deklarerat salt; Ka/Mg saknas."),
    tags: ["tillbehör", "natriumkälla"],
  }),
  defineFood({
    id: "seltin",
    name: "Seltin",
    category: "seasonings",
    aliases: ["seltin"],
    nutrientsPer100g: { kcal: 0, fat: 0, protein: 0, carbs: 0, sodiumMg: 20000, potassiumMg: 21000, magnesiumMg: 1020 },
    measures: [measure("krm", 1, 1.2), measure("tsk", 1, 6)],
    macroSource: source(SOURCE_TYPES.productLabel, "Seltin", "2026-05-22", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.productLabel, "Seltin", "2026-05-22", CONFIDENCE_LEVELS.label),
    tags: ["natriumkälla", "kaliumkälla", "magnesiumkälla"],
  }),
  defineFood({
    id: "collagen-nyttoteket",
    name: "Collagen",
    category: "supplements",
    aliases: ["collagen", "kollagen"],
    nutrientsPer100g: { kcal: 364, fat: 0, protein: 91, carbs: 0 },
    measures: [measure("msk", 1, 15)],
    macroSource: source(SOURCE_TYPES.productLabel, "Nyttoteket Clean Collagen", "2026-05-21", CONFIDENCE_LEVELS.label),
    electrolyteSource: source(SOURCE_TYPES.unknown, "Mineraler ej relevanta/deklarerade", "2026-05-23", CONFIDENCE_LEVELS.proxy),
    tags: ["tillskott", "ej_fullvärdigt_protein"],
  }),
]);

export function findFoodById(id) {
  return NUTRITION_CATALOG.find((food) => food.id === id) || null;
}
