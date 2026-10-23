# Design System

23.10.2026. — Preskoči na sadržaj ima izričit tabindex=0 radi WebKit zadane navigacije koja preskače native linkove bez eksplicitnog tab stopa. Nema pozitivnog tabindexa ili promjene redoslijeda; Enter vodi do postojećeg main-content fokusa. Pogođeni browser keyboard scenarij sada pokriva i desktop WebKit. Glavni sadržaj označava aria-busy tijekom početnog učitavanja/refresha/mutacije, bez mijenjanja fokusa ili uklanjanja otvorenog obrasca.

20.10.2026. — Podsjetnici koriste postojeće panel/status-badge/actions/token obrasce, tekstualni status Danas/Sutra/ZaN dana/Rok je prošao i izravni link izvora. Izvoz ostaje vidljivo odvojen od in-app pregleda, s jasnim rasponom/satnicom i uputama; nema skrivenog traženja notifikacijskih dozvola. Informacije kolegija dobivaju tekstualni indeks cjelina i naslove iz postojećeg plain texta; izvorni tekst dostupan u native details. SessionRow ima dostupnu označenu formu ispričnice, stanja potvrde/offline/konflikta i zasebni status/broj, bez oslanjanja samo na boju.

20.10.2026. — Kalendar koristi postojeće boje/tokenizirane razmake: sedam stupaca, odabrani Dan/Tjedan/Mjesec s aria-pressed, Danas s aria-current=date, predavanja plava, vježbe Ice Glass i tekst vrste, otkazano tekstom i isprekidanom granicom. Datumi su 44px ciljevi; događaji dostupni tipkovnicom. Na uskoj širini označena fokusabilna regija ima vlastiti vodoravni scroll. Dnevni detalji ponovno koriste SessionRow; nema nove biblioteke niti promjene podatkovne sheme.

Update 2026-10-19 — cjeloviti redizajn prema korisnikovu nalogu: tamnoplavi sidebar #102A56, srednje plava #1B4385, svijetloplava #EDF3FF i blue border #B8CBED proširuju potvrđeni Quantum Blue/Ice Glass. Input border #8191AB odvojen je od dekorativnog #D7E1EF. Bijela ostaje glavna površina; bez gradijenata, emojija i novih dependencies. Radijusi 4/6/8 px; panel padding 32 px desktop / 20 px mobile; razmaci 4/8/12/16/20/24/32/40/48. Navigacija prelazi na donji prikaz ispod 1024 px, dvostupčane forme ispod 768 px. Page heading ima sekcijsku granicu; record-list/record-row služe zadacima i obavezama, session-time vremenu nastave, status-badge tekstualnom stanju, metadata-grid osnovnim podacima. Form grid naslovi/akcije protežu se preko oba stupca. Detaljni nalazi i implementacija u UI_REDESIGN.md; dokazne granice u CURRENT_STATE.

TASK-002/003 update 2026-10-08: shared/styles/_forms.scss daje reusable panel, form grid, field, action, error/success i conflict obrasce. Form inputi imaju 16px font i najmanje 44px visinu; checkbox label proširuje cilj, vidljiv keyboard focus ostaje. Semestri/kolegiji koriste iste tokene i potvrđenu paletu, bez novog branding odluke. Axe i 320px overflow provjereni su na novim formama; stvarni iPhone/Android ostaju NOT RUN.

Datum: 2026-10-07. Planning baseline. Paleta potvrđena; ostali tokeni su početni izvedbeni izbori za provjeru u UI-ju, ne zasebna branding potvrda.

## 1. Principles i brand

Praktičan, čist, brz i pregledan. Dolaznost se unosi odmah iz termina. Podaci imaju jasnu hijerarhiju i povezani prikazi koriste isti rezultat. Radni naziv Kolegium; logo nije potreban MVP-u.

## 2. Tokens

| Token | Value | Svrha |
|---|---|---|
| color-primary | #2457FF | Quantum Blue: glavne akcije i active navigation |
| color-ice | #DFF7FF | Ice Glass: blaga površina/isticanje |
| color-background | #F7FAFF | Pozadina |
| color-surface | #FFFFFF | Kartice/forme |
| color-text | #14213D | Glavni tekst |
| color-text-muted | #4B5A73 | Pomoćni tekst, verificirati kontrast |
| color-border | #D7E1EF | Dekorativne granice; za input/focus koristiti jači kontrast |
| color-success | #166534 | Uspjeh uz tekst/ikonu |
| color-warning | #854D0E | Nepotpunost/rok uz tekst |
| color-error | #B91C1C | Pogreška uz poruku |

Primary button: bijeli tekst na Quantum Blue. Ice Glass nije boja teksta na bijeloj pozadini. Bez dark modea u MVP-u; može se kasnije dodati uz odvojene tokene i provjeru.

Font: system sans stack (system-ui, Segoe UI, sans-serif), bez vanjskog font servisa. Body 16px/1.5; small 14px/1.4; heading 24/32px prema kontekstu; minimum input font 16px na mobitelu. Weights 400/600/700.

Spacing 4/8/12/16/24/32/48; radius 4/6/8; shadow suptilan samo za elevated surfaces/dialog. CSS custom properties centralno. Ne uvoditi nasumične hex/padding vrijednosti po featureima.

## 3. Layout i responsive

- Mobile padding 16px, desktop 24–32px; max content 1440px.
- Početni breakpointi 768px (širi sadržaj), 1024px (sidebar/tjedna mreža); layout se prilagođava prostoru, ne nazivima uređaja.
- Mobile bottom nav uvažava safe-area-inset-bottom; sadržaj nikad ispod navigacije.
- Desktop sidebar 248px, glavna područja sa jasnim section headingom. Mobile cards imaju iste radnje kao tablice.
- Target površine dodira minimalno 44x44px. Hover nije jedini ulaz. Pozitivna/negativna attendance akcija mora imati label, ne samo boju.

## 4. Reusable components

Button primary/secondary/ghost/destructive, LabeledInput, Select, DateInput, TimeInput, FieldError, Card, StatusBadge, EmptyState, InlineAlert, ConfirmDialog, LoadingState, ResponsiveList, CourseSelector, TaskRow, SessionRow, ResultSummary i SaveFeedback.

Button states: default/hover/focus/disabled/loading. Loading blokira duplicate submit. Form labels vidljive, optional fields označene; validation čuva unos. Destructive confirm opisuje što se mijenja i koji povezani podaci ostaju. Toast samo dodatna potvrda, trajni error uz polje/obrazac.

Attendance: Prisutan/Odsutan label, Neoznačeno badge, Otkazano stanje termina. ResultSummary jasno razlikuje points, minimum, calculated grade, official grade i nepotpunost. Grade nikad ne prikazati kao final samo bojom.

Native inputs i Angular CDK za focus/dialog ako je potreban; ne uvoditi cijeli drugi UI framework. Foundation koristi mali lokalni SVG skup u IconComponent, bez icon dependencyja. Ikone su dekorativne uz tekstualni label; monogram K je radna ikona, nije konačna branding odluka.

## 5. Accessibility / motion

WCAG 2.2 AA cilj: keyboard, focus 2px+ offset, semantic headings/landmarks, live save status, proper dialog focus trap i povrat fokusa. Tekst kontrast >=4.5:1 (large >=3:1), essential non-text >=3:1. Disabled state izuzeci ne opravdavaju slabo čitljive podatke. Validate sve kombinacije prije releasea. prefers-reduced-motion bez nepotrebnih animacija. Skeleton/loading ima pristupačan tekst, ne beskonačni spinner bez objašnjenja.

## 6. Reuse

Tokeni i komponente u src/app/shared/ui i shared/styles; feature komponira postojeće komponente. Novi zajednički element samo ako postoji stvaran ponovljiv obrazac. Storybook nije zahtjev MVP-a; test harness ili mala interna preview stranica samo ako pomaže provjeri.

## SessionRow — implementirano

Početna/Raspored/Dolaznost koriste isti red termina, tekstualni status i Prisutan/Odsutan/Poništi. aria-pressed predstavlja server potvrđeni izbor; pending/error/conflict prikaz ne glumi spremljeni uspjeh. Forme i safe-area koriste postojeće quantum blue/ice glass tokene. Axe/keyboard/320px podskup nije puna WCAG certifikacija.
## TASK-006/007

Provjere/projekti/To-do/diplomski koriste postojeće panel/form-grid/actions tokene i hrvatske labels. Kartice zamjenjuju široke tablice; obavljeno/otvoreno odvojeno od grade. Unknown/zero i archive/conflict imaju tekst, ne samo boju. ResultHistory prikazuje sve pokušaje bez automatske final ocjene. Mobile safe-area i axe/320px provjeravaju se lokalno; to nije device/WCAG certifikacija.

## TASK-008/009

Rate koriste postojeće labeled money/date inpute i tekstualno paid/late stanje. Početna ima datum/vrstu/late label, card linkove i Load-more. Bodovanje koristi card/fieldset/form-grid, semantički odvojene Osobni izračun/Službeni rezultat, vidljive razloge nepotpunosti i structured components/scale/selectors. Nema nove palete/dependencyja.

## TASK-010/011 reusable UI

Backup koristi postojeće panel/label/button/error/status/progress obrasce, bez novih boja/fontova. Checkbox label je flex s minimalnom visinom 44px i 22px inputom, umjesto rastegnutog text-input pravila. PwaStatus zajednički nudi install/update na loginu i shellu. Promjena dataset generacije globalno vidljiva uz eksplicitni reload; disable stanja objašnjavaju pending/offline/dirty zaštitu, ne tvrde spremanje prije server potvrde.
