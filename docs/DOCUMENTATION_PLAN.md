# Odabir dokumentacije

Datum: 2026-10-07  
Status: dokumentacijski odabir proveden; roadmap je zasebno u IMPLEMENTATION_PLAN.md.

## Dokumenti i odgovornosti

| Dokument | Odluka | Odgovornost |
|---|---|---|
| README.md | Zadržati | Ulaz u projekt, status i dokumentacijske poveznice; run naredbe tek nakon provjere |
| AGENTS.md | Zadržati | Pravila agenata, autoritet dokumenata, zabrana izmišljenih zahtjeva i implementacijska vrata |
| PRD.md | Zadržati | Scope, stable FR IDs, domain ponašanje, potvrđeno/prijedlog/otvoreno i MVP |
| APP_FLOW.md | Zadržati | Navigacija, screen inventory i UX tokovi/stanja |
| TRD.md | Zadržati, kratko | Tehnički zahtjevi, kompatibilnost, pouzdanost i quality gates |
| ARCHITECTURE.md | Zadržati | Granice i način zadovoljavanja zahtjeva; postoji radni nacrt |
| DATABASE.md | Zadržati | Firestore model, validacija, veze, indeksiranje, podatkovne operacije i backup format |
| API.md | Zasad izostaviti | Nema potvrđenog vlastitog HTTP API-ja; Firestore ugovori i operacije pripadaju DATABASE.md. Dodati ako nastanu vlastiti endpointi |
| DESIGN_SYSTEM.md | Zadržati | Paleta, tokeni, komponente, pristupačnost i responsive pravila |
| SECURITY.md | Zadržati, proporcionalno | Google prijava, odobreni UID, Rules, validation, konfiguracija i privatnost |
| CODE_STYLE.md | Zadržati, kratko | Stvarne konvencije, formatter/linter i test stil; bez dupliciranja arhitekture |
| TESTING.md | Zadržati | Kritični scenariji i definition of done, povezani s FR IDs |
| DEPLOYMENT.md | Zadržati, kratko | Firebase Hosting, okruženja, Rules, kvote, release i recovery |
| DECISIONS.md | Zadržati | ADR index; pojedinačni ADR zapisi već postoje |
| CURRENT_STATE.md | Zadržati | Samo stvarno stanje, odvojeno od planiranog |
| CONSISTENCY_AUDIT.md | Izraditi u PHASE 7 | Nalazi usporedbe dokumenata, nedostajuće odluke i potrebni popravci |
| IMPLEMENTATION_PLAN.md | Izraditi poslije audita | PHASE 8: dependency roadmap, prihvatni kriteriji i zaustavljanje prije implementacije |
| templates/ADR_TEMPLATE.md | Zadržati | Dostavljeni izvorni template za važne odluke |
| templates/FEATURE_SPEC_TEMPLATE.md | Zadržati | Ciljane specifikacije gdje PRD/ugovori nisu dovoljni |

Dokumenti iz odabranog seta izrađeni su kao planning baseline. Originalni templatei kopirani su iz korisnikova ZIP-a; ciljane specifikacije attendance/grading koriste njihove odgovornosti. TEMPLATE placeholders ostaju samo u izvornim templateima.

Ovo je mala aplikacija po broju korisnika, ali ima povezanu dolaznost, bodovanje, povijest i cloud pristup. Kratki dokumenti s jasnim odgovornostima opravdani su; nema potrebe za zasebnim dokumentom za svaki CRUD ekran.

## Redoslijed documentation faze

1. PRD i APP_FLOW s razlikovanjem potvrđenih zahtjeva i otvorenih pravila kolegija.
2. TRD i dovršavanje arhitekture.
3. DATABASE i SECURITY nakon razrade domain pravila.
4. DESIGN_SYSTEM, CODE_STYLE, TESTING i DEPLOYMENT.
5. README, AGENTS, ADR index i CURRENT_STATE uskladiti s nastalim dokumentima.
6. Consistency audit prije implementation roadmapa; ozbiljne neriješene odluke označiti i ne predstaviti kao spremne.

## Naknadna pravila kolegija

Konkretni podaci nisu dostupni. Dokumenti moraju sadržavati označena otvorena mjesta, bez izmišljenih formula ili stvarnih kolegija. Kada korisnik dostavi podatke:

- izdvojiti sadržaj, izvore i domain pravila;
- usporediti ih s planiranim modelom;
- ažurirati pogođene zahtjeve/ugovore/test scenarije;
- ponoviti audit pogođenih dijelova;
- tražiti odluku samo za stvarne sukobe i promjene scopea.

## Granica

Dokumentiranje ne odobrava inicijalizaciju aplikacije, aktivaciju plaćenih servisa ni implementaciju. Na kraju bootstrapa STOP i čekanje korisnikova izričitog odobrenja.
