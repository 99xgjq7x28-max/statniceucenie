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
data/topics.json        všetky otázky, odpovede, tabuľky a referencie na obrázky
assets/images/          obrázky extrahované z Word dokumentov
statnice-ucenie.html    presmerovanie zo starej URL na index.html
```

## Používanie

- `Space`: ukázať/skryť odpoveď
- `N`: ďalšia otázka
- `R`: náhodná slabá otázka
- `?reset=1`: vymaže lokálny progres v aktuálnom prehliadači
