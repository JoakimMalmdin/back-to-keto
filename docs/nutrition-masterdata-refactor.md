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

## Migration Stages

1. Establish the catalog schema and migrate product labels already supplied by
   the user.
2. Add official generic foods after source verification.
3. Add unified quantity parsing and assumption reporting.
4. Recalculate both macros and electrolytes from the catalog.
5. Generate the visible food list from the catalog.
6. Replace the old signal arrays only after regression tests pass.

## Required Regression Inputs

- `2 burkar tonfisk i vatten med 1,5 msk majonnäs`
- `20 g fetaost, 1 tsk olivolja, 1 krm Seltin`
- `2 glas Chianti`
- `8 falukorvsskivor`
- `1 dl grekisk yoghurt, 2 björnbär, 2 röda vinbär`
- `2 tabletter magnesium 200 mg`
- `0,7 buljong, 1 avokado, 1 burk tonfisk i vatten, 1 tsk salt`
