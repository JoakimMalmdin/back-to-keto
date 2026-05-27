import {
  DEFAULT_LOCALE,
  NUTRITION_CATALOG,
  SUPPORTED_LOCALES,
  UNIT_DEFINITIONS,
  foodName,
} from "./nutrition-catalog.mjs?v=195";

const NUMBER_WORDS = Object.freeze({
  en: 1,
  ett: 1,
  tva: 2,
  "två": 2,
  tre: 3,
  fyra: 4,
  fem: 5,
  sex: 6,
  sju: 7,
  atta: 8,
  "åtta": 8,
  nio: 9,
  tio: 10,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
});

const NUMBER_SOURCE = String.raw`(?:\d+(?:[,.]\d+)?|\d+\s*\/\s*\d+|en|ett|tv[aå]|tre|fyra|fem|sex|sju|[aå]tta|nio|tio|one|two|three|four|five|six|seven|eight|nine|ten)`;
const MASS_UNITS = Object.freeze({ g: 1, kg: 1000 });
const VOLUME_ML = Object.freeze({ ml: 1, cl: 10, dl: 100, litre: 1000, teaspoon: 5, tablespoon: 15 });

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseNumber(value) {
  const normalized = value.toLocaleLowerCase("sv-SE").trim().replace(",", ".");
  if (Object.hasOwn(NUMBER_WORDS, normalized)) return NUMBER_WORDS[normalized];
  if (normalized.includes("/")) {
    const [numerator, denominator] = normalized.split("/").map((part) => Number(part.trim()));
    return denominator > 0 ? numerator / denominator : null;
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function aliasesForUnit(unitId) {
  return SUPPORTED_LOCALES.flatMap((locale) => UNIT_DEFINITIONS[unitId].aliases[locale] || []);
}

const UNIT_ALIAS_INDEX = Object.freeze(
  Object.fromEntries(
    Object.keys(UNIT_DEFINITIONS).flatMap((unitId) =>
      aliasesForUnit(unitId).map((alias) => [alias.toLocaleLowerCase("sv-SE"), unitId]),
    ),
  ),
);

const UNIT_SOURCE = Object.keys(UNIT_ALIAS_INDEX)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join("|");

const BEFORE_AMOUNT = new RegExp(
  String.raw`(?:^|[ \t,(;])(?:ca[ \t]+)?(${NUMBER_SOURCE})[ \t]*(${UNIT_SOURCE})[ \t]*(?:av[ \t]+)?$`,
  "iu",
);
const AFTER_AMOUNT = new RegExp(
  String.raw`^[ \t]*(?:ca[ \t]+)?(${NUMBER_SOURCE})[ \t]*(${UNIT_SOURCE})(?=$|[ \t,.;)])`,
  "iu",
);
const IMPLICIT_AMOUNT_BEFORE = new RegExp(
  String.raw`(?:^|[ \t,(;])(?:ca[ \t]+)?(${NUMBER_SOURCE})[ \t]*$`,
  "iu",
);

function buildAliasMatches(text, catalogue, defaultFoodAliases = {}) {
  const candidates = [];
  for (const food of catalogue) {
    const aliases = SUPPORTED_LOCALES.flatMap((locale) => food.aliases[locale] || [])
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    for (const alias of aliases) {
      const matcher = new RegExp(
        String.raw`(^|[^\p{L}\p{N}])(${escapeRegExp(alias)})(?=$|[^\p{L}\p{N}])`,
        "giu",
      );
      for (const match of text.matchAll(matcher)) {
        const start = (match.index || 0) + match[1].length;
        candidates.push({ food, alias: match[2], start, end: start + match[2].length });
      }
    }
  }
  for (const [alias, foodId] of Object.entries(defaultFoodAliases)) {
    const food = catalogue.find((entry) => entry.id === foodId);
    if (!food) continue;
    const matcher = new RegExp(
      String.raw`(^|[^\p{L}\p{N}])(${escapeRegExp(alias)})(?=$|[^\p{L}\p{N}])`,
      "giu",
    );
    for (const match of text.matchAll(matcher)) {
      const start = (match.index || 0) + match[1].length;
      candidates.push({ food, alias: match[2], start, end: start + match[2].length });
    }
  }
  candidates.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const selected = [];
  for (const candidate of candidates) {
    if (selected.some((entry) => candidate.start < entry.end && candidate.end > entry.start)) continue;
    selected.push(candidate);
  }
  return selected.sort((a, b) => a.start - b.start);
}

function sameLineBefore(text, start, length = 48) {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  return text.slice(Math.max(lineStart, start - length), start);
}

function sameLineAfter(text, end, length = 32) {
  const nextLineStart = text.indexOf("\n", end);
  const lineEnd = nextLineStart === -1 ? text.length : nextLineStart;
  return text.slice(end, Math.min(lineEnd, end + length));
}

function amountNearMatch(text, match) {
  const before = sameLineBefore(text, match.start);
  const after = sameLineAfter(text, match.end);
  const foundBefore = before.match(BEFORE_AMOUNT);
  const foundAfter = after.match(AFTER_AMOUNT);
  const found = foundBefore || foundAfter;
  if (found) {
    return {
      amount: parseNumber(found[1]),
      unit: UNIT_ALIAS_INDEX[found[2].toLocaleLowerCase("sv-SE")],
      inputUnit: found[2],
    };
  }
  const implicitAllowed =
    !match.food.implicitAliases ||
    match.food.implicitAliases.some(
      (alias) => alias.toLocaleLowerCase("sv-SE") === match.alias.toLocaleLowerCase("sv-SE"),
    );
  const implicit = implicitAllowed && match.food.implicitUnit && before.match(IMPLICIT_AMOUNT_BEFORE);
  if (!implicit) return null;
  return {
    amount: parseNumber(implicit[1]),
    unit: match.food.implicitUnit,
    inputUnit: UNIT_DEFINITIONS[match.food.implicitUnit].labels[DEFAULT_LOCALE],
  };
}

function exactMeasure(food, unit) {
  return food.measures.find((measure) => measure.unit === unit) || null;
}

function deriveGrams(food, amount, unit) {
  if (Object.hasOwn(MASS_UNITS, unit)) {
    return { grams: amount * MASS_UNITS[unit], method: "mass", assumption: null };
  }
  const direct = exactMeasure(food, unit);
  if (direct) {
    return { grams: (amount / direct.amount) * direct.grams, method: "declared_measure", assumption: null };
  }
  if (Object.hasOwn(VOLUME_ML, unit)) {
    const base = food.measures.find((measure) => Object.hasOwn(VOLUME_ML, measure.unit));
    if (base) {
      const gramsPerMl = base.grams / (base.amount * VOLUME_ML[base.unit]);
      return {
        grams: amount * VOLUME_ML[unit] * gramsPerMl,
        method: "derived_measure",
        assumption: `${unit} härlett från ${base.unit}`,
      };
    }
  }
  return null;
}

function scaleNutrients(food, grams) {
  const factor = grams / 100;
  return Object.fromEntries(
    Object.entries(food.nutrientsPer100g)
      .filter(([, value]) => Number.isFinite(value))
      .map(([nutrient, value]) => [nutrient, value * factor]),
  );
}

function sumTotals(items) {
  return items.reduce((totals, item) => {
    for (const [nutrient, value] of Object.entries(item.nutrients)) {
      totals[nutrient] = (totals[nutrient] || 0) + value;
    }
    return totals;
  }, {});
}

export function parseNutritionText(
  text,
  { locale = DEFAULT_LOCALE, catalogue = NUTRITION_CATALOG, defaultFoodAliases = {} } = {},
) {
  const items = [];
  const unresolved = [];
  const sourceText = String(text || "");

  for (const match of buildAliasMatches(sourceText, catalogue, defaultFoodAliases)) {
    if (match.food.requiresVariant) {
      unresolved.push({
        foodId: match.food.id,
        label: foodName(match.food, locale),
        reason: "variant_required",
        variant: match.food.requiresVariant,
        input: match.alias,
      });
      continue;
    }
    const explicitQuantity = amountNearMatch(sourceText, match);
    const quantity = explicitQuantity || match.food.defaultMeasure;
    const usedDefaultMeasure = !explicitQuantity && Boolean(match.food.defaultMeasure);
    if (!quantity || !Number.isFinite(quantity.amount) || quantity.amount <= 0) {
      unresolved.push({
        foodId: match.food.id,
        label: foodName(match.food, locale),
        reason: "missing_quantity",
        input: match.alias,
      });
      continue;
    }
    const conversion = deriveGrams(match.food, quantity.amount, quantity.unit);
    if (!conversion) {
      unresolved.push({
        foodId: match.food.id,
        label: foodName(match.food, locale),
        reason: "unsupported_measure",
        amount: quantity.amount,
        unit: quantity.unit,
        input: `${quantity.amount} ${quantity.inputUnit} ${match.alias}`,
      });
      continue;
    }
    items.push({
      foodId: match.food.id,
      label: foodName(match.food, locale),
      amount: quantity.amount,
      unit: quantity.unit,
      grams: conversion.grams,
      conversionMethod: conversion.method,
      assumption: usedDefaultMeasure
        ? [conversion.assumption, "standardportion: mängd saknas"].filter(Boolean).join("; ")
        : conversion.assumption,
      nutrients: scaleNutrients(match.food, conversion.grams),
    });
  }

  return { text: sourceText, items, unresolved, totals: sumTotals(items) };
}
