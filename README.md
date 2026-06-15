# Štátnice učenie

Statická učebná aplikácia pre otázky zo štátnic. Funguje bez backendu, dáta sú v `data/topics.json` a progres sa ukladá lokálne v prehliadači cez `localStorage`.

## Spustenie lokálne

```bash
python3 -m http.server 8765
```

Potom otvor:

```text
http://localhost:8765/index.html
```

## GitHub Pages

Nahraj celý priečinok do GitHub repozitára a v nastaveniach Pages vyber deploy z branchu. Vstupný súbor je `index.html`.

## Štruktúra

```text
index.html              hlavná stránka
src/app.js              logika aplikácie
src/styles.css          vizuál a responzívne layouty
hra.html                jednoduchá vedomostná plošinovka
src/game.js             logika hry
src/game.css            vizuál hry
data/topics.json        všetky otázky, odpovede, tabuľky a referencie na obrázky
kostry/                 stručné hovorené kostry všetkých 60 otázok
assets/images/          obrázky extrahované z Word dokumentov
statnice-ucenie.html    presmerovanie zo starej URL na index.html
```

## Používanie

- `Space`: ukázať/skryť odpoveď
- `N`: ďalšia otázka
- `R`: náhodná slabá otázka
- `?reset=1`: vymaže lokálny progres v aktuálnom prehliadači


## Keď GitHub Pages ukazuje 404

Ak URL typu `https://99xgjq7x28-max.github.io/statniceucenie/` ukazuje 404, skontroluj v repozitári:

1. `Settings` → `Pages`.
2. V časti `Build and deployment` nastav `Source` na `Deploy from a branch`.
3. Vyber branch `main` a folder `/ (root)`.
4. Klikni `Save` a počkaj pár minút.
5. V repozitári musí byť `index.html` priamo v koreňovej zložke, nie v podpriečinku.

Táto appka používa relatívne cesty (`src/app.js`, `data/topics.json`, `assets/images`), takže na GitHub Pages pod `/statniceucenie/` nepotrebuje žiadne špeciálne nastavenie base path.
