// Migration inventory only. Nutrition values continue to live in the verified
// catalogue after a product label or an SLV food identifier has been resolved.
export const SOURCE_INTENTS = Object.freeze({
  productLabel: "product_label",
  producer: "producer",
  livsmedelsverket: "livsmedelsverket",
  proxy: "proxy",
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

function proxy(id, svName, enName, category, priority, existingCatalogId, note = "") {
  return selectedFood(id, svName, enName, category, priority, SOURCE_INTENTS.proxy, SELECTION_STATUSES.inCatalogue, {
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
  slv("notfars", "Nötfärs", "Minced beef", "meat", 1, "Nötfärs"),
  slv("kottfarsbiff", "Köttfärsbiff", "Beef patty", "meat", 1, "Köttfärsbiff", "Behöver avgöras om den ska räknas som råvara eller egen standardrätt."),
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

  slv("bearnaise", "Bearnaisesås", "Bearnaise sauce", "seasonings", 2, "Bearnaisesås"),
  slv("aioli", "Aioli", "Aioli", "seasonings", 2, "Aioli"),
  slv("hollandaise", "Hollandaisesås", "Hollandaise sauce", "seasonings", 2, "Hollandaisesås"),
  slv("creme-fraiche", "Crème fraiche", "Creme fraiche", "dairy", 2, "Crème fraiche"),
  slv("graddfil", "Gräddfil", "Sour cream", "dairy", 2, "Gräddfil"),
  slv("keso", "Keso", "Cottage cheese", "dairy", 2, "Keso"),
  slv("cheddar", "Cheddar", "Cheddar", "dairy", 2, "Cheddarost"),
  slv("gouda", "Gouda", "Gouda", "dairy", 2, "Goudaost"),
  slv("brie", "Brie", "Brie", "dairy", 2, "Brieost"),
  slv("mozzarella", "Mozzarella", "Mozzarella", "dairy", 2, "Mozzarella"),
  slv("entrecote", "Entrecôte", "Ribeye steak", "meat", 2, "Nöt entrecôte"),
  slv("flaskfile", "Fläskfilé", "Pork fillet", "meat", 2, "Gris filé"),
  slv("laxfile", "Laxfilé", "Salmon fillet", "seafood", 2, "Lax"),
  slv("torsk", "Torsk", "Cod", "seafood", 2, "Torsk"),
  slv("rakor", "Räkor", "Prawns", "seafood", 2, "Räkor"),
  proxy("falukorv", "Falukorv", "Falukorv sausage", "charcuterie", 2, "falukorv-proxy", "Provisorisk post tills etikett eller officiell matchning har importerats."),
  slv("grillkorv", "Grillkorv", "Grilling sausage", "charcuterie", 2, "Grillkorv"),
  proxy("salami", "Salami", "Salami", "charcuterie", 2, "salami-proxy", "Provisorisk post med skivmått tills produktetikett finns."),
  slv("palaggsskinka", "Påläggsskinka", "Sliced ham", "charcuterie", 2, "Skinka rökt"),
  slv("leverpastej", "Leverpastej", "Liver pate", "charcuterie", 2, "Leverpastej"),
  slv("inlagd-sill", "Inlagd sill", "Pickled herring", "seafood", 2, "Sill inlagd"),
  slv("spetskal", "Spetskål", "Pointed cabbage", "vegetables", 2, "Spetskål"),
  slv("vitkal", "Vitkål", "White cabbage", "vegetables", 2, "Vitkål"),
  slv("broccoli", "Broccoli", "Broccoli", "vegetables", 2, "Broccoli"),
  slv("blomkal", "Blomkål", "Cauliflower", "vegetables", 2, "Blomkål"),
  slv("svamp", "Champinjon", "Mushroom", "vegetables", 2, "Champinjon"),
  slv("sparris", "Sparris", "Asparagus", "vegetables", 2, "Sparris"),
  slv("bladgront", "Bladgrönt", "Leafy greens", "vegetables", 2, "Sallat"),
  slv("pumpakarnor", "Pumpakärnor", "Pumpkin seeds", "nutsSeeds", 2, "Pumpafrö"),
  slv("mandel", "Mandel", "Almonds", "nutsSeeds", 2, "Mandel"),
  proxy("linfron", "Linfrön", "Linseed", "nutsSeeds", 2, "linfron-proxy", "Provisorisk post tills officiell matchning har importerats."),
  slv("solrosfron", "Solrosfrön", "Sunflower seeds", "nutsSeeds", 2, "Solrosfrö"),
  proxy("valnotter", "Valnötter", "Walnuts", "nutsSeeds", 2, "valnotter-proxy", "Provisorisk portionspost tills officiell SLV-matchning har importerats."),
  slv("macadamia", "Macadamianötter", "Macadamia nuts", "nutsSeeds", 2, "Macadamianötter"),
  slv("hallon", "Hallon", "Raspberries", "fruitBerries", 2, "Hallon"),
  proxy("bjornbar", "Björnbär", "Blackberries", "fruitBerries", 2, "bjornbar-proxy", "Provisorisk styckpost tills officiell SLV-matchning har importerats."),
  proxy("roda-vinbar", "Röda vinbär", "Redcurrants", "fruitBerries", 2, "roda-vinbar-proxy", "Provisorisk styckpost tills officiell SLV-matchning har importerats."),
  slv("blabar", "Blåbär", "Blueberries", "fruitBerries", 2, "Blåbär"),
  slv("pesto", "Pesto", "Pesto", "seasonings", 2, "Pesto"),
  slv("kaviar", "Kaviar", "Smoked cod roe spread", "seasonings", 2, "Kaviar"),
  slv("kaffe", "Kaffe", "Coffee", "drinks", 2, "Kaffe"),
  proxy("rodvin-torrt", "Chianti", "Chianti", "drinks", 2, "chianti-proxy", "Provisorisk Chianti-post; alkoholkcal redovisas separat i framtida skarp motor."),

  slv("jordnotter", "Jordnötter", "Peanuts", "nutsSeeds", 3, "Jordnötter"),
  slv("cashewnotter", "Cashewnötter", "Cashew nuts", "nutsSeeds", 3, "Cashewnötter"),
  slv("hjortron", "Hjortron", "Cloudberries", "fruitBerries", 3, "Hjortron"),
  slv("apple", "Äpple", "Apple", "fruitBerries", 3, "Äpple"),
  slv("apelsin", "Apelsin", "Orange", "fruitBerries", 3, "Apelsin"),
  slv("balsamico", "Balsamico", "Balsamic vinegar", "seasonings", 3, "Balsamvinäger"),
  slv("ketchup-vanlig", "Ketchup", "Ketchup", "seasonings", 3, "Ketchup"),
  slv("blodpudding", "Blodpudding", "Black pudding", "charcuterie", 3, "Blodpudding"),
  slv("lattol", "Lättöl", "Low-alcohol beer", "drinks", 3, "Lättöl"),
  slv("ol", "Öl", "Beer", "drinks", 3, "Öl"),
  slv("vitt-vin-torrt", "Vitt vin torrt", "Dry white wine", "drinks", 3, "Vin vitt"),
  slv("sprit", "Sprit 40%", "Spirit 40%", "drinks", 3, "Sprit"),
]);

export function selectedFoodsAtPriority(maxPriority = SELECTION_PRIORITIES.core) {
  return NUTRITION_SELECTION.filter((food) => food.priority <= maxPriority);
}
