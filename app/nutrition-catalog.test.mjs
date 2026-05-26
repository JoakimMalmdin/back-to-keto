import {
  CONFIDENCE_LEVELS,
  NUTRITION_CATALOG,
  NUTRITION_CATEGORIES,
  SOURCE_TYPES,
  SUPPORTED_LOCALES,
  UNIT_DEFINITIONS,
  categoryName,
  findFoodById,
  foodAliases,
  foodName,
} from "./nutrition-catalog.mjs";
import { UI_LOCALES, uiText } from "./locales.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const categoryIds = new Set(Object.keys(NUTRITION_CATEGORIES));
const unitIds = new Set(Object.keys(UNIT_DEFINITIONS));
const ids = new Set();

for (const locale of SUPPORTED_LOCALES) {
  assert(UI_LOCALES[locale], `UI-språk saknas: ${locale}`);
  assert(categoryName("seafood", locale), `Översättning saknas för fiskkategori: ${locale}`);
}

for (const food of NUTRITION_CATALOG) {
  assert(!ids.has(food.id), `Dubblett-id: ${food.id}`);
  ids.add(food.id);
  assert(categoryIds.has(food.category), `Okänd kategori för ${food.id}: ${food.category}`);
  assert(food.macroSource?.type, `Makrokälla saknas för ${food.id}`);
  assert(food.macroSource?.verifiedDate, `Verifieringsdatum saknas för ${food.id}`);
  assert(Number.isFinite(food.nutrientsPer100g.kcal), `kcal saknas för ${food.id}`);
  assert(Object.hasOwn(food.nutrientsPer100g, "fiber"), `Fiberfält saknas för ${food.id}`);
  assert(food.nutrientsPer100g.fiber === null || Number.isFinite(food.nutrientsPer100g.fiber), `Ogiltigt fibervärde för ${food.id}`);
  assert(Object.hasOwn(food.nutrientsPer100g, "omega3"), `O-3-fält saknas för ${food.id}`);
  assert(food.nutrientsPer100g.omega3 === null || Number.isFinite(food.nutrientsPer100g.omega3), `Ogiltigt O-3-värde för ${food.id}`);
  assert(Object.hasOwn(food.nutrientsPer100g, "omega6"), `O-6-fält saknas för ${food.id}`);
  assert(food.nutrientsPer100g.omega6 === null || Number.isFinite(food.nutrientsPer100g.omega6), `Ogiltigt O-6-värde för ${food.id}`);
  assert(Array.isArray(food.measures), `Måttform saknas för ${food.id}`);
  for (const locale of SUPPORTED_LOCALES) {
    assert(foodName(food, locale), `Visningsnamn saknas för ${food.id}: ${locale}`);
    assert((food.aliases[locale] || []).length > 0, `Alias saknas för ${food.id}: ${locale}`);
  }
  for (const entry of food.measures) {
    assert(unitIds.has(entry.unit), `Okänd måttenhet för ${food.id}: ${entry.unit}`);
  }
}

const nonCalculableRuleIds = new Set(["notfars-fat-required"]);
const supplementalGaps = NUTRITION_CATALOG
  .filter((food) => !nonCalculableRuleIds.has(food.id))
  .flatMap((food) => ["fiber", "omega3", "omega6"]
    .filter((nutrient) => !Number.isFinite(food.nutrientsPer100g[nutrient]))
    .map((nutrient) => `${food.id}:${nutrient}`));
assert(
  supplementalGaps.length === 0,
  `Berakningsbara livsmedel saknar fiber/O3/O6: ${supplementalGaps.join(", ")}`,
);

const seltin = findFoodById("seltin");
assert(seltin.electrolyteSource.type === SOURCE_TYPES.productLabel, "Seltin ska läsa elektrolyter från etiketten.");
assert(seltin.electrolyteSource.confidence === CONFIDENCE_LEVELS.label, "Seltin ska vara etikettverifierad.");
assert(seltin.measures.some((entry) => entry.unit === "pinch"), "Seltin ska stödja krm/pinch.");
assert(foodAliases(seltin).includes("reduced-sodium salt"), "Seltin ska kunna kännas igen på engelska.");
assert(seltin.nutrientsPer100g.fiber === 0 && seltin.nutrientsPer100g.omega3 === 0 && seltin.nutrientsPer100g.omega6 === 0, "Seltin ska inte visa okända fiber- eller fettsyrevärden.");

const salt = findFoodById("salt");
assert(salt.nutrientsPer100g.fiber === 0 && salt.nutrientsPer100g.omega3 === 0 && salt.nutrientsPer100g.omega6 === 0, "Salt ska ha nollvärden för fiber och fettsyror.");
assert(salt.nutrientsPer100g.sodiumMg === 39300 && salt.nutrientsPer100g.potassiumMg === 0, "Salt ska redovisa milligram natrium utan att tillskriva kalium.");

const mayonnaise = findFoodById("hellmanns-majonnas");
assert(mayonnaise.macroSource.type === SOURCE_TYPES.productLabel, "Hellmann's ska behålla etiketten som makrokälla.");
assert(mayonnaise.fattyAcidSource.type === SOURCE_TYPES.livsmedelsverket, "Hellmann's ska bära en beräknad LD-baserad fettsyreprofil.");
assert(mayonnaise.nutrientsPer100g.omega3 === 6.7 && mayonnaise.nutrientsPer100g.omega6 === 14.9, "Hellmann's ska beräknas från 79 g fett och rapsoljans profil.");
assert(mayonnaise.nutrientsPer100g.fiber === 0, "Hellmann's ska kompletteras med verifierat nollvärde för fiber.");

const olives = findFoodById("kalamataoliver-etikett");
assert(olives.macroSource.type === SOURCE_TYPES.productLabel, "Kalamata ska behålla etikettens makron.");
assert(olives.fattyAcidSource.type === SOURCE_TYPES.livsmedelsverket, "Kalamata ska få beräknad LD-baserad fettsyreprofil.");
assert(olives.nutrientsPer100g.omega3 === 0.2 && olives.nutrientsPer100g.omega6 === 1.8, "Kalamata ska viktas mot LD:s avrunna olivprofil.");

const tuna = findFoodById("ica-tonfisk-i-vatten");
assert(tuna.measures.some((entry) => entry.unit === "tin"), "Tonfisk i vatten ska stödja burk/tin.");
assert(foodAliases(tuna).includes("tuna in water"), "Tonfisk i vatten ska kunna kännas igen på engelska.");
assert(tuna.macroSource.type === SOURCE_TYPES.productLabel, "Tonfisk ska behålla produktetiketten som makrokälla.");
assert(tuna.fattyAcidSource.type === SOURCE_TYPES.livsmedelsverket, "Tonfisk ska kunna kompletteras med LD-fettsyreprofil.");
assert(tuna.nutrientsPer100g.omega3 === 0.2 && tuna.nutrientsPer100g.omega6 === 0, "Tonfisk ska få O-3/O-6 från motsvarande LD-post.");

const saebyMackerel = findFoodById("saeby-makrill-tomatsas");
assert(saebyMackerel.macroSource.type === SOURCE_TYPES.productLabel, "Sæby-makrill ska vara en egen etikettpost.");
assert(saebyMackerel.nutrientsPer100g.fat === 10 && saebyMackerel.nutrientsPer100g.protein === 14, "Sæby-makrill får inte återanvända ICA:s makron.");
assert(saebyMackerel.nutrientsPer100g.omega3 === 2.2 && saebyMackerel.nutrientsPer100g.omega6 === 0.7, "Sæby-makrill ska behålla deklarerat O3 och komplettera O6 från jämförbar LD-post.");

const bratwurst = findFoodById("bratwurst-87-kott-kummin-vitlok");
assert(bratwurst.nutrientsPer100g.fat === 24, "Bratwurst ska använda etikettens fettvärde.");
assert(bratwurst.nutrientsPer100g.sodiumMg === 760, "Bratwurst ska härleda natrium från deklarerat salt.");
assert(bratwurst.electrolyteSource.confidence === CONFIDENCE_LEVELS.calculated, "Bratwurstnatrium ska markeras som beräknat.");
assert(bratwurst.nutrientsPer100g.fiber === 0 && bratwurst.nutrientsPer100g.omega6 === 1.1, "Bratwurst ska kompletteras med jämförbar LD-korvpost.");

const meatballs = findFoodById("matriket-svenska-kottbullar-73");
assert(meatballs.nutrientsPer100g.carbs === 8.5, "Matriket-köttbullar ska använda etikettens kolhydratvärde.");
assert(meatballs.nutrientsPer100g.fiber === 4, "Matriket-köttbullar ska använda etikettens fibervärde.");
assert(meatballs.nutrientsPer100g.sodiumMg === 629, "Matriket-köttbullar ska härleda natrium från deklarerat salt.");
assert(meatballs.measures.length === 0, "Köttbullar får inte få styckmått innan styckvikten har kontrollerats.");
assert(meatballs.nutrientsPer100g.omega3 === 0.1 && meatballs.nutrientsPer100g.omega6 === 1.1, "Köttbullars fettsyror ska kompletteras från jämförbar LD-post.");

const yoghurt = findFoodById("grekisk-yoghurt-10");
assert(yoghurt.measures.some((entry) => entry.unit === "dl"), "Grekisk yoghurt ska stödja dl.");
assert(foodName(yoghurt, "en-GB") === "Greek yoghurt 10%", "Brittisk stavning ska använda yoghurt.");
assert(yoghurt.nutrientsPer100g.fiber === 0, "Grekisk yoghurt ska ange noll fiber.");
assert(yoghurt.nutrientsPer100g.omega3 === 0.1 && yoghurt.nutrientsPer100g.omega6 === 0.3, "Grekisk yoghurt ska kompletteras med LD:s 10%-yoghurtprofil.");

const quark = findFoodById("milbona-magerkvarg-naturell");
assert(quark.nutrientsPer100g.carbs === 4, "Milbona-kvarg ska ha etikettens kolhydrater per 100 g.");
assert(quark.measures.some((entry) => entry.unit === "tablespoon" && entry.grams === 15), "Kvarg ska stödja matsked.");
assert(quark.measures.some((entry) => entry.unit === "teaspoon" && entry.grams === 5), "Kvarg ska stödja tesked.");

const cream36 = findFoodById("vispgradde-36");
const cream40 = findFoodById("vispgradde-40");
assert(cream36.nutrientsPer100g.fat === 36, "Vispgrädde 36% ska ha produktens angivna fetthalt.");
assert(cream40.nutrientsPer100g.fat === 40, "Vispgrädde 40% ska ha produktens angivna fetthalt.");
assert(cream36.nutrientsPer100g.omega3 === 0.3 && cream36.nutrientsPer100g.omega6 === 0.5, "Vispgrädde 36% ska ha fettviktad LD-profil.");
assert(cream40.nutrientsPer100g.omega3 === 0.3 && cream40.nutrientsPer100g.omega6 === 0.6, "Vispgrädde 40% ska ha motsvarande LD-profil.");
assert(!foodAliases(cream36).includes("grädde"), "Grädde utan fetthalt får inte implicit betyda 36%.");
assert(!foodAliases(cream40).includes("grädde"), "Grädde utan fetthalt får inte implicit betyda 40%.");

const creamCheese = findFoodById("farskost-etikett");
const feta = findFoodById("fetaost-proxy");
assert(creamCheese.nutrientsPer100g.fiber === 0 && creamCheese.nutrientsPer100g.omega6 === 0.6, "Färskost ska kompletteras med verifierbar fiber-/fettsyreprofil.");
assert(feta.nutrientsPer100g.fiber === 0 && feta.nutrientsPer100g.omega6 === 0.8, "Fetaostschablonen ska kompletteras från närliggande salladsostpost.");

const coffee = findFoodById("kaffe");
assert(coffee.electrolyteSource.type === SOURCE_TYPES.livsmedelsverket, "Kaffe ska använda Livsmedelsverkets analyserade elektrolytvärden.");
assert(coffee.nutrientsPer100g.sodiumMg === 4, "Kaffe ska ha LD:s natriumvärde för elektrolytbilden.");
assert(coffee.nutrientsPer100g.potassiumMg === 102, "Kaffe ska ha LD:s kaliumvärde för elektrolytbilden.");
assert(coffee.nutrientsPer100g.magnesiumMg === 8, "Kaffe ska ha LD:s magnesiumvärde för elektrolytbilden.");
assert(coffee.measures.some((entry) => entry.unit === "cup" && entry.grams === 200), "En kopp kaffe ska motsvara 200 ml.");

const cucumber = findFoodById("gurka");
assert(cucumber.measures.some((entry) => entry.unit === "slice" && entry.grams === 15), "Gurka ska stödja en skiva om ca 15 g.");

const walnut = findFoodById("valnotter-proxy");
assert(walnut.measures.some((entry) => entry.unit === "piece" && entry.grams === 4), "Valnöt ska ha kontrollerat styckmått.");
assert(walnut.implicitUnit === "piece", "Valnöt utan enhetsord ska bara få använda stycklogik när antal anges.");
assert(walnut.nutrientsPer100g.omega3 === 8.5 && walnut.nutrientsPer100g.omega6 === 37.7, "Valnötter ska bära LD:s fettsyrevärden.");
assert(walnut.fattyAcidSource.type === SOURCE_TYPES.livsmedelsverket, "Valnötters fettsyreprofil ska vara spårad till LD.");

const avocado = findFoodById("avokado");
assert(avocado.macroSource.type === SOURCE_TYPES.livsmedelsverket, "Avokado ska vara importerad från SLV-kärnan.");
assert(avocado.nutrientsPer100g.potassiumMg === 600, "Avokado ska bära officiellt kaliumvärde i masterkatalogen.");
assert(avocado.nutrientsPer100g.fiber === 4.8, "Avokado ska bära officiellt fibervärde i masterkatalogen.");
assert(avocado.nutrientsPer100g.omega3 === 0.2 && avocado.nutrientsPer100g.omega6 === 2.4, "Avokado ska bära SLV-baserade O-3/O-6-värden.");
assert(avocado.fattyAcidSource.type === SOURCE_TYPES.livsmedelsverket, "Helt LD-baserade poster ska ange fettsyrekälla.");

const salmon = findFoodById("laxfile");
assert(salmon.nutrientsPer100g.omega3 === 1.8 && salmon.nutrientsPer100g.omega6 === 1.9, "Lax ska få LD:s fettsyrevärden.");

const cheddar = findFoodById("cheddar");
const gouda = findFoodById("gouda");
const brie = findFoodById("brie");
const mozzarella = findFoodById("mozzarella");
assert(cheddar.fattyAcidSource.type === SOURCE_TYPES.usdaFoodDataCentral, "Cheddar ska få sin exakta USDA-fettsyreprofil.");
assert(cheddar.nutrientsPer100g.omega3 === 0.1 && cheddar.nutrientsPer100g.omega6 === 1.2, "Cheddars USDA-värden ska anges per 100 g.");
assert(gouda.fattyAcidSource.type === SOURCE_TYPES.usdaFoodDataCentral, "Gouda ska få sin exakta USDA-fettsyreprofil.");
assert(gouda.nutrientsPer100g.omega3 === 0.4 && gouda.nutrientsPer100g.omega6 === 0.3, "Goudas USDA-värden ska anges per 100 g.");
assert(brie.fattyAcidSource.type === SOURCE_TYPES.livsmedelsverket && brie.nutrientsPer100g.omega6 === 0.8, "Brie ska prioritera motsvarande LD-post framför USDA.");
assert(mozzarella.fattyAcidSource.type === SOURCE_TYPES.livsmedelsverket && mozzarella.nutrientsPer100g.omega6 === 0.5, "Mozzarella ska prioritera motsvarande LD-post framför USDA.");

const egg = findFoodById("agg");
assert(egg.measures.some((entry) => entry.unit === "piece"), "Ägg ska stödja tydliga styckeangivelser.");

const patty = findFoodById("kottfarsbiff-proxy");
assert(patty.measures.some((entry) => entry.unit === "piece" && entry.grams === 80), "Köttfärsbit ska ha uttryckligt styckmått.");

const mincedBeefRule = findFoodById("notfars-fat-required");
const mincedBeef10 = findFoodById("notfars-10");
const mincedBeef12 = findFoodById("notfars-12");
const mincedBeef15 = findFoodById("notfars-15");
assert(mincedBeefRule.requiresVariant === "fat_percentage", "Köttfärs utan fetthalt ska blockeras i stället för att beräknas.");
assert(mincedBeef10.macroSource.type === SOURCE_TYPES.livsmedelsverket, "Nötfärs 10% ska använda officiell källa.");
assert(mincedBeef10.nutrientsPer100g.fat === 11.3, "Nötfärs 10% ska behålla SLV-postens analyserade fettvärde.");
assert(mincedBeef12.macroSource.type === SOURCE_TYPES.proxy, "Nötfärs 12% ska vara synligt schablonmärkt tills etikett finns.");
assert(mincedBeef12.nutrientsPer100g.fiber === 0 && mincedBeef12.nutrientsPer100g.omega3 === 0.1 && mincedBeef12.nutrientsPer100g.omega6 === 0.4, "Nötfärs 12% ska använda samma verifierade fiber-/fettsyreprofil som närliggande fetthalter.");
assert(mincedBeef15.nutrientsPer100g.fat === 15, "Nötfärs 15% ska använda officiellt fettvärde.");

const cashews = findFoodById("cashewnotter");
const peanuts = findFoodById("jordnotter");
assert(cashews.nutrientsPer100g.fiber === 8.3 && cashews.nutrientsPer100g.omega6 === 8.9, "Cashewnötter ska ha LD:s fiber- och fettsyrekomplettering.");
assert(peanuts.nutrientsPer100g.fiber === 8.1 && peanuts.nutrientsPer100g.omega6 === 15.5, "Jordnötter ska ha LD:s fiber- och fettsyrekomplettering.");

const bearnaise = findFoodById("bearnaise");
const cabbage = findFoodById("spetskal");
const pulledPork = findFoodById("pulled-pork");
assert(bearnaise.nutrientsPer100g.fiber === 0.1 && bearnaise.nutrientsPer100g.omega3 === 3.7, "Bearnaise ska ha sin officiella tillaggsprofil.");
assert(cabbage.nutrientsPer100g.fiber === 2.6 && cabbage.nutrientsPer100g.omega6 === 0, "Spetskal ska kompletteras fran jamforbar kalpost.");
assert(pulledPork.nutrientsPer100g.fiber === 0.8 && pulledPork.nutrientsPer100g.omega6 === 0.9, "Pulled pork ska ha verifierad tillaggsprofil.");

assert(uiText("sv-SE", "currentMacros") === "Aktuell makrobild", "Svensk UI-text saknas.");
assert(uiText("en-GB", "currentMacros") === "Current macros", "Engelsk UI-text saknas.");

console.log(`Nutrition catalogue foundation verified: ${NUTRITION_CATALOG.length} canonical foods, ${categoryIds.size} categories, ${SUPPORTED_LOCALES.length} locales.`);
