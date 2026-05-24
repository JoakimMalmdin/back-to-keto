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

## Migration Stages

1. Establish the catalog schema and migrate product labels already supplied by
   the user.
2. Establish `sv-SE`/`en-GB` localisation fields before further migration.
3. Add official generic foods after source verification.
4. Add unified quantity parsing and assumption reporting.
5. Recalculate both macros and electrolytes from the catalog.
6. Generate the visible food list from the catalog and selected locale.
7. Replace the old signal arrays only after regression tests pass.

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
