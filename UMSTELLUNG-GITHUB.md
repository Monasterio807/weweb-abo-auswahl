# Umstellung `weweb-abo-auswahl`: WeWeb-AI-Komponente → GitHub-Komponente

**Stand 04.08.2026 — Repo ist fertig und gepusht. Der Rest sind deine Klicks im WeWeb-Editor.**
Reihenfolge im Kanal-Umbau: nach `dashboard-start` und `weweb-emily-chat`.

## Ausgangslage geprüft — und ein Fund

`loadComponentFiles` (Live-Version `0d0aef3e-0845-4fc2-802c-1277ea7d412a`) gegen den eingecheckten
Stand: die Quelle stimmt überein (Ein-Plan-Modell, gleiche Stripe-Price-IDs).

**Aber:** das eingecheckte `dist/manager.js` war **veraltet** — 24176 statt 21937 Bytes, gebaut
noch vor dem Ein-Plan-Umbau vom 02.08.2026. Ein GitHub-Import auf diesem Stand hätte womöglich
die alte Zwei-Plan-Preistafel gezeigt. Neu gebaut und gepusht, 9 Tests grün.

Ausserdem fehlte lokal die `AI.json` (live vorhanden) — aus dem Live-Stand übernommen,
`metadata.name` auf `weweb-abo-auswahl` gezogen, damit es zum `package.json`-Namen passt.

> Solange die Seite noch das alte AI-Element trägt, ändert ein Push hier nichts an der Live-App.

## Schritt 1 — importieren

WeWeb-Dashboard → **Coded components** → **Import element / Add source code** → GitHub →
**`Monasterio807/weweb-abo-auswahl`** → Branch **`main`** → Build abwarten → Version aktivieren.

Beim Import einen unterscheidbaren Namen wählen (die alte heisst `abo-auswahl`), z.B.
**`Abo-Auswahl (GitHub)`**.

## Schritt 2 — auf die Seite ziehen

Seite **«Abo auswaehlen»** (Pfad **`/abo-`**), Section **«Abo-Auswahl Section»** — dort liegt
heute das AI-Element «Abo-Auswahl», über dem Footer.

Neues Element darunter platzieren, altes vorerst stehen lassen.

## Schritt 3 — die 5 Werte übernehmen

| Property | Wert auf der Seite | Art |
|---|---|---|
| `authToken` | `globalContext.auth['session']?.['access_token']` | **Formel** |
| `apiKey` | Anon-Key (`eyJhbGciOiJIUzI1NiIs…`) | Text — aus dem alten Element kopieren |
| `supabaseUrl` | `https://ztvqsxdudzdyqgeylujr.supabase.co` | Text |
| `onboardingUrl` | `/onboarding` | Text |
| `checkoutReturnUrl` | `/onboarding` | Text |

Kein Style-Override am alten Element, kein Workflow — nur diese fünf Werte.

## Schritt 4 — vergleichen

- [ ] Überschrift «Wähle dein Imploya-Abo», **eine** Plan-Karte (nicht zwei)
- [ ] Toggle Monatlich/Jährlich schaltet zwischen **CHF 29** und **CHF 290**
- [ ] Bei Jährlich erscheint «statt CHF 348/Jahr — 2 Monate gratis»
- [ ] «Jetzt starten» führt in den Stripe-Checkout (Test-Modus, nicht abschliessen)
- [ ] «Noch nicht — ich schau mich erst um» geht auf `/onboarding`

Wenn zwei Karten erscheinen, hat WeWeb einen alten Build gezogen — dann im Dashboard prüfen,
welche Version aktiv ist.

## Schritt 5 — altes Element löschen und publizieren

Erst wenn Schritt 4 sauber ist.

---

## Nebenbefund für später (nicht Teil dieser Umstellung)

Die Seite «Abo auswaehlen» liegt unter **`/abo-`**. Sowohl das Dashboard als auch die Startseite
verlinken aber auf **`/abo-auswaehlen`**. Im Dashboard fängt der Code das ab (`link()` mappt auf
`/abo`), auf der **Startseite** steht `aboUrl` roh auf `/abo-auswaehlen` — der Link führt dort
vermutlich ins Leere. Vor dem Go-Live einmal live nachklicken und den Slug geradeziehen.

## Für mich (technisch)

- Repo `Monasterio807/weweb-abo-auswahl`, Branch `main`. Lokal
  `WeWeb-Components/AboAuswahl/coded-component-abo-auswahl`.
- Seite `8ba12f62-bbee-4f6a-b493-7112693c5a60` (`/abo-`), Element
  `f2d1addd-d446-46ba-be53-f2f6c3abd670` in Section `69c8f384-e394-4533-9f8b-f74202c3d7a6`.
- Lokaler Build braucht `sass` (`npm install --no-save sass`). Nicht in `package.json` aufnehmen.
