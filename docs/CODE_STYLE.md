# Code Style

Foundation baseline 2026-10-07, update 2026-10-08. Shell, domain validacija i Firebase data adapteri za TASK-002/003 postoje.

## 1. Tooling i identifiers

TypeScript strict i Angular strictTemplates. Prettier za formatiranje, ESLint + angular-eslint za lint. Versions pinati pri foundationu i čuvati lockfile. English identifiers/code comments kada objašnjavaju tehničku namjeru; hrvatski UI i projektna dokumentacija.

PascalCase models/classes, camelCase functions/fields, kebab-case datoteke uz Angular suffixe (.component/.service/.spec). Firestore camelCase prema DATABASE. Bez any za domenske rezultate/backup; unknown na boundaryju i typed parsing.

## 2. Components i services

Standalone komponente i lazy feature routes. Signals za lokalno/view stanje; RxJS za SDK/listener lifecycle gdje ima svrhu. Bez globalnog state libraryja na početku. Jedna odgovornost po komponenti; forme typed reactive forms. SDK pozivi samo data servisima, izračuni pure functions u domainu.

Ne uvoditi generic base repository/service, god service ili wrappers koji samo preslikavaju jednu funkciju. DTO/view model razlikovati samo ako mapiranje stvarno treba. Ne razdvajati svaku funkciju u novu datoteku.

## 3. Validation i async

Form validation je UX; domain parser/Rules su granice povjerenja. Decimal points parser centralno. Date-only parser centralno. Reuse shared validators umjesto drift-a pravila po ekranima.

Await/handle svaki write; subscriber cleanup kroz Angular lifecycle. Ne swallowati errors. Typed application error categories iz DATABASE; SDK details nisu UI poruke. Transaction callback bez toasta/navigation side-effecta jer se može ponoviti. Refresh/side-effect tek nakon commit-a.

## 4. Configuration i dependencies

Config kroz dedicated module s validacijom. Firebase web config može biti public, admin credentials nikad u sourceu. Demo fixtures ne ulaze u production startup. Preferirati SDK/Angular capability prije nove biblioteke; zabilježiti razlog nove dependency.

## 5. Tests i refactoring

Testiraj observable behavior i domain invariants, ne private metodu ili copy implementacije. Deskriptivni nazivi, sintetički deterministic fixtures, mock vanjske granice. Bez snapshota za cijelu stranicu kao jedini dokaz.

Mali safe refactor samo kada potreban tasku. Promjena API/data ugovora prvo documentation impact i migration/compatibility analiza. Nema broad rewritea dok feature traži malu promjenu.

## 6. Actual script contract

TASK-001–003: start, start:e2e, build, test (non-watch), test:watch, lint, format, format:check, typecheck, test:e2e, emulators:start, emulators:test, auth:seed, auth:seed:test, test:rules i test:integration. Typecheck koristi Angular compiler i strictTemplates, ne samo TypeScript. Vitest dodatno kompilira testove. Test runner koristi .angular/tmp za Windows sandbox cache. Emulator/integration/E2E izvršavaju se sekvencijalno na izoliranom test projektu; unit tests ne traže mrežu. Prettier provjerava kod/config; Markdown, Firebase Rules i generirani output su izuzeti (Rules kompilira emulator).

Firebase modular SDK 12.19.0 podržava lokalni Node 22; verzija 13 traži noviji Node i nije uvedena. Firebase CLI 15.33.0 i Rules unit testing 5.0.2 su dev dependencies. Scoped @grpc/grpc-js override 1.14.5 zatvara runtime advisory; kompatibilnost je provjerena emulator SDK transakcijama. Razlozi/ograničenja drugih advisories su u DEPENDENCY_REVIEW; nema blanket audit fix --force ili prikrivanja nalaza.

Pinned Angular runtime/compiler 21.2.25, CLI/build 21.2.26 i TypeScript 5.9.3. Verificirano na Node 22.20.0; cijeli tooling traži Node 22.13+ unutar 22.x. Angular 22 zahtijeva noviji Node od lokalnog pa nije izabran za ovaj foundation. Instalacija verificirana kroz npm 11.21.0 bez globalne promjene npm-a; package-lock je source of truth. ESLint 10 + angular-eslint 21 podržavaju ovu kombinaciju. Playwright i axe-core služe browser/accessibility provjeri, nisu runtime dependencies.

## Schedule/attendance izvedba

Zagreb calendar arithmetic i attendance counts ostaju pure domain funkcije. SDK fixture clock se injektira u ScheduleRepository radi stabilne future-edit provjere; nema testnog clocka u production UI-ju. Page-scoped stores čiste minute timer/listenere i ignoriraju zastarjele async rezultate. UI koristi zajednički SessionRow i server potvrđeno stanje; Firebase imports ostaju u data sloju.
## TASK-006/007

work.models/work.validation definiraju typed contracts; decimal parser čuva unesenu preciznost bez float zbrajanja. WorkRepository ostaje dedicated adapter za povezane obaveze/rezultate, ne generic base service. Page-scoped WorkStore odbacuje zastarjele async rezultate; typed reactive forme zadržavaju original revision pri edit-u. ResultHistory/Tasks reusable između izvora; course panel ne duplicira rezultat. Nema novih dependencies.

## TASK-008/009

Domain planning.models/grading definira contracts, exact units i EUR cents. Data adapteri rade online server reads i revision transakcije; UI ne poziva SDK. ResultHistory ponovno koristi WorkStore adapter i za lecture/exercise. Page lifecycle ignorira zastarjele requestove i čisti timer/draft; svi writeovi koriste globalni pending.

## TASK-010/011 tooling

BackupEnvelope boundary prima unknown i zatvoreno validira reuse domain parserima; payload ne sprema auth/control/runtime metadata. Adapter jedini koristi Firebase SDK, komponente koriste core servis. Service worker je mali browser API modul iz templatea; content version i javni asset allowlist generiraju se tek nakon production builda, bez novih dependencyja. `npm run test:pwa` testira build na izoliranom lokalnom serveru; Playwright download/tmp koristi workspace .angular/tmp radi Windows sandboxa. Stvarni task/test rezultati su u CURRENT_STATE.

Worker lifecycle oslonjen je na browser API: [MDN service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [skipWaiting](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting), [install prompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event). Podrška native install prompta nije univerzalna; fallback je izbornik preglednika/uputa, uz stvarni device smoke.
