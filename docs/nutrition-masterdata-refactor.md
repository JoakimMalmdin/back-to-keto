# Nutrition Masterdata Refactor

## Safety

- Production reference point: `btk-v1.0-beta-build-159-pre-masterdata-refactor`.
- Development branch: `codex/nutrition-masterdata-refactor`.
- The current parser remains active until the replacement has been tested against real diary text.
- User diary entries and sync data are not migrated by this first step.

## Locked Categories

1. Matfett och oljor
2. Mejeri och ost
3. Kött, fågel och ägg
4. Chark, korv och pålägg
5. Fisk och skaldjur
6. Grönsaker, svamp och fermenterat
7. Nötter, frön och kärnor
8. Frukt och bär
9. Såser, kryddor och smaksättning
10. Dryck, buljong och alkohol
11. Tillskott
12. Egna standardrätter

Categories are for finding foods in the UI. Coaching uses tags such as
`fullvärdigt_protein`, `natriumkälla`, `kaliumkälla`, `magnesiumkälla`,
`alkohol`, and `ej_fullvärdigt_protein`.

## Source Policy

1. A supplied product label is authoritative for that branded product's
   declared macro values.
2. Livsmedelsverkets Livsmedelsdatabas is the intended primary source for
   generic ingredients and available mineral values.
3. Producer information is used when a product label needs confirmation.
4. A documented official fallback source is used only when Swedish data is
   absent.
5. Proxy mineral values and estimated recipes must be labelled as such; they
   must never appear as product-label measurements.

## Relevant Food Selection

- `app/nutrition-selection.mjs` is the migration inventory, not a second
  nutrition database. It identifies the foods the app should support first,
  their priority and their intended authoritative source.
- Generic foods are queued for resolution against Livsmedelsverkets
  Livsmedelsdata API. Once resolved, their Livsmedelsverket identifier and
  downloaded nutrient values belong in the canonical catalogue.
- Branded products with supplied labels remain label-sourced and are never
  overwritten by a similar generic database entry.
- Priority 1 covers foods needed to re-evaluate the first logged days.
  Priority 2 supports normal keto use and electrolyte coaching. Priority 3
  makes less frequent foods and deviations loggable.
- The API exposes foods through `/api/v1/livsmedel` and nutrient values through
  `/api/v1/livsmedel/{nummer}/naringsvarden`; it provides Swedish and English
  responses and is licensed under CC BY 4.0.
- Official API documentation:
  `https://dataportal.livsmedelsverket.se/livsmedel/swagger/v1/swagger.json`.
- Imported generic data must be attributed to Livsmedelsverket,
  Livsmedelsdatabasen, with the retrieved food identifier and retrieval date
  retained in the canonical record.

## First SLV Mapping Cohort

- `app/nutrition-slv-core.mjs` records the first resolved Livsmedelsverket
  matches and their retrieved macro/electrolyte values.
- The resolved first cohort is now promoted into `app/nutrition-catalog.mjs`,
  so those official values are read by the new parser from the canonical
  catalogue rather than being copied into ad hoc rules.
- The first resolved cohort contains 16 selection entries backed by 15
  official foods; plommontomat shares the generic tomato nutrient base while
  retaining a future separate portion rule.
- Logged meat is presently mapped to a corresponding cooked item where a
  defensible cooked entry exists, since diary gram amounts describe food on
  the plate. This assumption remains visible in each staged record.
- `Köttfärs` means `nötfärs` in this user's logging convention. This raw
  ingredient remains held until a fat variant is specified; `blandfärs`,
  `fläskfärs` and `kycklingfärs` must remain separate ingredients.
- `Köttfärsbit`/`köttfärsbiff` is a prepared-item estimate, not an alias for
  raw minced beef, and may therefore use its own explicit piece measure.
- Fetaost is held because the database candidate is salladsost rather than
  an unambiguous feta product.

## Canonical Record Shape

Each food will have one record containing:

- stable `id` and display `name`
- aliases used by the text parser
- one category and optional coaching tags
- nutrients expressed per 100 g or per 100 ml
- permitted measures and standard portions
- separate source metadata for macros and electrolytes
- verification date and confidence status

The visible food list, macro totals and electrolyte totals must eventually be
generated from the same record.

## Language Architecture

- There will be one nutrition catalogue, not one catalogue per language.
- Nutrition values, sources, standard portions and coaching tags are
  language-independent.
- Each catalogue item stores translated display names and input aliases for
  `sv-SE` and `en-GB`.
- Categories use stable internal ids and translated display names.
- Units use language-independent internal ids such as `tablespoon`, `teaspoon`,
  `pinch` and `tin`, while accepting translated input aliases such as
  `msk`/`tbsp`, `tsk`/`tsp`, `krm`/`pinch` and `burk`/`tin`.
- UI copy is kept in locale dictionaries outside the nutrition values.
- Historical Swedish diary text must remain parsable even when the interface is
  displayed in English, and vice versa.

## Personal Defaults And Product Variants

- Generic products that materially differ in macros are separate catalogue
  records. `Vispgrädde 36%` and `Vispgrädde 40%` must therefore not share a
  single generic nutrient record.
- Input that explicitly states a variant, such as `0,5 dl grädde 40%`, resolves
  directly to that catalogue record.
- Ambiguous input such as `0,5 dl grädde` must not silently change between 36%
  and 40%. The future parser should use a personal default only if the user has
  chosen one, otherwise show the assumption as unresolved.
- A future personal-products option should allow a user to register the
  labelled values of their usual cream rather than deriving all nutrients from
  fat percentage alone.
- `Köttfärs` and `nötfärs` are accepted as synonymous beef-mince inputs only
  when a verified fat variant is present. Livsmedelsverket posts for raw 10%
  and 15% mince are imported; 12% and 20% remain explicit label/source gaps.
- `Köttfärsbit` is a separate prepared-item estimate and must not silently
  satisfy a raw `köttfärs` input.

## Quantity Interpretation

- Per-100-g values are the calculation base. Everyday units are conversions
  into gram, not separate nutrient records.
- The app should accept reasonable alternate measures even when they are not
  the customary way to log the food. For example, kvarg may be written as
  `100 g`, `1 msk` or `1 tsk`.
- A directly defined conversion is preferred. For Milbona magerkvarg,
  `1 msk = 15 g` and `1 tsk = 5 g`.
- When a conversion can be derived reliably from an existing kitchen measure,
  it may be offered in the parser and labelled as an assumption.
- Volume measures are compatible within an item when a density conversion has
  been defined, for example yoghurt with `1 dl = 100 g` may accept `1 tsk =
  5 g` as a visible derived conversion.
- If a requested measure cannot be converted safely for that food, the entry
  must be flagged as unresolved and excluded from totals rather than silently
  replaced by a standard portion.
- A bare number may only be interpreted when the catalogue record declares an
  unambiguous implicit unit, optionally limited to specific aliases. Examples
  are `2 ägg`, `1 avokado`, `1 valnöt`, `0,7 buljong` and
  `8 falukorvsskivor`; `1 falukorv` is deliberately not interpreted as one
  slice. This is not a general normal-portion fallback.

## Migration Stages

1. Establish the catalog schema and migrate product labels already supplied by
   the user.
2. Establish `sv-SE`/`en-GB` localisation fields before further migration.
3. Add official generic foods after source verification.
4. Add unified quantity parsing and assumption reporting.
5. Recalculate both macros and electrolytes from the catalog.
6. Generate the visible food list from the catalog and selected locale.
7. Replace the old signal arrays only after regression tests pass.

## Parser Foundation Implemented

- `app/nutrition-parser.mjs` now resolves Swedish and British English aliases
  against the canonical catalogue without importing values from the live
  signal arrays.
- Grams are always accepted. Declared measures are used directly, and
  compatible volume measures may be calculated from a defined density with an
  explicit `derived_measure` status.
- Recognised foods with missing or unsupported quantities are returned as
  unresolved and excluded from totals.
- Variant-sensitive ingredients, currently `köttfärs`/`nötfärs`, are also
  returned as unresolved when the requested fat variant is not verified.
- `app/nutrition-parser.test.mjs` protects the known quantity failures around
  kvarg, yoghurt, cream, Seltin, tuna and mayonnaise.
- `app/nutrition-diary-regression.test.mjs` protects meal-level failures
  already encountered in use: walnuts counted as portions, falukorv slices,
  sauerkraut grams, Seltin and salt, tuna tins, berries counted by piece,
  Chianti glasses and magnesium tablets.
- `node app/nutrition-coverage-report.mjs` prints a repeatable Markdown
  inventory of source status and available measures by priority.
- Quantity lookup is restricted to the same meal line as the matched food, so
  an amount in lunch or dinner cannot leak into another meal.

## Current Cutover Gate

- The canonical catalogue currently covers the labelled products, the first
  official Livsmedelsverket cohort and explicitly marked provisional entries
  needed for known amount regressions.
- Provisional values remain visibly sourced as `proxy` until a product label
  or an official Livsmedelsverket match replaces them.
- The current live calculation is not switched to the master engine until
  diary-relevant remaining foods have canonical entries and the regression
  suite passes. This prevents a partial catalogue from silently lowering old
  day totals.

## Comparison Mode

- On the development branch, append `?mastercheck=1` to the app URL to show an
  opt-in panel for the new nutrition engine.
- The ordinary macro display remains calculated by the current engine while
  the comparison panel shows the subtotal for foods already migrated to the
  canonical catalogue.
- This mode is used to test real diary entries before the new engine is allowed
  to replace production calculations.

## Required Regression Inputs

- `2 burkar tonfisk i vatten med 1,5 msk majonnäs`
- `20 g fetaost, 1 tsk olivolja, 1 krm Seltin`
- `2 glas Chianti`
- `8 falukorvsskivor`
- `1 dl grekisk yoghurt, 2 björnbär, 2 röda vinbär`
- `2 tabletter magnesium 200 mg`
- `0,7 buljong, 1 avokado, 1 burk tonfisk i vatten, 1 tsk salt`
- `2 eggs, 1 tbsp mayonnaise, 1 avocado`
- `1 tin tuna in water, 1 tbsp mayonnaise`
