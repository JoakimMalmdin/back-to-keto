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

Appen har valfri molnsynk via Supabase. Lokal lagring fungerar fortfarande om Supabase inte ar konfigurerat. Synken anvander en personlig synkkod i appen, inte e-postinloggning.

1. Skapa ett Supabase-projekt.
2. Oppna SQL Editor i Supabase och kor hela `supabase_setup.sql`.
3. Ga till Project Settings > API och kopiera Project URL samt anon public key.
4. Fyll i `app/supabase-config.js`:

```js
export const supabaseConfig = {
  url: "https://DIN-PROJEKTREF.supabase.co",
  anonKey: "DIN-ANON-PUBLIC-KEY",
};
```

Efter detta valjer anvandaren en egen synkkod i appens Synk-ruta. Samma kod pa dator och telefon ger samma molnprofil. Valj en lang och svargissad kod, eftersom alla som kan koden kan lasa och skriva den profilen.
