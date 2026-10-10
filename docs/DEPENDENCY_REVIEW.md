# Pregled ovisnosti — 2026-10-08

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
