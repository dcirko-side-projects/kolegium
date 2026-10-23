# Vizualna revizija Kolegiuma

Online update 2026-10-19: korisnik izričito odobrio i provedena je Hosting-only objava cijelog aktualnog frontenda s redizajnom i postojećim in-app podsjetnicima. Release 276da58dcec7220b4701; build/release PWA/hosted HTTP i desktop/mobile login smoke PASS. Raniji navodi da je UI/reminder samo lokalan opisuju stanje prije ove objave. Bez mobile push aktivacije, data/Rules migracije, naplate ili Git commit/pusha. Dokazi i granice u CURRENT_STATE/DEPLOYMENT.

Datum: 2026-10-19. Korisnik odobrio cjelovit frontend redizajn uz očuvanje funkcionalnosti. Lokalna implementacija, bez naloga za objavu.

## Nalazi pregleda prije implementacije

Pregledani shell/navigacija, login, Početna, Sve sekcije, Kolegiji i detalj, Raspored/ICS import, Dolaznost, zajednički prikazi provjera/projekata i njihovi detalji, To-do, Diplomski, Rate, bodovanje/pokušaji i Postavke/backup/PWA.

- Panel je služio kao gotovo jedina razina hijerarhije. Ugniježđeni paneli, redovi i obrasci izgledali su jednako; ponovljene akcije nisu imale jasnu prostornu vezu sa sadržajem.
- `.field` i `.form-field` nisu dijelili razmake. Forme s `form-grid` smještale su naslove i završne akcije u pojedinačnu ćeliju. Datum u toolbaru rasporeda rastezao se zbog globalnog `width: 100%`.
- Desktop sidebar zauzimao je prostor već od 768 px. Na tabletima je nedostajala širina za dvostupčane podatke i forme.
- Početna je počinjala velikom promotivnom porukom i podsjetnicima prije današnje nastave. Ponavljanje iste bijele kartice nije davalo dovoljno informacijske hijerarhije.
- Tjedni raspored bio je negrupiran niz termina; datum, vrijeme, status i sekundarne radnje natjecali su se za pažnju. To-do i rate nisu razlikovali glavni podatak od metapodataka.
- Informacije i poveznice kolegija bile su serijski puni paneli čak i na velikom zaslonu; dugački sadržaj i bodovanje trebali su konzistentne granice i ritam.

## Provedba

Centralni tokeni i zajednički obrasci uređuju sve sekcije. Quantum Blue i Ice Glass ostaju; dodane su tamnoplava navigacija, srednje plava i svijetloplava površina. Bijela je glavna radna površina. Mali radijusi 4/6/8 px, bez gradijenata, novih fontova ili UI biblioteka.

Shell ima kontrastnu navigaciju, aktualni odabrani semestar i aktivnu roditeljsku sekciju na detail rutama. Ispod 1024 px koristi donju navigaciju i Sve sekcije. Safe-area, fokus, skip-link i statusi ostaju dostupni.

Početna daje prioritet danu i nastavi. Raspored grupira iste postojeće termine po datumu, zadržavajući redoslijed i radnje. SessionRow ističe vrijeme i tekstualni status; iste se radnje koriste na Početnoj, Rasporedu i Dolaznosti. To-do/projekti/provjere/rate koriste konzistentne redove; EUR iznos ima zasebnu hijerarhiju. Kolegij razdvaja informacije i poveznice u desktop stupce, a mobilno ih slaže redom. Diplomski koristi semantički prikaz teme/mentora. Rezultati, pravila, backup i import koriste zajedničke razmake, fieldsete, kontrolirane širine i sekcijske granice.

Pravila, upiti, repositoryji, Firestore schema/Rules i obračuni nisu dio ove promjene. Zasebne istodobne izmjene učitavanja aplikacije i podatkovnog sloja sačuvane su. Poslovni ugovori i otvoreni TASK-009C ostaju prema postojećoj dokumentaciji.

## Provjere

Dokazi i konačni rezultati u CURRENT_STATE i TESTING. `scripts/capture-academic.mjs` reproducira sintetičke snimke desktopa, Pixel 7 i tableta 768 px, uključujući obrasce i bodovanje. Testni seed/reset ostaje isključivo demo-kolegium-tests; ne dira cloud/dev podatke. `scripts/audit-frontend.mjs` koristi već pripremljen sintetički dataset, provjerava projekt prije prijave, prolazi stranice i glavne otvorene obrasce na 320/390/768/1024/1440 px, radi axe provjeru i provjeru horizontalnog overflowa. Rezultat sprema u ignorirani artifacts/ui-review/audit.json.

Snimke i preglednik dokazuju lokalni Chromium prikaz sa sintetičkim podacima. Ne predstavljaju fizički Android/iPhone, Safari, stvarni OAuth ili cloud dokaz.
