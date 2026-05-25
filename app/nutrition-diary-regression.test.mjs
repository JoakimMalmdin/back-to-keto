import { parseNutritionText } from "./nutrition-parser.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function near(actual, expected, message, tolerance = 0.01) {
  assert(Math.abs(actual - expected) <= tolerance, `${message}: fick ${actual}, väntade ${expected}.`);
}

function item(parsed, foodId) {
  const found = parsed.items.find((entry) => entry.foodId === foodId);
  assert(found, `Beräknad post saknas: ${foodId}`);
  return found;
}

let parsed = parseNutritionText("2 stekta ägg, 1 dl grekisk yoghurt 10%, 2 björnbär, 2 röda vinbär");
near(item(parsed, "agg").grams, 102, "Ägg i frukost ska räknas styckevis");
near(item(parsed, "grekisk-yoghurt-10").grams, 100, "Yoghurt i frukost ska räknas i dl");
near(item(parsed, "bjornbar-proxy").grams, 10, "Två björnbär ska använda styckmått");
near(item(parsed, "roda-vinbar-proxy").grams, 1, "Två röda vinbär ska använda styckmått");

parsed = parseNutritionText("1 glas buljong, 1 avokado, 1 burk tonfisk i vatten med 1,5 msk majonnäs, 1 tsk salt");
assert(parsed.unresolved.length === 0, "Tonfisklunchen ska vara fullt beräkningsbar i mastermotorn.");
near(item(parsed, "knorr-kottbuljong").grams, 10, "Ett glas buljong ska betyda en tärning");
near(item(parsed, "avokado").grams, 165, "En avokado ska använda deklarerat styckmått");
near(item(parsed, "ica-tonfisk-i-vatten").grams, 120, "En burk tonfisk ska använda avrunnen portionsvikt");
near(item(parsed, "hellmanns-majonnas").grams, 22.5, "Majonnäs ska kunna anges med decimal matsked");
near(item(parsed, "salt").grams, 6, "Salt ska stödja tesked utan sammanblandning med Seltin");

parsed = parseNutritionText("120 g bratwurst, 25 g surkål, 2 ägg, 1 msk majonnäs, 0,5 avokado");
assert(parsed.unresolved.length === 0, "Den fotograferade bratwurstlunchen ska vara beräkningsbar.");
near(item(parsed, "surkal").grams, 25, "Surkål i gram får inte ge dl-varning");
near(item(parsed, "avokado").grams, 82.5, "Halv avokado ska beräknas från styckmått");

parsed = parseNutritionText("1 msk kvarg, 1 tsk kvarg, 1 valnöt, 1 krm seltin, 2 tabletter magnesium 200 mg");
assert(parsed.unresolved.length === 0, "Kända felposter ska kunna beräknas tillsammans.");
near(item(parsed, "milbona-magerkvarg-naturell").grams, 15, "Första kvargmåttet ska förbli matsked");
near(item(parsed, "valnotter-proxy").grams, 4, "Valnöt ska inte falla tillbaka på normalportion");
near(item(parsed, "seltin").nutrients.potassiumMg, 252, "Ett krm Seltin ska ge rätt kalium");
near(item(parsed, "magnesiumtablett-200").nutrients.magnesiumMg, 400, "Två magnesiumtabletter ska ge 400 mg magnesium");

parsed = parseNutritionText("8 falukorvsskivor med 1 msk majonnäs, 2 plommontomater");
near(item(parsed, "falukorv-proxy").grams, 160, "Åtta falukorvsskivor ska vara 160 g, inte åtta normalportioner");
near(item(parsed, "plommontomat").grams, 40, "Plommontomater ska räknas styckevis");

parsed = parseNutritionText("1 köttfärsbit");
assert(parsed.unresolved.length === 0, "En uttrycklig köttfärsbit ska inte tappas bort.");
near(item(parsed, "kottfarsbiff-proxy").grams, 80, "En köttfärsbit ska använda sin deklarerade standardbit");

parsed = parseNutritionText("20 g fetaost, 15 g ost, 1/2 tsk linfrön, 2 glas chianti");
assert(parsed.unresolved.length === 0, "Vanliga kompletteringar ska vara beräkningsbara.");
near(item(parsed, "fetaost-proxy").grams, 20, "Fetaost ska inte bli generell ost");
near(item(parsed, "hardost-proxy").grams, 15, "Ost i gram ska behålla sin angivna mängd");
near(item(parsed, "linfron-proxy").grams, 2.5, "Halv tesked linfrön ska härledas från matsked");
near(item(parsed, "chianti-proxy").grams, 300, "Två glas Chianti ska ge två glas");

console.log("Diary regressions verified: photographed meals and known amount failures are guarded.");
