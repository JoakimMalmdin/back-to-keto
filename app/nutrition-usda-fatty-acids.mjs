export const USDA_SOURCE = Object.freeze({
  authority: "USDA FoodData Central, SR Legacy",
  apiBase: "https://fdc.nal.usda.gov/",
  retrievedDate: "2026-05-26",
});

function fattyAcidProfile(catalogId, fdcId, officialName, omega3, omega6, note = "") {
  return Object.freeze({
    catalogId,
    fdcId,
    officialName,
    omega3,
    omega6,
    note,
  });
}

// USDA supplements only named generic foods without a defensible direct
// Swedish food match. Product-label macros remain authoritative.
const USDA_FATTY_ACID_PROFILES = Object.freeze([
  fattyAcidProfile("cheddar", 173414, "Cheese, cheddar", 0.1, 1.2, "O-3 summerar ALA, EPA, DPA och DHA; O-6 summerar linolsyra och arakidonsyra."),
  fattyAcidProfile("gouda", 171241, "Cheese, gouda", 0.4, 0.3, "Exakt namngiven USDA-post används för fettsyror; befintlig makroschablon skrivs inte över."),
]);

export function usdaFattyAcidProfileFor(catalogId) {
  return USDA_FATTY_ACID_PROFILES.find((profile) => profile.catalogId === catalogId) || null;
}
