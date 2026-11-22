# Prompt: Build the Complete "F1 // ARCHIVE" Web Application

> **Use this single prompt to regenerate the entire F1 Archive project from scratch.**

---

## PROJECT OVERVIEW

Build a premium, immersive **Formula 1 historical archive web application** called **"F1 // ARCHIVE"** using **React + TypeScript + Vite**. The app features a cinematic welcome/loading experience with a 2D SVG F1 car animation, telemetry-style HUD, and then transitions into a full multi-section archive covering **Seasons, Teams, Cars (with interactive 3D model via Three.js), and Drivers**. The design language is dark, futuristic, motorsport-inspired — think race control dashboards and carbon fiber textures.

---

## TECH STACK AND SETUP

Create a **Vite + React + TypeScript** project with these dependencies:

```json
{
  "name": "f1-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.8",
    "@react-three/fiber": "^9.7.0",
    "@types/three": "^0.185.4",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "three": "^0.185.1"
  },
  "devDependencies": {
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.4",
    "oxlint": "^1.75.0",
    "typescript": "~6.0.2",
    "vite": "^8.2.0"
  }
}
```

**vite.config.ts** — Standard React plugin config:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
})
```

**index.html** — Include `<meta name="referrer" content="no-referrer" />` (important for loading external F1 team logo images that are hotlinked from `media.formula1.com`). Use `/favicon.svg` as the icon. Title: `f1-app`.

---

## DESIGN SYSTEM (index.css)

Import three Google Fonts: **Titillium Web** (headline/UI), **Share Tech Mono** (telemetry readouts), and **Outfit** (body text).

### CSS Custom Properties (`:root`)
```
--color-bg-start: #05070C        (deep dark blue-black)
--color-bg-end: #0A0F1C          (slightly lighter dark blue)
--color-accent-primary: #00D2FF  (cyan/electric blue — F1 telemetry color)
--color-accent-secondary: #FF1E1E (red — brake/danger color)
--color-grid: rgba(28, 35, 51, 0.4)  (subtle grid line color)
--color-text-primary: #F5F7FA     (near-white)
--color-text-secondary: #8B93A7   (muted gray-blue)
--font-headline: 'Titillium Web', sans-serif
--font-telemetry: 'Share Tech Mono', monospace
--font-body: 'Outfit', sans-serif
```

### Global Styles
- `*` reset with `box-sizing: border-box; margin: 0; padding: 0`
- `body`: use `--font-body`, background is `linear-gradient(135deg, --color-bg-start, --color-bg-end)`, color is `--color-text-primary`, `min-height: 100vh`, `overflow-x: hidden`
- `#root`: `width: 100vw; min-height: 100vh; position: relative`
- Utility class `.headline`: uses `--font-headline`, `text-transform: uppercase`, `letter-spacing: 0.15em`
- Utility class `.telemetry`: uses `--font-telemetry`, color `--color-text-secondary`
- Utility class `.sr-only`: standard screen-reader-only class

---

## FILE STRUCTURE

```
f1-app/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   ├── legends/             (placeholder for legendary team images)
│   └── models/
│       └── generic_f1.glb   (A generic F1 car 3D model in GLB format — ~18MB)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── assets/
│   │   └── hero.png (placeholder)
│   ├── data/
│   │   └── f1_database.ts   (Complete hardcoded F1 data — teams, drivers, seasons)
│   ├── hooks/
│   │   └── useUserPreferences.ts
│   └── components/
│       ├── WelcomeExperience.tsx + .css
│       ├── TelemetryHUD.tsx + .css
│       ├── F1CarAnimation.tsx + .css
│       ├── Home.tsx + .css
│       ├── CarsArchive.tsx + .css
│       ├── InteractiveCarModel.tsx
│       ├── SeasonsArchive.tsx + .css
│       ├── DriversArchive.tsx + .css
│       └── TeamsArchive.tsx + .css
```

**IMPORTANT: You need a `.glb` 3D model file** at `public/models/generic_f1.glb`. Use any generic F1 car 3D model (e.g. from Sketchfab — search for "F1 car GLB"). The `InteractiveCarModel` component will auto-scale it to fit the viewport and strip textures, applying team colors dynamically.

---

## COMPLETE DATA FILE (`src/data/f1_database.ts`)

This is the core data layer. Export three arrays: `TEAMS`, `DRIVERS`, and `SEASONS`.

### TEAMS Array (13 teams — 10 current + 3 legendary)

Each team object has:
```ts
{
  id: string,
  name: string,
  carName: string,         // e.g. 'RB20', 'SF-24'
  color: string,           // team hex color
  base: string,
  principal: string,
  championships: number,
  logoUrl: string,         // hotlinked from media.formula1.com or Wikipedia
  description: string,     // 2-3 sentence team history
  firstEntry: number,      // year
  polePositions: number,
  fastestLaps: number,
  specs: {
    powerUnit: string,
    chassis: string,
    weight: string,        // e.g. '798 kg'
    downforce: string,     // e.g. 'High', 'Medium', 'Low'
    topSpeed: string       // e.g. '352 km/h'
  }
}
```

**The 13 teams with their exact data:**

1. **Red Bull Racing** — id: `redbull`, color: `#0600EF`, carName: `RB20`, base: `Milton Keynes, UK`, principal: `Christian Horner`, championships: `6`, firstEntry: `2005`, polePositions: `98`, fastestLaps: `95`, powerUnit: `Honda RBPT V6 Turbo Hybrid`, chassis: `Carbon-fibre composite monocoque`, weight: `798 kg`, downforce: `High`, topSpeed: `352 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/red-bull-racing-logo.png`, description: `Red Bull Racing, officially Oracle Red Bull Racing, is a Formula One racing team, racing under an Austrian license and based in the United Kingdom. Formed after the purchase of the Jaguar Racing team, they have become one of the most dominant forces in modern F1.`

2. **Scuderia Ferrari** — id: `ferrari`, color: `#FF2800`, carName: `SF-24`, base: `Maranello, Italy`, principal: `Frederic Vasseur`, championships: `16`, firstEntry: `1950`, polePositions: `249`, fastestLaps: `260`, powerUnit: `Ferrari 066/12 V6 Turbo Hybrid`, chassis: `Honeycomb carbon fibre`, weight: `798 kg`, downforce: `High`, topSpeed: `350 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/ferrari-logo.png`, description: `Scuderia Ferrari is the racing division of luxury auto manufacturer Ferrari and the racing team that competes in Formula One. It is the oldest surviving and most successful Formula One team, having competed in every world championship since the 1950 Formula One season.`

3. **Mercedes-AMG PETRONAS** — id: `mercedes`, color: `#00A19B`, carName: `W15`, base: `Brackley, UK`, principal: `Toto Wolff`, championships: `8`, firstEntry: `1954`, polePositions: `137`, fastestLaps: `106`, powerUnit: `Mercedes-AMG F1 M15`, chassis: `Moulded carbon fibre`, weight: `798 kg`, downforce: `Medium-High`, topSpeed: `348 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/mercedes-logo.png`, description: `The Mercedes-Benz Formula One team, operated by Mercedes-Benz Grand Prix Limited, is a highly successful British-based German team. They achieved unprecedented success in the turbo-hybrid era, securing eight consecutive Constructors' Championships from 2014 to 2021.`

4. **McLaren F1 Team** — id: `mclaren`, color: `#FF8000`, carName: `MCL38`, base: `Woking, UK`, principal: `Andrea Stella`, championships: `8`, firstEntry: `1966`, polePositions: `156`, fastestLaps: `165`, powerUnit: `Mercedes-AMG F1 M15`, chassis: `Carbon fibre composite`, weight: `798 kg`, downforce: `High`, topSpeed: `351 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/mclaren-logo.png`, description: `McLaren Racing Limited is a British motor racing team based at the McLaren Technology Centre in Woking. Founded by Bruce McLaren in 1963, it is the second oldest active team and one of the most successful in F1 history.`

5. **Aston Martin Aramco** — id: `aston`, color: `#00665E`, carName: `AMR24`, base: `Silverstone, UK`, principal: `Mike Krack`, championships: `0`, firstEntry: `1959`, polePositions: `0`, fastestLaps: `1`, powerUnit: `Mercedes-AMG F1 M15`, chassis: `Carbon fibre monocoque`, weight: `798 kg`, downforce: `Medium`, topSpeed: `349 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/aston-martin-logo.png`, description: `Aston Martin Aramco Formula One Team is a British motor racing team. The Aston Martin brand returned to F1 in 2021 after a rebrand of the Racing Point team, heavily investing in their new Silverstone headquarters and technical campus.`

6. **BWT Alpine F1 Team** — id: `alpine`, color: `#FF87BC`, carName: `A524`, base: `Enstone, UK`, principal: `Bruno Famin`, championships: `2`, firstEntry: `1986`, polePositions: `20`, fastestLaps: `15`, powerUnit: `Renault E-Tech RE24`, chassis: `Carbon fibre monocoque`, weight: `798 kg`, downforce: `Medium`, topSpeed: `346 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/alpine-logo.png`, description: `Alpine F1 Team is the Formula One entry for the French sports car brand Alpine, owned by Renault. The team serves to promote the Alpine brand, racing out of the historic Enstone facility which has hosted championship-winning teams like Benetton and Renault.`

7. **Williams Racing** — id: `williams`, color: `#005AFF`, carName: `FW46`, base: `Grove, UK`, principal: `James Vowles`, championships: `9`, firstEntry: `1977`, polePositions: `128`, fastestLaps: `133`, powerUnit: `Mercedes-AMG F1 M15`, chassis: `Carbon fibre composite`, weight: `798 kg`, downforce: `Low`, topSpeed: `353 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/williams-logo.png`, description: `Williams Grand Prix Engineering Limited is a British Formula One motor racing team and constructor. Founded by Sir Frank Williams and Sir Patrick Head in 1977, it dominated the 1980s and 90s, winning 9 Constructors' titles.`

8. **Visa Cash App RB** — id: `rb`, color: `#1534CC`, carName: `VCARB 01`, base: `Faenza, Italy`, principal: `Laurent Mekies`, championships: `0`, firstEntry: `2006`, polePositions: `1`, fastestLaps: `3`, powerUnit: `Honda RBPT V6 Turbo Hybrid`, chassis: `Carbon fibre monocoque`, weight: `798 kg`, downforce: `Medium`, topSpeed: `347 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/rb-logo.png`, description: `Visa Cash App RB Formula One Team (often abbreviated as VCARB) is an Italian racing team. Originally formed as Scuderia Toro Rosso after Red Bull purchased Minardi, it serves as the sister team to Red Bull Racing.`

9. **Stake F1 Team Kick Sauber** — id: `sauber`, color: `#00E701`, carName: `C44`, base: `Hinwil, Switzerland`, principal: `Alessandro Alunni Bravi`, championships: `0`, firstEntry: `1993`, polePositions: `1`, fastestLaps: `7`, powerUnit: `Ferrari 066/12 V6 Turbo Hybrid`, chassis: `Carbon fibre monocoque`, weight: `798 kg`, downforce: `Medium-Low`, topSpeed: `348 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/kick-sauber-logo.png`, description: `Sauber Motorsport AG is a Swiss motorsport engineering company. Operating under the Stake F1 Team Kick Sauber branding for 2024, the team is in a transition period ahead of becoming the official Audi factory team in 2026.`

10. **MoneyGram Haas F1 Team** — id: `haas`, color: `#FFFFFF`, carName: `VF-24`, base: `Kannapolis, USA`, principal: `Ayao Komatsu`, championships: `0`, firstEntry: `2016`, polePositions: `1`, fastestLaps: `2`, powerUnit: `Ferrari 066/12 V6 Turbo Hybrid`, chassis: `Carbon fibre monocoque`, weight: `798 kg`, downforce: `Medium`, topSpeed: `349 km/h`, logoUrl: `https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/haas-logo.png`, description: `Haas Formula LLC is an American Formula One racing team established by NASCAR Cup Series co-owner Gene Haas. Entering the sport in 2016, they are known for their unique technical partnership with Ferrari.`

11. **Team Lotus** (LEGENDARY) — id: `lotus`, color: `#FFB800`, carName: `Lotus 72`, base: `Hethel, UK`, principal: `Colin Chapman`, championships: `7`, firstEntry: `1958`, polePositions: `107`, fastestLaps: `71`, powerUnit: `Ford Cosworth DFV 3.0 V8`, chassis: `Aluminium monocoque`, weight: `540 kg`, downforce: `Medium`, topSpeed: `300 km/h`, logoUrl: `https://en.wikipedia.org/wiki/Special:FilePath/Lotus_Cars_logo.svg`, description: `Team Lotus was the motorsport sister company of English sports car manufacturer Lotus Cars. The team ran cars in many motorsport categories, including Formula One, where they won seven Formula One Constructors' titles and six Drivers' Championships.`

12. **Benetton Formula** (LEGENDARY) — id: `benetton`, color: `#0088CE`, carName: `B195`, base: `Enstone, UK`, principal: `Flavio Briatore`, championships: `1`, firstEntry: `1986`, polePositions: `15`, fastestLaps: `36`, powerUnit: `Renault RS7 3.0 V10`, chassis: `Carbon-fibre monocoque`, weight: `595 kg`, downforce: `High`, topSpeed: `320 km/h`, logoUrl: `https://en.wikipedia.org/wiki/Special:FilePath/Michael_Schumacher_Jos_Verstappen_JJ_Lehto_Benetton_1994.jpg`, description: `Benetton Formula Ltd., commonly referred to simply as Benetton, was a Formula One constructor that participated from 1986 to 2001. The team was owned by the Benetton family who run a worldwide chain of clothing stores of the same name.`

13. **Brawn GP** (LEGENDARY) — id: `brawn`, color: `#BDFE00`, carName: `BGP 001`, base: `Brackley, UK`, principal: `Ross Brawn`, championships: `1`, firstEntry: `2009`, polePositions: `5`, fastestLaps: `4`, powerUnit: `Mercedes-Benz FO 108W 2.4 V8`, chassis: `Carbon-fibre and honeycomb composite`, weight: `605 kg`, downforce: `High (Double Diffuser)`, topSpeed: `325 km/h`, logoUrl: `https://en.wikipedia.org/wiki/Special:FilePath/Jenson_Button_2009_Germany_3.jpg`, description: `Brawn GP Formula One Team, the trading name of Brawn Racing, was a Formula One constructor created by a management buyout of Honda Racing F1 Team. They competed in only the 2009 season, winning both the Drivers' and Constructors' Championships.`

---

### DRIVERS Array (15 drivers — 11 current + 4 legends)

Each driver object has:
```ts
{
  id: string,              // 3-letter code (VER, HAM, etc.)
  name: string,
  number: number,
  teamId: string,          // references TEAMS[].id
  wins: number,
  podiums: number,
  championships: number,
  country: string,
  imageUrl: string,        // hotlinked from formula1.com or Wikipedia
  raceFinishes: Array<{    // 7 entries: race name + position (number or 'DNF'/'DNS')
    race: string,
    position: number | string
  }>
}
```

**Complete driver data (include ALL these drivers):**

| ID | Name | Number | Team ID | Wins | Podiums | Champs | Country | Image URL |
|----|------|--------|---------|------|---------|--------|---------|-----------|
| VER | Max Verstappen | 1 | redbull | 61 | 108 | 3 | Netherlands | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png` |
| PER | Sergio Perez | 11 | redbull | 6 | 39 | 0 | Mexico | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png` |
| HAM | Lewis Hamilton | 44 | mercedes | 105 | 201 | 7 | United Kingdom | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png` |
| RUS | George Russell | 63 | mercedes | 2 | 14 | 0 | United Kingdom | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png` |
| LEC | Charles Leclerc | 16 | ferrari | 6 | 36 | 0 | Monaco | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png` |
| SAI | Carlos Sainz | 55 | ferrari | 3 | 23 | 0 | Spain | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png` |
| NOR | Lando Norris | 4 | mclaren | 2 | 22 | 0 | United Kingdom | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png` |
| PIA | Oscar Piastri | 81 | mclaren | 1 | 6 | 0 | Australia | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png` |
| ALO | Fernando Alonso | 14 | aston | 32 | 106 | 2 | Spain | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png` |
| STR | Lance Stroll | 18 | aston | 0 | 3 | 0 | Canada | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png` |
| ALB | Alexander Albon | 23 | williams | 0 | 2 | 0 | Thailand | `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png` |
| MSC | Michael Schumacher | 1 | ferrari | 91 | 155 | 7 | Germany | `https://en.wikipedia.org/wiki/Special:FilePath/Michael_Schumacher%2C_September_2005.jpg` |
| SEN | Ayrton Senna | 1 | mclaren | 41 | 80 | 3 | Brazil | `https://en.wikipedia.org/wiki/Special:FilePath/Ayrton_Senna_9_-_Cropped.jpg` |
| PRO | Alain Prost | 2 | mclaren | 51 | 106 | 4 | France | `https://en.wikipedia.org/wiki/Special:FilePath/Festival_automobile_international_2015_-_Photocall_-_065_%28cropped%29.jpg` |
| LAU | Niki Lauda | 12 | ferrari | 25 | 54 | 3 | Austria | `https://en.wikipedia.org/wiki/Special:FilePath/Lauda_at_1982_Dutch_Grand_Prix.jpg` |
| VET | Sebastian Vettel | 5 | redbull | 53 | 122 | 4 | Germany | `https://en.wikipedia.org/wiki/Special:FilePath/Sebastian_Vettel_2011_Sebastian_Vettel_in_Yokohama.jpg` |

**Race finishes for current drivers** — each has 7 races (Bahrain, Saudi Arabia, Australia, Japan, China, Miami, Emilia Romagna) with position results. Legends have 3 "career stat" entries instead (Career Wins, Pole Positions, Fastest Laps).

**Full race finishes data per current driver:**
- **Verstappen**: Bahrain P1, Saudi Arabia P1, Australia DNF, Japan P1, China P1, Miami P2, Emilia Romagna P1
- **Perez**: Bahrain P2, Saudi Arabia P2, Australia P5, Japan P2, China P3, Miami P4, Emilia Romagna P8
- **Hamilton**: Bahrain P7, Saudi Arabia P9, Australia DNF, Japan P9, China P9, Miami P6, Emilia Romagna P6
- **Russell**: Bahrain P5, Saudi Arabia P6, Australia P17, Japan P7, China P6, Miami P8, Emilia Romagna P7
- **Leclerc**: Bahrain P4, Saudi Arabia P3, Australia P2, Japan P4, China P4, Miami P3, Emilia Romagna P3
- **Sainz**: Bahrain P3, Saudi Arabia DNS, Australia P1, Japan P3, China P5, Miami P5, Emilia Romagna P5
- **Norris**: Bahrain P6, Saudi Arabia P8, Australia P3, Japan P5, China P2, Miami P1, Emilia Romagna P2
- **Piastri**: Bahrain P8, Saudi Arabia P4, Australia P4, Japan P8, China P8, Miami P13, Emilia Romagna P4
- **Alonso**: Bahrain P9, Saudi Arabia P5, Australia P8, Japan P6, China P7, Miami P9, Emilia Romagna P19
- **Stroll**: Bahrain P10, Saudi Arabia DNF, Australia P6, Japan P12, China P15, Miami P17, Emilia Romagna P9
- **Albon**: Bahrain P15, Saudi Arabia P11, Australia P11, Japan DNF, China P12, Miami P18, Emilia Romagna DNF

**Legend career stats:**
- **Schumacher**: 91 wins, 68 poles, 77 fastest laps
- **Senna**: 41 wins, 65 poles, 19 fastest laps
- **Prost**: 51 wins, 33 poles, 41 fastest laps
- **Lauda**: 25 wins, 24 poles, 24 fastest laps
- **Vettel**: 53 wins, 57 poles, 38 fastest laps

---

### SEASONS Array (14 iconic seasons)

Each season object:
```ts
{
  year: number,
  races: number,
  championDriver: string,
  championTeam: string,
  notableEvents: string[],
  recordsBroken: string[]
}
```

**Complete season data (include ALL these):**

| Year | Races | Champion Driver | Champion Team | Notable Events | Records Broken |
|------|-------|----------------|---------------|----------------|----------------|
| 2025 | 24 | Lando Norris | McLaren | Norris secures his maiden World Drivers' Championship at the final race in Abu Dhabi; McLaren defends their Constructors' title | Lando Norris becomes World Champion, ending Verstappen's 4-year streak; Closest championship finish in years, decided by just 2 points |
| 2024 | 24 | Max Verstappen | McLaren | Record breaking 24-race calendar; Hamilton announces Ferrari move for 2025; McLaren wins their first Constructors' Championship since 1998 | Max Verstappen secures his fourth consecutive World Drivers' Championship; Longest F1 calendar in history with 24 races |
| 2023 | 22 | Max Verstappen | Red Bull Racing | Verstappen sets record with 10 consecutive wins; Red Bull wins 21 out of 22 races | Max Verstappen sets record for most consecutive wins (10); Red Bull breaks McLaren's 1988 record for most consecutive team wins (15); Verstappen sets record for most points in a single season (575) |
| 2022 | 22 | Max Verstappen | Red Bull Racing | Introduction of new ground-effect aerodynamics regulations | Verstappen sets new record for most wins in a single season (15); Verstappen sets record for most points in a season (454) |
| 2021 | 22 | Max Verstappen | Mercedes | Epic championship battle decided on the final lap in Abu Dhabi | Lewis Hamilton becomes first driver to reach 100 race wins; Lewis Hamilton sets record for most pole positions (103) |
| 2020 | 17 | Lewis Hamilton | Mercedes | Season heavily affected by COVID-19; Hamilton equals Schumacher with 7 titles | Lewis Hamilton equals Michael Schumacher's record of 7 World Championships; Hamilton surpasses Schumacher's all-time record of 91 career wins; Kimi Raikkonen breaks record for most race starts |
| 2013 | 19 | Sebastian Vettel | Red Bull Racing | Vettel wins 9 consecutive races to end the season; Red Bull's 4th consecutive double championship | Sebastian Vettel equals Alberto Ascari's record of 9 consecutive race wins; Vettel equals Schumacher's record of 13 wins in a single season; Vettel becomes youngest four-time World Champion |
| 2009 | 17 | Jenson Button | Brawn GP | Brawn GP wins championship in their only season; Introduction of double diffusers | Brawn GP becomes first and only team to win Constructors Championship in their debut season; Jenson Button equals record for most wins in the first seven races (6) |
| 2004 | 18 | Michael Schumacher | Ferrari | Schumacher wins 13 races in a single season; Ferrari's dominance peaks with 15 wins | Michael Schumacher sets a new record of 13 wins in a single season; Schumacher becomes the first and only driver to win 7 World Championships; Schumacher sets record for most consecutive podium finishes (19) |
| 1995 | 17 | Michael Schumacher | Benetton Formula | Schumacher's second title; Benetton's only Constructors' Championship | Michael Schumacher becomes the youngest double World Champion at the time; Benetton achieves their first ever Constructors Championship |
| 1991 | 16 | Ayrton Senna | McLaren | Senna's third and final world championship | Ayrton Senna becomes youngest three-time World Champion at the time; Senna wins the first four races of the season consecutively |
| 1989 | 16 | Alain Prost | McLaren | Infamous Senna-Prost collision at Suzuka; Prost wins his third title | McLaren equals their own record of dominance; Alain Prost sets new record for career points |
| 1984 | 16 | Niki Lauda | McLaren | Lauda wins by half a point over teammate Prost | Smallest Championship winning margin in F1 history (0.5 points); McLaren breaks record for most wins in a season (12) |
| 1972 | 12 | Emerson Fittipaldi | Team Lotus | Fittipaldi becomes youngest champion at the time; Lotus wins their 5th constructors title | Emerson Fittipaldi becomes the youngest World Champion in history (25 years, 273 days) |

---

## COMPONENT SPECIFICATIONS

### 1. `App.tsx` — Root Component
- State: `isWelcomeComplete` (boolean, starts `false`)
- When `false`: Show `<WelcomeExperience onComplete={() => setIsWelcomeComplete(true)} />`
- Always render `<Home isVisible={isWelcomeComplete} />` (it fades in via CSS)

### 2. `useUserPreferences.ts` — Custom Hook
- Reads/writes to `localStorage` keys: `f1_first_visit`, `f1_sound_enabled`
- Detects `prefers-reduced-motion` media query
- Detects slow network via `navigator.connection` (data saver, slow-2g, 2g) — sets reduced motion
- Returns: `isFirstVisit`, `setFirstVisit(bool)`, `soundEnabled`, `setSoundEnabled(bool)`, `hasReducedMotion`

### 3. `WelcomeExperience.tsx` — Full-Screen Loading Intro
- **Fixed overlay** (z-index 9999) over the entire viewport
- **Phases**: `init` -> `loading` -> `ready` -> `exit`
- If `hasReducedMotion` or `!isFirstVisit`: skip directly to `ready` phase, auto-complete after 1.5s
- Full version: 3-second `requestAnimationFrame` progress animation with **easeOutQuad** easing
- At 100% progress -> `ready` (hold 800ms) -> `exit` (fade out 800ms) -> calls `onComplete()`
- **Background layers:**
  - `.environment-grid` — CSS grid pattern (`linear-gradient` cross-hatch) with `perspective(500px) rotateX(60deg)` transform, animated with `translateY` for infinite scroll effect
  - `.carbon-texture` — radial gradient + tiny SVG noise pattern overlay
- Contains `<TelemetryHUD>` and `<F1CarAnimation>` components
- Reduced motion fallback: simple centered text with "WELCOME TO THE F1 ARCHIVE" and progress %

### 4. `TelemetryHUD.tsx` — HUD Overlay on Loading Screen
- **Positioned absolutely** over the welcome experience, acts as a display-only overlay (pointer-events: none except buttons)
- **Layout**: Top bar (branding left, controls right) -> Center (welcome message) -> Bottom (facts + progress bar)
- **Top bar**: "F1 // ARCHIVE" branding + "THE EVOLUTION OF SPEED" subtitle + sound toggle + skip button (`ESC` key also triggers skip)
- **Center**: Large headline "RACE CONTROL, STANDING BY." + subtext "75 years of data. Every regulation, every rivalry, every record."
- **Bottom left**: Rotating facts array (cycles every 2s): `["927 RACES INDEXED", "34 CONSTRUCTORS", "112 DRIVERS' CHAMPIONSHIPS", "DATABASE ONLINE", "ARCHIVE 1950 to 2026"]`
- **Bottom right**: Loading stage label (maps progress to 9 stages: SYSTEM INITIALIZATION -> LOADING F1 DATABASE -> SEASON DATA -> TEAM DATABASE -> DRIVER DATABASE -> VEHICLE MODELS -> TECHNICAL ARCHIVE -> 3D ASSETS -> SYSTEM READY) + progress bar (300px wide, 4px tall, cyan gradient with shimmer animation) + percentage readout
- **Animations**: All three HUD sections fade in with staggered delays (0.2s, 0.5s, 0.8s) using a `fadeIn` keyframe (opacity 0 to 1, translateY 10px to 0)
- **Progress bar** uses a `shimmer` animation (background-position sweep) and cyan glow box-shadow

### 5. `F1CarAnimation.tsx` — SVG Car That Drives Across Screen
- **Container**: Absolute positioned, centered vertically, full width, 200px tall, z-index 5
- **Car wrapper**: Starts at `left: -350px`, translates across screen via `transform: translateX(${progress}vw)`
- **SVG car** (viewBox `0 0 300 100`):
  - Body silhouette: `M 50 60 L 80 50 L 150 45 L 200 40 L 250 45 L 280 60 Z` (filled dark, stroked cyan)
  - Front wing: `M 280 60 L 290 65 L 290 70 L 250 70 Z`
  - Rear wing: `M 50 60 L 40 40 L 60 40 Z`
  - Halo/cockpit: `M 160 42 L 180 35 L 200 40 Z` (white stroke, no fill)
  - Two wheels at `cx=80,cy=70` and `cx=230,cy=70` (r=15, red stroke, spinning animation 0.1s)
  - Aero trails (cyan gradient, visible at 40-90% progress)
  - Exhaust flame (red triangle, visible at 30-90% progress, flickering animation)
  - Linear gradient `#glow` and blur filter for effects
- **Speed readout**: Telemetry text showing "SPEED {speed} KM/H" — calculated: 0 at start, ramps to 100 by 20%, then 320 by 80%, snaps to 350 by 100%
- **Speed lines**: 25 horizontal lines flying left-to-right across background (some cyan, some red for `.fast`), random vertical positions
- **Floor reflection**: Blurred cyan strip below car

### 6. `Home.tsx` — Main App Shell (Post-Loading)
- **Container fades in** when `isVisible` is true (opacity 0 to 1 transition)
- **Header**: "F1 // ARCHIVE" branding (clickable to go home) + navigation links: SEASONS, TEAMS, CARS, DRIVERS, GARAGE
- **State**: `currentView` string — routes to: `'home'` (hero), `'seasons'`, `'teams'`, `'cars'`, `'drivers'`, `'garage'`, `'archive'`
- **Home view**: Large headline "THE EVOLUTION OF SPEED." + subtitle + "ENTER ARCHIVE" CTA button + floating car SVG silhouette placeholder with cyan glow gradient
- **Garage/Archive**: Placeholder views with back buttons
- Active nav items get cyan color + text-shadow glow

### 7. `SeasonsArchive.tsx` — Season Browser
- **Left sidebar** with scrollable year buttons
- **Main content**: Year title (4rem), stats grid (races count, world champion in cyan, constructor champion), notable events list (> prefix), records broken section (cyan-themed)
- Uses shared `.archive-section`, `.sidebar`, `.list-button`, `.stat-card` CSS classes

### 8. `TeamsArchive.tsx` — Team Browser
- **Left sidebar** with team buttons (color indicator dot + team name)
- **Main content**: Team logo image + team name (in team color with matching text-shadow), description paragraph, stats grid (base, first entry, principal, championships, pole positions, fastest laps, car name), "VIEW 3D MODEL" CTA button (in team color) that navigates to Cars view

### 9. `DriversArchive.tsx` — Driver Browser
- **Left sidebar** with driver name buttons
- **Main content**: Giant driver number (8rem, team color with glow), driver name + team name, stats grid (country, championships, wins, podiums), race finishes list (scrollable, hover highlights, position colored: gold for P1, silver for P2, bronze for P3, red for DNF)
- **Driver image**: Positioned absolutely on the right side with radial gradient background in team color, images loaded from external URLs, fallback is a helmet placeholder (rounded CSS shape with team-color border)

### 10. `CarsArchive.tsx` — 3D Car Viewer
- **Three-column layout**: Left sidebar (team buttons with color indicators + team logos), center (Three.js Canvas), right sidebar (specifications)
- **Three.js Canvas** (using `@react-three/fiber` and `@react-three/drei`):
  - Camera position: `[4, 2, 5]`, FOV 45
  - Background color: `#05070C`
  - Ambient light (0.5) + spotlight (position [10,10,10], angle 0.15, penumbra 1, castShadow) + point light (position [-10,-10,-10], intensity 0.5)
  - `<Suspense>` fallback shows "LOADING 3D ASSETS..." text via `<Html center>`
  - `<InteractiveCarModel>` with team color, specs, and aero toggle
  - `<ContactShadows>` (resolution 1024, scale 20, blur 2, opacity 0.5, cyan color)
  - `<Environment preset="city" />`
  - `<OrbitControls>` (no pan, constrained polar angle, autoRotate when aero is off)
- **Canvas overlay**: Car name (3rem) + "INTERACTIVE 3D MODEL" label + "AERO TEST: ON/OFF" toggle button
- **Right sidebar**: Specifications (power unit, chassis, weight, aero package, top speed) + telemetry status box showing "SYSTEM STATUS: ONLINE" and "MODEL RENDER: ACTIVE"

### 11. `InteractiveCarModel.tsx` — The 3D Car Component
- Loads GLB model from `/models/generic_f1.glb` via `useGLTF`
- **Scene cloning and setup:**
  - Clones the scene, computes bounding boxes
  - Auto-scales to fit viewport (3.5 / maxDimension)
  - Centers the model by subtracting scaled center offset
  - Strips ALL textures (map, normalMap, roughnessMap, metalnessMap) to create clean surfaces
  - Applies team color to body panel materials (materials named `OBJ.003`/`OBJ.004` or index 0/1)
  - Sets body material roughness=0.2, metalness=0.9 for premium metallic look
- **Hover interaction:**
  - `onPointerOver/Move/Out` on the primitive
  - Highlights hovered material with emissive glow in team color (emissiveIntensity 0.5)
  - Shows floating HTML tooltip via `<Html>` positioned at hover point with spec info:
    - Material index 0-3: CHASSIS info (chassis type + weight)
    - Material index 4-6: AERO PACKAGE info (downforce level)
    - Material index 7+: POWER UNIT info (power unit + top speed)
  - Tooltip styled with dark background, team-color border, glow shadow, monospace font
- **Floating animation**: Gentle sine-wave bob (`Math.sin(clock.elapsedTime) * 0.05`) when aero mode is OFF; static when ON
- **Wind tunnel mode** (showAero=true): Renders `<WindTunnel>` component with 2000 cyan particles flowing from front to back, deflecting around the car body shape. Particles use additive blending, size 0.05, opacity 0.4.
- Preloads the GLB model with `useGLTF.preload('/models/generic_f1.glb')`

---

## ANIMATION SPECIFICATIONS

### CSS Keyframes Used
1. **`gridMove`** (WelcomeExperience): Perspective grid scrolls vertically — `translateY(0)` to `translateY(40px)`, 10s linear infinite
2. **`fadeIn`** (TelemetryHUD, shared): `opacity: 0, translateY(10px)` to `opacity: 1, translateY(0)`, 1s ease
3. **`shimmer`** (TelemetryHUD progress bar): `background-position: 200% 0` to `-200% 0`, 2s linear infinite
4. **`pulseTrail`** (F1CarAnimation): Aero trail opacity/blur/scale oscillation, 0.15s infinite alternate
5. **`flicker`** (F1CarAnimation): Exhaust flame scaleX + translateY jitter, 0.05s infinite alternate
6. **`spin`** (F1CarAnimation): Wheel rotation 0 to 360deg, 0.1s linear infinite
7. **`dash`** (F1CarAnimation): Speed lines fly from right to left — `translateX(0)` to `translateX(-150vw)`, random durations 0.1-0.5s
8. **`float`** (Home): Hero car placeholder gentle horizontal drift, 6s ease-in-out infinite
9. **`pulse`** (CarsArchive): Loading text opacity oscillation 0.5 to 1, 1s infinite alternate

### Transitions
- Welcome exit: `opacity 0.8s ease-in-out, transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)` — scales up to 1.05 while fading out
- Home container: `opacity 1.5s ease-in-out` for fade-in
- All buttons/links: `0.2s ease` transitions on color, background, border, transform
- CTA buttons: `translateY(-2px)` + box-shadow on hover
- List buttons: `padding-left 1rem to 1.5rem` indent on hover/active
- Driver images: `scale(1.05)` on parent hover with `cubic-bezier(0.16, 1, 0.3, 1)` easing

---

## RESPONSIVE DESIGN

- **Breakpoint**: 1024px (tablets) and 768px (mobile)
- At 1024px: Archive layouts switch from row to column, sidebars become full-width, canvas container gets fixed 60vh height
- At 768px: Telemetry HUD gets reduced padding, welcome message shrinks to 1.8rem, progress bar shrinks to 200px
- Navigation and header adapt with flex-wrap

---

## ACCESSIBILITY

- `aria-label` on sound toggle and skip button
- `aria-live="polite"` on loading status for screen reader announcements
- ESC key to skip intro
- `.sr-only` utility class available
- Respects `prefers-reduced-motion` — skips all animations, shows simplified loading
- Detects data-saver/slow connections and falls back to reduced motion
- Custom scrollbar styling for race results list (4px cyan scrollbar)

---

## BUILD AND RUN

```bash
npm install
npm run dev
```

The app will open at `http://localhost:5173`. On first visit, you will see the full cinematic loading experience. On subsequent visits (or if you press ESC / click SKIP INTRO), it skips to the main app instantly.

**Remember**: You MUST place a `.glb` format F1 car 3D model at `public/models/generic_f1.glb` for the Cars Archive 3D viewer to work. The component auto-scales and recolors any model.