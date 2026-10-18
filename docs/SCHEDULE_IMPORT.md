# TVZ raspored — 2026-10-11

Korisnik je dostavio `C:/Users/domag/Downloads/Raspored_PROGING_Sem3_2026.ics` i zatražio izostavljanje svih termina kolegija **Modeliranje i administracija baza podataka**, unos preostalog rasporeda i mogućnost dodavanja/uklanjanja termina. To odobrava ograničeni ručni TVZ ICS uvoz uz postojeće FR-004/007; nije odobrenje za calendar sync ili novu automatsku objavu.

## Pregled izvora

235 pojedinačnih VEVENT zapisa; izostavljeno 30 termina baza; preostaje 205 termina / 5 kolegija. Datumi su 2026-10-05 — 2027-02-06. Floating vremena tumače se kao Europe/Zagreb, što piše u pregledu prije potvrde. Izvor ne koristi RRULE: ne generirati termine tijekom praznika niti pretvarati cijeli semestar u neprekidno tjedno ponavljanje.

| Kolegij | Predavanja | Blokovi vježbi u izvoru |
|---|---:|---:|
| Razvoj mobilnih aplikacija | 16 | 16 |
| Napredne tehnike projektiranja web servisa (open source, php) | 15 | 30 |
| Projektiranje inovacija | 16 | 32 |
| Bihevioralno upravljanje | 16 | 32 |
| NOSQL i napredna big data analitika | 16 | 16 |

Brojevi su **blokovi u datoteci**, nisu službeni total/minimum dolaznosti. Laboratorijske/auditorne/seminarske vježbe mapiraju se u exercise, predavanja u lecture. Svaki odabrani blok je jedna jedinica prema postojećem ugovoru; audit i seminar Projektiranja inovacija ostaju odvojeni blokovi.

Korisnik je 2026-10-11 izričito odabrao Web servise **18:00–19:30** i Bihevioralno upravljanje **19:00–20:30**. Nakon uklanjanja alternativnih 15 + 16 blokova ostaje **174 termina** (79 predavanja / 95 vježbi). UI vježbe početno ne odabire automatski; svi blokovi se mogu pregledati i uključiti prije potvrde. Korisnik treba odabrati/postaviti semestar s datumima koji obuhvaćaju raspored. Uvoz ne mijenja datume postojećeg semestra niti izmišlja službene datume.

Izvor nije mijenjan. Lokalna kopija bez baza: `artifacts/schedule/Raspored_PROGING_Sem3_2026_bez_baza.ics` (205 termina). **Za korisnikov konačni uvoz koristiti `artifacts/schedule/Raspored_PROGING_Sem3_2026_moj_raspored.ics` (174 termina, potvrđene grupe).** Obje su ignored; osobni raspored nije ugrađen u JavaScript bundle/Git fixtures.

## Implementirani tok

Raspored → Uvezi TVZ raspored → datoteka do 1 MiB → pregled svih grupa/dana/učionica → izričit odabir vježbi → potvrda u izabranom semestru. Nedostajući kolegiji dodaju se s nepoznatim pravilima, praznim informacijama/linkovima. Postojeći kolegiji po jedinstvenom nazivu se ponovno koriste; arhivirani ili višeznačni upisi zaustavljaju uvoz.

Svaki datum je pojedinačni session s templateId=null, replacementForId=null, attendance=unmarked. Ne uvodi se nova schema/Rules/migracija. Stable SHA-256 identitet uključuje semestar i normalizirani sadržaj termina, ne promjenjivi UID izvoza. Predlošci, postojeći snapshotovi, oznake dolaznosti i otkazivanja ne prepisuju se. Podudarni datum/vrsta/vrijeme/lokacija preskače se, uključujući virtualne termine.

Uvoz je **aditivan i sekvencijalan**, nije atomic restore: svaki zapis ima server-confirmed transakciju s root revision/lock/dataset provjerama. Pri prekidu UI prikazuje potvrđeni napredak i mogućnost djelomičnog uvoza. Ponoviti isti odabir nakon refresha; već spremljeno se preskače. Globalni pending blokira navigaciju/normalne radnje tijekom uvoza. Novi paralelni zapis s istim stable ID-em i drukčijom dolaznošću uzrokuje konflikt, ne tiho poništenje.

Dodaj pojedinačni termin: postojeći course selector, datum unutar semestra, vrijeme, lecture/exercise i opcionalna lokacija. Otkaži termin + Sakrij otkazane termine uklanja ga iz aktivnog pogleda uz sačuvanu povijest; Prikaži otkazane termine + Vrati u održano omogućuje povrat. Nema fizičkog brisanja povijesti. Korekcija datuma/vremena spremljenog snapshota: otkazivanje i novi termin, prema postojećem ugovoru.

## Granica isporuke

Implementacija i grupe potvrđene. Korisnik zasebno odobrio novu Hosting objavu i ona je izvedena 2026-10-11. Potom izričito zatražio upis iako ne može završiti browser prijavu: preko postojećeg CLI administrativnog računa validiran puni postojeći backup graf (domain kolekcije prazne), pa atomarno dodano 181 zapisa: 1 semestar, preferences/app, 5 kolegija i 174 termina. Root updateTime precondition štiti reviziju/restore lock/dataset, svi novi dokumenti koriste exists=false; nema brisanja ili overwrita postojećih zapisa. Svih 181 payload/revision/server timestamp server readback provjeren. Ponovljeni read-only plan daje 0 novih zapisa i 174 skipped. Backup prije upisa je ignored artifacts/schedule/before-cloud-schedule.json; sanitized rezultat cloud-import-result.json. Privremeni script je ignored .angular/tmp/cloud-calendar-import.mjs, nije runtime/admin API aplikacije.

Semestar 3. semestar 2026./2027. ima datume koji pokrivaju dostavljeni raspored, ne tvrdi da je poznat službeni akademski kalendar. Svi termini su unmarked, attendanceRules total/minimum=null. Svih 174 explicit sessiona zadržava source datume/lokacije, nema prazničnih virtualnih lekcija. Administrative commit/readback nije owner Google OAuth ili browser Rules dokaz. Google account chooser nije mogao biti dovršen kroz browser automation; korisnik će prijavu provjeriti kasnije. Puni device/cross-device/recovery acceptance ostaje otvoren.

Unit 39/39, schedule SDK 6/6, schedule browser 10/10 te dodatni import axe/320px 2/2. Typecheck/lint/format/release build i release PWA smoke PASS. Poznati initial bundle warning ostaje 833.54 kB/500 kB. Deploy hosting-only PASS, /login i /schedule HTTP 200 no-cache; worker no-store, content version cfc6dc22010eee79fdc7. Rules nepromijenjeni, nema novog commita/pusha ni naplate. Daljnji deploy traži novi nalog; pravila kolegija TASK-009C još nedostaju.
