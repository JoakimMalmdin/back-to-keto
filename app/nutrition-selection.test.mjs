import { NUTRITION_CATALOG, NUTRITION_CATEGORIES } from "./nutrition-catalog.mjs";
import {
  NUTRITION_SELECTION,
  SELECTION_STATUSES,
  SOURCE_INTENTS,
  selectedFoodsAtPriority,
} from "./nutrition-selection.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const catalogueIds = new Set(NUTRITION_CATALOG.map((food) => food.id));
const selectionIds = new Set();
const categoryIds = new Set(Object.keys(NUTRITION_CATEGORIES));

for (const food of NUTRITION_SELECTION) {
  assert(!selectionIds.has(food.id), `Dubblett i urvalet: ${food.id}`);
  selectionIds.add(food.id);
  assert(categoryIds.has(food.category), `Okänd kategori i urvalet: ${food.id}`);
  assert(food.names["sv-SE"] && food.names["en-GB"], `Språknamn saknas: ${food.id}`);
  assert(Object.values(SOURCE_INTENTS).includes(food.sourceIntent), `Källstrategi saknas: ${food.id}`);
  if (food.sourceIntent === SOURCE_INTENTS.livsmedelsverket) {
    assert(
      food.status === SELECTION_STATUSES.resolveSlv || food.status === SELECTION_STATUSES.inCatalogue,
      `SLV-post ska vara matchad eller kvar i kön: ${food.id}`,
    );
    assert(food.slvQuery, `SLV-sökterm saknas: ${food.id}`);
  }
  if (food.status === SELECTION_STATUSES.inCatalogue) {
    assert(catalogueIds.has(food.existingCatalogId), `Katalogpost saknas för verifierad urvalspost: ${food.id}`);
  }
}

for (const food of NUTRITION_CATALOG) {
  assert(NUTRITION_SELECTION.some((entry) => entry.existingCatalogId === food.id), `Befintlig katalogpost saknas i urvalet: ${food.id}`);
}

const core = selectedFoodsAtPriority(1);
assert(core.length >= 30, "Kärnurvalet ska täcka verkliga loggdagar.");
assert(core.some((food) => food.id === "agg"), "Ägg ska finnas i kärnurvalet.");
assert(core.some((food) => food.id === "avokado"), "Avokado ska finnas i kärnurvalet.");
assert(core.some((food) => food.id === "knorr-kottbuljong"), "Fotograferad buljong ska finnas i kärnurvalet.");

console.log(`Nutrition selection verified: ${NUTRITION_SELECTION.length} selected foods, ${core.length} in core cohort.`);
