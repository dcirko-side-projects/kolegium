# Pregled ovisnosti — 2026-10-08

## Aktualna provjera i zakrpe 23.10.2026.

Svježi početni audit postojećeg lockfilea: **16 nalaza (8 high / 7 moderate / 1 low)**, runtime bez nalaza. Primijenjene kompatibilne razvojne zakrpe: @angular/build i @angular/cli **21.2.28**, vitest **4.1.12**, firebase-tools **15.34.1**; ip-address **10.7.4** osvježen unutar postojećeg transitive semver ugovora. Angular runtime/compiler 21.2.25, Firebase SDK 12.19.0 i Node22 baseline ostaju isti. Instalacija s ignore-scripts; postojeći re2 native ABI load PASS na22.23.3. Nema force fixa, major overridea ili novog dependencyja.

Konačni registry snapshot: **0 runtime; 5 moderate razvojnih nalaza, 0 high/critical/low**. Preostalo: @google-cloud/pubsub → @opentelemetry/core1.x i gaxios6.x → uuid9.x te propagirani firebase-tools nalaz. Registry predlaže Firebase major downgrade, ne kompatibilnu zakrpu; ne forsirati. Browser runtime ne uključuje CLI lance. Preostali gate je dokumentiran OPEN5moderate, nije potpuni audit PASS. Izvještaji prije/nakon u ignoriranom artifacts/audit-*-2026-10-23.json.

Izvori: službeni npm registry package metadata za navedene točne verzije i audit; [Vitest maintainerova zakrpa](https://github.com/vitest-dev/vitest/releases/tag/v4.1.12), [ip-address advisory i zakrpa10.7.4](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5). Sastavljanje/testovi navedeni u CURRENT_STATE. Prvi artefakt samo s alatnim zakrpama bio je content-identičan objavljenom f1cf18a3673985c5f1fe (42SHA-256 usporedbe). Naknadno otkriveni i popravljeni Tab fokus te emulator transport stvaraju novi lokalni release **08e81c515a7f1629ce7e**, build/PWA PASS; nije objavljen u ovom nalogu.

## Aktualna zakrpa i provjera 19.10.2026.

Scoped override `superstatic → re2 1.26.1` zatvara četiri re2 advisories iz prethodne 1.24.1 verzije. [Maintainerova zakrpa i opis UTF-8 over-read greške](https://github.com/uhop/node-re2/security/advisories/GHSA-j4r3-hg7j-8chg) navode 1.26.1 kao popravljenu verziju. Nije promijenjen Angular, Firebase SDK ili CLI major. Zaključan pripadajući razvojni native-build lanac; njegov Node minimum je 22.22.2 unutar 22.x, verificirano 22.23.3. `allowScripts` dopušta samo točno `re2@1.26.1`; nisu blanket omogućene instalacijske skripte. Native compile/load i regresija skraćenog UTF-8 Buffera PASS na Node 22; pri rebuild-u PATH mora prvo sadržavati isti Node zbog ABI-ja, ne sistemski Node 24.

Svježi registry snapshot: `npm audit --omit=dev` **0**; puni audit **11 (7 high / 4 moderate)**, svi preostali nalazi u razvojnom Firebase CLI lancu. Izvještaji prije/poslije u ignoriranom artifacts/completion-2026-10-19/. Nema `audit fix --force`, major downgradea ili neprovjerenog major overridea. Preostali braces/basic-ftp/OpenTelemetry/uuid i propagirani CLI nalazi nisu označeni riješenima; puni dependency gate ostaje otvoren. Browser/runtime build ne uključuje te CLI pakete. Postojeća procjena ograničenih vlastitih Hosting/emulator inputa ostaje ograničena procjena, ne dokaz potpune nedostižnosti ranjivosti.

Initial default/release bundle sada **361.07 kB / približno 99.3 kB transfer**, ispod nepromijenjenog 500 kB warning budgeta. Lazy shell i odvojeni Auth/Firestore context uklanjaju rani database download/parse iz prijavnog entry grafa. PWA worker i dalje cacheira javne lazy assets; ukupna veličina aplikacije i stvarni mid-range cilj nisu time automatski dokazani. Mobile mjerenje ostaje zaseban acceptance. Stariji brojevi ispod su povijest.

TASK-002/003, Windows Node 22.20.0. Firebase SDK 12.19.0, CLI 15.33.0 i Rules testing 5.0.2 su pinned; lockfile je autoritet. Firebase 13 odbijen je zbog zahtjeva novijeg Node runtimea, bez mijenjanja potvrđenog foundationa.

Runtime gRPC advisory riješen je scoped overrideom @firebase/firestore → @grpc/grpc-js 1.14.5. SDK transakcije i Rules provjerene su na toj instalaciji; nije promijenjen Firebase major. `npm audit --omit=dev` sada prijavljuje **0** ranjivosti. To je registry snapshot, ne potpuna sigurnosna revizija.

Puni `npm audit` prijavljuje **12 development nalaza: 7 high, 5 moderate**, bez critical. Dodani Firebase CLI uvodi njihove dependency lance; ne ulaze u browser runtime. Nalazi nisu označeni kao riješeni:

| Korijen advisoryja | Pogođeni razvojni put | Procjena / otvoreni korak |
|---|---|---|
| [braces stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Firebase CLI → chokidar → braces | Audit nema zakrpanu verziju braces. Lokalni project globovi su kontrolirani; ne obrađivati nepoznate projekte/patterns bez pregleda. Pričekati upstream popravak/zamjenu i provjeriti prije release tooling uporabe. |
| [basic-ftp directory parser](https://github.com/advisories/GHSA-c475-qrg2-pj4r) | proxy-agent → pac-proxy-agent → get-uri → basic-ftp 5.3.1 | Zakrpa dostupna u 6.2.2, major izvan get-uri ugovora. Emulator workflow ne koristi FTP/PAC sadržaj. Nije napravljen neprovjeren major override; pratiti upstream, ponoviti pregled prije real deploya. |
| [OpenTelemetry baggage](https://github.com/advisories/GHSA-8988-4f7v-96qf) | CLI → pubsub → OpenTelemetry | Zakrpa 2.8.0, lokalni lanac 1.x. Nema Pub/Sub servisa u aplikaciji. Upstream kompatibilna nadogradnja treba pregled. |
| [uuid buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | CLI → gaxios → uuid 9.x | Zakrpa 11.1.1 mijenja major. Aplikacija koristi crypto.randomUUID, bez ovog runtime puta. Ne forsirati cijeli CLI downgrade koji audit predlaže. |
| [re2 buffer read](https://github.com/advisories/GHSA-j4r3-hg7j-8chg) i ostali re2 nalazi iz audita | Firebase CLI native re2 | Ne koristiti re2 s neprovjerenim patterns/bufferima. Upstream patch/Node prebuilt kompatibilnost treba provjeru; nema re2 u browseru. |

Zaključak za ovaj task: lokalni emulator development može se nastaviti uz dokumentirane nalaze. **Release dependency gate ostaje otvoren** za TASK-011/012; prije cloud/deploy koraka ponoviti audit, procjenu relevantnih execution paths i kompatibilnih nadogradnji. Ne primjenjivati audit fix --force, ne povećavati dopuštenu severity i ne prikazivati puni audit kao PASS.

Drugi otvoreni performance nalaz: production initial bundle 818.80 kB / estimated transfer 215.91 kB (build 2026-10-09). Build prolazi error budget, ali ima upozorenje postojećeg 500 kB warning budgeta nakon dodavanja Firebase SDK-a. Budget nije povećan. Loading/performance optimizacija i stvarni mobile mjerni dokaz pripadaju hardeningu TASK-011.


## Ponovna provjera 2026-10-10 — TASK-011

Cloud priprema, naknadni audit: puni audit opet 12 (7 high / 5 moderate), bez promjene dependencies. Ograničeni plan koristi Firebase CLI login/read-only API te kasnije samo statični Hosting i Firestore Rules/indekse uz explicit project/config. Source pregled: chokidar nalazi u emulator watcherima, Pub/Sub put u emulator/Functions, koji se ne objavljuju; CLI API transport koristi HTTPS/undici, proxy environment nije postavljen u ovom procesu. Gaxios uuid v4 poziv za boundary nema caller-provided buffer. Ovo je djelomična procjena relevantnog puta, ne potpuni reachability audit niti uklanjanje ranjivosti. Repo/build/Rules inputi vlastiti i pregledani; ne dodavati nepoznate pattern/PAC/FTP/proxy izvore. Re2 i ostali transitive nalazi ostaju otvoreni za upstream/kompatibilan patch. First online candidate može se pregledati uz ove poznate granice; završni dependency release gate nije označen punim PASS.

Svježi `npm audit --omit=dev`: **0** nalaza. Puni audit i dalje **12 (7 high / 5 moderate)** u development/CLI lancima; nije primijenjen audit fix --force niti neprovjeren major override/downgrade. TASK-008–011 nisu dodali dependencies. Cloud/deploy dependency gate ostaje OPEN do kompatibilnog popravka ili konkretne, dokumentirane procjene relevantnog deploy puta prije releasea.

Production build 2026-10-10: **833.37 kB initial / 220.50 kB estimated transfer**. Postojeći 500 kB warning i dalje otvoren; 1 MB error budget prolazi bez povećanja budžeta. Stvarni mid-range mobile cilj nije izmjeren i nije PASS. Nije izvedena široka Firebase/auth refaktorizacija radi umjetnog uklanjanja upozorenja.
