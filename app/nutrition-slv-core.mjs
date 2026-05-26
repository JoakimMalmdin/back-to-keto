// Official Livsmedelsverket candidates for the first diary-validation cohort.
// These records are staged imports and do not affect calculations until they
// are deliberately promoted into the canonical nutrition catalogue.
export const SLV_SOURCE = Object.freeze({
  authority: "Livsmedelsverket, Livsmedelsdatabasen",
  apiBase: "https://dataportal.livsmedelsverket.se/livsmedel/api/v1",
  licence: "CC BY 4.0",
  retrievedDate: "2026-05-26",
});

function officialFood(selectionId, slvFoodNumber, svName, enName, nutrientsPer100g, note = "") {
  return Object.freeze({
    selectionId,
    slvFoodNumber,
    officialNames: Object.freeze({ "sv-SE": svName, "en-GB": enName }),
    nutrientsPer100g: Object.freeze(nutrientsPer100g),
    source: SLV_SOURCE,
    note,
  });
}

export const SLV_CORE_RESOLVED = Object.freeze([
  officialFood("agg", 1225, "Ägg rått", "Egg raw", {
    kcal: 137, fat: 9.7, protein: 12.2, carbs: 0.4, fiber: 0, sodiumMg: 142, potassiumMg: 132, magnesiumMg: 12,
  }, "Neutral grundpost för ägg; extra stekfett registreras separat."),
  officialFood("bacon", 1004, "Gris bacon stekt", "Pork bacon fried", {
    kcal: 412, fat: 38.8, protein: 17, carbs: 0, fiber: 0, sodiumMg: 975, potassiumMg: 255, magnesiumMg: 16,
  }, "Tillagad post eftersom bacon loggas efter stekning."),
  officialFood("avokado", 320, "Avokado", "Avocado", {
    kcal: 197, fat: 19.6, protein: 1.9, carbs: 1.7, fiber: 4.8, sodiumMg: 5, potassiumMg: 600, magnesiumMg: 32,
  }),
  officialFood("spenat", 4941, "Spenat färsk", "Spinach raw", {
    kcal: 24, fat: 0.4, protein: 3.3, carbs: 0.8, fiber: 2.1, sodiumMg: 100, potassiumMg: 730, magnesiumMg: 95,
  }),
  officialFood("surkal", 406, "Surkål konserv. m. lag", "Sauerkraut fermented cabbage canned w/ brine", {
    kcal: 17, fat: 0.2, protein: 0.9, carbs: 2, fiber: 1.7, sodiumMg: 320, potassiumMg: 260, magnesiumMg: 13,
  }),
  officialFood("kycklingfile", 1170, "Kyckling bröstfilé färsk stekt u. skinn", "Chicken breast fillet fresh meat fried w/o skin", {
    kcal: 116, fat: 2.5, protein: 23, carbs: 0, fiber: 0, sodiumMg: 72, potassiumMg: 374, magnesiumMg: 40,
  }, "Tillagad, skinnfri filé motsvarar loggad måltid bättre än rå vikt."),
  officialFood("oxfile", 3318, "Nöt oxfilé stekt", "Tenderloin/fillet of beef pan-fried", {
    kcal: 145, fat: 4.8, protein: 25.4, carbs: 0, fiber: 0, sodiumMg: 197, potassiumMg: 286, magnesiumMg: 29,
  }, "Beräknad tillagad Livsmedelsverkspost; gram i tallrikslogg tolkas som tillagad vikt."),
  officialFood("flaskkotlett-benfri", 6004, "Gris fläskkotlett tillagad", "Pork chop cooked", {
    kcal: 133, fat: 6, protein: 19.6, carbs: 0, fiber: 0, sodiumMg: 61, potassiumMg: 373, magnesiumMg: 32,
  }, "Tillagad post. Benfri mängd mäts som ätlig del."),
  officialFood("notfars-10", 951, "Nöt färs rå fett 10%", "Minced beef raw 10% fat", {
    kcal: 182, fat: 11.3, protein: 20.1, carbs: 0, fiber: 0, sodiumMg: 86, potassiumMg: 278, magnesiumMg: 20,
  }, "Köttfärs och nötfärs tolkas som samma nötråvara när 10% fetthalt uttryckligen anges."),
  officialFood("notfars-15", 963, "Nöt färs rå fett 15%", "Minced beef raw 15% fat", {
    kcal: 211, fat: 15, protein: 19.4, carbs: 0, fiber: 0, sodiumMg: 83, potassiumMg: 280, magnesiumMg: 20,
  }, "Köttfärs och nötfärs tolkas som samma nötråvara när 15% fetthalt uttryckligen anges."),
  officialFood("parmesan", 103, "Ost hårdost parmesan fett 30% typ Parmiggiano Reggiano", "Cheese hard parmesan 30% fat e.g. Parmiggiano Reggiano", {
    kcal: 428, fat: 32.2, protein: 31.1, carbs: 4.2, fiber: 0, sodiumMg: 510, potassiumMg: 87, magnesiumMg: 35,
  }),
  officialFood("smor", 29, "Smör fett 80%", "Butter 80% fat", {
    kcal: 729, fat: 82, protein: 0.4, carbs: 0.5, fiber: 0, sodiumMg: 480, potassiumMg: 0, magnesiumMg: 0,
  }, "Generisk saltad smörpost; osaltat smör behöver egen matchning vid behov."),
  officialFood("olivolja", 4659, "Olivolja extra jungfruolja", "Olive oil extra virgine", {
    kcal: 884, fat: 100, protein: 0, carbs: 0, fiber: 0, sodiumMg: 0, potassiumMg: 0, magnesiumMg: 0,
  }),
  officialFood("tomat", 364, "Tomat", "Tomato", {
    kcal: 18, fat: 0.1, protein: 0.8, carbs: 2.6, fiber: 1.3, sodiumMg: 2, potassiumMg: 240, magnesiumMg: 9,
  }),
  officialFood("plommontomat", 364, "Tomat", "Tomato", {
    kcal: 18, fat: 0.1, protein: 0.8, carbs: 2.6, fiber: 1.3, sodiumMg: 2, potassiumMg: 240, magnesiumMg: 9,
  }, "Samma generiska näringsgrund som tomat; plommontomat får eget styckmått i katalogen."),
  officialFood("zucchini", 362, "Squash", "Squash", {
    kcal: 14, fat: 0.1, protein: 0, carbs: 2.5, fiber: 1.8, sodiumMg: 0, potassiumMg: 148, magnesiumMg: 17,
  }, "Livsmedelsverkets generiska squashpost används för zucchini."),
  officialFood("gurka", 339, "Gurka", "Cucumber", {
    kcal: 13, fat: 0.1, protein: 0.8, carbs: 2.3, fiber: 0, sodiumMg: 3, potassiumMg: 160, magnesiumMg: 10,
  }),
  officialFood("jordgubbar", 526, "Jordgubbar", "Strawberries", {
    kcal: 41, fat: 0.2, protein: 0.5, carbs: 8.3, fiber: 1.9, sodiumMg: 1, potassiumMg: 130, magnesiumMg: 11,
  }),
]);

export const SLV_CORE_REVIEW = Object.freeze([
  Object.freeze({
    selectionId: "kottfarsbiff",
    candidates: Object.freeze([]),
    reason: "Bör definieras som egen standardrätt eller beräknas från vald färs och stekfett.",
  }),
  Object.freeze({
    selectionId: "fetaost",
    candidates: Object.freeze([
      Object.freeze({ slvFoodNumber: 94, name: "Salladsost fett 22%" }),
    ]),
    reason: "Livsmedelsverket har salladsost, inte entydigt fetaost; etikett eller uttryckligt proxyval behövs.",
  }),
]);
