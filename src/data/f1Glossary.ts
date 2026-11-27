import { z } from 'zod';

export const F1GlossaryEntrySchema = z.object({
  key: z.string(),
  term: z.string(),
  shortDef: z.string(),
  detail: z.string(),
  category: z.enum([
    'Strategy',
    'Aerodynamics',
    'Regulations',
    'Power Unit',
    'Race Craft',
    'Tyres',
    'Weekend Format',
  ]),
});

export type F1GlossaryEntry = z.infer<typeof F1GlossaryEntrySchema>;

const RAW_GLOSSARY: F1GlossaryEntry[] = [
  {
    key: 'undercut',
    term: 'Undercut',
    shortDef: 'Pitting earlier than a rival to gain track position on fresher, faster tyres.',
    detail: 'By stopping a lap or two ahead of the car in front, the driver exploits the pace advantage of new rubber to set a blistering out-lap and emerge ahead when the rival eventually pits.',
    category: 'Strategy',
  },
  {
    key: 'overcut',
    term: 'Overcut',
    shortDef: 'Staying out on track longer while a rival pits, capitalising on clear air or tyre temperature.',
    detail: 'Effective when tyre degradation is low or warming up new tyres takes multiple laps. The driver sets rapid laps in clean air before pitting and rejoining ahead.',
    category: 'Strategy',
  },
  {
    key: 'drs',
    term: 'DRS (Drag Reduction System)',
    shortDef: 'A driver-activated rear wing flap that sheds aerodynamic drag to aid overtaking.',
    detail: 'Allowed only in designated DRS zones when a trailing car is within 1.0 second of the leading car at the detection point. Reduces drag by roughly 20–25 km/h.',
    category: 'Aerodynamics',
  },
  {
    key: 'pole-to-win',
    term: 'Pole to Win',
    shortDef: 'Starting from the first grid position (pole) and converting it into a Grand Prix victory.',
    detail: 'One of motorsport’s most definitive indicators of weekend dominance, especially on technical circuits with limited overtaking opportunities like Monaco or the Hungaroring.',
    category: 'Race Craft',
  },
  {
    key: 'ground-effect',
    term: 'Ground Effect',
    shortDef: 'Generating downforce by accelerating airflow under the floor using Venturi tunnels.',
    detail: 'Reintroduced in 2022 to reduce turbulent wake (“dirty air”). The car’s shaped underbody floor creates a low-pressure area that suctions the chassis directly to the tarmac.',
    category: 'Aerodynamics',
  },
  {
    key: 'parc-ferme',
    term: 'Parc Fermé',
    shortDef: 'A strictly monitored impound zone where car setups are frozen between Qualifying and Race.',
    detail: 'French for “closed park”. Teams are forbidden from altering major suspension, aerodynamic, or setup parameters after Qualifying without incurring grid or pit-lane penalties.',
    category: 'Regulations',
  },
  {
    key: 'tyre-deg',
    term: 'Tyre Degradation',
    shortDef: 'Thermal and abrasive loss of tyre grip across consecutive laps in a race stint.',
    detail: 'Unlike tyre wear (physical tread depth loss), degradation is a chemical and thermal performance drop-off where lap times escalate by tenths of a second per lap.',
    category: 'Tyres',
  },
  {
    key: 'venturi-tunnels',
    term: 'Venturi Tunnels',
    shortDef: 'Contoured channels underneath the floor that create ground-effect downforce.',
    detail: 'By narrowing and then expanding the cross-sectional area under the sidepods, airflow speed increases and static pressure drops according to Bernoulli’s principle.',
    category: 'Aerodynamics',
  },
  {
    key: 'active-aero',
    term: 'Active Aerodynamics',
    shortDef: 'Movable aerodynamic surfaces that shift between high-downforce and low-drag modes.',
    detail: 'Mandated for the 2026 regulations to balance straight-line energy efficiency with high-speed cornering stability, featuring adaptive front and rear wing angles.',
    category: 'Aerodynamics',
  },
  {
    key: 'mgu-k',
    term: 'MGU-K (Motor Generator Unit - Kinetic)',
    shortDef: 'Hybrid electric motor that recovers energy under braking and deploys electric horsepower.',
    detail: 'Harnesses kinetic energy during deceleration, converts it into electricity stored in the Energy Store (ES), and delivers up to 350 kW (470 hp in 2026 specs) directly to the drivetrain.',
    category: 'Power Unit',
  },
  {
    key: 'clean-air',
    term: 'Clean Air',
    shortDef: 'Undisturbed, laminar airflow ahead of a car providing maximum cooling and aerodynamic downforce.',
    detail: 'A driver running in clean air preserves tyre life, optimizes radiator cooling, and achieves the intended aerodynamic efficiency calculated in CFD and wind tunnels.',
    category: 'Aerodynamics',
  },
  {
    key: 'dirty-air',
    term: 'Dirty Air',
    shortDef: 'Turbulent, low-pressure wake left behind a racing car that hampers trailing cars.',
    detail: 'Following closely in dirty air strips the trailing car of front-end downforce, causing understeer, sliding, and rapid thermal overheating of tyre surfaces.',
    category: 'Aerodynamics',
  },
  {
    key: 'slipstream',
    term: 'Slipstream',
    shortDef: 'The low-pressure pocket of air directly behind a speeding car that reduces straight-line drag.',
    detail: 'Also known as a tow. Trailing cars experience significantly reduced drag on straights, enabling higher top speeds to pull alongside and execute an overtake into the braking zone.',
    category: 'Race Craft',
  },
  {
    key: 'delta',
    term: 'Delta Time',
    shortDef: 'The positive or negative lap time difference compared to a benchmark lap or reference driver.',
    detail: 'Displayed on driver steering wheels and pit-wall monitors in real-time, showing whether a pilot is up (green/purple) or down (amber/red) relative to delta target pace.',
    category: 'Race Craft',
  },
  {
    key: 'apex',
    term: 'Apex',
    shortDef: 'The innermost geometric point of a corner along the optimal racing line.',
    detail: 'Hitting the geometric or late apex allows drivers to straighten the steering wheel as early as possible on corner exit, maximizing acceleration and traction down the ensuing straight.',
    category: 'Race Craft',
  },
  {
    key: 'chicane',
    term: 'Chicane',
    shortDef: 'A tight, artificial sequence of alternating sharp turns designed to slow cars down.',
    detail: 'Frequently positioned before long straights or pit entries (such as Monza’s Prima Variante) to test kerb-riding compliance, braking stability, and mechanical direction change.',
    category: 'Race Craft',
  },
  {
    key: 'safety-car',
    term: 'Safety Car (SC)',
    shortDef: 'Physical vehicle deployed onto the circuit to bunch up the field and neutralise the race during hazards.',
    detail: 'The field must line up behind the Safety Car at a reduced speed with overtaking strictly prohibited. Pitting under SC conditions saves roughly 10–12 seconds compared to green-flag pit stops.',
    category: 'Regulations',
  },
  {
    key: 'vsc',
    term: 'Virtual Safety Car (VSC)',
    shortDef: 'Electronic speed limit enforced via sector delta times without deploying a physical car.',
    detail: 'Drivers must keep their steering-wheel delta time positive across every mini-marshalling sector. Pitting under VSC yields a ~7–9 second tactical advantage over standard stops.',
    category: 'Regulations',
  },
  {
    key: 'stint',
    term: 'Stint',
    shortDef: 'A continuous section of a race driven on a single set of tyres between pit stops.',
    detail: 'Race strategies are defined by stint length and tyre selection (e.g. Medium-Hard one-stop or Soft-Medium-Hard two-stop), balancing tyre wear against compound degradation.',
    category: 'Strategy',
  },
  {
    key: 'compound',
    term: 'Tyre Compound',
    shortDef: 'The chemical rubber formulation (Hard, Medium, Soft) selected by Pirelli for each Grand Prix.',
    detail: 'Pirelli nominates three slick compounds from C1 (hardest, lowest wear) to C5/C6 (softest, maximum mechanical grip but highest thermal degradation) for each circuit.',
    category: 'Tyres',
  },
  {
    key: 'graining',
    term: 'Graining',
    shortDef: 'Rubber tearing from the tyre surface and sticking back on as abrasive lumps.',
    detail: 'Occurs when tyres slide across cold track surfaces before reaching optimal operating temperature. Temporarily reduces contact area and grip until the tyres "clean up".',
    category: 'Tyres',
  },
  {
    key: 'blistering',
    term: 'Blistering',
    shortDef: 'Internal tyre overheating that causes gas pockets to erupt through the tread rubber.',
    detail: 'Caused by extreme carcass temperature when tyres are pushed too hard in high-load corners. Leaves craters in the rubber tread and severely damages sustained pace.',
    category: 'Tyres',
  },
  {
    key: 'q1-q3',
    term: 'Knockout Qualifying (Q1, Q2, Q3)',
    shortDef: 'The three-session qualifying format eliminating the slowest 5 cars in each round.',
    detail: 'Q1 sets positions 16–20; Q2 eliminates 11–15; Q3 is a final shootout among the top 10 drivers battling for Pole Position.',
    category: 'Weekend Format',
  },
  {
    key: 'constructors-title',
    term: 'World Constructors Championship (WCC)',
    shortDef: 'The title awarded to the team whose two cars accumulate the most championship points.',
    detail: 'First awarded in 1958. Determines the commercial prize-money distribution and aerodynamic wind-tunnel testing time allocation for the subsequent season.',
    category: 'Weekend Format',
  },
  {
    key: 'fastest-lap',
    term: 'Fastest Lap',
    shortDef: 'The single quickest lap recorded during the Grand Prix race session.',
    detail: 'From 2019 to 2024, earned 1 bonus championship point if set by a driver finishing in the top 10. A vital strategic target for late-race pit stops on soft tyres.',
    category: 'Race Craft',
  },
];

// Validate all 25 terms at module load time to guarantee schema compliance
export const F1_GLOSSARY: Record<string, F1GlossaryEntry> = Object.fromEntries(
  RAW_GLOSSARY.map((entry) => {
    const validated = F1GlossaryEntrySchema.parse(entry);
    return [validated.key, validated];
  })
);

export function getGlossaryTerm(key: string): F1GlossaryEntry | undefined {
  return F1_GLOSSARY[key.toLowerCase().trim()];
}
