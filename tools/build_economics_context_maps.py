import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "mindmapy-ekonomia-klucove"

MAPS = [
    (
        "01_trh_a_hospodarska_politika.md",
        "Trh a hospodárska politika",
        """
## E1 Trh
- dopyt
  - cena rastie → dopytované množstvo klesá
- ponuka
  - cena rastie → ponúkané množstvo rastie
- rovnováha
  - dopyt = ponuka → rovnovážna cena
- makro ukazovatele
  - HDP, inflácia, nezamestnanosť
- časové rady
  - trend, sezónnosť, cyklus → prognóza

## E2 Cena a elasticita
- cena
  - náklady + zákazník + konkurencia
- elasticita
  - citlivosť dopytu na zmenu ceny
- elastický dopyt
  - zmena ceny → veľká zmena predaja
- neelastický dopyt
  - zmena ceny → malá zmena predaja
- štatistika
  - korelácia opisuje vzťah → regresia umožňuje odhad

## E3 Trhové štruktúry
- dokonalá konkurencia
  - veľa firiem, rovnaký produkt, firma cenu neurčuje
- monopolistická konkurencia
  - veľa firiem, odlíšené produkty
- oligopol
  - niekoľko veľkých vzájomne závislých firiem
- monopol
  - jedna firma, vysoké bariéry vstupu
- trhová sila
  - menej konkurencie → väčší vplyv na cenu

## E4 Výkon ekonomiky
- HDP
  - produkcia vytvorená na území štátu
- HNP/HND
  - dôchodok domácich rezidentov
- výpočet HDP
  - produkčná = dôchodková = výdavková metóda
- platobná bilancia
  - bežný + kapitálový + finančný účet
- limity HDP
  - neukazuje rozdelenie príjmov, kvalitu života ani škody na prostredí

## E5 Inflácia a nezamestnanosť
- inflácia
  - rast cien → pokles kúpnej sily
- nezamestnanosť
  - frikčná, štrukturálna, cyklická
- Phillipsova krivka
  - krátkodobo nižšia nezamestnanosť ↔ vyšší tlak na infláciu
- cenové indexy
  - CPI, HICP, PPI, deflátor HDP
- politika trhu práce
  - aktívna pomáha nájsť prácu; pasívna tlmí stratu príjmu

## E6 Fiškálna politika
- vykonáva vláda
- nástroje
  - dane + verejné výdavky + transfery
- expanzívna
  - výdavky hore alebo dane dole → dopyt a HDP rastú
- reštriktívna
  - výdavky dole alebo dane hore → dopyt a deficit klesajú
- riziko
  - podpora ekonomiky môže zvýšiť deficit, dlh a infláciu

## E7 Menová politika
- vykonáva ECB pre eurozónu
- cieľ
  - cenová stabilita, inflácia 2 % v strednodobom horizonte
- sadzby hore
  - úvery zdražejú → dopyt a inflácia slabnú
- sadzby dole
  - úvery zlacnejú → spotreba a investície rastú
- Slovensko
  - stabilné euro, ale bez vlastnej menovej politiky

## E8 Otvorená ekonomika a IS–LM
- otvorená ekonomika
  - export + import + pohyb kapitálu
- IS
  - rovnováha na trhu tovarov
- LM
  - rovnováha na trhu peňazí
- fiškálna expanzia
  - IS doprava → HDP a úrok rastú
- menová expanzia
  - LM doprava → HDP rastie, úrok klesá

## Prepojenia
- dopyt a ponuka → určujú cenu → cenová zmena sa hodnotí elasticitou
- štruktúra trhu → určuje silu firmy → ovplyvňuje cenovú stratégiu
- inflácia rastie → ECB zvýši sadzby → úvery zdražejú → dopyt slabne
- recesia → vláda môže expandovať → IS doprava → HDP rastie
- otvorenosť SR → zahraničný dopyt silno ovplyvňuje HDP a zamestnanosť
""",
    ),
    (
        "02_eu_a_medzinarodna_ekonomika.md",
        "EÚ a medzinárodná ekonomika",
        """
## E9 Európska únia
- Komisia
  - navrhuje pravidlá a dohliada na ich plnenie
- Parlament + Rada EÚ
  - prijímajú legislatívu
- Európska rada
  - určuje politické smerovanie
- členstvo SR
  - jednotný trh, fondy, euro, voľný pohyb

## E10 Ekonomická integrácia
- zóna voľného obchodu
- colná únia
- spoločný trh
- hospodárska a menová únia
- viac integrácie
  - menej bariér, ale menej národnej autonómie

## E11 Medzinárodný obchod
- liberalizmus
  - menej bariér → viac obchodu a konkurencie
- protekcionizmus
  - clá a kvóty → ochrana domácich výrobcov
- WTO
  - pravidlá a riešenie obchodných sporov
- SR
  - exportne orientovaná a závislá od EÚ

## E12 Pohyb kapitálu
- priame investície
  - kontrola podniku, technológie, pracovné miesta
- portfóliové investície
  - cenné papiere, vyššia mobilita
- úvery a ostatné investície
- hostiteľská krajina
  - kapitál a know-how, ale aj odliv ziskov

## E13 Udržateľnosť
- Agenda 2030
  - 17 cieľov udržateľného rozvoja
- Európska zelená dohoda
  - klimatická neutralita EÚ
- náklady
  - investície a transformácia podnikov
- prínosy
  - inovácie, úspory zdrojov, nové trhy

## Prepojenia
- integrácia → jednotný trh → rast obchodu a pohybu kapitálu
- otvorená SR → profituje z EÚ → zároveň silno reaguje na zahraničné krízy
- protekcionizmus → chráni odvetvie → zdražuje dovoz a oslabuje konkurenciu
- priame investície → rast kapitálu a produktivity → vyšší potenciálny HDP
- zelená transformácia → nové náklady dnes → nižšie environmentálne riziká neskôr
""",
    ),
    (
        "03_penaze_a_bankovnictvo.md",
        "Peniaze a bankovníctvo",
        """
## E14 Peniaze
- funkcie
  - výmena, zúčtovanie, uchovanie hodnoty
- peniaze
  - všeobecný ekonomický pojem
- mena
  - konkrétna peňažná sústava štátu alebo únie
- CBDC
  - digitálne peniaze centrálnej banky

## E15 ECB a NBS
- ECB
  - riadi menovú politiku eurozóny
- Rada guvernérov
  - hlavné rozhodnutia o sadzbách
- NBS
  - súčasť Eurosystému, dohľad a národné úlohy
- vzťah
  - ECB rozhoduje spoločne, NBS vykonáva a prenáša politiku na Slovensko

## E16 Finančný systém
- centrálna banka
- obchodné banky
- nebankové inštitúcie
  - poisťovne, fondy, obchodníci s cennými papiermi
- riziká bánk
  - úverové, trhové, likviditné, operačné
- regulácia
  - stabilita a ochrana klientov

## E17 Obchodné bankovníctvo
- pasívne operácie
  - banka získava zdroje, najmä vklady
- aktívne operácie
  - banka poskytuje úvery a investuje
- zisk banky
  - úrokové a poplatkové výnosy mínus náklady a straty
- produkty
  - vklady, úvery, platby, investície
- úverová zmluva
  - suma + úrok + splatnosť + zabezpečenie

## Prepojenia
- peniaze umožňujú platby → banky sprostredkujú ich pohyb
- ECB zmení sadzby → bankám sa zmení cena zdrojov → zmenia sadzby klientom
- banka prijme vklady → poskytne úvery → financuje spotrebu a investície
- viac úverov → vyšší rast, ale aj vyššie úverové riziko
- regulácia → obmedzuje riziko → podporuje stabilitu systému
""",
    ),
    (
        "04_trh_prace_a_rast.md",
        "Trh práce a ekonomický rast",
        """
## E18 Trh práce
- ponuka práce
  - domácnosti a pracovníci
- dopyt po práci
  - zamestnávatelia
- mzda
  - cena práce
- rovnováha
  - ponuka práce = dopyt po práci
- minimálna mzda
  - chráni príjem, ale môže zvýšiť náklady zamestnávateľov

## E19 Rast a Okunov zákon
- Okunov zákon
  - HDP rastie → nezamestnanosť spravidla klesá
- dlhodobý rast
  - kapitál + práca + produktivita + technológie
- úspory
  - zdroj investícií
- investície
  - rozširujú kapitál a budúcu produkciu
- automatizácia a AI
  - rast produktivity + zmena požadovaných zručností

## Prepojenia
- dopyt po výrobkoch rastie → firmy vyrábajú viac → rastie dopyt po práci
- investície rastú → kapitál a produktivita rastú → potenciálny HDP rastie
- technologický pokrok → niektoré miesta zaniknú → nové zručnosti získajú hodnotu
- nesúlad zručností → štrukturálna nezamestnanosť → potreba rekvalifikácie
""",
    ),
    (
        "05_financny_manazment.md",
        "Finančný manažment",
        """
## E20 Finančný manažment
- hlavný cieľ
  - zvyšovať hodnotu podniku
- financovanie
  - odkiaľ podnik získa peniaze
- investovanie
  - kam podnik peniaze vloží
- likvidita
  - schopnosť platiť záväzky načas
- riziko a výnos
  - vyšší očakávaný výnos spravidla znamená vyššie riziko

## Finančné prostredie
- trhy
  - peňažný a kapitálový
- inštitúcie
  - banky, poisťovne, fondy
- nástroje
  - úvery, dlhopisy, akcie

## Prepojenia
- podnik potrebuje majetok → musí vybrať zdroj financovania
- financovanie má cenu → cena kapitálu ovplyvní výber investície
- zisk nestačí → podnik potrebuje aj hotovosť a likviditu
- každé finančné rozhodnutie spája výnos, riziko a čas
""",
    ),
    (
        "06_naklady_majetok_a_uctovnictvo.md",
        "Náklady, majetok a účtovníctvo",
        """
## E21 Náklady
- fixné
  - nemenia sa priamo s objemom výroby
- variabilné
  - menia sa s objemom výkonov
- priame
  - možno priradiť produktu
- nepriame
  - režijné náklady
- ABC kalkulácia
  - náklady sa priraďujú podľa aktivít a ich príčin

## E22 Majetok
- dlhodobý majetok
  - slúži dlhšie než rok
- obežný majetok
  - zásoby, pohľadávky, peniaze
- oceňovanie
  - historická cena verzus reálna hodnota
- odpisy
  - rozloženie hodnoty majetku do nákladov
- pracovný kapitál
  - obežný majetok mínus krátkodobé záväzky

## E23 Zdroje financovania
- vlastné zdroje
  - kapitál vlastníkov, nerozdelený zisk
- cudzie zdroje
  - úvery, záväzky, dlhopisy
- kapitálová štruktúra
  - pomer vlastného a cudzieho kapitálu
- finančná páka
  - dlh môže zvýšiť výnos vlastníkov aj riziko

## E24 Účtovné výkazy
- súvaha
  - majetok = vlastné imanie + záväzky
- výkaz ziskov a strát
  - výnosy − náklady = výsledok hospodárenia
- cash flow
  - skutočný pohyb peňazí
- rozdiel
  - zisk nie je to isté ako hotovosť

## E25 Účtovné vzťahy
- podvojné účtovníctvo
  - každá operácia má dve strany: MD a D
- odberatelia
  - pohľadávky
- dodávatelia
  - záväzky
- mzdy a dane
  - vzťahy k zamestnancom a štátu
- cenné papiere
  - majetkové verzus dlhové

## Prepojenia
- nákup majetku → zdroj financovania → zmena súvahy
- používanie majetku → odpisy → náklady → nižší účtovný zisk
- predaj na faktúru → výnos a pohľadávka → peniaze prídu neskôr
- vysoký zisk + nezaplatené faktúry → možný problém s likviditou
- viac dlhu → vyššia páka → vyšší možný ROE aj finančné riziko
""",
    ),
    (
        "07_analyza_uroky_a_investicie.md",
        "Finančná analýza, úroky a investície",
        """
## E26 Finančná analýza
- likvidita
  - schopnosť splácať krátkodobé záväzky
- zadlženosť
  - miera financovania dlhom
- aktivita
  - efektívnosť využitia majetku
- rentabilita
  - ROA, ROE, ROS
- hodnota
  - FCF, EVA, MVA, ROIC

## E27 Časová hodnota peňazí
- euro dnes > euro v budúcnosti
- budúca hodnota
  - úročenie
- súčasná hodnota
  - diskontovanie
- anuita
  - rovnaké pravidelné platby
- perpetuita
  - nekonečný rad platieb

## E28 Cena peňazí a kapitálu
- nominálny úrok
  - uvedená sadzba
- reálny úrok
  - nominálny úrok mínus inflácia
- cena kapitálu
  - požadovaná návratnosť zdrojov firmy
- výnosová krivka
  - úroky podľa splatnosti
- kurz
  - rozdiel úrokov ovplyvňuje pohyb kapitálu a menu

## E29 Riziko a výnos
- vyšší výnos ↔ vyššie riziko
- izolované riziko
  - rozptyl a smerodajná odchýlka
- portfólio
  - kombinácia aktív
- diverzifikácia
  - znižuje špecifické riziko
- CAPM
  - požadovaný výnos = bezrizikový výnos + odmena za systematické riziko

## E30 Investičné rozhodovanie
- doba návratnosti
  - ako rýchlo sa investícia vráti
- NPV
  - súčasná hodnota prínosov mínus investícia
- IRR
  - výnosová miera, pri ktorej NPV = 0
- index ziskovosti
  - hodnota prínosov na jedno investované euro
- rozhodnutie
  - NPV > 0 → projekt vytvára hodnotu

## Prepojenia
- účtovné výkazy → finančné ukazovatele → posúdenie zdravia podniku
- vyššia inflácia → vyšší požadovaný nominálny úrok
- vyššie riziko → vyššia požadovaná návratnosť → nižšia súčasná hodnota
- diverzifikácia → nižšie špecifické riziko portfólia
- cena kapitálu → diskontná sadzba → ovplyvní NPV projektu
- kladná NPV → investícia zvyšuje hodnotu podniku
""",
    ),
]

if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
OUTPUT.mkdir(parents=True)

index = [
    "# Kľúčové kontextové mapy – Ekonómia a financie",
    "",
    "Tieto mapy neobsahujú celé odpovede. Ukazujú iba základné pojmy,",
    "príčiny, následky a prepojenia medzi otázkami.",
    "",
]

for filename, title, body in MAPS:
    content = f"# {title}\n{body.strip()}\n"
    (OUTPUT / filename).write_text(content, encoding="utf-8")
    index.append(f"- [{title}]({filename})")

(OUTPUT / "00_PREHLAD.md").write_text("\n".join(index) + "\n", encoding="utf-8")
print(f"Created {len(MAPS)} context maps in {OUTPUT}")
