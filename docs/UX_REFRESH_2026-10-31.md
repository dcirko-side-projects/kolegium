# UX redizajn i pouzdanost — 31.10.2026.

Naknadno31.10.2026.: korisnik izričito zatražio „Objavi online”. Hosting-only kandidat **2d05521c7c64e5c60e82 objavljen**,18HTTP/cache +44SHA-256 assets + javni login1440/390px PASS. URL https://kolegium-c8970.firebaseapp.com. Raniji lokalni opseg ispod prethodi tom nalogu; nema Rules/data/billing/Git izmjena ili novog stvarnog Outlook/device dokaza. Detalji CURRENT_STATE/DEPLOYMENT.


## Odobreni opseg i odluka o Outlooku

Korisnik odobrio implementaciju ikona, modalnih obrazaca, dovršenih zadataka, ispravka današnje nastave i nove tamne palete te regresijske provjere. Nakon nalaza da projekt ima samo ručni .ics izvoz, prvotni izbor izravnog Microsoft povezivanja naknadno izričito zamijenio odlukom: „ma ostavi onda ručno unošenje podsjetnika i na kraju objasni kako se to radi”. **Nema Outlook API integracije, Microsoft prijave, novih dependencies ili promjene spremljenih identiteta.** Automatska provjera odbila je tada nepotrebnu MSAL instalaciju; package.json/lockfile ostali su nepromijenjeni. Lokalni rad ne uključuje novu objavu, commit/push, cloud upise ili billing promjene.

## Implementirano i uzroci

- Midnight Black #02070A navigacija i istaknute podloge, tamna pozadina/kartice, Electric Blue #0297DE akcije i Cantaloupe Orange #FC734D naglasci. Centralni tokeni, kontrastni tekst/input obrubi, hover/focus, tipografija, zaobljenja i suptilne sjene. Tamni tekst primarnih gumba umjesto bijelog održava kontrast na zadanoj plavoj. PWA manifest/theme i monogram koriste istu paletu.
- Postojeći lokalni SVG skup IconComponent proširen zvonom i primijenjen uz sve glavne naslove, navigaciju i reminder kategorije. Bez dodatne biblioteke ili mrežnih ikona.
- Zajednički EditorDialogComponent za dodavanje/uređivanje zadataka, kolegija, semestara, provjera/projekata, diplomskog, rata, rasporeda/nadoknada, dolaznosnih uvjeta/ispričnica, bodovanja/službenih rezultata i pokušaja te TVZ uvoz. Desktop modal i mobilni donji panel zadržavaju postojeće forme, validaciju, expected revisions i server-confirmed spremanje. Filtri ostaju na stranici. Backup ostaje svoj postojeći pregled/izričita potvrda zamjene, bez promjene recovery ugovora.
- Native modal odvaja pozadinu; eksplicitno kruženje Tab/Shift+Tab, naslov/fokus, Escape/×/Odustani, povrat na pokretač ili main, ograničen scroll/safe-area i sticky zaglavlje. Dirty potvrda čuva unos, pending blokira zatvaranje; klik na backdrop ne odbacuje podatke.
- Pronađen UX rizik pri premještanju formi: vanjske poruke nisu dostupne kroz modal. Offline/stale/restore/dataset/error i conflict/server verzija sada se prikazuju unutar dijaloga; DialogStateService izbjegava dupliciranje globalnog statusa. Neuspjeli unos ostaje otvoren. Testovi su prilagođeni namjernoj modalnoj interakciji: odjava nakon zatvaranja obrasca, eksplicitno otvaranje dovršenih zadataka, zatvaranje TVZ uvoza prije upravljanja kalendarom.
- Dovršeni zadaci u zasebnoj početno sklopljenoj grupi, kvačica/tekstualni badge, druga podloga i suptilno precrtan naslov. Ponovno otvaranje vraća isti canonical zapis u aktivne. Statusni filter Dovršeno izravno prikazuje rezultate; broj stavki jasno označen učitanim, paging sačuvan. Isti TasksComponent na projektu/diplomskom.
- **Uzrok odstupanja današnje nastave:** Početna je renderirala sve ScheduleStore.rows, dok je Raspored lokalno skrivao otkazane. Oba sada koriste zajednički activeRows, Početna dodatno todayRows za točan Zagreb datum. Nema drugog rasporeda ili kopiranja podataka. Postojeće occurrences i recorded-overrides/recurrence/date-bound server upiti ostaju isti. Minutni sat dobiva focus/visibility osvježenje nakon buđenja/ponoći. Otklonjeni lažni empty prikazi tijekom učitavanja/greške i dodana mogućnost učitavanja preostalih kolegija na Početnoj.
- **Uzrok Outlook ponašanja:** ručno uvezena datoteka je snapshot; promjena u Kolegiumu ne može promijeniti Outlook zapis. To je sada istaknuto iznad izvoza, uz korake za zasebni kalendar i zamjenu prethodnog uvoza. Izvoz i dalje čuva stabilne dataset/source UID-jeve; uvoznik odlučuje kako tretira ponovni uvoz. Nema obećanja deduplikacije ili slanja brisanja putem datoteke.
- Dodatni audit popravci: eksplicitnih 48 × 48 px na ikonama u Svim sekcijama čuva 24 px SVG sadržaj unatoč paddingu; sidebar focus koristi Electric Blue umjesto tamnog surface tokena. Browser test provjerava stvarnu geometriju svih ikona i boju keyboard fokusa.
- Uklonjen zadržani hover naglasak na dodirnoj mobilnoj navigaciji; samo aktivna ruta dobiva trajno isticanje. Sekundarni narančasti naglasak kartice obaveza dobio je ispravan prioritet u CSS-u; opis kalendarskih boja prati novu paletu.
- Osvježeni capture/audit skriptovi za aktualnu Dolaznost s Pretraži, stvarnu modalnu formu, reminder rutu i snimke mobilnog/desktop task dijaloga.

## Ručni Outlook postupak

1. U Kolegiumu otvori Podsjetnici, primijeni raspon i sat alarma, učitaj dodatne stranice/kolegije ako postoje i preuzmi .ics.
2. U Outlooku na webu: Kalendar → Dodaj kalendar → Stvori prazan kalendar. Koristi zaseban „Kolegium — uvoz”.
3. Dodaj kalendar → Prenesi iz datoteke / Upload from file → odaberi .ics i zasebni kalendar → Uvezi.
4. Nakon promjene roka/naziva/satnice, dovršavanja/plaćanja ili otkazivanja napravi novi izvoz. Pregledaj stari uvoz: samo ako zasebni kalendar sadrži isključivo taj uvoz, ukloni ga i stvori prazan za novi snapshot. Osobni kalendar i tuđe događaje ostavi sačuvane; kod prethodnog uvoza u osobni kalendar ručno ukloni samo stare Kolegium događaje. Ne očekuj da ponovni uvoz preko stare datoteke ažurira stare rokove.
5. Uvezi novu datoteku jednom i provjeri promijenjeni datum, Europe/Zagreb i barem jedan alarm/obavijest na telefonu. Alarm nakon uvoza ovisi o Outlook klijentu/postavkama.

Microsoft izričito razlikuje datotečni snapshot od pretplate koja se osvježava: [službene upute za Outlook uvoz](https://support.microsoft.com/en-us/outlook/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web). UI nazivi razlikuju se po verziji/lokalizaciji. Stvarni Outlook/telefonski alarm nisu dokazani lokalnim testovima.

## Provjere i granice

Točni završni brojevi i artefakti u CURRENT_STATE/TESTING. `e2e/design-refresh.spec.ts` dodaje odbijeni Escape i očuvani dirty unos, fokus/povrat, axe/320–1440px, grupiranje/reopen/reload, zajedničko otkazivanje i Zagreb midnight/focus te stvarno preuzimanje ICS-a prije/poslije promjene roka i dovršavanja uz isti UID. Postojeći suiteovi provjeravaju ostale forme, offline/konflikt, canonical rezultate, arhivu i recovery na emulatoru.

Fizički uređaji, stvarni Outlook uvoz/alarmi, real cross-device i raniji WebKit/cloud recovery gates ostaju zasebni. Nema schema/Rules/migracije niti pristupa produkcijskim podacima. Ovaj dokument ne predstavlja dokaz nove online objave.
