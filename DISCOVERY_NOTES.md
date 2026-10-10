# Discovery — radne bilješke

Datum: 2026-10-07
Faza: PHASE 9 — bootstrap dokumentacija/audit/roadmap pripremljeni; STOP prije implementacije. Finalni scope je u docs/PRD.md, a stanje u docs/CURRENT_STATE.md. Ova bilješka čuva discovery povijest i ne nadjačava finalne ugovore.

Ovo je zapis odluka iz discoveryja, a ne finalni PRD, arhitektura ili implementation roadmap. Nema implementacije. Potvrđeni stack i izvedbeni baseline sada su u projektnim dokumentima; otvorena pravila i Proposed ADR-004 vidljivi su u auditu. Nakon bootstrap procesa potrebno je izričito odobrenje korisnika za implementaciju.

## Potvrđeno — confirmed

- Osobna, privatna aplikacija za organizaciju fakultetskih obaveza; primarni korisnik je vlasnik projekta.
- Mobitel i laptop koriste iste podatke. Mobile UX i desktop pregled važni su.
- MVP treba internet za rad. Offline rad nije zahtjev MVP-a.
- Sve potvrđene sekcije trebaju biti lako dostupne.
- MUST područja: kolegiji, dolaznost, raspored, kolokviji/ispiti, projekti, jedna objedinjena To-do sekcija i diplomski.
- Dolaznost je glavni prioritet; ostala područja počinju s osnovnim funkcionalnostima.
- Taskovi i opća To-do lista spojeni su u jednu sekciju. Ne postoje dvije odvojene sekcije za zadatke.
- Dolaznost se prati po kolegiju, odvojeno za predavanja i vježbe. Korisnik daje ukupan broj termina i minimalan broj dolazaka potreban za prolaz.
- Raspored je isti svaki tjedan; korisnik će dati raspored.
- Ovaj semestar ima pet kolegija, idući dva.
- Korisnik će dostaviti informacije s TVZ stranica, primjerice sadržaj, uvjete i linkove. Točni podaci i struktura bit će određeni nakon pregleda dostavljenog materijala.
- Diplomski je MUST, ali se koristi rjeđe. Početni opseg: osnovne informacije, mentor i zadaci. Tema još nije poznata.
- Kolokviji/ispiti: praćenje što korisnika čeka i kada, uz novu potvrđenu potrebu za unosom rezultata/ocjene; detaljna pravila rezultata tek se definiraju.
- Projekti: osnovno praćenje projekata, rokova i obaveza; moguća veza s kolegijem.
- Paleta: Quantum Blue #2457FF i Ice Glass #DFF7FF. Uloge boja, fontovi i ostali design tokeni nisu definirani.
- Korisnik je prihvatio prijedloge prethodnog product/UX batcha:
  - jedan zadatak, bez dupliciranja, može biti samostalan ili povezan s kolegijem, projektom ili diplomskim;
  - zadatak ima naziv, opcionalni rok, opcionalnu poveznicu i dovršeno/nedovršeno; To-do prikazuje sve zadatke s filtrima prema kontekstu;
  - dolaznost: Prisutan / Odsutan / Neoznačen, brz unos iz današnje nastave i naknadni unos/ispravak; neoznačeno nije izostanak;
  - otkazani termin nije izostanak; službeni ukupan broj i minimum mijenjaju se samo ručno prema informacijama kolegija; nadoknada je zaseban termin;
  - dvije kategorije dolaznosti po kolegiju: predavanja i vježbe; nema potvrđenog zahtjeva za dodatno dijeljenje vježbi;
  - Početna prikazuje današnju nastavu, nadolazeće rokove i zadatke;
  - laptop: stalna bočna navigacija; mobitel: Početna, Raspored, To-do i Sve sekcije;
  - arhiva ranijih semestara čuva kolegije i dolaznost; aktualni semestar je glavni prikaz;
  - početni opseg projekata: naziv, opcionalna veza s kolegijem, rok i zadaci;
  - početni opseg provjera: naziv, vrsta, kolegij i datum, vrijeme ako je poznato;
  - diplomski: osnovne informacije, tema i mentor kada budu poznati, povezani zadaci;
  - prihvaćen smjer boja: Quantum Blue za glavne akcije/aktivne elemente, Ice Glass za blage površine/isticanje; kontrast i tokeni tek slijede.
- Novi izričit zahtjev: mala sekcija za rate fakulteta, iznos i rok plaćanja. MUST dodatak osnovnom MVP-u.
- Rate potvrđene: naziv/redni broj, iznos u eurima, rok i ručno plaćeno/neplaćeno; neplaćene rate među nadolazećim obavezama. Nema djelomičnih uplata u MVP-u.
- Podržani uređaji: Android, iPhone i Windows. UI je hrvatski.
- Aplikacija treba biti lako dostupna preko interneta s mobitela i neovisna o tome je li laptop uključen.
- Budžet: preferirano besplatno, najviše 5 EUR mjesečno ukupno za rad aplikacije. Ovo nije odobrenje za aktivaciju plaćene usluge. Rok prve verzije nije naveden.
- Platforma potvrđena: responsive web + PWA za MVP, online rad bez offline unosa/sinkronizacije.
- Potvrđen pristup samo korisnikovu odobrenom računu, bez javne registracije, sa zadržavanjem prijave na vlastitim uređajima. Potvrđena Google prijava kroz Firebase Authentication.
- Korisnik nema preferenciju tehnologija; agent treba usporediti razumne opcije i preporučiti, a korisnik donosi odluku.
- Korisnik je potvrdio Angular + TypeScript, Firebase Authentication, Cloud Firestore i Firebase Hosting; početni plan Spark. Tehničke odluke zabilježene su u docs/decisions/ADR-001-platform.md, ADR-002-stack.md i ADR-003-access.md.
- Prihvaćena je predložena arhitektura: UI po featureima, odvojena application/domain logika i Firebase pristup, reusable komponente i Security Rules; vlastiti backend nije planiran za sadašnji MVP. Novi zahtjevi moraju se provjeriti prema tim granicama.
- Tjedni raspored i konkretni termini različiti su koncepti. Promjena budućeg rasporeda ne mijenja povijest dolaznosti; povijesni ispravak je izričita radnja. Jedan termin ima jednu promjenjivu evidenciju, bez dupliciranja dolazaka.
- Datum roka razlikuje se od vremena nastave; predložena zona Europe/Zagreb prihvaćena je uz ostatak arhitekturnog prijedloga.
- Arhivirani semestar prvenstveno je za pregled; naknadni ispravak moguć je kroz izričitu akciju uređivanja.
- Projekt se može označiti završenim, a provjera obavljenom. Prošli datum ne znači automatsko dovršavanje; završetak i rezultat su odvojeni pojmovi.
- MUST: ručni export i povrat svih podataka aplikacije, bez prijavnih tokena, uz validaciju i potvrdu prije zamjene. Detaljna strategija sigurnog povrata još se mora definirati.
- Prihvaćeno pouzdano spremanje: jasno spremanje/uspjeh/pogreška, ponovni pokušaj bez gubitka unosa, osvježavanje podataka pri povratku i zaštita od neprimjetnog pregaženja istodobnih izmjena.
- Novo proširenje scopea — confirmed/MUST: unos ocjena projekta, kolegija i kolokvija te bodova vježbi, konačnih bodova i potrebnih bodova za prolaz kolegija. Novi zahtjev zamjenjuje raniji status ocjena/bodova kao nepotvrđenih ideja.
- MUST: konačni bodovi automatski su zbroj pojedinačnih bodova iz vježbi, predavanja i kolokvija kroz semestar. Ocjena kolegija računa se prema bodovima i pravilima tog kolegija. Korisnik će dostaviti pravila; pragovi i formule ne smiju se izmišljati.
- MUST: čuvaju se svi pokušaji provjera znanja. Korisnik izbor pokušaja smatra trenutačno nebitnim; ne nastavljati discovery pitanjima o tome. Način uključivanja rezultata u zbroj ostaje otvoren za detaljnu specifikaciju; svi pokušaji ne smiju se automatski zbrojiti.
- Sekcije su povezane kroz kolegij: provjere, dolaznost, nastava, projekti i bodovni rezultati čine povezani pregled.
- Korisnik trenutačno nema točne informacije i pravila. Dostavit će ih za sve kolegije kad ih dobije. Projektno dokumentiranje može napredovati s izričito otvorenim domain pravilima; nema izmišljenih pravila ni privremenih pragova koji se predstavljaju kao stvarni.
- Bodovi projekata ulaze u bodovanje ako to određuju pravila kolegija; konkretna pravila još nisu dostupna.

## Prijedlozi — suggested; nisu odobreni zahtjevi

- COULD: dodatne bilješke izvan informacija o kolegiju, ako se potvrdi konkretna potreba.
- Ocjena i bodovi odvojeni su podaci; neunesen rezultat nije nula ni pad. Rezultati su opcionalni prije objave ili za stavke koje se tako ne ocjenjuju.
- Predložen razdvojen prikaz: evidentirani zbroj bodova i izračunata ocjena prema potpunim pravilima. Bez pravila nema izračunate ocjene; nepotpuni rezultati ne predstavljaju konačnu ocjenu.
- Predložen jedan bodovni zapis za stvarni rezultat, povezan s izvornom provjerom/aktivnošću/projektom, bez dvostrukog pribrajanja zbog prikaza u različitim sekcijama.
- Predložen prikaz rezultata u detalju kolegija i pripadajućim projektima/provjerama, bez nove glavne navigacijske sekcije. Nije odobreno.

## Buduće ideje — future idea

- LATER: offline pregled/unos i naknadna sinkronizacija; korisnik želi ponovno procijeniti potrebu nakon MVP-a.
- LATER prijedlozi, bez odobrenja za razvoj: AI, widgeti, vanjske integracije i import rasporeda.

## Otvoreno — unresolved

- Točan sadržaj kartice kolegija nakon što korisnik dostavi TVZ informacije.
- Računanje postotka dolaznosti i upozorenje kada uvjet više nije dostižan; detaljni postupak nadoknade.
- Datumi početka/kraja semestra i iznimke tjednog rasporeda; postupak otvaranja novog semestra.
- Detaljni tokovi unosa i uređivanja te loading/empty/error/success stanja.
- Konkretni preglednici/verzije podržanih platformi; odobreni UID postavlja se tek pri pripremi okruženja.
- Prihvatljiva ograničenja besplatnog hostinga, detaljna export/restore strategija i rok prve verzije.
- Podsjetnici/notifikacije, materijali i milestoneovi diplomskog nisu potvrđeni MVP zahtjevi.
- Otvorene tehničke odluke: detaljne granice pristupa podacima, struktura Firestore dokumenata, Security Rules, backup, CI, deployment postupak, test alati, PWA cache/update pravila i konkretne verzije ovisnosti. Osnovni stack i hosting potvrđeni su.
- Ocjenjivanje: skala i pragovi ocjena, granice/zaokruživanje, maksimumi/minimumi po komponenti, detaljna granularnost aktivnosti, pravilo izbora pokušaja, ulaze li bodovi projekata u ukupni zbroj, odnos prema uvjetima dolaznosti i postupanje s nepotpunim pravilima/rezultatima. Automatski zbroj i računanje ocjene te povijest pokušaja potvrđeni su.

## Granice procesa

- Prvo proizvod i UX, zatim usporedba tehničkih opcija i korisnikova odluka.
- Odabrati potrebne dokumente tek u documentation fazi i koristiti dostavljene templatee.
- Nakon dokumentacije slijede consistency audit i implementation roadmap.
- Nema inicijalizacije aplikacije, production codea, commita, pusha ili objave u ovoj fazi.

## Provjera tehničkih opcija — 2026-10-07

Ovo su izvori za usporedbu, a ne odluke o providerima:

- Instalacija PWA razlikuje se prema platformi/pregledniku; na iPhoneu je moguć pristup preko početnog ekrana: https://web.dev/learn/pwa/installation
- Firebase Spark je plan bez naplate, uz ograničenja pojedinih proizvoda: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firestore ima besplatne kvote; backup i restore traže billing: https://firebase.google.com/docs/firestore/pricing
- Supabase Free može pauzirati projekt s niskom aktivnošću tijekom sedam dana, što treba procijeniti prema zahtjevu lake dostupnosti: https://supabase.com/docs/guides/platform/free-project-pausing
- Cloudflare Pages ima besplatan plan za web hosting s definiranim limitima; hosting frontenda ne rješava sam po sebi pohranu i pristup privatnim podacima: https://developers.cloudflare.com/pages/platform/limits/
- Angular ima ugrađene obrasce, routing i dependency injection: https://angular.dev/overview
- React dokumentira Vite kao opciju za aplikaciju izrađenu od početka, uz zasebne odluke o routingu i drugim potrebama: https://react.dev/learn/build-a-react-app-from-scratch
- Firebase Security Rules provode pristup i validaciju zahtjeva web/mobile klijenata: https://firebase.google.com/docs/firestore/security/get-started
- Google prijava na webu: https://firebase.google.com/docs/auth/web/google-signin
- Cijene za provjeru prije aktivacije: https://firebase.google.com/pricing i https://supabase.com/pricing
