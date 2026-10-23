# Security

23.10.2026.: kompatibilne zakrpe razvojnih alata i ip-address uklanjaju sve trenutačne high nalaze; runtime audit0, preostalih5moderate u CLI lancima prema DEPENDENCY_REVIEW. Nije potpuna sigurnosna revizija. Nova opt-in provjera privatnog backupa koristi samo hardcoded demo-kolegium-tests/loopback adapter, validira prije resetiranja, uspoređuje payload bez privatnih assertion diffova te na kraju prazni testne zapise. Nema uvoza CLI credentials u test, cloud restore/upisa ili promjene Rules/CSP/IAM/billing. Read-only consistent cloud export zaseban je ignorirani lokalni artefakt, s aktualnim domain parserom; ne uključivati osobne kopije u Git.

20.10.2026. — excused/absenceNote additive closed-shape Rules promjena: napomena samo plain text1–500 znakova uz excused, update affectedKeys ne dopušta promjenu snimke termina. Canceled⇒unmarked; auth UID, dataset/root revision, lock i reference nepromijenjeni. Testovi pokrivaju predugu/praznu napomenu, present/canceled s napomenom i nepoznat enum. Backup sadrži osobnu napomenu i čuva se privatno, ne u Gitu.

Privatni .ics izvoz generira se na uređaju kao Blob, bez uploada, javne pretplate, tokena, privileged credentials ili novih servisa. RFC5545 TEXT escaping/UTF-8 folding onemogućuje ubacivanje dodatnih ICS komponenti kroz naziv/lokaciju; nema arbitrary HTML-a/evala. Shared worker ostaje static-only; nova /reminders javna shell ruta ne cacheira privatne API odgovore. Firebase billing/FCM/IAM nisu aktivirani. Jednokratna dolaznost bila je zasebno potvrđena, provedena uz backup/preconditions/atomic/readback i bez drugih cloud izmjena.

2026-10-19: korisnik zasebno potvrdio Google prijavu u Kolegium i administrativni pristup samo projektu kolegium-c8970 radi navedenih korekcija kolegija/rasporeda. Stvarna Chrome/Windows owner prijava i course/project writes promatrani; administrativni backup/atomic write/readback nije zamjena za other-UID ili fizički cross-device dokaz. CLI credentials ostaju u ignoriranom .firebase-cli; u source/backup ne ulaze tokeni ni autorizacijski kodovi. Admin skripte/privatni readback ostaju ignorirani, ne ulaze u runtime. Owner allowlist, Rules, auth scope aplikacije i billing nisu mijenjani.

2026-10-15 TASK-009C: nastavne informacije upisane kao escaped plain text u postojeći course information; linkovi samo existing validated http/https, bez HTML-a/evala ili novih runtime ovlasti. Upute iz ZIP-a tretirane su kao sadržaj kolegija, ne instrukcije za izvršenje ili slanje poruka. Nisu preneseni pristupna lozinka iz PDF-a niti drugi studenti/identifikatori sa screenshota. Administrativni sadržajni batch koristi postojeći CLI račun, backup/preconditions/atomic commit/full readback; nema cloud schema/Rules/billing/deploy izmjene. Detalji COURSE_SOURCE_REVIEW; browser OAuth/Rules i dalje zaseban otvoreni dokaz.

2026-10-11 rate/podsjetnici: novi in-app prikaz nema browser Notification permission, tokene ili privileged SDK. Koristi existing owner server reads; Rules nepromijenjeni. Četiri rate administrativno upisane uz create-only/root updateTime/backup/readback, bez brisanja. Mobile push samo Proposed u PUSH_REMINDERS_PROPOSAL.md; nema IAM/API/billing/Rules promjene niti token storagea.

2026-10-11: TVZ ICS je lokalni plain-text unos ograničen na 1 MiB/1000 explicit događaja; unsupported recurrence/timezone/shape odbija se, UI prikazuje Angular interpolation bez HTML-a. App importer nema administrativne credentials; koristi postojeće owner Rules/revision/restore lock adaptere. Jednokratni administrative cloud seed izričito je zatražen kada korisnik nije mogao dovršiti browser prijavu: postojeći CLI account, create-only zapisi, root updateTime precondition, puna domain/backup graph validacija prije upisa, lokalni backup i server readback. Privremeni script/privatni artefakti su ignored i nisu u javnom bundleu ili source repo-u. Rules/allowlist/naplata nepromijenjeni. Administrative dokaz ne zatvara owner OAuth/Rules/device acceptance.

Datum baselinea: 2026-10-07; aktualna lokalna provedba 2026-10-09. Privatni MVP za jednog korisnika; security plan nije provjeren release.

Lokalne emulator Rules testirane su za sintetički UID local-owner. firebase/firestore.rules koristi se samo lokalnim demo konfiguracijama; firebase.json referencira firestore.production.rules koje odbijaju sve putanje. Production app je nekonfiguriran. Nema stvarnog OAuth/cloud permission dokaza ni odobrenja deploya.

Mock Google credential aktivan je samo u emulator načinu za demo projekt i loopback host. Firebase Auth persistence upravlja SDK; aplikacija ne sprema tokene ručno. Privatni UI uklanja se pri gubitku/odbijanju prijave; listeneri i application state čiste se. Odjava nakon potvrde nespremljenog unosa radi puni reload za čišćenje SDK memory cachea. RAM draft može se vratiti istom UID-u tijekom otvorene stranice; odjava/neodobreni račun brišu draft. Reload nije trajno spremanje drafta.

Implementirani Rules scope: root init, active metadata, semesters, courses, preferences, scheduleTemplates, sessions, assessments, projects, tasks, thesis, canonical scoreActivities i scoreAttempts. Installments/gradingRules/courseOutcomes i staged restore dodatno su aktivirani TASK-008–010. Ostale kolekcije ostaju deny. Lock blokira normalne izmjene; zasebni closed restore prijelazi jedini ga postavljaju/uklanjaju. Validacija zatvara nested fields, reference, datume, revizije i URL-ove. Otvoreni dependency release gate: DEPENDENCY_REVIEW.

## 1. Assets, threats i trust boundaries

Assets: raspored, osobne obaveze, ocjene, dolaznost i rate; lokalni backup sadržava sve njih. Prijetnje: drugi Google račun, otvorene Rules, XSS preko bilješki/linkova, neispravan backup, izgubljeni/konfliktni zapisi i slučajna naplata. Granice: browser → Auth/Firestore, backup download/upload i deploy credentials.

## 2. Authentication / authorization

- Google kroz Firebase Authentication bez javnog registration ekrana. Autentificiranje drugog računa može postojati; aplikacijski pristup odbija sve druge UID-ove.
- Odobreni UID konfigurirati u Rules izvan korisnički upisivih podataka. Nema writable allowlist niti e-mail stringa iz forme kao autoriteta.
- Svaka users/{uid} putanja provjerava request.auth.uid == uid == odobreni UID. Default deny drugdje; UI guards služe UX-u.
- Odjava čisti listenere/in-memory podatke. Ne spremati/logirati tokene ručno. Session expiry/revocation traže novu prijavu; stvarni tok NOT RUN.
- Mobile redirect/authDomain/OAuth allowlist uskladiti za hosting domenu i Safari. Stvarni browser/PWA test obvezan prije releasea.

## 3. Rules ugovor

- Normalni root/dataset/doc read dopušten je samo odobrenom UID-u i aktivnom dataset-u. Restore staging/retained read/write je plan za zasebnu owner-only operaciju, sada deny.
- Normalni write samo u active kopiju bez restoreToken-a. Transaction provjerava expected record revision, povećanje i root dataRevision preko getAfter gdje primjenjivo. Client ne mijenja ID/unknown fields.
- Tipovi, string/enum/range limiti, attendance canceled invariant i reference prema DATABASE; zatvorene nested mape.
- Root+active metadata init atomarno bez domain seed podataka. Normalni revision increment ne mijenja pointer. Restore start/freeze/abort/commit zahtijeva zatvoreni root/metadata prijelaz i odgovarajući token/pointer/state; arbitrary pointer update ostaje deny.
- Nema hard delete data-bearing parenta s implicitnom kaskadom. Permission nije dokaz odsutnosti dependents. Owner ima edit/archive, ne unrestricted write true.
- Lookup budget ograničava buduće staging batch-e prema DATABASE. Testovi pokrivaju other UID, stale dataset/revision, lock i invalid refs.
- Template/session closed shape, parent/date/time/weekday/revision/lock. Prvi template-derived session odgovara deterministic ID-u i izvornom snapshotu. Snapshot update, canceled+present i invalid replacement odbijeni.
- Future edit absence-query provjera je repository guard s provjerom root revision prije queryja i u transakciji. Rules štite immutable snapshot; same ne dokazuju globalnu odsutnost recorded budućih termina.

## 4. Validation i XSS

Forme + pure domain validation + Rules. Korisnički tekst escaped plain text; nema rich HTML, bypassSecurityTrustHtml, eval ili dynamic grading formule. Linkovi samo http/https, bez embedded credentials; vanjske poveznice noopener/noreferrer u novom tabu. Nema upload storagea u MVP-u.

Backup plan: veličina prije parsiranja, schema allowlist, deep types/refs, odbiti unknown verzije, duple ID-ove/nevaljane bodove. Export bez tokena, UID-a ili credentials. File sadrži osobne podatke; enkripcija nije obećana MVP funkcija. TASK-010 implementira validaciju i staged restore; Rules validiraju pojedine zapise/prijelaze, a approved client puni graf i jednakost zamrznutog readbacka.

## 5. Configuration, headers i privacy

Firebase web config nije admin secret; sigurnost ostaje na Rules. Service account ključevi, deploy tokeni i privatni OAuth secrets nikad u frontend/repo/backupu. Primjeri samo placeholders; credentials kroz CLI login/CI secret store.

Hosting plan: HTTPS, CSP s najmanjim Firebase/Google izvorima, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, frame-ancestors none. CSP verificirati s OAuth/PWA; bez blanket * ili unsafe-eval. Nema vlastite cookie auth/session/HTTP API, pa CSRF/CORS nisu proizvoljni middlewarei. Headers/cloud još NOT RUN.

Nema analitike/third-party error trackinga po defaultu. Logovi samo error category/operacija, bez task naslova, bodova, mentora, tokena ili backupa. EU Firestore lokacija nije obećanje potpune EU-only auth obrade.

## 6. Dependency i incident response

Lockfile i procjena high/critical advisories prije releasea; ne gasiti warning bez procjene. Ako su Rules otvorene: deny/known-good deploy uz incident authorization, provjera izloženosti, obnova pogođenih podataka/credentials, testiranje i dokumentiranje. Kompromitirani deploy credential: opoziv/rotacija i deployment pregled.

## 7. Release checklist

- [ ] Real approved/other/anonymous auth i cloud Rules smoke.
- [ ] Nema secrets u repo/bundle/export/logovima.
- [ ] Restore interruption/conflict i input validation acceptance.
- [ ] OAuth/PWA na fizičkom iPhoneu/Androidu.
- [ ] Headers/CSP ne prekidaju prijavu.
- [ ] Nema plaćenih servisa bez odluke.

Lokalni Rules/SDK/browser podskup prolazi; checklist nije automatski PASS. Izvori: [Rules](https://firebase.google.com/docs/firestore/security/get-started), [redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices).
## TASK-006/007 — lokalni Rules scope

Approved UID može čitati nove active kolekcije i pisati uz root revision+1/server timestamp, record revision, bez restore lock-a. Closed fields/nested context/source, parents, datum/vrijeme i decimal/grade limiti server-side. Canonical activity source/id/course i deterministic attempt ID onemogućuju duplicate sources ili promjenu attempt identity. Activity metadata update iz TASK-009 validira nepromjenjivi source/course i bodovne granice; grade nije HTML ili executable formula. source course promjena nakon activity creation odbijena. Normalni hard delete ostaje deny. TASK-008–010 zasebno aktiviraju grading/recovery; brisanje je moguće samo na potvrđenom orphan datasetu. Runtime tests nisu real cloud authorization proof.

## TASK-008/009 — proširenje sigurnosti

Rate/config/outcome imaju closed shapes, course parent, revision/root/server time i restore lock; anonymous/other i hard delete deny. Activity source/course immutable; manual prefix veže activity uz kolegij/vrstu, canonical source veze ostaju. Nested component/scale maps zatvorene i decimal/max/min validirani. Rules ne računaju grade niti dokazuju complete source list, jedinstvene component keys, poredak cijele skale ili puni counted selection graf. Adapter/pure engine provjeravaju taj graf i root revision protiv TOCTOU; derived grade nije spremljena writable činjenica. Arbitrary rounding string ne izvršava se; unsupported ostaje incomplete. Production deny-all ne mijenja se.


## TASK-010/011/012 — sigurnosne granice

Cloud owner priprema: korisnik dostavio stvarni UID; `app-environment.ts` ga sadrži uz `mode: unconfigured`. `npm run release:prepare-rules` izrađuje `firestore.release.rules` iz istog lokalno verificiranog ugovora uz zamjenu isključivo owner konstante. `firebase.json` i dalje referencira deny-all `firestore.production.rules`. Kandidat nije cloud deploy. `npm run test:release-rules` na izoliranom demo-kolegium-tests provjerava owner init/read, anonymous/other/local-owner odbijanje, foreign root/arbitrary allowlist/pointer write odbijanje i zatvoren default deployment. UID nije tajna ni dovoljan dokaz stvarne cloud autorizacije. Nema promjene schema v1 niti migracije podataka.

Approved UID čita active/previous/staging i napuštene kopije radi oporavka. Stage create dopušten samo uz root lock i staging metadata; stage update nije dopušten. Zamrzavanje prije readbacka zatvara kasni write. Activate atomarno provjerava pointer/token i prijelaze metadata; abort ne mijenja active. Cleanup štiti active/previous/staging server-side. UI promjenu active kopije tretira kao novu generaciju: stari unos ostaje vidljiv, writes blokirani do eksplicitnog reloada.

Export provjerava root revision prije/poslije svih čitanja i izostavlja UID/auth/control/runtime metadata; full graf, limiti 5 MiB/10.000, zatvorena polja, IDs/reference i bodovi provjeravaju se prije locka. Authorized client validation nije zamjena za Rules niti dokaz da Rules same provode puni obračun.

Service worker cache sadržava samo build allowlist javnog shell-a/JS/CSS/ikona/manifesta. Private API i /__/auth/* prolaze mrežom, nema runtime data cachea. Update ne osvježava drugi tab i blokiran je tijekom dirty/pending/offline/restore/stale dataset stanja. Nema novih dependencies. Hosting headers su pripremljeni, CSP Report-Only kandidat još nije enforcement; cloud/OAuth provjera ostaje u RELEASE_CHECKLIST.
Hosting kandidat koristi X-Frame-Options SAMEORIGIN radi planiranog same-origin Firebase Auth iframe helpera. Enforced CSP za app s frame-ancestors none mora imati pregledane auth-helper iznimke prije aktivacije; Report-Only kandidat nije enforcement. [Firebase redirect/iframe](https://firebase.google.com/docs/auth/web/redirect-best-practices).
