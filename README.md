# Back to Keto

Mobilanpassad PWA for daglig keto-loggning.

## Lokal start

```sh
node src/server.mjs
```

Oppna sedan `http://localhost:4173`.

## GitHub Pages

Publicera fran `main` och `/root`. Root-sidan skickar vidare till `app/`.

Datan sparas lokalt i varje browser. Anvand export/import i appen for att flytta loggen mellan enheter.

## Supabase-synk

Appen har valfri molnsynk via Supabase. Lokal lagring fungerar fortfarande om Supabase inte ar konfigurerat.

1. Skapa ett Supabase-projekt.
2. Oppna SQL Editor i Supabase och kor `supabase_setup.sql`.
3. Ga till Project Settings > API och kopiera Project URL samt anon public key.
4. Fyll i `app/supabase-config.js`:

```js
export const supabaseConfig = {
  url: "https://DIN-PROJEKTREF.supabase.co",
  anonKey: "DIN-ANON-PUBLIC-KEY",
};
```

5. I Authentication > URL Configuration, lagg till GitHub Pages-urlen som tillaten redirect-url:

```text
https://joakimmalmdin.github.io/back-to-keto/app/
https://joakimmalmdin.github.io/back-to-keto/app/?v=34
```

Efter detta kan anvandaren logga in med e-postlank i appens Synk-ruta. Varje inloggad anvandare far egen rad i databasen via Supabase Row Level Security.
