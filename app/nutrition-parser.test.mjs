import { parseNutritionText } from "./nutrition-parser.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function near(actual, expected, message) {
  assert(Math.abs(actual - expected) < 0.001, `${message}: fick ${actual}, väntade ${expected}.`);
}

let parsed = parseNutritionText("1 tsk kvarg");
assert(parsed.unresolved.length === 0, "Tesked kvarg ska kunna beräknas.");
near(parsed.items[0].grams, 5, "1 tsk kvarg ska vara 5 g");
near(parsed.totals.carbs, 0.2, "1 tsk kvarg ska ge rätt kolhydratvärde");
near(parsed.totals.protein, 0.5, "1 tsk kvarg ska ge rätt proteinvärde");

parsed = parseNutritionText("1 msk kvarg");
near(parsed.items[0].grams, 15, "1 msk kvarg ska vara 15 g");
near(parsed.totals.carbs, 0.6, "1 msk kvarg ska ge rätt kolhydratvärde");

parsed = parseNutritionText("2 burkar tonfisk i vatten med 1,5 msk majonnäs");
assert(parsed.unresolved.length === 0, "Tonfisk och majonnäs ska kunna beräknas.");
near(parsed.items.find((item) => item.foodId === "ica-tonfisk-i-vatten").grams, 240, "Två burkar tonfisk ska ge två standardburkar");
near(parsed.items.find((item) => item.foodId === "hellmanns-majonnas").grams, 22.5, "1,5 msk majonnäs ska bli gram");

parsed = parseNutritionText("1 valnöt");
assert(parsed.unresolved.length === 0, "En valnöt ska räknas som ett deklarerat styckmått.");
near(parsed.items[0].grams, 4, "En valnöt ska vara cirka 4 g");
near(parsed.totals.carbs, 0.56, "En valnöt får inte räknas som en 30-gramsportion");

parsed = parseNutritionText("30 g valnötter");
near(parsed.items[0].grams, 30, "Valnötter i gram ska fortfarande använda angiven vikt");

parsed = parseNutritionText("1 falukorv");
assert(parsed.items.length === 0, "En hel falukorv utan gram får inte räknas som en skiva.");
assert(parsed.unresolved.length === 1, "Otydlig falukorv ska markeras för komplettering.");

parsed = parseNutritionText("2 stekta ägg, 0,5 avokado och 5 små jordgubbar");
near(parsed.items.find((item) => item.foodId === "agg").grams, 102, "Två ägg ska tolkas som två stycken");
near(parsed.items.find((item) => item.foodId === "avokado").grams, 82.5, "En halv avokado ska använda styckmått");
near(parsed.items.find((item) => item.foodId === "jordgubbar").grams, 45, "Fem små jordgubbar ska använda styckmått");

parsed = parseNutritionText("4 krm seltin");
near(parsed.items[0].grams, 4.8, "Fyra krm Seltin ska ge rätt gram");
near(parsed.totals.potassiumMg, 1008, "Fyra krm Seltin ska ge kalium från etiketten");

parsed = parseNutritionText("0,7 buljong");
near(parsed.items[0].grams, 7, "Buljong utan utskrivet mått ska bara använda uttryckligt implicit tärningsmått");
near(parsed.totals.carbs, 1.61, "0,7 buljong ska beräknas från torr tärning utan att bli en hel portion");

parsed = parseNutritionText("0,5 dl grädde 40%");
assert(parsed.unresolved.length === 0, "Grädde med angiven fetthalt ska kunna beräknas.");
near(parsed.items[0].grams, 50, "En halv dl grädde ska bli 50 g");
near(parsed.totals.fat, 20, "En halv dl 40-procentig grädde ska ge rätt fett");

parsed = parseNutritionText("1 tsk grädde 40%");
assert(parsed.items[0].conversionMethod === "derived_measure", "Tesked grädde ska märkas som härledd från msk.");
near(parsed.items[0].grams, 5, "Härledd tesked grädde ska vara 5 g");

parsed = parseNutritionText("2 tsk yoghurt 3%");
assert(parsed.items[0].conversionMethod === "derived_measure", "Tesked yoghurt ska kunna härledas från dl.");
near(parsed.items[0].grams, 10, "Två teskedar yoghurt ska vara 10 g när 1 dl är 100 g");
near(parsed.totals.carbs, 0.37, "Två teskedar yoghurt ska ge rätt kolhydratvärde");

parsed = parseNutritionText("20 g halloumi");
assert(parsed.unresolved.length === 0, "Gram ska alltid kunna användas för livsmedel.");
near(parsed.totals.protein, 4.6, "20 g halloumi ska beräknas från värde per 100 g");

parsed = parseNutritionText("120 g bratwurst");
assert(parsed.unresolved.length === 0, "Bratwurst i gram ska kunna beräknas.");
near(parsed.totals.fat, 28.8, "120 g bratwurst ska använda etikettens fettvärde");
near(parsed.totals.protein, 15.6, "120 g bratwurst ska använda etikettens proteinvärde");
near(parsed.totals.carbs, 3.36, "120 g bratwurst ska använda etikettens kolhydratvärde");

parsed = parseNutritionText("1 tbsp mayonnaise", { locale: "en-GB" });
assert(parsed.items[0].label === "Hellmann's mayonnaise", "Engelsk text ska lösas mot samma produkt.");
near(parsed.items[0].grams, 15, "En engelsk matsked majonnäs ska bli 15 g");

parsed = parseNutritionText("1 burk kvarg");
assert(parsed.items.length === 0, "Burk kvarg får inte räknas som standardportion.");
assert(parsed.unresolved[0].reason === "unsupported_measure", "Burk kvarg ska markeras som ej definierat mått.");

parsed = parseNutritionText("kvarg");
assert(parsed.items.length === 0, "Kvarg utan mängd får inte beräknas.");
assert(parsed.unresolved[0].reason === "missing_quantity", "Kvarg utan mängd ska flaggas.");

parsed = parseNutritionText("25 g halloumi\n1 dl grekisk yoghurt");
near(parsed.items.find((item) => item.foodId === "halloumi-zeta").grams, 25, "Halloumi får inte ärva nästa måltids dl-mått");
near(parsed.items.find((item) => item.foodId === "grekisk-yoghurt-10").grams, 100, "Yoghurt på ny måltidsrad ska behålla eget dl-mått");

parsed = parseNutritionText("halloumi\n1 dl grekisk yoghurt");
assert(parsed.unresolved.some((item) => item.foodId === "halloumi-zeta"), "Halloumi utan egen mängd får inte ärva nästa måltids mått.");
near(parsed.items.find((item) => item.foodId === "grekisk-yoghurt-10").grams, 100, "Yoghurt ska fortsatt beräknas från sitt egna mått.");

console.log("Nutrition parser verified: explicit, derived and unresolved measures behave as intended.");
