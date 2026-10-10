# Product Requirements Document

**Projekt:** Kolegium (radni naziv)  
**Datum:** 2026-10-07  
**Status:** Bootstrap baseline; konkretna pravila kolegija čekaju korisnikove izvore.

## 1. Overview, problem i korisnik

Jedno mjesto za pregled i organizaciju osobnih fakultetskih obaveza na mobitelu i laptopu. Informacije su trenutačno raspršene; korisnik posebno zaboravlja evidentirati dolaznost. Primarni i jedini korisnik MVP-a je vlasnik aplikacije.

Uspjeh znači: brzo evidentirati dolazak, pronaći današnju nastavu i nadolazeće obaveze, vidjeti otvorene zadatke i sačuvati podatke kroz semestre. Broj featurea nije cilj. Nema SaaS-a, društvene mreže, multi-tenancyja ni institucionalnog SIS-a.

## 2. Scope i prioriteti

Status ideje (confirmed/suggested/future idea/unresolved) odvojen je od prioriteta (MUST/SHOULD/COULD/LATER).

### In Scope — confirmed / MUST

Kolegiji, dolaznost, tjedni raspored, provjere znanja i svi pokušaji, projekti, jedna To-do sekcija, osnovni diplomski, rate, evidencija ocjena/bodova, zbroj i računanje ocjene prema dostupnim pravilima, semestralna arhiva, privatni pristup i ručni backup/povrat.

### SHOULD

Pomoćni UI za brzo pronalaženje i sortiranje u postojećim listama; ne blokira osnovne MUST tokove. Nije dodatna puna tražilica.

### COULD

Dodatne nepovezane bilješke i ukupan preostali iznos svih rata. Nisu dio implementacijskog MVP backlog-a.

### Out of Scope — LATER

Offline unos/sinkronizacija, push/e-mail podsjetnici, widgeti, AI, import rasporeda, vanjske calendar/TVZ/bankovne integracije, uploads materijala/potvrda uplata, djelomične uplate, društvene funkcije, kompleksni milestoneovi diplomskog i napredna statistika. Ne implementirati bez promjene scopea.

## 3. Core user stories

- US-001: Vidjeti današnju nastavu i odmah zapisati prisutnost kako je ne bih zaboravio.
- US-002: Vidjeti rokove i otvorene zadatke kako bih planirao tjedan.
- US-003: Vidjeti povezane informacije, dolaznost i rezultate kolegija na jednom mjestu.
- US-004: Pratiti zadatke diplomskog prije nego što znam temu.
- US-005: Evidentirati plaćene i nadolazeće rate.
- US-006: Sačuvati podatke i oporaviti ih iz vlastite kopije.

## 4. Functional requirements

| ID | Zahtjev | Prioritet | Acceptance sažetak |
|---|---|---|---|
| FR-001 | Privatni pristup Google prijavom | MUST | Samo odobreni UID može čitati/pisati; prijava se zadržava na vlastitom uređaju |
| FR-002 | Semestri i arhiva | MUST | Aktualni semestar je glavni kontekst; arhiva zadržava povijest uz izričito uređivanje |
| FR-003 | Kolegiji i informacije | MUST | Unos naziva, informacija i linkova; povezani sadržaji bez dupliciranja |
| FR-004 | Tjedni raspored | MUST | Dan/tjedan, vrsta nastave, vrijeme i opcionalna lokacija; ponavljanje ograničeno datumima semestra |
| FR-005 | Evidencija dolaznosti | MUST | Predavanja/vježbe odvojeno; prisutan/odsutan/neoznačen; naknadni ispravak; jedan zapis po terminu |
| FR-006 | Pregled uvjeta dolaznosti | MUST | Broj dolazaka, službeni ukupni broj i minimum; preostali dolasci uz upozorenje na neoznačene termine |
| FR-007 | Iznimke nastave | MUST | Otkazano nije izostanak; nadoknada zaseban termin; budući raspored ne mijenja povijest |
| FR-008 | Kolokviji/ispiti i ostale provjere | MUST | Naziv, vrsta, kolegij, datum/opcionalno vrijeme, obavljeno; svi pokušaji sačuvani |
| FR-009 | Projekti | MUST | Naziv, opcionalni kolegij/rok, povezani zadaci, završeno i rezultat |
| FR-010 | Jedna To-do sekcija | MUST | Naziv, opcionalni datum roka i kontekst, dovršeno; filtri; samostalni zadaci |
| FR-011 | Osnovni diplomski | MUST | Tema/mentor mogu nedostajati; osnovne informacije i zadaci dostupni |
| FR-012 | Rate fakulteta | MUST | Naziv/redni broj, EUR iznos, rok, plaćeno/neplaćeno; neplaćene među nadolazećim obavezama |
| FR-013 | Početna | MUST | Današnja nastava, otvoreni zadaci, nadolazeće obaveze; izravan unos prisutnosti |
| FR-014 | Unos rezultata | MUST | Pojedinačni bodovi vježbi/predavanja/provjera/projekata gdje se boduju; ocjene stavki/kolegija; nepoznato nije nula |
| FR-015 | Zbroj i ocjena kolegija | MUST | Bodovi se zbrajaju jednom; ocjena prema potvrđenim pravilima; bez pravila nema izmišljene ocjene |
| FR-016 | Zajednički podaci i pouzdano spremanje | MUST | Uspjeh samo nakon potvrde servera; refresh drugog uređaja; konflikt ne pregazi tiho podatke |
| FR-017 | Export i povrat podataka | MUST | Validirana kopija bez auth podataka, potvrda zamjene, neuspjeh ne ostavlja djelomičnu aktivnu kopiju |
| FR-018 | Mobile i desktop pristup | MUST | Android/iPhone/Windows, PWA i hrvatski UI, sve sekcije lako dostupne |

## 5. Domain pravila

- Semestar ima datume nastave; stvarni datumi dolaze od korisnika. Kolegij je upis u konkretan semestar, pa ponovni upis ne prepisuje povijest.
- Termini imaju vrstu lecture/exercise. Jedan blok rasporeda predstavlja jednu attendance jedinicu dok pravila ne odrede drukčije. Granularnost provjeriti prije unosa stvarnih pravila.
- Neoznačeni termin nije izostanak. Otkazano je stanje termina, ne attendance rezultat. Otkazivanje ne mijenja službeni total/minimum automatski.
- Broj dolazaka P iz poznatih prisutnih termina prikazati uz A odsutnih i U neoznačenih održanih/prošlih termina. Preostalo do minimuma je max(0, minimum-P). Postotak službenog fonda P/total može se prikazati samo kada total>0 i s nazivom koji objašnjava nazivnik; nikad kao procjena konačnog ishoda bez evidencije. total/minimum mogu biti nepoznati; tada nema izvedenog uvjeta. Mora vrijediti 0 <= minimum <= total.
- Task ima jedan kontekst: none/course/project/thesis. Kolegij projekta određuje course kontekst njegovih zadataka. Izbjegavati dvije proturječne veze.
- Završetak provjere/projekta i ocjena/položenost zasebni su pojmovi; prošli datum ne dovršava stavku.
- Svaki bodovni rezultat ima jedan izvor. Prikaz u više sekcija ne stvara novi rezultat. Rezultat može nedostajati; 0 je stvarno unesena nula.
- Svi pokušaji sačuvani. Način obračunskog odabira pokušaja ostaje unresolved; bez njega prikazati da zbroj nije potpun umjesto zbrajanja svih pokušaja.
- Projektni bodovi ulaze u zbroj samo prema pravilima kolegija. Dolaznost ne generira bodove bez takvog pravila.
- Ocjena se izvodi iz bodova tek uz poznate pragove, uključene komponente i izbor rezultata. Prikaz je osobni izračun, uz označenu nepotpunost dok sve komponente nisu završene. Ručno unesena službena ocjena ostaje zasebna od izračunate; razlika se vidi i ne prepisuje automatski.
- Skala ocjena, decimalna preciznost, zaokruživanje, intervali i dodatni pragovi čekaju izvore. Nema univerzalne pretpostavke 1–5 ili 50%.
- Početna prikazuje sve zakašnjele nedovršene obaveze i sljedećih 14 dana; UI može promijeniti raspon. Taj raspon je početna UX postavka, ne poslovno pravilo. Datum roka nije vrijeme; nastava koristi Europe/Zagreb.
- Umjesto kaskadnog brisanja povezanih podataka koristiti arhiviranje; prazni nepovezani zapisi mogu se izbrisati uz potvrdu. Pravilo detaljnije u DATABASE.

## 6. MVP acceptance i uspjeh

- FR-001–FR-018 imaju implementirane odgovarajuće tokove i acceptance dokaze.
- Stvarna dolaznost unosi se iz današnjeg termina najviše dvjema radnjama nakon otvaranja Početne.
- Spremanje, greške i nepoznati rezultati su vidljivi; nema dvostrukih bodova/dolazaka.
- Restart/drugi uređaj vraćaju serverom potvrđene podatke; backup se može vratiti bez miješanog dataset-a.
- Kritični testovi/Rules/build/lint prolaze; Android i iPhone imaju stvarnu provjeru, odvojenu od emulacije.
- Za puni stvarni obračun ocjena moraju biti dostavljena i validirana pravila kolegija. Bez njih može biti spreman generički dio i unos; FR-015 za stvarne kolegije ostaje djelomično verificiran.

## 7. Open questions i assumptions

- Korisnik će dostaviti svih pet aktualnih i dva buduća kolegija, raspored i pravila. Njihova imena, satnica i pravila nisu poznati.
- Izbor pokušaja trenutačno nije korisnikov prioritet; ostaje otvoren samo za obračun koji o njemu ovisi.
- Radni naziv Kolegium, projekcije rokova i izvedbena pravila označeni u ovoj dokumentaciji nisu nova potvrda branding odluke.
- Ne mijenjati MUST u LATER zbog nedostajućih izvora; označiti konfiguraciju/acceptance koji čekaju podatke.
