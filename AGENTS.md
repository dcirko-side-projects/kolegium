# Upute AI coding agentima

## Najnoviji nastavak 2026-10-18 — prijenos na novi laptop

Korisnik izričito naložio commit i push svih aktualnih projektnih izmjena u postojeći privatni dcirko/kolegium radi nastavka na novom laptopu. Nalog obuhvaća ovaj checkpoint izvornog koda/testova/dokumentacije, ne privatne privitke, source PDF/ZIP/ICS, lokalne backupe, credentials ili generirane artefakte. Ne mijenjati vidljivost repozitorija niti deployati/aktivirati naplatu. Za nastavak pročitati docs/NEXT_CHAT_PROMPT.md i docs/NEW_LAPTOP_SETUP.md; putanja novog checkouta može biti drukčija.

Aktualno: 5 kolegija/174 termina, četiri rate, informacije o kolegijima, četiri projekta/seminara, dva BU kolokvija i šest praznih bodovnih aktivnosti već su u cloudu. Ne ponavljati seed. Faza 1 Google prijave/pregleda potvrđena od korisnika 15.10.; cross-device mutacije/refresh/reopen/conflict/offline još nisu potvrđeni. Podsjetnici odgođeni; lokalni in-app kod postoji, nije objavljen. TASK-009C nije full Done: ne izmišljati bodovne/attendance ugovore koji nedostaju. Najnoviji dokazi u CURRENT_STATE; stariji statusni odlomci ispod ostaju povijest.

## Najnoviji nastavak 2026-10-11

Korisnik odobrio ograničeni TVZ ICS import i pojedinačno dodavanje/otkazivanje-skrivanje termina. Baze izostavljene; Web servisi vježbe u 18:00, Bihevioralno u 19:00. Zasebno odobrio novu hosting-only objavu, koja je izvršena. Zatim izričito zatražio upis bez browser prijave: 5 kolegija/174 termina + semestar/preferences atomarno dodani kroz postojeći CLI admin račun, backup/preconditions/readback potvrđeni. SCHEDULE_IMPORT i CURRENT_STATE su autoritet za ove dokaze; ne ponavljati seed, ne tvrditi browser OAuth/device uspjeh. Današnje izmjene nisu commitirane/pushane. Ovaj nalog ne dopušta budući automatski deploy, commit/push, naplatu ili public repo.

## 1. Scope i implementacijska vrata

Ovo je personal/private faculty organizer. Stack i scope iz PRD/ADR su autoritet. Bootstrapping je dokumentacija, ne runtime dokaz. Ne inicijalizirati aplikaciju niti pisati production code dok korisnik izričito ne odobri implementaciju nakon planning rezultata. Nakon odobrenja workflow ide po IMPLEMENTATION_PLAN, bez rebootstrapiranja.

Ne commitati, pushati, objavljivati niti aktivirati naplatu bez korisnikova naloga. Početni Spark, preferirano 0 EUR, najviše 5 EUR/mjesečno ukupno. Budget alert ne jamči limit.

## 2. Reading order i authority

Prije non-trivial rada: PRD → TRD → ARCHITECTURE → CURRENT_STATE → relevantni APP_FLOW/DATABASE/SECURITY/DESIGN_SYSTEM/TESTING → CODE_STYLE → IMPLEMENTATION_PLAN → relevantni ADR/feature spec.

Autoritet: aktualna izričita uputa korisnika; PRD za scope; TRD za tehničke zahtjeve; ARCHITECTURE za granice; DATABASE za contracts; SECURITY za sigurnost; DESIGN_SYSTEM za UI; CODE_STYLE za konvencije; IMPLEMENTATION_PLAN za redoslijed; CURRENT_STATE za stvarne dokaze. APP_FLOW definira journeys uz PRD. Accepted ADR objašnjava odluku; Proposed nije već korisnikova potvrda.

Conflict report: navedi oba izvora i posljedicu, razriješi prije pogođene implementacije. Ne popunjavaj unresolved pravila pretpostavkama. DISCOVERY_NOTES je povijest; finalni ugovor je PRD. Dokumentacijski baseline sadrži i izvedbene izbore za review, ne samo korisnikove rečenice.

## 3. Workflow

1. Razumij task/FR i pročitaj aktualno stanje.
2. Inspect live files/config/status; očuvaj nevezane korisnikove promjene.
3. Planiraj najmanju koherentnu promjenu i ovisnosti.
4. Implementiraj u potvrđenim granicama, reusable obrascima.
5. Pokreni odgovarajuće tests/lint/static/build checks.
6. Provjeri behavior i granice dokaza; sintetički test nije real TVZ/device/cloud dokaz.
7. Ažuriraj relevantni dokument, task status i CURRENT_STATE.
8. Sažmi behavior/why/checks/limitations. Nema širokog nepovezanog refactora.

## 4. Architecture / data rules

- UI nema Firebase SDK pozive; pure domain functions nemaju UI/network dependency.
- Jedan task i jedan canonical bodovni rezultat bez dupliciranja zbog više prikaza.
- Dolaznost lecture/exercise, jedna promjenjiva evidencija po sessionu; canceled != absent.
- Budući schedule edit ne mijenja recorded povijest.
- Ne izmišljaj pravila kolegija, bodovne pragove ili best/latest attempt izbor. FR-015 bez izvora ostaje djelomično konfiguriran.
- Čuvaj sve pokušaje; ne zbrajaj ih sve automatski. Unknown != zero.
- Schema/Rules promjena: impact, backup/migration, update DATABASE/types/tests. Ne editirati već primijenjenu migraciju na slijepo.
- Date-only rokovi i Europe/Zagreb satnica prema ugovoru.
- Revision transactions, server confirmation, conflict UI i root restore lock obvezni.
- Ne zamjenjuj backup chunkovima izravno u active kopiji. ADR-004 je Accepted od korisnika 2026-10-10; slijediti freeze/readback/atomic activation ugovor.

## 5. Security / UI / testing

Default deny; samo odobreni UID, server-side Rules. Auth != authorization. Nema secrets u kodu/logovima/exportu. Nema arbitrary HTML, dynamic eval grading formula ili writable allowlist.

Hrvatski UI, potvrđena paleta, reusable tokeni/komponente, keyboard/contrast i mobile safe-area. Loading/empty/error/success/offline/conflict states prema APP_FLOW. Nema offline queue ili novih dependencies bez potrebe.

TESTING mapira FR→TC; pokrij kritične invariants, permission i failure scenarije. Ne piši test koji samo zrcali implementaciju. Prijavi kada test nije izveden i zašto; ne označi task Done bez potrebnih dokaza.

## 6. Documentation update matrix

| Promjena | Dokument |
|---|---|
| Scope/domain behavior | PRD |
| Journeys/routes | APP_FLOW |
| Tehnički zahtjev/granice | TRD/ARCHITECTURE |
| Data operation/schema/backup | DATABASE |
| Permissions/validation | SECURITY |
| UI tokens/patterns | DESIGN_SYSTEM |
| Conventions/tooling | CODE_STYLE |
| Test strategy/critical proof | TESTING |
| Release/env/recovery | DEPLOYMENT |
| Važna odluka | ADR + DECISIONS |
| Sequencing/progress | IMPLEMENTATION_PLAN + CURRENT_STATE |

## 7. Definition of Done / ask boundaries

Primjenjivi FR behavior, validacija, authorization i UX states implementirani; relevant tests/build/lint/static prolaze; docs/current state ažurirani; nema secrets ili debug artefakata. Device/real OAuth/hosted CI tvrdnje traže takav dokaz.

Razjasni scope/framework/db/auth/breaking schema ili paid service promjenu prije primjene; destructive data action traži konkretnu provjeru/odobrenje. Routine implementacijski izbor u odobrenom scopeu ne traži novu potvrdu svaki put. Pri nedostajućim pravilima napreduj u neovisnom dijelu, pogođeni dio označi unresolved.

## 8. Commands

TASK-001 odobren 2026-10-07; TASK-002/003 odobreni 2026-10-08; TASK-004/005 naknadno odobreni 2026-10-09. Stvarne naredbe i uvjeti nalaze se u README/package.json; dokazi u CURRENT_STATE. Testovi koriste izolirani demo-kolegium-tests i izvršavaju se sekvencijalno zbog resetiranja baze; dev demo-kolegium se ne prazni. Production konfiguracija/Rules ostaju zatvorene. TASK-006/007 izričito odobreni 2026-10-09; TASK-008/009 izričito odobreni 2026-10-09; nastavak TASK-010/011/012 odobren 2026-10-10, uključujući ADR-004. TASK-009C čeka korisnikove izvore. Ne izmišljaj real OAuth/device/cloud uspjeh.


## Nastavak 2026-10-10

Najnoviji nalog: korisnik izričito odobrio prvu online testnu objavu Rules/indeksa/Hostinga u kolegium-c8970 i zatražio GitHub repozitorij. Objavljena testna verzija na firebaseapp.com, privatni dcirko/kolegium repozitorij za izvorni kod. Ovaj nalog pokriva početni commit/push tog projekta; ne dopušta budući automatski deploy, naplatu ni public repo. Default firebase.json i standardni build ostaju zatvoreni; odvojeni release config koristi odobreni UID. Cloud/device DoD još treba stvarne dokaze.

Korisnik odobrio nastavak TASK-010 i TASK-011/012 nakon TASK-008/009, uz preostali radni kapacitet. ADR-004 izričito prihvaćen 2026-10-10. TASK-009C čeka stvarne izvore. Odobrenje implementacije ne aktivira naplatu, ne objavljuje aplikaciju i ne dopušta commit/push; cloud koraci zahtijevaju konkretan projekt/UID i zasebno odobrenje objave.
