import {
  CircuitCornersRegistrySchema,
  type CircuitCorner,
  type CircuitCornersRegistry,
  type FallbackCornerMarker
} from './circuitCornersSchema';

export const CIRCUIT_CORNERS_REGISTRY: CircuitCornersRegistry = CircuitCornersRegistrySchema.parse({
  // ── 1. Spa-Francorchamps (Belgium) ──
  'spa-francorchamps': [
    {
      number: 1,
      name: 'La Source',
      t: 0.05,
      speedKmh: 68,
      gear: 2,
      brakingG: 5.2,
      lateralG: 2.1,
      brakingDistanceM: 118,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight downhill hairpin following the start straight. Crucial traction zone leading into the downhill charge toward Eau Rouge.',
      famousOvertake: 'Grosjean multi-car pileup (2012); Alonso round the outside of Hamilton (2014)'
    },
    {
      number: 3,
      name: 'Eau Rouge / Raidillon',
      t: 0.18,
      speedKmh: 305,
      gear: 8,
      brakingG: 0.8,
      lateralG: 4.8,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Terrifying full-throttle uphill compression. 17% gradient climb with vertical G-forces pushing drivers down into their seats.',
      famousOvertake: 'Mark Webber daring slipstream pass on Fernando Alonso into the crest (2011)'
    },
    {
      number: 5,
      name: 'Les Combes',
      t: 0.36,
      speedKmh: 142,
      gear: 3,
      brakingG: 5.4,
      lateralG: 3.2,
      brakingDistanceM: 125,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Prime overtaking opportunity at the end of the Kemmel Straight DRS zone. Right-left chicane demanding aggressive kerb usage.',
      famousOvertake: 'Mika Häkkinen double-slipstream pass on Michael Schumacher lapping Zonta (2000)'
    },
    {
      number: 8,
      name: 'Bruxelles',
      t: 0.52,
      speedKmh: 110,
      gear: 3,
      brakingG: 2.8,
      lateralG: 2.9,
      brakingDistanceM: 65,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Long, off-camber downhill right-hander where front-left tyre graining and understeer punish drivers who miss the apex.',
      famousOvertake: 'Vettel lunging on Button down the inside (2010)'
    },
    {
      number: 10,
      name: 'Pouhon',
      t: 0.62,
      speedKmh: 285,
      gear: 7,
      brakingG: 1.2,
      lateralG: 5.1,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Double-apex left-hand sweeper taken in 7th gear. Peak neck strain exceeding 5G under modern ground-effect downforce.',
      famousOvertake: 'Max Verstappen around the outside of Felipe Nasr (2015)'
    },
    {
      number: 14,
      name: 'Stavelot',
      t: 0.74,
      speedKmh: 178,
      gear: 4,
      brakingG: 3.5,
      lateralG: 3.8,
      brakingDistanceM: 75,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Right-hand kink leading onto the flat-out Blanchimont blast. Early throttle application is vital for top speed.',
      famousOvertake: 'Ricciardo divebomb on Perez (2016)'
    },
    {
      number: 17,
      name: 'Blanchimont',
      t: 0.88,
      speedKmh: 315,
      gear: 8,
      brakingG: null,
      lateralG: 4.2,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Flat-out blind left-hand kink taken at over 310 km/h. Requires supreme car balance in turbulent wake.',
      famousOvertake: 'Alonso bold sweep past Schumacher into Blanchimont (2005)'
    },
    {
      number: 19,
      name: 'Bus Stop Chicane',
      t: 0.96,
      speedKmh: 75,
      gear: 2,
      brakingG: 5.5,
      lateralG: 2.4,
      brakingDistanceM: 132,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Final hard-braking battleground before the pit straight. Heavy deceleration from 325 km/h to 75 km/h.',
      famousOvertake: 'Hamilton vs. Räikkönen epic wheel-to-wheel scrap in treacherous rain (2008)'
    }
  ],

  // ── 2. Monza (Italy) ──
  'monza': [
    {
      number: 1,
      name: 'Variante del Rettifilo',
      t: 0.12,
      speedKmh: 72,
      gear: 2,
      brakingG: 5.8,
      lateralG: 2.2,
      brakingDistanceM: 145,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Massive deceleration from 350 km/h down to 72 km/h. Narrow chicane that frequently causes opening-lap contact.',
      famousOvertake: 'Verstappen and Hamilton championship collision landing on halo (2021)'
    },
    {
      number: 3,
      name: 'Curva Grande (Curva Biassono)',
      t: 0.28,
      speedKmh: 295,
      gear: 8,
      brakingG: null,
      lateralG: 3.5,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: false,
      notes: 'Long, sweeping right-hand bend taken flat out with skinny Monza low-drag rear wings.',
      famousOvertake: 'Vettel passing Alonso half on the grass (2011)'
    },
    {
      number: 4,
      name: 'Variante della Roggia',
      t: 0.42,
      speedKmh: 120,
      gear: 3,
      brakingG: 5.2,
      lateralG: 2.8,
      brakingDistanceM: 110,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Second chicane framed by tall trees. High sausage kerbs punish cut apexes with immediate chassis launch.',
      famousOvertake: 'Hamilton around the outside of Räikkönen into Roggia (2018)'
    },
    {
      number: 6,
      name: 'Curva di Lesmo 1',
      t: 0.54,
      speedKmh: 195,
      gear: 5,
      brakingG: 3.8,
      lateralG: 3.6,
      brakingDistanceM: 70,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Medium-speed right-hander requiring precise turn-in. Missing the apex ruins speed down to Lesmo 2.',
      famousOvertake: 'Gasly holding off Sainz for historic maiden victory (2020)'
    },
    {
      number: 7,
      name: 'Curva di Lesmo 2',
      t: 0.62,
      speedKmh: 165,
      gear: 4,
      brakingG: 3.6,
      lateralG: 3.4,
      brakingDistanceM: 65,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Tighter than Lesmo 1; drivers clip the inside kerb and drift out onto the gravel trap border.',
      famousOvertake: 'Leclerc defending aggressively from Hamilton (2019)'
    },
    {
      number: 8,
      name: 'Variante Ascari',
      t: 0.78,
      speedKmh: 215,
      gear: 5,
      brakingG: 4.6,
      lateralG: 4.1,
      brakingDistanceM: 95,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'High-speed left-right-left sequence through the Royal Park. Maximum commitment over inner kerbs.',
      famousOvertake: 'Vettel sweeping past Massa at the exit of Ascari (2008)'
    },
    {
      number: 11,
      name: 'Curva Parabolica (Alboreto)',
      t: 0.92,
      speedKmh: 220,
      gear: 6,
      brakingG: 3.2,
      lateralG: 3.9,
      brakingDistanceM: 80,
      isOvertakingZone: false,
      isHighDownforce: false,
      notes: 'Eternal opening radius right-hander. Track limits along the asphalt run-off are heavily policed.',
      famousOvertake: 'Perez diving past Sainz on the entry to Parabolica (2023)'
    }
  ],

  // ── 3. Monaco (Monaco) ──
  'monaco': [
    {
      number: 1,
      name: 'Sainte Dévote',
      t: 0.08,
      speedKmh: 95,
      gear: 2,
      brakingG: 4.6,
      lateralG: 2.2,
      brakingDistanceM: 85,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Historic opening corner named after the patron saint. Escape road catches locked-up brakes.',
      famousOvertake: 'Verstappen diving past Sainz in his rookie campaign (2015)'
    },
    {
      number: 3,
      name: 'Massenet & Casino Square',
      t: 0.22,
      speedKmh: 148,
      gear: 4,
      brakingG: 2.5,
      lateralG: 3.4,
      brakingDistanceM: 40,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Fast blind left-hand crest past the Hotel de Paris. The track drops sharply away at the exit.',
      famousOvertake: 'Perez brushing the Armco to hold track position (2022)'
    },
    {
      number: 5,
      name: 'Mirabeau Haute',
      t: 0.32,
      speedKmh: 82,
      gear: 2,
      brakingG: 3.8,
      lateralG: 2.0,
      brakingDistanceM: 55,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Downhill plunge with severe negative banking. Inside barrier leaves zero room for error.',
      famousOvertake: 'Ricciardo managing down-on-power PU to stave off Vettel (2018)'
    },
    {
      number: 6,
      name: 'Grand Hotel Hairpin (Fairmont)',
      t: 0.40,
      speedKmh: 48,
      gear: 1,
      brakingG: 2.2,
      lateralG: 1.5,
      brakingDistanceM: 35,
      isOvertakingZone: false,
      isHighDownforce: false,
      notes: 'The slowest corner on the Formula 1 calendar. Requires maximum steering lock modified on the rack.',
      famousOvertake: 'Ayrton Senna dominating the streets with sublime throttle modulation (1992)'
    },
    {
      number: 8,
      name: 'Portier',
      t: 0.48,
      speedKmh: 80,
      gear: 2,
      brakingG: 3.1,
      lateralG: 2.3,
      brakingDistanceM: 45,
      isOvertakingZone: false,
      isHighDownforce: false,
      notes: 'Right-hander leading directly into the tunnel. Ayrton Senna famously crashed here in 1988 while leading.',
      famousOvertake: 'Leclerc overtaking Grosjean down the inside (2019)'
    },
    {
      number: 10,
      name: 'Nouvelle Chicane',
      t: 0.62,
      speedKmh: 75,
      gear: 2,
      brakingG: 5.4,
      lateralG: 2.5,
      brakingDistanceM: 115,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Hard deceleration exiting the darkness of the tunnel into the blinding Mediterranean sun.',
      famousOvertake: 'Button slicing through the pack in his dominant championship year (2009)'
    },
    {
      number: 12,
      name: 'Tabac',
      t: 0.72,
      speedKmh: 165,
      gear: 4,
      brakingG: 2.8,
      lateralG: 3.8,
      brakingDistanceM: 45,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Blistering left-hander right along the harbor yachts. Requires surgical precision against the barriers.',
      famousOvertake: 'Alonso qualifying commitment brushing the outer wall (2023)'
    },
    {
      number: 15,
      name: 'Swimming Pool (Louis Chiron)',
      t: 0.82,
      speedKmh: 205,
      gear: 5,
      brakingG: 2.2,
      lateralG: 4.4,
      brakingDistanceM: 35,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'High-speed flick around the swimming pool complex. Cars ride the tall yellow kerbs violently.',
      famousOvertake: 'Verstappen clinical qualifying pole lap edge (2023)'
    },
    {
      number: 18,
      name: 'La Rascasse',
      t: 0.94,
      speedKmh: 62,
      gear: 1,
      brakingG: 3.5,
      lateralG: 1.8,
      brakingDistanceM: 48,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight corner wrapping around the restaurant terrace before Antony Noghès onto the pit straight.',
      famousOvertake: 'Schumacher parking scandal in qualifying session (2006)'
    }
  ],

  // ── 4. Silverstone (Great Britain) ──
  'silverstone': [
    {
      number: 3,
      name: 'Village & The Loop',
      t: 0.16,
      speedKmh: 88,
      gear: 2,
      brakingG: 4.8,
      lateralG: 2.2,
      brakingDistanceM: 105,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight infield complex introduced with the Wing pit layout. Excellent switchback overtaking chance.',
      famousOvertake: 'Hamilton passing Leclerc after a side-by-side duel into Village (2022)'
    },
    {
      number: 6,
      name: 'Brooklands',
      t: 0.35,
      speedKmh: 145,
      gear: 3,
      brakingG: 4.5,
      lateralG: 3.1,
      brakingDistanceM: 98,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Long left-hand entry off the Wellington Straight DRS. Late braking battles are standard.',
      famousOvertake: 'Sainz, Leclerc, and Perez epic 3-wide dogfight (2022)'
    },
    {
      number: 9,
      name: 'Copse',
      t: 0.52,
      speedKmh: 290,
      gear: 8,
      brakingG: 1.0,
      lateralG: 5.2,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Mega 290 km/h blind right-hander taken with just a breath of throttle lift. Utmost commitment.',
      famousOvertake: 'Hamilton and Verstappen dramatic lap 1 51G collision (2021)'
    },
    {
      number: 10,
      name: 'Maggotts',
      t: 0.62,
      speedKmh: 298,
      gear: 8,
      brakingG: null,
      lateralG: 5.0,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Entry to Formula 1’s greatest high-speed esses sequence. Fast direction changes test chassis stiffness.',
      famousOvertake: 'Räikkönen slicing through traffic in peak V10 era (2005)'
    },
    {
      number: 12,
      name: 'Becketts',
      t: 0.68,
      speedKmh: 235,
      gear: 6,
      brakingG: 2.8,
      lateralG: 4.6,
      brakingDistanceM: 40,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Decelerating right-left transition in the Maggotts-Becketts complex. Requires perfect rhythm.',
      famousOvertake: 'Alonso around the outside of Schumacher through Becketts (2006)'
    },
    {
      number: 15,
      name: 'Stowe',
      t: 0.82,
      speedKmh: 205,
      gear: 5,
      brakingG: 4.4,
      lateralG: 3.8,
      brakingDistanceM: 90,
      isOvertakingZone: true,
      isHighDownforce: true,
      notes: 'Sixth-gear entry off the Hangar Straight. Tailwind often unsettles the rear axle on entry.',
      famousOvertake: 'Leclerc exquisite outside pass on Hamilton (2022)'
    },
    {
      number: 16,
      name: 'Vale & Club',
      t: 0.94,
      speedKmh: 95,
      gear: 2,
      brakingG: 4.9,
      lateralG: 2.6,
      brakingDistanceM: 110,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Downhill braking into Vale followed by long acceleration around Club toward the British crowd.',
      famousOvertake: 'Mansell selling the famous "Silverstone Dummy" to Piquet (1987)'
    }
  ],

  // ── 5. Suzuka (Japan) ──
  'suzuka': [
    {
      number: 1,
      name: 'First Curve (Turns 1 & 2)',
      t: 0.08,
      speedKmh: 175,
      gear: 4,
      brakingG: 4.2,
      lateralG: 3.6,
      brakingDistanceM: 85,
      isOvertakingZone: true,
      isHighDownforce: true,
      notes: 'Fast entry off the pit straight followed immediately by a tightening second-apex left.',
      famousOvertake: 'Senna and Prost infamous championship-deciding collision (1990)'
    },
    {
      number: 4,
      name: 'The Esses (S-Curves)',
      t: 0.22,
      speedKmh: 220,
      gear: 5,
      brakingG: 1.5,
      lateralG: 4.5,
      brakingDistanceM: 25,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Uphill flowing esses requiring fluid weight transfer. Any mistake in Turn 3 ruins the entire sector.',
      famousOvertake: 'Hamilton dancing through the S-Curves on pole lap (2017)'
    },
    {
      number: 8,
      name: 'Degner 1 & 2',
      t: 0.40,
      speedKmh: 140,
      gear: 3,
      brakingG: 3.8,
      lateralG: 3.4,
      brakingDistanceM: 55,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Named after Ernst Degner. Degner 1 is a fast snap right; Degner 2 has a high kerb that catches floor edges.',
      famousOvertake: 'Vettel on Alonso through the sweeping curves (2012)'
    },
    {
      number: 11,
      name: 'Hairpin (Turn 11)',
      t: 0.52,
      speedKmh: 68,
      gear: 2,
      brakingG: 4.6,
      lateralG: 2.1,
      brakingDistanceM: 92,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tightest point on the track following the underpass. Classic late-braking divebomb hotspot.',
      famousOvertake: 'Kobayashi stunning crowd with 5 overtakes at the hairpin (2010)'
    },
    {
      number: 13,
      name: 'Spoon Curve',
      t: 0.68,
      speedKmh: 185,
      gear: 5,
      brakingG: 3.2,
      lateralG: 3.8,
      brakingDistanceM: 70,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Double-apex downhill left-hander. Exit speed dictates the flat-out run down the back straight.',
      famousOvertake: 'Verstappen sweeping around the outside of Norris (2023)'
    },
    {
      number: 15,
      name: '130R',
      t: 0.84,
      speedKmh: 310,
      gear: 8,
      brakingG: 0.5,
      lateralG: 4.2,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Legendary 130-meter radius left-hander taken flat out at over 300 km/h.',
      famousOvertake: 'Fernando Alonso breathtaking outside pass on Michael Schumacher (2005)'
    },
    {
      number: 16,
      name: 'Casio Triangle Chicane',
      t: 0.94,
      speedKmh: 75,
      gear: 2,
      brakingG: 5.6,
      lateralG: 2.3,
      brakingDistanceM: 130,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Severe deceleration after 130R. Iconic battleground where countless world titles were settled.',
      famousOvertake: 'Senna and Prost historic chicane collision (1989)'
    }
  ],

  // ── 6. Interlagos (Brazil) ──
  'interlagos': [
    {
      number: 1,
      name: 'S do Senna (Turns 1 & 2)',
      t: 0.08,
      speedKmh: 115,
      gear: 3,
      brakingG: 5.1,
      lateralG: 3.0,
      brakingDistanceM: 115,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Downhill left-right chicane honoring Ayrton Senna. Bumpy braking zone allows multiple racing lines.',
      famousOvertake: 'Montoya audacious rookie pass on Michael Schumacher into Turn 1 (2001)'
    },
    {
      number: 4,
      name: 'Descida do Lago',
      t: 0.28,
      speedKmh: 155,
      gear: 4,
      brakingG: 4.5,
      lateralG: 3.2,
      brakingDistanceM: 95,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Left-hander at the end of the Reta Oposta DRS straight. Frequent wheel-to-wheel retaliation zone.',
      famousOvertake: 'Hamilton passing Vettel on the outside for the lead (2018)'
    },
    {
      number: 6,
      name: 'Ferradura',
      t: 0.45,
      speedKmh: 210,
      gear: 5,
      brakingG: 2.2,
      lateralG: 3.8,
      brakingDistanceM: 35,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Fast horseshoe uphill right-hander. High lateral G tests tyre preservation in warm Sao Paulo sun.',
      famousOvertake: 'Verstappen masterclass in torrential rain (2016)'
    },
    {
      number: 8,
      name: 'Pinheirinho',
      t: 0.62,
      speedKmh: 98,
      gear: 2,
      brakingG: 3.6,
      lateralG: 2.5,
      brakingDistanceM: 60,
      isOvertakingZone: false,
      isHighDownforce: false,
      notes: 'Slow left-hander in the tight natural amphitheater. Heavy traction demand on corner exit.',
      famousOvertake: 'Alonso clawing through traffic to title podium (2012)'
    },
    {
      number: 10,
      name: 'Bico de Pato',
      t: 0.74,
      speedKmh: 82,
      gear: 2,
      brakingG: 4.2,
      lateralG: 2.1,
      brakingDistanceM: 70,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight hairpin shaped like a duck bill. Requires patience on throttle to avoid wheelspin.',
      famousOvertake: 'Räikkönen late-race dive to seal miracle 2007 world championship'
    },
    {
      number: 12,
      name: 'Junção',
      t: 0.86,
      speedKmh: 135,
      gear: 3,
      brakingG: 3.4,
      lateralG: 2.8,
      brakingDistanceM: 55,
      isOvertakingZone: false,
      isHighDownforce: false,
      notes: 'Crucial left-hander leading onto the long uphill drag to the finish line.',
      famousOvertake: 'Hamilton passing Glock in the final corners to win 2008 title'
    }
  ],

  // ── 7. Austin / COTA (USA) ──
  'austin': [
    {
      number: 1,
      name: 'Turn 1 (The Hill)',
      t: 0.08,
      speedKmh: 78,
      gear: 2,
      brakingG: 4.8,
      lateralG: 2.4,
      brakingDistanceM: 105,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Steep 41-meter uphill climb into a blind apex hairpin. Wide run-off invites bold 3-wide divebombs.',
      famousOvertake: 'Hamilton slicing past Rosberg into the uphill crest (2015)'
    },
    {
      number: 3,
      name: 'The S-Curves (Turns 3–6)',
      t: 0.22,
      speedKmh: 245,
      gear: 6,
      brakingG: 1.8,
      lateralG: 4.8,
      brakingDistanceM: 30,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Inspired by Silverstone’s Maggotts/Becketts. Brutal lateral load and bumpy ground-effect oscillations.',
      famousOvertake: 'Verstappen chasing down Hamilton through the esses (2021)'
    },
    {
      number: 11,
      name: 'Hairpin (Turn 11)',
      t: 0.42,
      speedKmh: 82,
      gear: 2,
      brakingG: 4.6,
      lateralG: 2.2,
      brakingDistanceM: 95,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Precedes the 1.2 km back straight. Clean exit traction is paramount for top speed.',
      famousOvertake: 'Alonso wheel-to-wheel pass on Stroll followed by dramatic airborne crash (2022)'
    },
    {
      number: 12,
      name: 'Back Straight Braking (Turn 12)',
      t: 0.62,
      speedKmh: 92,
      gear: 2,
      brakingG: 5.6,
      lateralG: 2.5,
      brakingDistanceM: 135,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Peak overtaking hotspot after DRS straight. Deceleration from 330 km/h to 92 km/h.',
      famousOvertake: 'Verstappen and Hamilton wheel-to-wheel thriller in closing laps (2021)'
    },
    {
      number: 16,
      name: 'Quadruple Apex (Turns 16–18)',
      t: 0.82,
      speedKmh: 215,
      gear: 6,
      brakingG: 1.2,
      lateralG: 4.4,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Mirror image of Istanbul Park Turn 8. High-speed carousel punishing the front-right tyre.',
      famousOvertake: 'Leclerc defensive masterclass against Perez (2022)'
    }
  ],

  // ── 8. Red Bull Ring (Spielberg) ──
  'spielberg': [
    {
      number: 1,
      name: 'Niki Lauda Kurve (Turn 1)',
      t: 0.12,
      speedKmh: 145,
      gear: 3,
      brakingG: 4.8,
      lateralG: 3.2,
      brakingDistanceM: 95,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Uphill right-hander named after Niki Lauda. High exit sausage kerb damages front wings.',
      famousOvertake: 'Verstappen and Leclerc sparring on the restart (2019)'
    },
    {
      number: 3,
      name: 'Remus (Turn 3)',
      t: 0.32,
      speedKmh: 68,
      gear: 2,
      brakingG: 5.4,
      lateralG: 2.0,
      brakingDistanceM: 125,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Apex of the circuit at 68m above ground. Tight uphill hairpin creating classic cut-back passes.',
      famousOvertake: 'Verstappen robust pass on Leclerc for maiden Honda turbo-hybrid win (2019)'
    },
    {
      number: 4,
      name: 'Schlossgold (Turn 4)',
      t: 0.48,
      speedKmh: 125,
      gear: 3,
      brakingG: 5.0,
      lateralG: 3.1,
      brakingDistanceM: 110,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Downhill right-hander with off-camber exit. Third DRS zone makes this a prime overtaking spot.',
      famousOvertake: 'Hamilton and Albon podium collision (2020)'
    },
    {
      number: 7,
      name: 'Würth (Turns 6 & 7)',
      t: 0.72,
      speedKmh: 205,
      gear: 5,
      brakingG: 2.8,
      lateralG: 4.2,
      brakingDistanceM: 45,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Double left-hander requiring high aerodynamic downforce and sharp front-end response.',
      famousOvertake: 'Sainz fighting through the midfield pack (2021)'
    },
    {
      number: 9,
      name: 'Jochen Rindt Kurve (Turn 9)',
      t: 0.88,
      speedKmh: 235,
      gear: 6,
      brakingG: 1.8,
      lateralG: 4.1,
      brakingDistanceM: 30,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Fast downhill right-hander leading to the final turn. Strict track limits enforced.',
      famousOvertake: 'Rosberg and Hamilton last-lap clash for the victory (2016)'
    }
  ],

  // ── 9. Bahrain (Sakhir) ──
  'bahrain': [
    {
      number: 1,
      name: 'Michael Schumacher Turn (Turn 1)',
      t: 0.10,
      speedKmh: 75,
      gear: 2,
      brakingG: 5.3,
      lateralG: 2.2,
      brakingDistanceM: 128,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Hard deceleration from 335 km/h at the end of the main straight. Tailwinds often cause lockups.',
      famousOvertake: 'Hamilton vs. Rosberg epic Duel in the Desert (2014)'
    },
    {
      number: 4,
      name: 'Turn 4',
      t: 0.28,
      speedKmh: 140,
      gear: 3,
      brakingG: 4.6,
      lateralG: 3.1,
      brakingDistanceM: 95,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Uphill right-hander off the second straight. Track limits here determined the 2021 win.',
      famousOvertake: 'Hamilton vs. Verstappen track limits duel in season opener (2021)'
    },
    {
      number: 10,
      name: 'Turn 10 Hairpin',
      t: 0.62,
      speedKmh: 82,
      gear: 2,
      brakingG: 4.2,
      lateralG: 2.4,
      brakingDistanceM: 80,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tricky downhill left-hand hairpin with unloading front-left tyre. Prone to severe lockups.',
      famousOvertake: 'Leclerc baiting Verstappen into repeated lockups (2022)'
    }
  ],

  // ── 10. Jeddah (Saudi Arabia) ──
  'jeddah': [
    {
      number: 1,
      name: 'Turn 1 & 2 Chicane',
      t: 0.08,
      speedKmh: 110,
      gear: 3,
      brakingG: 5.1,
      lateralG: 2.8,
      brakingDistanceM: 115,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight left-right complex between concrete walls. High probability of safety car interventions.',
      famousOvertake: 'Hamilton and Verstappen multi-restart chaos (2021)'
    },
    {
      number: 13,
      name: 'Turn 13 Banked Hairpin',
      t: 0.45,
      speedKmh: 165,
      gear: 4,
      brakingG: 3.4,
      lateralG: 3.6,
      brakingDistanceM: 65,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: '12-degree banked turnaround corner. High grip allows early throttle application.',
      famousOvertake: 'Perez mastering tyre life to control the race (2023)'
    },
    {
      number: 27,
      name: 'Turn 27 Hairpin',
      t: 0.92,
      speedKmh: 115,
      gear: 3,
      brakingG: 4.8,
      lateralG: 2.6,
      brakingDistanceM: 95,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Final hairpin before the pit straight. Strategic DRS detection games are played on entry.',
      famousOvertake: 'Verstappen and Leclerc tactical DRS braking games (2022)'
    }
  ],

  // ── 11. Melbourne (Albert Park) ──
  'melbourne': [
    {
      number: 1,
      name: 'Jones (Turn 1)',
      t: 0.08,
      speedKmh: 155,
      gear: 4,
      brakingG: 4.8,
      lateralG: 3.2,
      brakingDistanceM: 98,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Opening chicane through park trees. Bumpy braking zone with grass immediately off track.',
      famousOvertake: 'Ralf Schumacher launching over Barrichello into Turn 1 (2002)'
    },
    {
      number: 9,
      name: 'Turns 9 & 10 High Speed Chicane',
      t: 0.62,
      speedKmh: 245,
      gear: 6,
      brakingG: 2.2,
      lateralG: 4.6,
      brakingDistanceM: 35,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Redesigned full-throttle sweeper around the lake. Massive commitment against lakeside armco.',
      famousOvertake: 'Sainz pulling away for emotional comeback win (2024)'
    },
    {
      number: 11,
      name: 'Ascari (Turn 11)',
      t: 0.76,
      speedKmh: 125,
      gear: 3,
      brakingG: 4.6,
      lateralG: 3.0,
      brakingDistanceM: 90,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Sharp right-hander at the end of the lakeside DRS zone. High gravel trap risk.',
      famousOvertake: 'Perez climbing from pit lane to points (2023)'
    }
  ],

  // ── 12. Shanghai (China) ──
  'shanghai': [
    {
      number: 1,
      name: 'The Snail Curve (Turns 1–3)',
      t: 0.12,
      speedKmh: 85,
      gear: 2,
      brakingG: 3.2,
      lateralG: 3.4,
      brakingDistanceM: 65,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Unique decreasing-radius carousel turning through 270 degrees. Severe front-left tyre wear.',
      famousOvertake: 'Alonso and Schumacher strategic cat-and-mouse duel (2006)'
    },
    {
      number: 6,
      name: 'Turn 6 Hairpin',
      t: 0.38,
      speedKmh: 78,
      gear: 2,
      brakingG: 4.6,
      lateralG: 2.1,
      brakingDistanceM: 92,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight hairpin offering switchback opportunities for drivers defending the inside.',
      famousOvertake: 'Ricciardo divebomb clinic on his way to an improbable win (2018)'
    },
    {
      number: 14,
      name: 'Turn 14 Hairpin',
      t: 0.88,
      speedKmh: 68,
      gear: 2,
      brakingG: 5.6,
      lateralG: 2.2,
      brakingDistanceM: 138,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'End of the 1.2 km back straight. Massive 340 km/h deceleration into 68 km/h hairpin.',
      famousOvertake: 'Hamilton passing Vettel on the inside for the lead (2011)'
    }
  ],

  // ── 13. Miami (USA) ──
  'miami': [
    {
      number: 1,
      name: 'Turn 1',
      t: 0.08,
      speedKmh: 95,
      gear: 2,
      brakingG: 4.8,
      lateralG: 2.4,
      brakingDistanceM: 105,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Hard 90-degree right-hander off the pit straight around the Hard Rock Stadium.',
      famousOvertake: 'Verstappen sweeping past Sainz on the outside (2022)'
    },
    {
      number: 14,
      name: 'Turn 14 & 15 Chicane',
      t: 0.65,
      speedKmh: 65,
      gear: 1,
      brakingG: 3.8,
      lateralG: 1.8,
      brakingDistanceM: 60,
      isOvertakingZone: false,
      isHighDownforce: false,
      notes: 'Crawl over high curb ramps under the highway overpass. Extreme precision required.',
      famousOvertake: 'Norris managing safety car restart for maiden F1 victory (2024)'
    },
    {
      number: 17,
      name: 'Turn 17 Hairpin',
      t: 0.88,
      speedKmh: 75,
      gear: 2,
      brakingG: 5.2,
      lateralG: 2.2,
      brakingDistanceM: 125,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Sharp left-hand hairpin terminating the 1.3 km straight. Primary overtaking spot.',
      famousOvertake: 'Verstappen hunt down and pass on Leclerc (2022)'
    }
  ],

  // ── 14. Imola (Italy) ──
  'imola': [
    {
      number: 2,
      name: 'Variante Tamburello',
      t: 0.15,
      speedKmh: 140,
      gear: 3,
      brakingG: 5.2,
      lateralG: 3.2,
      brakingDistanceM: 115,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Chicane following the long pit straight flat-out blast. Riding the kerbs is essential for lap time.',
      famousOvertake: 'Hamilton and Verstappen wheel-to-wheel into Tamburello (2021)'
    },
    {
      number: 7,
      name: 'Tosa',
      t: 0.42,
      speedKmh: 92,
      gear: 2,
      brakingG: 4.4,
      lateralG: 2.5,
      brakingDistanceM: 85,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Uphill hairpin surrounded by hillside Tifosi. Banking helps rotate the car.',
      famousOvertake: 'Alonso holding off Schumacher in legendary 2005 battle'
    },
    {
      number: 9,
      name: 'Piratella',
      t: 0.55,
      speedKmh: 205,
      gear: 5,
      brakingG: 2.8,
      lateralG: 3.8,
      brakingDistanceM: 45,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Fast blind downhill left-hander. Car lightens as the track drops away.',
      famousOvertake: 'Schumacher defensive lines in 2006 rematch'
    },
    {
      number: 11,
      name: 'Acque Minerali',
      t: 0.68,
      speedKmh: 155,
      gear: 4,
      brakingG: 4.2,
      lateralG: 3.6,
      brakingDistanceM: 75,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Brutal right-hand compression followed by steep uphill climbing exit.',
      famousOvertake: 'Verstappen sweeping past in mixed wet conditions (2021)'
    }
  ],

  // ── 15. Montreal (Canada) ──
  'montreal': [
    {
      number: 1,
      name: 'Virage Senna (Turns 1 & 2)',
      t: 0.10,
      speedKmh: 110,
      gear: 3,
      brakingG: 4.8,
      lateralG: 2.8,
      brakingDistanceM: 105,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Downhill left flick followed immediately by the slow looping right hairpin around the pond.',
      famousOvertake: 'Alesi maiden Grand Prix victory drive (1995)'
    },
    {
      number: 10,
      name: 'L’Épingle (Hairpin)',
      t: 0.68,
      speedKmh: 68,
      gear: 2,
      brakingG: 5.2,
      lateralG: 2.0,
      brakingDistanceM: 125,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight 180-degree hairpin leading onto the Casino Straight. Maximum traction demand.',
      famousOvertake: 'Hamilton first career F1 victory drive (2007)'
    },
    {
      number: 14,
      name: 'Wall of Champions (Turns 13 & 14)',
      t: 0.94,
      speedKmh: 135,
      gear: 4,
      brakingG: 5.6,
      lateralG: 3.2,
      brakingDistanceM: 120,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Chicane with concrete wall right on the exit. Caught Hill, Schumacher, and Villeneuve in 1999.',
      famousOvertake: 'Button passing Vettel on the final wet lap (2011)'
    }
  ],

  // ── 16. Catalunya (Barcelona) ──
  'catalunya': [
    {
      number: 1,
      name: 'Elf (Turns 1 & 2)',
      t: 0.12,
      speedKmh: 135,
      gear: 3,
      brakingG: 5.2,
      lateralG: 3.0,
      brakingDistanceM: 120,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Uphill chicane at the end of the long 1 km main straight. Prime passing opportunity.',
      famousOvertake: 'Hamilton and Rosberg first-lap crash on the grass (2016)'
    },
    {
      number: 3,
      name: 'Curva Renault (Turn 3)',
      t: 0.25,
      speedKmh: 240,
      gear: 6,
      brakingG: null,
      lateralG: 4.4,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Long uphill right-hand sweeper that shreds the front-left tyre under sustained lateral G.',
      famousOvertake: 'Alonso sweeping around the outside of Webber in turn 3 (2013)'
    },
    {
      number: 10,
      name: 'La Caixa (Turn 10)',
      t: 0.72,
      speedKmh: 85,
      gear: 2,
      brakingG: 4.8,
      lateralG: 2.4,
      brakingDistanceM: 105,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Remodeled sweeping hairpin off the back straight. Good braking duel territory.',
      famousOvertake: 'Hamilton passing Verstappen with bold 2-stop strategy (2021)'
    }
  ],

  // ── 17. Hungaroring (Hungary) ──
  'hungaroring': [
    {
      number: 1,
      name: 'Turn 1',
      t: 0.10,
      speedKmh: 95,
      gear: 2,
      brakingG: 5.2,
      lateralG: 2.5,
      brakingDistanceM: 120,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Downhill right-hander following the pit straight. Virtually the only true overtaking spot.',
      famousOvertake: 'Piquet legendary sideways power-slide around Senna (1986)'
    },
    {
      number: 4,
      name: 'Turn 4',
      t: 0.32,
      speedKmh: 215,
      gear: 5,
      brakingG: 2.2,
      lateralG: 4.0,
      brakingDistanceM: 35,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Fast blind uphill left-hander. Exit kerb is right on the grass verge.',
      famousOvertake: 'Hamilton around the outside on qualifying pole run (2020)'
    },
    {
      number: 12,
      name: 'Turn 12',
      t: 0.82,
      speedKmh: 120,
      gear: 3,
      brakingG: 4.4,
      lateralG: 3.1,
      brakingDistanceM: 85,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Right-hander following the short second straight. Switchback passes are common.',
      famousOvertake: 'Ocon holding off Vettel to take shocking maiden win (2021)'
    }
  ],

  // ── 18. Zandvoort (Netherlands) ──
  'zandvoort': [
    {
      number: 1,
      name: 'Tarzanbocht (Turn 1)',
      t: 0.08,
      speedKmh: 105,
      gear: 3,
      brakingG: 4.9,
      lateralG: 2.6,
      brakingDistanceM: 105,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Historic banked right-hander at the end of the pit straight. Cambered banking aids overtaking.',
      famousOvertake: 'Lauda and Prost wheel-to-wheel duel (1985)'
    },
    {
      number: 3,
      name: 'Hugenholtzbocht (Turn 3)',
      t: 0.22,
      speedKmh: 110,
      gear: 3,
      brakingG: 3.2,
      lateralG: 3.5,
      brakingDistanceM: 50,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: '19-degree bowl-shaped banking. Allows cars to run side-by-side on high and low lines.',
      famousOvertake: 'Verstappen riding the upper rim to delight home fans (2021)'
    },
    {
      number: 14,
      name: 'Arie Luyendykbocht (Turn 14)',
      t: 0.92,
      speedKmh: 265,
      gear: 7,
      brakingG: null,
      lateralG: 4.1,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: '18-degree banked sweeping turn launching cars with DRS open onto the main straight.',
      famousOvertake: 'Alonso sweeping through rain on lap 1 (2023)'
    }
  ],

  // ── 19. Baku (Azerbaijan) ──
  'baku': [
    {
      number: 1,
      name: 'Turn 1',
      t: 0.08,
      speedKmh: 105,
      gear: 3,
      brakingG: 5.6,
      lateralG: 2.4,
      brakingDistanceM: 135,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Hard 90-degree left-hander after the 2.2 km full-throttle straight. Slipstream battles galore.',
      famousOvertake: 'Ricciardo passing 3 cars in one braking move into Turn 1 (2017)'
    },
    {
      number: 8,
      name: 'The Castle Section (Turn 8)',
      t: 0.42,
      speedKmh: 85,
      gear: 2,
      brakingG: 3.6,
      lateralG: 1.8,
      brakingDistanceM: 55,
      isOvertakingZone: false,
      isHighDownforce: false,
      notes: 'The narrowest track section in Formula 1 (7.6 meters wide) alongside medieval stone fortress.',
      famousOvertake: 'Leclerc "I am stupid" qualifying crash at the castle wall (2019)'
    },
    {
      number: 16,
      name: 'Turn 16',
      t: 0.78,
      speedKmh: 110,
      gear: 3,
      brakingG: 4.8,
      lateralG: 2.6,
      brakingDistanceM: 95,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Left-hander exiting the old town onto the uninterrupted 2.2 km full-throttle sprint.',
      famousOvertake: 'Perez holding off Hamilton on the standing restart (2021)'
    }
  ],

  // ── 20. Marina Bay (Singapore) ──
  'marina-bay': [
    {
      number: 1,
      name: 'Sheares (Turn 1)',
      t: 0.08,
      speedKmh: 115,
      gear: 3,
      brakingG: 5.1,
      lateralG: 2.8,
      brakingDistanceM: 110,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Bumpy braking zone off the pit straight under tropical heat and humidity.',
      famousOvertake: 'Vettel, Verstappen, and Räikkönen wet start collision (2017)'
    },
    {
      number: 7,
      name: 'Memorial (Turn 7)',
      t: 0.38,
      speedKmh: 105,
      gear: 3,
      brakingG: 5.2,
      lateralG: 2.7,
      brakingDistanceM: 115,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Hard deceleration at the end of Raffles Boulevard. Classic safety car restart flashpoint.',
      famousOvertake: 'Sainz tactical DRS management masterclass to win (2023)'
    },
    {
      number: 14,
      name: 'Connaught (Turn 14)',
      t: 0.72,
      speedKmh: 92,
      gear: 2,
      brakingG: 4.8,
      lateralG: 2.4,
      brakingDistanceM: 100,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Right-hander off the Esplanade Drive. Surface painted lines reduce braking grip.',
      famousOvertake: 'Hamilton stunning qualifying lap under the lights (2018)'
    }
  ],

  // ── 21. Mexico City (Hermanos Rodríguez) ──
  'mexico-city': [
    {
      number: 1,
      name: 'Turns 1–3 Chicane',
      t: 0.10,
      speedKmh: 110,
      gear: 3,
      brakingG: 5.4,
      lateralG: 2.8,
      brakingDistanceM: 130,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Deceleration at 2,285m thin air altitude. Reduced downforce makes the braking zone slippery.',
      famousOvertake: 'Verstappen 3-wide outside sweep for the lead (2021)'
    },
    {
      number: 4,
      name: 'Turn 4',
      t: 0.28,
      speedKmh: 115,
      gear: 3,
      brakingG: 4.8,
      lateralG: 2.6,
      brakingDistanceM: 105,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Left-hand entry following the second straight. Overtakes here set up DRS retorts.',
      famousOvertake: 'Perez battling Hamilton to ecstatic stadium roar (2021)'
    },
    {
      number: 12,
      name: 'Foro Sol Stadium (Turns 12–15)',
      t: 0.82,
      speedKmh: 75,
      gear: 2,
      brakingG: 3.8,
      lateralG: 2.0,
      brakingDistanceM: 65,
      isOvertakingZone: false,
      isHighDownforce: false,
      notes: 'Slow winding stadium section packed with 40,000 cheering fans. Podium sits right in the arena.',
      famousOvertake: 'Norris slicing through from 17th to 5th (2023)'
    }
  ],

  // ── 22. Las Vegas (USA) ──
  'las-vegas': [
    {
      number: 1,
      name: 'Turn 1 Hairpin',
      t: 0.08,
      speedKmh: 85,
      gear: 2,
      brakingG: 4.8,
      lateralG: 2.2,
      brakingDistanceM: 110,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight left hairpin into the Koval straight. Cold night temperatures make tyre warm-up difficult.',
      famousOvertake: 'Verstappen sliding past Leclerc on opening lap (2023)'
    },
    {
      number: 14,
      name: 'Strip Straight Braking (Turn 14)',
      t: 0.82,
      speedKmh: 95,
      gear: 2,
      brakingG: 5.6,
      lateralG: 2.4,
      brakingDistanceM: 140,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Hard deceleration from 350 km/h past the Bellagio Fountains and Caesars Palace.',
      famousOvertake: 'Leclerc last-lap divebomb on Perez for P2 (2023)'
    },
    {
      number: 17,
      name: 'Turn 17',
      t: 0.94,
      speedKmh: 245,
      gear: 6,
      brakingG: 1.5,
      lateralG: 3.8,
      brakingDistanceM: 25,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'High-speed kink leading to the final start-finish line under the neon casino canopy.',
      famousOvertake: 'Verstappen and Leclerc slipstream sprint to the flag (2023)'
    }
  ],

  // ── 23. Lusail (Qatar) ──
  'lusail': [
    {
      number: 1,
      name: 'Turn 1',
      t: 0.08,
      speedKmh: 125,
      gear: 3,
      brakingG: 5.1,
      lateralG: 2.9,
      brakingDistanceM: 115,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Hard braking zone at the end of the 1.0 km pit straight. Sand off-line reduces grip.',
      famousOvertake: 'Hamilton controlling from lights to flag (2021)'
    },
    {
      number: 12,
      name: 'Turns 12–14 Triple Apex',
      t: 0.72,
      speedKmh: 255,
      gear: 7,
      brakingG: null,
      lateralG: 5.1,
      brakingDistanceM: null,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Relentless high-speed right-hand carousel. Extreme tyre loads caused FIA-mandated stint lengths.',
      famousOvertake: 'Piastri sprint race victory masterclass (2023)'
    },
    {
      number: 16,
      name: 'Turn 16',
      t: 0.92,
      speedKmh: 155,
      gear: 4,
      brakingG: 3.8,
      lateralG: 3.4,
      brakingDistanceM: 65,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Final corner onto the pit straight. Kerb vibration can destabilize aerodynamic floor suction.',
      famousOvertake: 'Verstappen securing third world title in sprint race (2023)'
    }
  ],

  // ── 24. Yas Marina (Abu Dhabi) ──
  'yas-marina': [
    {
      number: 5,
      name: 'Turn 5 Hairpin',
      t: 0.28,
      speedKmh: 75,
      gear: 2,
      brakingG: 5.2,
      lateralG: 2.2,
      brakingDistanceM: 120,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Reconfigured open hairpin at the start of the back straight. Prime DRS setup area.',
      famousOvertake: 'Verstappen passing Hamilton on the final lap for 2021 championship'
    },
    {
      number: 6,
      name: 'Turn 6 Chicane',
      t: 0.52,
      speedKmh: 110,
      gear: 3,
      brakingG: 5.4,
      lateralG: 2.7,
      brakingDistanceM: 130,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Deceleration from 330 km/h after the second long straight. Excellent switchback potential.',
      famousOvertake: 'Perez heroically defending from Hamilton to aid teammate (2021)'
    },
    {
      number: 9,
      name: 'Marsa Banked Turn (Turn 9)',
      t: 0.68,
      speedKmh: 215,
      gear: 5,
      brakingG: 2.8,
      lateralG: 4.1,
      brakingDistanceM: 45,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Slightly banked long sweeper around the hotel basin replacing the old clunky 90-degree corners.',
      famousOvertake: 'Leclerc audacious pass on Russell around the outside (2023)'
    }
  ],

  // ── 25. Madring (Circuito de Madring / Classic Madrid) ──
  'madring': [
    {
      number: 1,
      name: 'Turn 1',
      t: 0.10,
      speedKmh: 110,
      gear: 3,
      brakingG: 4.9,
      lateralG: 2.8,
      brakingDistanceM: 110,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Hard deceleration off the main straight through the urban circuit perimeter.',
      famousOvertake: 'Inaugural race battleground for European Grand Prix honours'
    },
    {
      number: 5,
      name: 'Turn 5',
      t: 0.45,
      speedKmh: 145,
      gear: 4,
      brakingG: 3.5,
      lateralG: 3.2,
      brakingDistanceM: 70,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Medium-speed sweeping corner challenging mechanical grip.',
      famousOvertake: 'Wheel-to-wheel battles across asphalt transitions'
    },
    {
      number: 9,
      name: 'Turn 9',
      t: 0.85,
      speedKmh: 85,
      gear: 2,
      brakingG: 4.5,
      lateralG: 2.3,
      brakingDistanceM: 95,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight left hairpin terminating the back acceleration zone.',
      famousOvertake: 'Late-braking lunge territory into the stadium section'
    }
  ],

  // ── 26. Sepang (Malaysia) ──
  'sepang': [
    {
      number: 1,
      name: 'Turn 1 & 2 Chicane',
      t: 0.10,
      speedKmh: 82,
      gear: 2,
      brakingG: 5.2,
      lateralG: 2.4,
      brakingDistanceM: 125,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight downhill right followed by an off-camber left. Hermann Tilke’s signature double chicane.',
      famousOvertake: 'Multi-21 controversy as Vettel defies team orders on Webber (2013)'
    },
    {
      number: 5,
      name: 'Turn 5 & 6',
      t: 0.42,
      speedKmh: 225,
      gear: 6,
      brakingG: 1.5,
      lateralG: 4.6,
      brakingDistanceM: 25,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'High-speed directional flick testing downforce in sweltering equatorial humidity.',
      famousOvertake: 'Räikkönen maiden career victory drive for McLaren (2003)'
    },
    {
      number: 15,
      name: 'Turn 15 Hairpin',
      t: 0.92,
      speedKmh: 75,
      gear: 2,
      brakingG: 5.4,
      lateralG: 2.2,
      brakingDistanceM: 130,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Wide banked hairpin joining the twin parallel straights. Classic switchback spot.',
      famousOvertake: 'Alonso historic maiden pole and victory battle (2003)'
    }
  ],

  // ── 27. Nürburgring (Germany) ──
  'nurburgring': [
    {
      number: 1,
      name: 'Castrol-S (Turns 1–4)',
      t: 0.12,
      speedKmh: 72,
      gear: 2,
      brakingG: 5.0,
      lateralG: 2.3,
      brakingDistanceM: 115,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Tight arena complex built onto the Grand Prix circuit. Opening lap contact hotspot.',
      famousOvertake: 'Hakkinen and Schumacher tactical duel in the Eifel (1998)'
    },
    {
      number: 7,
      name: 'Michael Schumacher S (Turns 8 & 9)',
      t: 0.52,
      speedKmh: 235,
      gear: 6,
      brakingG: 1.8,
      lateralG: 4.5,
      brakingDistanceM: 30,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Fast downhill chicane named after Michael Schumacher. Extreme commitment over curbs.',
      famousOvertake: 'Hamilton taking 91st victory to equal Schumacher record (2020)'
    },
    {
      number: 10,
      name: 'Veedol Chicane (Turn 13 & 14)',
      t: 0.88,
      speedKmh: 95,
      gear: 2,
      brakingG: 5.2,
      lateralG: 2.6,
      brakingDistanceM: 120,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Hard deceleration before the final turn onto the pit straight. High curbs launch cars.',
      famousOvertake: 'Winkelhock leading Grand Prix for Spyker during flash flood (2007)'
    }
  ],

  // ── 28. Hockenheimring (Germany) ──
  'hockenheimring': [
    {
      number: 1,
      name: 'Nordkurve (Turn 1)',
      t: 0.08,
      speedKmh: 205,
      gear: 5,
      brakingG: 3.5,
      lateralG: 3.8,
      brakingDistanceM: 65,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Fast right-hander kicking off the lap. Outside gravel trap was replaced with asphalt.',
      famousOvertake: 'Hamilton surging past Raikkonen on the outside (2008)'
    },
    {
      number: 6,
      name: 'Spitzkehre Hairpin (Turn 6)',
      t: 0.48,
      speedKmh: 65,
      gear: 1,
      brakingG: 5.8,
      lateralG: 2.1,
      brakingDistanceM: 145,
      isOvertakingZone: true,
      isHighDownforce: false,
      notes: 'Deceleration from 335 km/h along the parabolic curve into a 65 km/h hairpin.',
      famousOvertake: 'Alonso "Fernando is faster than you" team order pass on Massa (2010)'
    },
    {
      number: 12,
      name: 'Motodrom Entry (Turn 12)',
      t: 0.82,
      speedKmh: 175,
      gear: 4,
      brakingG: 3.8,
      lateralG: 3.5,
      brakingDistanceM: 70,
      isOvertakingZone: false,
      isHighDownforce: true,
      notes: 'Blind right-hand crest entering the massive Motodrom stadium grandstands.',
      famousOvertake: 'Vettel crashing out of the race lead in tragic rain shower (2018)'
    }
  ]
});

/**
 * Returns curated signature corners for a circuit, or empty array if not present in the registry.
 */
export function getCuratedCorners(circuitId: string): CircuitCorner[] {
  return CIRCUIT_CORNERS_REGISTRY[circuitId] || [];
}

/**
 * For uncurated historic circuits (e.g., 1950s tracks lacking modern corner telemetry),
 * mathematically auto-detects peak curvature apex points along the loop.
 * NEVER fabricates speed, gear, or G-force numbers.
 */
export function buildFallbackApexMarkers(
  coordinates: [number, number, number][]
): FallbackCornerMarker[] {
  const n = coordinates.length;
  if (n < 6) return [];

  // Compute 2D turning angles
  const curvatures: Array<{ index: number; curvature: number }> = [];

  for (let i = 0; i < n; i++) {
    const prev = coordinates[(i - 1 + n) % n]!;
    const curr = coordinates[i]!;
    const next = coordinates[(i + 1) % n]!;

    const v1x = curr[0] - prev[0];
    const v1z = curr[2] - prev[2];
    const v2x = next[0] - curr[0];
    const v2z = next[2] - curr[2];

    const len1 = Math.hypot(v1x, v1z);
    const len2 = Math.hypot(v2x, v2z);

    if (len1 > 1e-4 && len2 > 1e-4) {
      const dot = Math.min(1, Math.max(-1, (v1x * v2x + v1z * v2z) / (len1 * len2)));
      const angle = Math.acos(dot);
      if (angle > 0.08) {
        curvatures.push({ index: i, curvature: angle });
      }
    }
  }

  // Sort by curvature descending, pick up to 8 distinct apex points
  curvatures.sort((a, b) => b.curvature - a.curvature);

  const selectedIndices: number[] = [];
  const minSeparation = Math.max(3, Math.floor(n / 12));

  for (const c of curvatures) {
    const tooClose = selectedIndices.some(
      (idx) => Math.min(Math.abs(c.index - idx), n - Math.abs(c.index - idx)) < minSeparation
    );
    if (!tooClose) {
      selectedIndices.push(c.index);
      if (selectedIndices.length >= 8) break;
    }
  }

  // Sort chronologically along lap
  selectedIndices.sort((a, b) => a - b);

  return selectedIndices.map((idx, turnNum) => ({
    number: turnNum + 1,
    name: `Geometric Apex T${turnNum + 1}`,
    t: Number((idx / n).toFixed(3)),
    isAutoDetected: true,
    speedKmh: undefined,
    gear: undefined,
    brakingG: null,
    lateralG: null,
    brakingDistanceM: null,
    isOvertakingZone: turnNum % 2 === 0,
    isHighDownforce: turnNum % 2 === 1,
    notes: 'Auto-detected geometric apex — historical corner telemetry unavailable.'
  }));
}
