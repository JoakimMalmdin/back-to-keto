// Migration inventory only. Nutrition values continue to live in the verified
// catalogue after a product label or an SLV food identifier has been resolved.
export const SOURCE_INTENTS = Object.freeze({
  productLabel: "product_label",
  producer: "producer",
  livsmedelsverket: "livsmedelsverket",
  proxy: "proxy",
  inputRule: "input_rule",
});

export const SELECTION_STATUSES = Object.freeze({
  inCatalogue: "in_catalogue",
  labelToMigrate: "label_to_migrate",
  labelNeeded: "label_needed",
  resolveSlv: "resolve_slv",
});

export const SELECTION_PRIORITIES = Object.freeze({
  core: 1,
  useful: 2,
  later: 3,
});

function selectedFood(id, svName, enName, category, priority, sourceIntent, status, extra = {}) {
  return Object.freeze({
    id,
    names: Object.freeze({ "sv-SE": svName, "en-GB": enName }),
    category,
    priority,
    sourceIntent,
    status,
    existingCatalogId: null,
    slvQuery: null,
    note: "",
    ...extra,
  });
}

function labelled(id, svName, enName, category, priority, status, existingCatalogId = null, note = "") {
  return selectedFood(id, svName, enName, category, priority, SOURCE_INTENTS.productLabel, status, {
    existingCatalogId,
    note,
  });
}

function producer(id, svName, enName, category, priority, existingCatalogId, note = "") {
  return selectedFood(id, svName, enName, category, priority, SOURCE_INTENTS.producer, SELECTION_STATUSES.inCatalogue, {
    existingCatalogId,
    note,
  });
}

function slv(id, svName, enName, category, priority, slvQuery, note = "") {
  return selectedFood(id, svName, enName, category, priority, SOURCE_INTENTS.livsmedelsverket, SELECTION_STATUSES.resolveSlv, {
    slvQuery,
    note,
  });
}

function slvPromoted(id, svName, enName, category, priority, slvQuery, note = "") {
  return selectedFood(id, svName, enName, category, priority, SOURCE_INTENTS.livsmedelsverket, SELECTION_STATUSES.inCatalogue, {
    existingCatalogId: id,
    slvQuery,
    note,
  });
}

function slvStaged(id, svName, enName, category, priority, slvQuery, note = "") {
  return selectedFood(id, svName, enName, category, priority, SOURCE_INTENTS.livsmedelsverket, SELECTION_STATUSES.inCatalogue, {
    existingCatalogId: id,
    slvQuery,
    note: `Provisorisk katalogpost som ska ersättas med verifierad SLV-matchning. ${note}`.trim(),
  });
}

function proxy(id, svName, enName, category, priority, existingCatalogId, note = "") {
  return selectedFood(id, svName, enName, category, priority, SOURCE_INTENTS.proxy, SELECTION_STATUSES.inCatalogue, {
    existingCatalogId,
    note,
  });
}

function inputRule(id, svName, enName, category, priority, existingCatalogId, note = "") {
  return selectedFood(id, svName, enName, category, priority, SOURCE_INTENTS.inputRule, SELECTION_STATUSES.inCatalogue, {
    existingCatalogId,
    note,
  });
}

// Priority 1 is the first-week calculation cohort. Priority 2 broadens normal
// keto use and coaching. Priority 3 makes common deviations loggable.
export const NUTRITION_SELECTION = Object.freeze([
  labelled("hellmanns-majonnas", "Hellmann's majonnäs", "Hellmann's mayonnaise", "seasonings", 1, SELECTION_STATUSES.inCatalogue, "hellmanns-majonnas"),
  labelled("felix-ketchup-osotad", "Felix tomatketchup osötad", "Felix unsweetened tomato ketchup", "seasonings", 1, SELECTION_STATUSES.inCatalogue, "felix-ketchup-osotad"),
  labelled("grekisk-yoghurt-10", "Grekisk yoghurt 10%", "Greek yoghurt 10%", "dairy", 1, SELECTION_STATUSES.inCatalogue, "grekisk-yoghurt-10"),
  labelled("yoghurt-naturell-3", "Yoghurt naturell 3%", "Natural yoghurt 3%", "dairy", 2, SELECTION_STATUSES.inCatalogue, "yoghurt-naturell-3"),
  labelled("milbona-magerkvarg-naturell", "Milbona magerkvarg naturell", "Milbona natural low-fat quark", "dairy", 1, SELECTION_STATUSES.inCatalogue, "milbona-magerkvarg-naturell"),
  producer("vispgradde-36", "Vispgrädde 36%", "Whipping cream 36%", "dairy", 2, "vispgradde-36"),
  producer("vispgradde-40", "Vispgrädde 40%", "Whipping cream 40%", "dairy", 1, "vispgradde-40"),
  labelled("farskost-etikett", "Färskost", "Cream cheese", "dairy", 1, SELECTION_STATUSES.inCatalogue, "farskost-etikett"),
  labelled("halloumi-zeta", "Halloumi", "Halloumi", "dairy", 1, SELECTION_STATUSES.inCatalogue, "halloumi-zeta"),
  labelled("bratwurst-87-kott-kummin-vitlok", "Bratwurst 87% kött, kummin & vitlök", "Bratwurst 87% meat, cumin & garlic", "charcuterie", 1, SELECTION_STATUSES.inCatalogue, "bratwurst-87-kott-kummin-vitlok"),
  labelled("matriket-svenska-kottbullar-73", "Matriket svenska köttbullar 73% kött", "Matriket Swedish meatballs 73% meat", "charcuterie", 1, SELECTION_STATUSES.inCatalogue, "matriket-svenska-kottbullar-73", "Fotograferad etikett; anges i gram tills en styckvikt har vägts."),
  labelled("ica-makrill-tomatsas", "ICA spansk makrillfilé i tomatsås", "ICA Spanish mackerel fillet in tomato sauce", "seafood", 1, SELECTION_STATUSES.inCatalogue, "ica-makrill-tomatsas"),
  labelled("ica-tonfisk-i-vatten", "ICA tonfisk i vatten", "ICA tuna in spring water", "seafood", 1, SELECTION_STATUSES.inCatalogue, "ica-tonfisk-i-vatten"),
  labelled("kalamataoliver-etikett", "Kalamataoliver", "Kalamata olives", "vegetables", 2, SELECTION_STATUSES.inCatalogue, "kalamataoliver-etikett"),
  labelled("seltin", "Seltin", "Seltin reduced-sodium salt", "seasonings", 1, SELECTION_STATUSES.inCatalogue, "seltin"),
  proxy("salt", "Salt", "Salt", "seasonings", 1, "salt", "Natrium beräknat från natriumklorid; stödjer krm och tsk."),
  labelled("collagen-nyttoteket", "Collagen", "Collagen", "supplements", 1, SELECTION_STATUSES.inCatalogue, "collagen-nyttoteket"),
  labelled("knorr-kottbuljong", "Köttbuljongtärning", "Beef stock cube", "drinks", 1, SELECTION_STATUSES.inCatalogue, "knorr-kottbuljong", "Fotograferad etikett; standardportion 1 tärning i 3,5 dl vatten."),
  proxy("magnesiumtablett-200", "Magnesiumtablett 200 mg", "Magnesium tablet 200 mg", "supplements", 1, "magnesiumtablett-200", "Dosen 200 mg används som angiven tillskottsdos; produktetikett behöver fortfarande läggas in."),

  slvPromoted("agg", "Ägg", "Egg", "meat", 1, "Ägg", "Neutral grundpost för ägg; extra stekfett registreras separat."),
  slvPromoted("bacon", "Bacon", "Bacon", "charcuterie", 1, "Bacon"),
  slvPromoted("avokado", "Avokado", "Avocado", "vegetables", 1, "Avokado"),
  slvPromoted("spenat", "Spenat", "Spinach", "vegetables", 1, "Spenat"),
  slvPromoted("surkal", "Surkål", "Sauerkraut", "vegetables", 1, "Surkål"),
  slvPromoted("kycklingfile", "Kycklingfilé utan skinn", "Skinless chicken breast", "meat", 1, "Kyckling bröstfilé utan skinn"),
  slvPromoted("oxfile", "Oxfilé", "Beef fillet", "meat", 1, "Nöt oxfilé"),
  slvPromoted("flaskkotlett-benfri", "Benfri fläskkotlett", "Boneless pork chop", "meat", 1, "Gris kotlett benfri"),
  inputRule("notfars-fat-required", "Nötfärs/köttfärs utan fetthalt", "Minced beef without fat percentage", "meat", 1, "notfars-fat-required", "Inmatningsspärr: köttfärs betyder nötfärs men får inte beräknas utan verifierad fetthalt."),
  slvPromoted("notfars-10", "Nötfärs/köttfärs 10%", "Minced beef 10% fat", "meat", 1, "Nöt färs rå fett 10%", "Officiell rå nötfärspost; köttfärs och nötfärs behandlas som synonymer när 10% anges."),
  proxy("notfars-12", "Nötfärs/köttfärs 12%", "Minced beef 12% fat", "meat", 1, "notfars-12", "Interpolerad schablon mellan officiella SLV-poster för 10% och 15%; ersätts av produktetikett när sådan finns."),
  slvPromoted("notfars-15", "Nötfärs/köttfärs 15%", "Minced beef 15% fat", "meat", 1, "Nöt färs rå fett 15%", "Officiell rå nötfärspost; köttfärs och nötfärs behandlas som synonymer när 15% anges."),
  labelled("notfars-20", "Nötfärs/köttfärs 20%", "Minced beef 20% fat", "meat", 1, SELECTION_STATUSES.labelNeeded, null, "Ingen direkt rå SLV-post hittad; produktetikett eller annan verifierad källa behövs."),
  proxy("kottfarsbiff", "Köttfärsbiff", "Beef patty", "meat", 1, "kottfarsbiff-proxy", "Standardpost för en tillagad köttfärsbit om cirka 80 g; fetthalt/recept kan förfinas."),
  proxy("fetaost", "Fetaost", "Feta cheese", "dairy", 1, "fetaost-proxy", "Provisorisk post tills etikett eller entydig officiell matchning finns."),
  proxy("hardost", "Ost", "Cheese", "dairy", 1, "hardost-proxy", "Generisk hårdostpost tills ostsort anges eller etikett finns."),
  slvPromoted("parmesan", "Parmesan", "Parmesan", "dairy", 1, "Parmesanost"),
  slvPromoted("smor", "Smör", "Butter", "fats", 1, "Smör"),
  slvPromoted("olivolja", "Olivolja", "Olive oil", "fats", 1, "Olivolja"),
  slvPromoted("tomat", "Tomat", "Tomato", "vegetables", 1, "Tomat"),
  slvPromoted("plommontomat", "Plommontomat", "Plum tomato", "vegetables", 1, "Tomat", "Portionsmått för plommontomat läggs ovanpå vald generisk tomatpost."),
  slvPromoted("zucchini", "Zucchini", "Courgette", "vegetables", 1, "Squash zucchini"),
  slvPromoted("gurka", "Gurka", "Cucumber", "vegetables", 1, "Gurka"),
  slvPromoted("jordgubbar", "Jordgubbar", "Strawberries", "fruitBerries", 1, "Jordgubbar"),

  slvStaged("bearnaise", "Bearnaisesås", "Bearnaise sauce", "seasonings", 2, "Bearnaisesås"),
  slvStaged("aioli", "Aioli", "Aioli", "seasonings", 2, "Aioli"),
  slvStaged("hollandaise", "Hollandaisesås", "Hollandaise sauce", "seasonings", 2, "Hollandaisesås"),
  slvStaged("creme-fraiche", "Crème fraiche", "Creme fraiche", "dairy", 2, "Crème fraiche"),
  slvStaged("graddfil", "Gräddfil", "Sour cream", "dairy", 2, "Gräddfil"),
  slvStaged("keso", "Keso", "Cottage cheese", "dairy", 2, "Keso"),
  slvStaged("cheddar", "Cheddar", "Cheddar", "dairy", 2, "Cheddarost"),
  slvStaged("gouda", "Gouda", "Gouda", "dairy", 2, "Goudaost"),
  slvStaged("brie", "Brie", "Brie", "dairy", 2, "Brieost"),
  slvStaged("mozzarella", "Mozzarella", "Mozzarella", "dairy", 2, "Mozzarella"),
  slvStaged("entrecote", "Entrecôte", "Ribeye steak", "meat", 2, "Nöt entrecôte"),
  slvStaged("flaskfile", "Fläskfilé", "Pork fillet", "meat", 2, "Gris filé"),
  slvStaged("laxfile", "Laxfilé", "Salmon fillet", "seafood", 2, "Lax"),
  slvStaged("torsk", "Torsk", "Cod", "seafood", 2, "Torsk"),
  slvStaged("rakor", "Räkor", "Prawns", "seafood", 2, "Räkor"),
  proxy("falukorv", "Falukorv", "Falukorv sausage", "charcuterie", 2, "falukorv-proxy", "Provisorisk post tills etikett eller officiell matchning har importerats."),
  slvStaged("grillkorv", "Grillkorv", "Grilling sausage", "charcuterie", 2, "Grillkorv"),
  proxy("korv-75", "Korv 75% kött", "Sausage 75% meat", "charcuterie", 2, "korv-75"),
  proxy("salami", "Salami", "Salami", "charcuterie", 2, "salami-proxy", "Provisorisk post med skivmått tills produktetikett finns."),
  slvStaged("palaggsskinka", "Påläggsskinka", "Sliced ham", "charcuterie", 2, "Skinka rökt"),
  slvStaged("leverpastej", "Leverpastej", "Liver pate", "charcuterie", 2, "Leverpastej"),
  slvStaged("inlagd-sill", "Inlagd sill", "Pickled herring", "seafood", 2, "Sill inlagd"),
  proxy("pulled-pork", "Pulled pork", "Pulled pork", "meat", 2, "pulled-pork"),
  proxy("baconlindad-kottfarsbit", "Baconlindad köttfärsbit", "Bacon-wrapped beef patty", "meat", 2, "baconlindad-kottfarsbit"),
  slvStaged("spetskal", "Spetskål", "Pointed cabbage", "vegetables", 2, "Spetskål"),
  slvStaged("vitkal", "Vitkål", "White cabbage", "vegetables", 2, "Vitkål"),
  slvStaged("broccoli", "Broccoli", "Broccoli", "vegetables", 2, "Broccoli"),
  slvStaged("blomkal", "Blomkål", "Cauliflower", "vegetables", 2, "Blomkål"),
  slvStaged("svamp", "Champinjon", "Mushroom", "vegetables", 2, "Champinjon"),
  slvStaged("sparris", "Sparris", "Asparagus", "vegetables", 2, "Sparris"),
  slvStaged("bladgront", "Bladgrönt", "Leafy greens", "vegetables", 2, "Sallat"),
  slvStaged("pumpakarnor", "Pumpakärnor", "Pumpkin seeds", "nutsSeeds", 2, "Pumpafrö"),
  slvStaged("mandel", "Mandel", "Almonds", "nutsSeeds", 2, "Mandel"),
  proxy("linfron", "Linfrön", "Linseed", "nutsSeeds", 2, "linfron-proxy", "Provisorisk post tills officiell matchning har importerats."),
  slvStaged("solrosfron", "Solrosfrön", "Sunflower seeds", "nutsSeeds", 2, "Solrosfrö"),
  proxy("valnotter", "Valnötter", "Walnuts", "nutsSeeds", 2, "valnotter-proxy", "Provisorisk portionspost tills officiell SLV-matchning har importerats."),
  slvStaged("macadamia", "Macadamianötter", "Macadamia nuts", "nutsSeeds", 2, "Macadamianötter"),
  slvStaged("hallon", "Hallon", "Raspberries", "fruitBerries", 2, "Hallon"),
  proxy("bjornbar", "Björnbär", "Blackberries", "fruitBerries", 2, "bjornbar-proxy", "Provisorisk styckpost tills officiell SLV-matchning har importerats."),
  proxy("roda-vinbar", "Röda vinbär", "Redcurrants", "fruitBerries", 2, "roda-vinbar-proxy", "Provisorisk styckpost tills officiell SLV-matchning har importerats."),
  proxy("bar-allmant", "Bär (allmänt)", "Berries (general)", "fruitBerries", 2, "bar-allmant-proxy", "Schablonpost när bärsort inte är angiven; ersätts av specifik sort när den är känd."),
  slvStaged("blabar", "Blåbär", "Blueberries", "fruitBerries", 2, "Blåbär"),
  slvStaged("pesto", "Pesto", "Pesto", "seasonings", 2, "Pesto"),
  slvStaged("kaviar", "Kaviar", "Smoked cod roe spread", "seasonings", 2, "Kaviar"),
  slvStaged("kaffe", "Kaffe", "Coffee", "drinks", 2, "Kaffe"),
  proxy("rodvin-torrt", "Chianti", "Chianti", "drinks", 2, "chianti-proxy", "Provisorisk Chianti-post; alkoholkcal redovisas separat i framtida skarp motor."),

  slvStaged("jordnotter", "Jordnötter", "Peanuts", "nutsSeeds", 3, "Jordnötter"),
  slvStaged("cashewnotter", "Cashewnötter", "Cashew nuts", "nutsSeeds", 3, "Cashewnötter"),
  slvStaged("hjortron", "Hjortron", "Cloudberries", "fruitBerries", 3, "Hjortron"),
  slvStaged("apple", "Äpple", "Apple", "fruitBerries", 3, "Äpple"),
  slvStaged("apelsin", "Apelsin", "Orange", "fruitBerries", 3, "Apelsin"),
  slvStaged("balsamico", "Balsamico", "Balsamic vinegar", "seasonings", 3, "Balsamvinäger"),
  slvStaged("ketchup-vanlig", "Ketchup", "Ketchup", "seasonings", 3, "Ketchup"),
  slvStaged("blodpudding", "Blodpudding", "Black pudding", "charcuterie", 3, "Blodpudding"),
  slvStaged("lattol", "Lättöl", "Low-alcohol beer", "drinks", 3, "Lättöl"),
  slvStaged("ol", "Öl", "Beer", "drinks", 3, "Öl"),
  slvStaged("vitt-vin-torrt", "Vitt vin torrt", "Dry white wine", "drinks", 3, "Vin vitt"),
  slvStaged("sprit", "Sprit 40%", "Spirit 40%", "drinks", 3, "Sprit"),
]);

export function selectedFoodsAtPriority(maxPriority = SELECTION_PRIORITIES.core) {
  return NUTRITION_SELECTION.filter((food) => food.priority <= maxPriority);
}
