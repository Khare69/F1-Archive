import type { Team, Driver, Season, Circuit } from '../types/f1';

export const TEAMS: Team[] = [
  {
    id: 'redbull',
    name: 'Red Bull Racing',
    carName: 'RB20',
    color: '#0600EF',
    base: 'Milton Keynes, UK',
    principal: 'Christian Horner',
    championships: 6,
    firstEntry: 2005,
    polePositions: 98,
    fastestLaps: 95,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/red-bull-racing-logo.png',
    description: 'Red Bull Racing, officially Oracle Red Bull Racing, is a Formula One racing team, racing under an Austrian license and based in the United Kingdom. Formed after the purchase of the Jaguar Racing team, they have become one of the most dominant forces in modern F1.',
    specs: {
      powerUnit: 'Honda RBPT V6 Turbo Hybrid',
      chassis: 'Carbon-fibre composite monocoque',
      weight: '798 kg',
      downforce: 'High',
      topSpeed: '352 km/h'
    }
  },
  {
    id: 'ferrari',
    name: 'Scuderia Ferrari',
    carName: 'SF-24',
    color: '#FF2800',
    base: 'Maranello, Italy',
    principal: 'Frederic Vasseur',
    championships: 16,
    firstEntry: 1950,
    polePositions: 249,
    fastestLaps: 260,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/ferrari-logo.png',
    description: 'Scuderia Ferrari is the racing division of luxury auto manufacturer Ferrari and the racing team that competes in Formula One. It is the oldest surviving and most successful Formula One team, having competed in every world championship since the 1950 Formula One season.',
    specs: {
      powerUnit: 'Ferrari 066/12 V6 Turbo Hybrid',
      chassis: 'Honeycomb carbon fibre',
      weight: '798 kg',
      downforce: 'High',
      topSpeed: '350 km/h'
    }
  },
  {
    id: 'mercedes',
    name: 'Mercedes-AMG PETRONAS',
    carName: 'W15',
    color: '#00A19B',
    base: 'Brackley, UK',
    principal: 'Toto Wolff',
    championships: 8,
    firstEntry: 1954,
    polePositions: 137,
    fastestLaps: 106,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/mercedes-logo.png',
    description: "The Mercedes-Benz Formula One team, operated by Mercedes-Benz Grand Prix Limited, is a highly successful British-based German team. They achieved unprecedented success in the turbo-hybrid era, securing eight consecutive Constructors' Championships from 2014 to 2021.",
    specs: {
      powerUnit: 'Mercedes-AMG F1 M15',
      chassis: 'Moulded carbon fibre',
      weight: '798 kg',
      downforce: 'Medium-High',
      topSpeed: '348 km/h'
    }
  },
  {
    id: 'mclaren',
    name: 'McLaren F1 Team',
    carName: 'MCL38',
    color: '#FF8000',
    base: 'Woking, UK',
    principal: 'Andrea Stella',
    championships: 8,
    firstEntry: 1966,
    polePositions: 156,
    fastestLaps: 165,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/mclaren-logo.png',
    description: 'McLaren Racing Limited is a British motor racing team based at the McLaren Technology Centre in Woking. Founded by Bruce McLaren in 1963, it is the second oldest active team and one of the most successful in F1 history.',
    specs: {
      powerUnit: 'Mercedes-AMG F1 M15',
      chassis: 'Carbon fibre composite',
      weight: '798 kg',
      downforce: 'High',
      topSpeed: '351 km/h'
    }
  },
  {
    id: 'aston',
    name: 'Aston Martin Aramco',
    carName: 'AMR24',
    color: '#00665E',
    base: 'Silverstone, UK',
    principal: 'Mike Krack',
    championships: 0,
    firstEntry: 1959,
    polePositions: 0,
    fastestLaps: 1,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/aston-martin-logo.png',
    description: 'Aston Martin Aramco Formula One Team is a British motor racing team. The Aston Martin brand returned to F1 in 2021 after a rebrand of the Racing Point team, heavily investing in their new Silverstone headquarters and technical campus.',
    specs: {
      powerUnit: 'Mercedes-AMG F1 M15',
      chassis: 'Carbon fibre monocoque',
      weight: '798 kg',
      downforce: 'Medium',
      topSpeed: '349 km/h'
    }
  },
  {
    id: 'alpine',
    name: 'BWT Alpine F1 Team',
    carName: 'A524',
    color: '#FF87BC',
    base: 'Enstone, UK',
    principal: 'Bruno Famin',
    championships: 2,
    firstEntry: 1986,
    polePositions: 20,
    fastestLaps: 15,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/alpine-logo.png',
    description: 'Alpine F1 Team is the Formula One entry for the French sports car brand Alpine, owned by Renault. The team serves to promote the Alpine brand, racing out of the historic Enstone facility which has hosted championship-winning teams like Benetton and Renault.',
    specs: {
      powerUnit: 'Renault E-Tech RE24',
      chassis: 'Carbon fibre monocoque',
      weight: '798 kg',
      downforce: 'Medium',
      topSpeed: '346 km/h'
    }
  },
  {
    id: 'williams',
    name: 'Williams Racing',
    carName: 'FW46',
    color: '#005AFF',
    base: 'Grove, UK',
    principal: 'James Vowles',
    championships: 9,
    firstEntry: 1977,
    polePositions: 128,
    fastestLaps: 133,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/williams-logo.png',
    description: "Williams Grand Prix Engineering Limited is a British Formula One motor racing team and constructor. Founded by Sir Frank Williams and Sir Patrick Head in 1977, it dominated the 1980s and 90s, winning 9 Constructors' titles.",
    specs: {
      powerUnit: 'Mercedes-AMG F1 M15',
      chassis: 'Carbon fibre composite',
      weight: '798 kg',
      downforce: 'Low',
      topSpeed: '353 km/h'
    }
  },
  {
    id: 'rb',
    name: 'Visa Cash App RB',
    carName: 'VCARB 01',
    color: '#1534CC',
    base: 'Faenza, Italy',
    principal: 'Laurent Mekies',
    championships: 0,
    firstEntry: 2006,
    polePositions: 1,
    fastestLaps: 3,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/rb-logo.png',
    description: 'Visa Cash App RB Formula One Team (often abbreviated as VCARB) is an Italian racing team. Originally formed as Scuderia Toro Rosso after Red Bull purchased Minardi, it serves as the sister team to Red Bull Racing.',
    specs: {
      powerUnit: 'Honda RBPT V6 Turbo Hybrid',
      chassis: 'Carbon fibre monocoque',
      weight: '798 kg',
      downforce: 'Medium',
      topSpeed: '347 km/h'
    }
  },
  {
    id: 'sauber',
    name: 'Stake F1 Team Kick Sauber',
    carName: 'C44',
    color: '#00E701',
    base: 'Hinwil, Switzerland',
    principal: 'Alessandro Alunni Bravi',
    championships: 0,
    firstEntry: 1993,
    polePositions: 1,
    fastestLaps: 7,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/kick-sauber-logo.png',
    description: 'Sauber Motorsport AG is a Swiss motorsport engineering company. Operating under the Stake F1 Team Kick Sauber branding for 2024, the team is in a transition period ahead of becoming the official Audi factory team in 2026.',
    specs: {
      powerUnit: 'Ferrari 066/12 V6 Turbo Hybrid',
      chassis: 'Carbon fibre monocoque',
      weight: '798 kg',
      downforce: 'Medium-Low',
      topSpeed: '348 km/h'
    }
  },
  {
    id: 'haas',
    name: 'MoneyGram Haas F1 Team',
    carName: 'VF-24',
    color: '#E6002B',
    base: 'Kannapolis, USA',
    principal: 'Ayao Komatsu',
    championships: 0,
    firstEntry: 2016,
    polePositions: 1,
    fastestLaps: 2,
    logoUrl: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/teams/2024/haas-logo.png',
    description: 'Haas Formula LLC is an American Formula One racing team established by NASCAR Cup Series co-owner Gene Haas. Entering the sport in 2016, they are known for their unique technical partnership with Ferrari.',
    specs: {
      powerUnit: 'Ferrari 066/12 V6 Turbo Hybrid',
      chassis: 'Carbon fibre monocoque',
      weight: '798 kg',
      downforce: 'Medium',
      topSpeed: '349 km/h'
    }
  },
  {
    id: 'lotus',
    name: 'Team Lotus',
    carName: 'Lotus 72',
    color: '#FFB800',
    base: 'Hethel, UK',
    principal: 'Colin Chapman',
    championships: 7,
    firstEntry: 1958,
    polePositions: 107,
    fastestLaps: 71,
    isLegendary: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Team_Lotus_logo.svg/500px-Team_Lotus_logo.svg.png',
    description: "Team Lotus was the motorsport sister company of English sports car manufacturer Lotus Cars. The team ran cars in many motorsport categories, including Formula One, where they won seven Formula One Constructors' titles and six Drivers' Championships.",
    specs: {
      powerUnit: 'Ford Cosworth DFV 3.0 V8',
      chassis: 'Aluminium monocoque',
      weight: '540 kg',
      downforce: 'Medium',
      topSpeed: '300 km/h'
    }
  },
  {
    id: 'benetton',
    name: 'Benetton Formula',
    carName: 'B195',
    color: '#0088CE',
    base: 'Enstone, UK',
    principal: 'Flavio Briatore',
    championships: 1,
    firstEntry: 1986,
    polePositions: 15,
    fastestLaps: 36,
    isLegendary: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Benetton_Formula_logo.svg/500px-Benetton_Formula_logo.svg.png',
    description: 'Benetton Formula Ltd., commonly referred to simply as Benetton, was a Formula One constructor that participated from 1986 to 2001. The team was owned by the Benetton family who run a worldwide chain of clothing stores of the same name.',
    specs: {
      powerUnit: 'Renault RS7 3.0 V10',
      chassis: 'Carbon-fibre monocoque',
      weight: '595 kg',
      downforce: 'High',
      topSpeed: '320 km/h'
    }
  },
  {
    id: 'brawn',
    name: 'Brawn GP',
    carName: 'BGP 001',
    color: '#BDFE00',
    base: 'Brackley, UK',
    principal: 'Ross Brawn',
    championships: 1,
    firstEntry: 2009,
    polePositions: 5,
    fastestLaps: 4,
    isLegendary: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Brawn_GP_logo.svg/500px-Brawn_GP_logo.svg.png',
    description: "Brawn GP Formula One Team, the trading name of Brawn Racing, was a Formula One constructor created by a management buyout of Honda Racing F1 Team. They competed in only the 2009 season, winning both the Drivers' and Constructors' Championships.",
    specs: {
      powerUnit: 'Mercedes-Benz FO 108W 2.4 V8',
      chassis: 'Carbon-fibre and honeycomb composite',
      weight: '605 kg',
      downforce: 'High (Double Diffuser)',
      topSpeed: '325 km/h'
    }
  }
];

export const DRIVERS: Driver[] = [
  {
    id: 'VER',
    name: 'Max Verstappen',
    number: 1,
    teamId: 'redbull',
    wins: 61,
    podiums: 108,
    championships: 4,
    country: 'Netherlands',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 1 },
      { race: 'Saudi Arabia', position: 1 },
      { race: 'Australia', position: 'DNF' },
      { race: 'Japan', position: 1 },
      { race: 'China', position: 1 },
      { race: 'Miami', position: 2 },
      { race: 'Emilia Romagna', position: 1 }
    ]
  },
  {
    id: 'PER',
    name: 'Sergio Perez',
    number: 11,
    teamId: 'redbull',
    wins: 6,
    podiums: 39,
    championships: 0,
    country: 'Mexico',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 2 },
      { race: 'Saudi Arabia', position: 2 },
      { race: 'Australia', position: 5 },
      { race: 'Japan', position: 2 },
      { race: 'China', position: 3 },
      { race: 'Miami', position: 4 },
      { race: 'Emilia Romagna', position: 8 }
    ]
  },
  {
    id: 'HAM',
    name: 'Lewis Hamilton',
    number: 44,
    teamId: 'mercedes',
    wins: 105,
    podiums: 201,
    championships: 7,
    country: 'United Kingdom',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 7 },
      { race: 'Saudi Arabia', position: 9 },
      { race: 'Australia', position: 'DNF' },
      { race: 'Japan', position: 9 },
      { race: 'China', position: 9 },
      { race: 'Miami', position: 6 },
      { race: 'Emilia Romagna', position: 6 }
    ]
  },
  {
    id: 'RUS',
    name: 'George Russell',
    number: 63,
    teamId: 'mercedes',
    wins: 2,
    podiums: 14,
    championships: 0,
    country: 'United Kingdom',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 5 },
      { race: 'Saudi Arabia', position: 6 },
      { race: 'Australia', position: 17 },
      { race: 'Japan', position: 7 },
      { race: 'China', position: 6 },
      { race: 'Miami', position: 8 },
      { race: 'Emilia Romagna', position: 7 }
    ]
  },
  {
    id: 'LEC',
    name: 'Charles Leclerc',
    number: 16,
    teamId: 'ferrari',
    wins: 6,
    podiums: 36,
    championships: 0,
    country: 'Monaco',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 4 },
      { race: 'Saudi Arabia', position: 3 },
      { race: 'Australia', position: 2 },
      { race: 'Japan', position: 4 },
      { race: 'China', position: 4 },
      { race: 'Miami', position: 3 },
      { race: 'Emilia Romagna', position: 3 }
    ]
  },
  {
    id: 'SAI',
    name: 'Carlos Sainz',
    number: 55,
    teamId: 'ferrari',
    wins: 3,
    podiums: 23,
    championships: 0,
    country: 'Spain',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 3 },
      { race: 'Saudi Arabia', position: 'DNS' },
      { race: 'Australia', position: 1 },
      { race: 'Japan', position: 3 },
      { race: 'China', position: 5 },
      { race: 'Miami', position: 5 },
      { race: 'Emilia Romagna', position: 5 }
    ]
  },
  {
    id: 'NOR',
    name: 'Lando Norris',
    number: 4,
    teamId: 'mclaren',
    wins: 3,
    podiums: 26,
    championships: 1,
    country: 'United Kingdom',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 6 },
      { race: 'Saudi Arabia', position: 8 },
      { race: 'Australia', position: 3 },
      { race: 'Japan', position: 5 },
      { race: 'China', position: 2 },
      { race: 'Miami', position: 1 },
      { race: 'Emilia Romagna', position: 2 }
    ]
  },
  {
    id: 'PIA',
    name: 'Oscar Piastri',
    number: 81,
    teamId: 'mclaren',
    wins: 2,
    podiums: 9,
    championships: 0,
    country: 'Australia',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 8 },
      { race: 'Saudi Arabia', position: 4 },
      { race: 'Australia', position: 4 },
      { race: 'Japan', position: 8 },
      { race: 'China', position: 8 },
      { race: 'Miami', position: 13 },
      { race: 'Emilia Romagna', position: 4 }
    ]
  },
  {
    id: 'ALO',
    name: 'Fernando Alonso',
    number: 14,
    teamId: 'aston',
    wins: 32,
    podiums: 106,
    championships: 2,
    country: 'Spain',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 9 },
      { race: 'Saudi Arabia', position: 5 },
      { race: 'Australia', position: 8 },
      { race: 'Japan', position: 6 },
      { race: 'China', position: 7 },
      { race: 'Miami', position: 9 },
      { race: 'Emilia Romagna', position: 19 }
    ]
  },
  {
    id: 'STR',
    name: 'Lance Stroll',
    number: 18,
    teamId: 'aston',
    wins: 0,
    podiums: 3,
    championships: 0,
    country: 'Canada',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 10 },
      { race: 'Saudi Arabia', position: 'DNF' },
      { race: 'Australia', position: 6 },
      { race: 'Japan', position: 12 },
      { race: 'China', position: 15 },
      { race: 'Miami', position: 17 },
      { race: 'Emilia Romagna', position: 9 }
    ]
  },
  {
    id: 'ALB',
    name: 'Alexander Albon',
    number: 23,
    teamId: 'williams',
    wins: 0,
    podiums: 2,
    championships: 0,
    country: 'Thailand',
    imageUrl: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png',
    raceFinishes: [
      { race: 'Bahrain', position: 15 },
      { race: 'Saudi Arabia', position: 11 },
      { race: 'Australia', position: 11 },
      { race: 'Japan', position: 'DNF' },
      { race: 'China', position: 12 },
      { race: 'Miami', position: 18 },
      { race: 'Emilia Romagna', position: 'DNF' }
    ]
  },
  {
    id: 'MSC',
    name: 'Michael Schumacher',
    number: 1,
    teamId: 'ferrari',
    wins: 91,
    podiums: 155,
    championships: 7,
    country: 'Germany',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Michael_Schumacher%2C_September_2005.jpg/500px-Michael_Schumacher%2C_September_2005.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 91 },
      { race: 'Pole Positions', position: 68 },
      { race: 'Fastest Laps', position: 77 }
    ]
  },
  {
    id: 'SEN',
    name: 'Ayrton Senna',
    number: 1,
    teamId: 'mclaren',
    wins: 41,
    podiums: 80,
    championships: 3,
    country: 'Brazil',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Ayrton_Senna_9_-_Cropped.jpg/500px-Ayrton_Senna_9_-_Cropped.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 41 },
      { race: 'Pole Positions', position: 65 },
      { race: 'Fastest Laps', position: 19 }
    ]
  },
  {
    id: 'PRO',
    name: 'Alain Prost',
    number: 2,
    teamId: 'mclaren',
    wins: 51,
    podiums: 106,
    championships: 4,
    country: 'France',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Festival_automobile_international_2015_-_Photocall_-_065_%28cropped%29.jpg/500px-Festival_automobile_international_2015_-_Photocall_-_065_%28cropped%29.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 51 },
      { race: 'Pole Positions', position: 33 },
      { race: 'Fastest Laps', position: 41 }
    ]
  },
  {
    id: 'LAU',
    name: 'Niki Lauda',
    number: 12,
    teamId: 'ferrari',
    wins: 25,
    podiums: 54,
    championships: 3,
    country: 'Austria',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Lauda_at_1982_Dutch_Grand_Prix.jpg/500px-Lauda_at_1982_Dutch_Grand_Prix.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 25 },
      { race: 'Pole Positions', position: 24 },
      { race: 'Fastest Laps', position: 24 }
    ]
  },
  {
    id: 'VET',
    name: 'Sebastian Vettel',
    number: 5,
    teamId: 'redbull',
    wins: 53,
    podiums: 122,
    championships: 4,
    country: 'Germany',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Sebastian_Vettel_2011_Sebastian_Vettel_in_Yokohama.jpg/500px-Sebastian_Vettel_2011_Sebastian_Vettel_in_Yokohama.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 53 },
      { race: 'Pole Positions', position: 57 },
      { race: 'Fastest Laps', position: 38 }
    ]
  },
  {
    id: 'BUT',
    name: 'Jenson Button',
    number: 22,
    teamId: 'brawn',
    wins: 15,
    podiums: 50,
    championships: 1,
    country: 'United Kingdom',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Jenson_Button_2016_Malaysia.jpg/500px-Jenson_Button_2016_Malaysia.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 15 },
      { race: 'Pole Positions', position: 8 },
      { race: 'Fastest Laps', position: 8 }
    ]
  },
  {
    id: 'FIT',
    name: 'Emerson Fittipaldi',
    number: 8,
    teamId: 'lotus',
    wins: 14,
    podiums: 35,
    championships: 2,
    country: 'Brazil',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Emerson_Fittipaldi_1974.jpg/500px-Emerson_Fittipaldi_1974.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 14 },
      { race: 'Pole Positions', position: 6 },
      { race: 'Fastest Laps', position: 6 }
    ]
  },
  {
    id: 'FAN',
    name: 'Juan Manuel Fangio',
    number: 1,
    teamId: 'mercedes',
    wins: 24,
    podiums: 35,
    championships: 5,
    country: 'Argentina',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Juan_Manuel_Fangio_%281952%29.jpg/500px-Juan_Manuel_Fangio_%281952%29.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 24 },
      { race: 'Pole Positions', position: 29 },
      { race: 'Fastest Laps', position: 23 }
    ]
  },
  {
    id: 'CLA',
    name: 'Jim Clark',
    number: 1,
    teamId: 'lotus',
    wins: 25,
    podiums: 32,
    championships: 2,
    country: 'United Kingdom',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Jim_Clark_1966.jpg/500px-Jim_Clark_1966.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 25 },
      { race: 'Pole Positions', position: 33 },
      { race: 'Fastest Laps', position: 28 }
    ]
  },
  {
    id: 'HAK',
    name: 'Mika Häkkinen',
    number: 1,
    teamId: 'mclaren',
    wins: 20,
    podiums: 51,
    championships: 2,
    country: 'Finland',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mika_Hakkinen_in_Spa_2010_%28cropped%29.jpg/500px-Mika_Hakkinen_in_Spa_2010_%28cropped%29.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 20 },
      { race: 'Pole Positions', position: 26 },
      { race: 'Fastest Laps', position: 25 }
    ]
  },
  {
    id: 'RAI',
    name: 'Kimi Räikkönen',
    number: 7,
    teamId: 'ferrari',
    wins: 21,
    podiums: 103,
    championships: 1,
    country: 'Finland',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Kimi_R%C3%A4ikk%C3%B6nen_2012_Malaysia.jpg/500px-Kimi_R%C3%A4ikk%C3%B6nen_2012_Malaysia.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 21 },
      { race: 'Pole Positions', position: 18 },
      { race: 'Fastest Laps', position: 46 }
    ]
  },
  {
    id: 'MAN',
    name: 'Nigel Mansell',
    number: 5,
    teamId: 'williams',
    wins: 31,
    podiums: 59,
    championships: 1,
    country: 'United Kingdom',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Nigel_Mansell_2015.jpg/500px-Nigel_Mansell_2015.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 31 },
      { race: 'Pole Positions', position: 32 },
      { race: 'Fastest Laps', position: 30 }
    ]
  },
  {
    id: 'PIQ',
    name: 'Nelson Piquet',
    number: 1,
    teamId: 'williams',
    wins: 23,
    podiums: 60,
    championships: 3,
    country: 'Brazil',
    isLegend: true,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Nelson_Piquet_1983_Silverstone.jpg/500px-Nelson_Piquet_1983_Silverstone.jpg',
    raceFinishes: [
      { race: 'Career Wins', position: 23 },
      { race: 'Pole Positions', position: 24 },
      { race: 'Fastest Laps', position: 23 }
    ]
  }
];

export const SEASONS: Season[] = [
  {
    year: 2026,
    races: 24,
    championDriver: 'Charles Leclerc',
    championTeam: 'Scuderia Ferrari',
    championDriverId: 'LEC',
    championTeamId: 'ferrari',
    notableEvents: [
      'Dawn of the 2026 Power Unit & Active Aerodynamics regulation revolution',
      'Charles Leclerc and Lewis Hamilton lead Ferrari to double championship victory',
      '100% sustainable fuels and 50/50 electrical power split introduced'
    ],
    recordsBroken: [
      'Charles Leclerc secures his maiden FIA Formula One World Drivers Championship',
      'Ferrari wins their first Constructors Championship since 2008'
    ]
  },
  {
    year: 2025,
    races: 24,
    championDriver: 'Max Verstappen',
    championTeam: 'McLaren F1 Team',
    championDriverId: 'VER',
    championTeamId: 'mclaren',
    notableEvents: [
      'Historic 4-way team title fight between McLaren, Red Bull, Ferrari, and Mercedes',
      'McLaren secures their first World Constructors\' Championship in 27 years',
      'Lewis Hamilton announces sensational career move to Scuderia Ferrari'
    ],
    recordsBroken: [
      'McLaren wins first Constructors Championship since 1998',
      'Highest number of unique Grand Prix winners in the modern hybrid era'
    ]
  },
  {
    year: 2024,
    races: 24,
    championDriver: 'Max Verstappen',
    championTeam: 'Red Bull Racing',
    championDriverId: 'VER',
    championTeamId: 'redbull',
    notableEvents: [
      'Max Verstappen secures his 4th consecutive Drivers\' World Championship',
      'Seven different Grand Prix winners across four different teams'
    ],
    recordsBroken: [
      'Max Verstappen equals Alain Prost and Sebastian Vettel with 4 World Championships',
      'Longest Formula 1 season in history with 24 Grand Prix rounds'
    ]
  },
  {
    year: 2023,
    races: 22,
    championDriver: 'Max Verstappen',
    championTeam: 'Red Bull Racing',
    championDriverId: 'VER',
    championTeamId: 'redbull',
    notableEvents: [
      'Most dominant single-season campaign in Formula 1 history',
      'Red Bull RB19 wins 21 out of 22 Grand Prix races'
    ],
    recordsBroken: [
      'Max Verstappen sets record for most wins in a season (19)',
      'Verstappen sets record for most consecutive race wins (10)',
      'Verstappen achieves highest win percentage in F1 history (86.4%)'
    ]
  },
  {
    year: 2022,
    races: 22,
    championDriver: 'Max Verstappen',
    championTeam: 'Red Bull Racing',
    championDriverId: 'VER',
    championTeamId: 'redbull',
    notableEvents: [
      'Revolutionary ground-effect aerodynamic technical regulation reset',
      'Red Bull ends Mercedes\' eight-year Constructors Championship streak'
    ],
    recordsBroken: [
      'Max Verstappen sets new record of 15 race victories in a single season',
      'Verstappen breaks record for most points scored in a season (454)'
    ]
  },
  {
    year: 2021,
    races: 22,
    championDriver: 'Max Verstappen',
    championTeam: 'Mercedes',
    championDriverId: 'VER',
    championTeamId: 'mercedes',
    notableEvents: [
      'Epic season-long championship duel decided on the final lap in Abu Dhabi',
      'First championship victory for Max Verstappen and Honda engine since 1991'
    ],
    recordsBroken: [
      'Lewis Hamilton becomes first driver to reach 100 career race wins',
      'Lewis Hamilton sets record for most pole positions (103)'
    ]
  },
  {
    year: 2020,
    races: 17,
    championDriver: 'Lewis Hamilton',
    championTeam: 'Mercedes',
    championDriverId: 'HAM',
    championTeamId: 'mercedes',
    notableEvents: [
      'Season heavily condensed and rescheduled due to COVID-19 pandemic',
      'Hamilton equals Michael Schumacher\'s benchmark of 7 World Titles'
    ],
    recordsBroken: [
      'Lewis Hamilton equals Michael Schumacher\'s record of 7 World Championships',
      'Hamilton surpasses Schumacher\'s all-time record of 91 career Grand Prix wins',
      'Kimi Raikkonen breaks record for most career race starts'
    ]
  },
  {
    year: 2019,
    races: 21,
    championDriver: 'Lewis Hamilton',
    championTeam: 'Mercedes',
    championDriverId: 'HAM',
    championTeamId: 'mercedes',
    notableEvents: [
      'Mercedes opens season with historic five consecutive 1-2 finishes',
      'Hamilton clinches his 6th World Drivers\' Championship in Austin'
    ],
    recordsBroken: [
      'Mercedes breaks record with 6 consecutive Drivers\' and Constructors\' World Title doubles',
      'Lewis Hamilton breaks record for most career points in Formula 1'
    ]
  },
  {
    year: 2018,
    races: 21,
    championDriver: 'Lewis Hamilton',
    championTeam: 'Mercedes',
    championDriverId: 'HAM',
    championTeamId: 'mercedes',
    notableEvents: [
      'High-stakes "Fight for Five" between four-time champions Hamilton and Vettel',
      'Hamilton stages sensational wet-weather masterclass from 14th on the grid in Germany'
    ],
    recordsBroken: [
      'Lewis Hamilton becomes third driver in history to win 5 World Championships (joining Fangio & Schumacher)',
      'Introduction of the Titanium Halo cockpit safety structure across all cars'
    ]
  },
  {
    year: 2017,
    races: 20,
    championDriver: 'Lewis Hamilton',
    championTeam: 'Mercedes',
    championDriverId: 'HAM',
    championTeamId: 'mercedes',
    notableEvents: [
      'Introduction of wider cars, wider Pirelli tyres, and aggressive downforce regulations',
      'Fierce championship clash between Mercedes and Ferrari across Europe and Asia'
    ],
    recordsBroken: [
      'Lewis Hamilton surpasses Ayrton Senna (65) and Michael Schumacher (68) for all-time pole positions',
      'Lap records shattered worldwide under high-downforce regulations'
    ]
  },
  {
    year: 2016,
    races: 21,
    championDriver: 'Nico Rosberg',
    championTeam: 'Mercedes',
    championTeamId: 'mercedes',
    notableEvents: [
      'Rosberg beats Hamilton to title then immediately retires from F1',
      'Explosive teammate rivalry and wheel-to-wheel drama throughout the season',
      'Hamilton suffers crucial engine failures in Malaysia'
    ],
    recordsBroken: [
      'Rosberg becomes second son of a World Champion to win the title (after Damon Hill)',
      'Nico Rosberg retires 5 days after securing his maiden World Championship'
    ]
  },
  {
    year: 2015,
    races: 19,
    championDriver: 'Lewis Hamilton',
    championTeam: 'Mercedes',
    championDriverId: 'HAM',
    championTeamId: 'mercedes',
    notableEvents: [
      'Hamilton claims his third World Drivers\' Championship in dramatic wet US GP in Austin',
      'Sebastian Vettel makes Ferrari debut, securing three emotional race victories'
    ],
    recordsBroken: [
      'Lewis Hamilton equals childhood hero Ayrton Senna with 3 World Championships',
      'Mercedes records 16 race wins in a 19-race season'
    ]
  },
  {
    year: 2014,
    races: 19,
    championDriver: 'Lewis Hamilton',
    championTeam: 'Mercedes',
    championDriverId: 'HAM',
    championTeamId: 'mercedes',
    notableEvents: [
      'Dawn of the 1.6L V6 Turbo-Hybrid power unit era',
      'Mercedes Silver Arrows begin historic era of dominance, winning 16 of 19 races',
      'Epic "Duel in the Desert" between Hamilton and Rosberg in Bahrain'
    ],
    recordsBroken: [
      'Mercedes secures their maiden FIA Formula One World Constructors\' Championship',
      'Lewis Hamilton secures his second World Championship title (first since 2008)'
    ]
  },
  {
    year: 2013,
    races: 19,
    championDriver: 'Sebastian Vettel',
    championTeam: 'Red Bull Racing',
    championDriverId: 'VET',
    championTeamId: 'redbull',
    notableEvents: [
      'Vettel wins 9 consecutive races to close out the V8 naturally-aspirated era',
      'Red Bull secures their 4th consecutive double championship'
    ],
    recordsBroken: [
      'Sebastian Vettel equals Alberto Ascari\'s record of 9 consecutive race wins',
      'Vettel equals Schumacher\'s record of 13 wins in a single season',
      'Vettel becomes youngest four-time World Champion in history'
    ]
  },
  {
    year: 2012,
    races: 20,
    championDriver: 'Sebastian Vettel',
    championTeam: 'Red Bull Racing',
    championDriverId: 'VET',
    championTeamId: 'redbull',
    notableEvents: [
      'Unprecedented 7 different race winners in the first 7 Grand Prix of the season',
      'Breathtaking wet-weather title finale at Interlagos where Vettel spins on Lap 1 and recovers to win title by 3 points'
    ],
    recordsBroken: [
      'Sebastian Vettel becomes youngest triple World Champion in history at 25 years old',
      'Seven different winners in first seven races sets all-time F1 parity record'
    ]
  },
  {
    year: 2011,
    races: 19,
    championDriver: 'Sebastian Vettel',
    championTeam: 'Red Bull Racing',
    championDriverId: 'VET',
    championTeamId: 'redbull',
    notableEvents: [
      'Inaugural Indian Grand Prix at the Buddh International Circuit won dominantly by Vettel',
      'Introduction of DRS (Drag Reduction System) and Pirelli tyres revolutionizing overtaking'
    ],
    recordsBroken: [
      'Sebastian Vettel breaks Nigel Mansell\'s record with 15 pole positions in a single season',
      'Vettel becomes the youngest back-to-back double World Champion'
    ]
  },
  {
    year: 2010,
    races: 19,
    championDriver: 'Sebastian Vettel',
    championTeam: 'Red Bull Racing',
    championDriverId: 'VET',
    championTeamId: 'redbull',
    notableEvents: [
      'Four drivers fight for title at final race in Abu Dhabi',
      'Vettel wins championship from 3rd in the standings without leading the championship all year',
      'Red Bull secures their first ever Constructors\' Championship'
    ],
    recordsBroken: [
      'Sebastian Vettel becomes youngest World Champion in history at 23 years, 134 days',
      'First four-way championship showdown in Formula 1 history'
    ]
  },
  {
    year: 2009,
    races: 17,
    championDriver: 'Jenson Button',
    championTeam: 'Brawn GP',
    championDriverId: 'BUT',
    championTeamId: 'brawn',
    notableEvents: [
      'Brawn GP wins championship in their single season of existence',
      'Introduction of radical aerodynamic rule changes and double diffusers'
    ],
    recordsBroken: [
      'Brawn GP becomes first and only team to win Constructors Championship in debut season',
      'Jenson Button equals record for most wins in the first seven races (6)'
    ]
  },
  {
    year: 2008,
    races: 18,
    championDriver: 'Lewis Hamilton',
    championTeam: 'Scuderia Ferrari',
    championDriverId: 'HAM',
    championTeamId: 'ferrari',
    notableEvents: [
      'Historic first-ever night race in Formula 1 at Singapore',
      'Championship decided on final corner of final lap in Brazil as Hamilton passes Timo Glock'
    ],
    recordsBroken: [
      'Lewis Hamilton becomes youngest World Drivers\' Champion at the time (23 years, 301 days)',
      'Ferrari wins their 16th World Constructors\' Championship title'
    ]
  },
  {
    year: 2007,
    races: 17,
    championDriver: 'Kimi Räikkönen',
    championTeam: 'Scuderia Ferrari',
    championDriverId: 'RAI',
    championTeamId: 'ferrari',
    notableEvents: [
      'Hamilton\'s stunning rookie season, narrowly missing the title by 1 point',
      'Intense Alonso-Hamilton internal tension at McLaren and the Spygate scandal',
      'Räikkönen comes from 17 points behind with two races remaining to take the title'
    ],
    recordsBroken: [
      'Räikkönen wins title by 1 point over both Hamilton and Alonso',
      'Closest 3-way World Drivers\' Championship battle in modern history'
    ]
  },
  {
    year: 2006,
    races: 18,
    championDriver: 'Fernando Alonso',
    championTeam: 'Renault F1 Team',
    championDriverId: 'ALO',
    championTeamId: 'renault',
    notableEvents: [
      'Titanic duel between young champion Alonso and veteran Michael Schumacher',
      'Transition from 3.0L V10 to 2.4L V8 engines across the entire grid',
      'Schumacher announces his first retirement from Formula 1 in Monza'
    ],
    recordsBroken: [
      'Fernando Alonso becomes youngest double World Champion in history (at the time)',
      'Renault wins back-to-back Constructors\' World Championships'
    ]
  },
  {
    year: 2005,
    races: 19,
    championDriver: 'Fernando Alonso',
    championTeam: 'Renault F1 Team',
    championDriverId: 'ALO',
    championTeamId: 'renault',
    notableEvents: [
      'Fernando Alonso ends Ferrari and Schumacher\'s historic five-year championship dominance',
      'Radical single-set tyre regulation for both qualifying and full race distance',
      'Famous 6-car US Grand Prix at Indianapolis after Michelin tyre safety withdrawal'
    ],
    recordsBroken: [
      'Fernando Alonso becomes the youngest World Champion in F1 history (24 years, 58 days)',
      'Renault secures their first Constructors\' Championship as a full works team'
    ]
  },
  {
    year: 2004,
    races: 18,
    championDriver: 'Michael Schumacher',
    championTeam: 'Ferrari',
    championDriverId: 'MSC',
    championTeamId: 'ferrari',
    notableEvents: [
      'Schumacher wins 13 races in a single season with the legendary F2004',
      'Ferrari\'s golden era dominance peaks with 15 wins out of 18 races'
    ],
    recordsBroken: [
      'Michael Schumacher sets new record of 13 wins in a single season',
      'Schumacher becomes the first and only driver to win 7 World Championships',
      'Schumacher sets record for most consecutive podium finishes (19)'
    ]
  },
  {
    year: 2003,
    races: 16,
    championDriver: 'Michael Schumacher',
    championTeam: 'Ferrari',
    championDriverId: 'MSC',
    championTeamId: 'ferrari',
    notableEvents: [
      'Fierce three-way championship fight between Schumacher, Kimi Räikkönen, and Juan Pablo Montoya',
      'Introduction of new single-lap qualifying format and 10-8-6-5-4-3-2-1 points system'
    ],
    recordsBroken: [
      'Michael Schumacher wins record-breaking 6th World Drivers\' Championship, surpassing Juan Manuel Fangio',
      'Fernando Alonso becomes youngest driver to win an F1 Grand Prix in Hungary (22 years, 26 days)'
    ]
  },
  {
    year: 2002,
    races: 17,
    championDriver: 'Michael Schumacher',
    championTeam: 'Ferrari',
    championDriverId: 'MSC',
    championTeamId: 'ferrari',
    notableEvents: [
      'Schumacher and the Ferrari F2002 achieve unprecedented 100% podium finish rate (17 out of 17 races)',
      'Schumacher clinches world title in July at Magny-Cours with 6 races to spare'
    ],
    recordsBroken: [
      'Michael Schumacher equals Juan Manuel Fangio\'s 45-year record of 5 World Championships',
      'Schumacher clinches championship earlier in a season than any driver in history (Round 11 of 17)'
    ]
  },
  {
    year: 2001,
    races: 17,
    championDriver: 'Michael Schumacher',
    championTeam: 'Ferrari',
    championDriverId: 'MSC',
    championTeamId: 'ferrari',
    notableEvents: [
      'Schumacher commands dominant title defense with 9 Grand Prix victories',
      'Debut of future World Champions Fernando Alonso and Kimi Räikkönen, alongside Juan Pablo Montoya'
    ],
    recordsBroken: [
      'Michael Schumacher surpasses Alain Prost\'s record of 51 career Grand Prix wins (finishing season at 53)',
      'Ferrari sets record for largest Constructors\' Championship winning margin (77 points)'
    ]
  },
  {
    year: 2000,
    races: 17,
    championDriver: 'Michael Schumacher',
    championTeam: 'Ferrari',
    championDriverId: 'MSC',
    championTeamId: 'ferrari',
    notableEvents: [
      'Schumacher wins Ferrari\'s first World Drivers\' Championship in 21 years (since Jody Scheckter in 1979)',
      'Iconic season-long duel against McLaren\'s Mika Häkkinen decided in dramatic penultimate race in Suzuka'
    ],
    recordsBroken: [
      'Ferrari ends a 21-year Drivers\' Championship drought',
      'Schumacher secures his 3rd World Championship and begins the legendary 5-peat era'
    ]
  },
  {
    year: 1995,
    races: 17,
    championDriver: 'Michael Schumacher',
    championTeam: 'Benetton Formula',
    championDriverId: 'MSC',
    championTeamId: 'benetton',
    notableEvents: [
      'Schumacher takes his second world title powered by Renault V10',
      'Benetton achieves their first and only Constructors\' Championship'
    ],
    recordsBroken: [
      'Michael Schumacher becomes the youngest double World Champion at the time',
      'Benetton achieves their first ever Constructors Championship'
    ]
  },
  {
    year: 1994,
    races: 16,
    championDriver: 'Michael Schumacher',
    championTeam: 'Benetton Formula',
    championDriverId: 'MSC',
    championTeamId: 'benetton',
    notableEvents: [
      'Tragic deaths of Ayrton Senna and Roland Ratzenberger at Imola',
      'Darkest weekend in F1 history leading to monumental safety revolutions',
      'Controversial title decider between Schumacher and Damon Hill in Adelaide'
    ],
    recordsBroken: [
      'Michael Schumacher secures his maiden World Drivers\' Championship',
      'Catalyzed modern F1 circuit and vehicle safety engineering standards'
    ]
  },
  {
    year: 1991,
    races: 16,
    championDriver: 'Ayrton Senna',
    championTeam: 'McLaren',
    championDriverId: 'SEN',
    championTeamId: 'mclaren',
    notableEvents: [
      'Senna wins his emotional home Grand Prix in Brazil stuck in 6th gear',
      'Senna secures his third and final world championship title'
    ],
    recordsBroken: [
      'Ayrton Senna becomes youngest three-time World Champion at the time',
      'Senna wins the first four races of the season consecutively'
    ]
  },
  {
    year: 1989,
    races: 16,
    championDriver: 'Alain Prost',
    championTeam: 'McLaren',
    championDriverId: 'PRO',
    championTeamId: 'mclaren',
    notableEvents: [
      'Infamous Senna-Prost collision at the chicane in Suzuka',
      'Prost clinches his third world title amidst intense team rivalry'
    ],
    recordsBroken: [
      'McLaren Honda continues dominant era in turbo transition',
      'Alain Prost sets new record for career points accumulated'
    ]
  },
  {
    year: 1988,
    races: 16,
    championDriver: 'Ayrton Senna',
    championTeam: 'McLaren',
    championDriverId: 'SEN',
    championTeamId: 'mclaren',
    notableEvents: [
      'McLaren MP4/4 wins 15 out of 16 races with Senna and Prost',
      'Legendary battle between Senna and Prost establishing greatest rivalry',
      'Senna wins maiden title in sensational Japanese Grand Prix comeback drive'
    ],
    recordsBroken: [
      'McLaren sets all-time season win percentage record (93.8% — 15 of 16 races)',
      'McLaren claims 10 consecutive 1-2 finishes in a single season'
    ]
  },
  {
    year: 1984,
    races: 16,
    championDriver: 'Niki Lauda',
    championTeam: 'McLaren',
    championDriverId: 'LAU',
    championTeamId: 'mclaren',
    notableEvents: [
      'Lauda wins championship over teammate Prost by the narrowest margin ever',
      'Ayrton Senna announces arrival with incredible Monaco rain drive for Toleman'
    ],
    recordsBroken: [
      'Smallest Championship winning margin in F1 history (0.5 points)',
      'McLaren breaks record for most wins in a single season (12)'
    ]
  },
  {
    year: 1976,
    races: 16,
    championDriver: 'James Hunt',
    championTeam: 'Ferrari',
    championTeamId: 'ferrari',
    notableEvents: [
      'Niki Lauda survives horrific fiery crash at the Nürburgring Nordschleife',
      'Lauda makes miraculous recovery in just 6 weeks to continue title fight',
      'James Hunt wins World Championship by 1 point at rain-soaked Mount Fuji finale'
    ],
    recordsBroken: [
      'One of the most heroic and dramatic comeback stories in all of sports history',
      'Championship decided by a single point in final Grand Prix'
    ]
  },
  {
    year: 1972,
    races: 12,
    championDriver: 'Emerson Fittipaldi',
    championTeam: 'Team Lotus',
    championDriverId: 'FIT',
    championTeamId: 'lotus',
    notableEvents: [
      'Fittipaldi dominates the season driving the revolutionary black & gold Lotus 72',
      'Lotus wins their 5th Constructors\' Championship'
    ],
    recordsBroken: [
      'Emerson Fittipaldi becomes the youngest World Champion in history (25 years, 273 days)'
    ]
  }
];

export const CIRCUITS: Circuit[] = [
  {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'United Kingdom',
    city: 'Northamptonshire',
    lengthKm: '5.891 km',
    turns: 18,
    lapRecord: '1:27.097',
    lapRecordHolder: 'Max Verstappen (2020)',
    firstGP: 1950,
    drsZones: 2,
    elevation: '+11m',
    type: 'Permanent',
    description: 'The home of British motorsport and the venue for the very first Formula 1 World Championship race in 1950. Renowned worldwide for high-speed flowing sequences like Copse, Maggotts, and Becketts which subject drivers to lateral forces exceeding 5G.',
    trackCoordinates: [
      [0, 0, 0], [3, 0.2, -1], [7, 0.4, 0], [10, 0.6, 2], [11, 0.5, 5],
      [8, 0.3, 7], [4, 0.2, 8], [0, 0.1, 7], [-4, 0.3, 6], [-8, 0.5, 4],
      [-11, 0.8, 1], [-12, 0.9, -3], [-9, 0.7, -6], [-5, 0.4, -7], [-2, 0.2, -5],
      [0, 0, 0]
    ]
  },
  {
    id: 'buddh',
    name: 'Buddh International Circuit',
    country: 'India',
    city: 'Greater Noida, Uttar Pradesh',
    lengthKm: '5.125 km',
    turns: 16,
    lapRecord: '1:24.178',
    lapRecordHolder: 'Sebastian Vettel (Red Bull Racing, 2011)',
    firstGP: 2011,
    drsZones: 2,
    elevation: '+14m (Turn 3 crest)',
    type: 'Permanent',
    description: 'Designed by Hermann Tilke, the Buddh International Circuit hosted the Indian Grand Prix from 2011 to 2013, with Sebastian Vettel winning every single edition. Famous for its dramatic 14-meter elevation change climbing into Turn 3 and its wide, parabolic multi-apex stadium corner.',
    trackCoordinates: [
      [0, 0, 0], [4, 1.2, 0], [7, 3.5, 2.5], [6, 3.8, 5.5], [2, 2.5, 7],
      [-4, 0.8, 6.5], [-9, 0, 4.5], [-14, -0.6, 0.5], [-12, 0.2, -4],
      [-6, 0.9, -7.5], [0, 0.3, -8.5], [5, 0.8, -5], [0, 0, 0]
    ]
  },
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    city: 'Monte Carlo',
    lengthKm: '3.337 km',
    turns: 19,
    lapRecord: '1:12.909',
    lapRecordHolder: 'Lewis Hamilton (2021)',
    firstGP: 1950,
    drsZones: 1,
    elevation: '+42m (Casino rise)',
    type: 'Street',
    description: 'The crown jewel of Formula 1. A legendary, ultra-tight street circuit through the glamorous streets and harbor of Monte Carlo. With zero margin for error, unforgiving steel barriers, and minimal overtaking opportunities, qualifying here is the most intense session in motorsport.',
    trackCoordinates: [
      [0, 0, 0], [2, 1.5, 2], [3, 3.8, 5], [1, 4.2, 7], [-2, 3.0, 6],
      [-4, 1.8, 4], [-5, 0.5, 2], [-6, 0, -1], [-4, 0, -4], [-1, 0, -3],
      [1, 0, -2], [0, 0, 0]
    ]
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    city: 'Stavelot',
    lengthKm: '7.004 km',
    turns: 19,
    lapRecord: '1:46.286',
    lapRecordHolder: 'Valtteri Bottas (2018)',
    firstGP: 1950,
    drsZones: 2,
    elevation: '+102m (Eau Rouge hill)',
    type: 'Permanent',
    description: 'A colossal rollercoaster through the Ardennes forest and the longest track on the modern F1 calendar. Famous for the legendary Eau Rouge/Raidillon uphill sweep, Blanchimont flat-out curve, and notorious micro-climate where one sector can be drenched in rain while another remains dry.',
    trackCoordinates: [
      [0, 0, 0], [2, -0.5, -2], [5, 4.5, -4], [9, 8.5, -3], [12, 9.2, 1],
      [10, 8.0, 5], [6, 5.0, 8], [1, 2.5, 9], [-5, 0.5, 7], [-9, -1.0, 4],
      [-12, -2.0, 0], [-8, -1.5, -3], [-3, -0.8, -2], [0, 0, 0]
    ]
  },
  {
    id: 'monza',
    name: 'Autodromo Nazionale Monza',
    country: 'Italy',
    city: 'Monza',
    lengthKm: '5.793 km',
    turns: 11,
    lapRecord: '1:21.046',
    lapRecordHolder: 'Rubens Barrichello (2004)',
    firstGP: 1950,
    drsZones: 2,
    elevation: '+12m',
    type: 'Permanent',
    description: 'The iconic "Temple of Speed". Situated in a historic royal park outside Milan, Monza delivers the highest average speeds and top velocities of the entire season (exceeding 350 km/h). Cars run ultra-low downforce wings to scream past the passionate Italian Tifosi.',
    trackCoordinates: [
      [0, 0, 0], [5, 0.1, 0], [10, 0.2, 1], [12, 0.3, 3], [10, 0.4, 6],
      [4, 0.5, 7], [-2, 0.4, 8], [-8, 0.2, 5], [-12, 0.1, 1], [-10, 0, -3],
      [-5, 0, -2], [0, 0, 0]
    ]
  },
  {
    id: 'suzuka',
    name: 'Suzuka International Racing Course',
    country: 'Japan',
    city: 'Suzuka',
    lengthKm: '5.807 km',
    turns: 18,
    lapRecord: '1:30.983',
    lapRecordHolder: 'Lewis Hamilton (2019)',
    firstGP: 1987,
    drsZones: 1,
    elevation: '+40m',
    type: 'Permanent',
    description: 'A masterclass in racing architecture designed by John Hugenholtz, featuring the only figure-eight crossover layout in F1. Suzuka tests total aerodynamic downforce and driver commitment through the iconic Sector 1 Esses, Degner corners, and the fearsome 130R.',
    trackCoordinates: [
      [0, 0, 0], [3, 0.5, -2], [6, 1.2, -4], [8, 2.0, -2], [6, 2.8, 1],
      [3, 3.2, 4], [0, 2.5, 6], [-4, 3.5, 4], [-6, 2.0, 0], [-8, 1.0, -3],
      [-5, 0.5, -6], [-2, 0.2, -4], [0, 0, 0]
    ]
  },
  {
    id: 'interlagos',
    name: 'Autódromo José Carlos Pace (Interlagos)',
    country: 'Brazil',
    city: 'São Paulo',
    lengthKm: '4.309 km',
    turns: 15,
    lapRecord: '1:10.540',
    lapRecordHolder: 'Valtteri Bottas (2018)',
    firstGP: 1973,
    drsZones: 2,
    elevation: '+35m',
    type: 'Permanent',
    description: 'An amphitheater of motorsport passion situated between two reservoirs in São Paulo. Driven anti-clockwise with high physical neck strain, Interlagos consistently produces chaotic, rain-affected championship thrillers with its natural undulations and Senna S complex.',
    trackCoordinates: [
      [0, 0, 0], [3, -1.0, 2], [6, -2.5, 4], [8, -1.5, 7], [5, 0.5, 8],
      [1, 2.0, 6], [-3, 3.0, 3], [-7, 2.5, 0], [-9, 1.0, -3], [-5, 0.5, -5],
      [-1, 0, -3], [0, 0, 0]
    ]
  },
  {
    id: 'cota',
    name: 'Circuit of The Americas (COTA)',
    country: 'United States',
    city: 'Austin, Texas',
    lengthKm: '5.513 km',
    turns: 20,
    lapRecord: '1:36.169',
    lapRecordHolder: 'Charles Leclerc (2019)',
    firstGP: 2012,
    drsZones: 2,
    elevation: '+41m (Turn 1 hill)',
    type: 'Permanent',
    description: 'The first purpose-built F1 facility in the United States, designed by Hermann Tilke. Features a dramatic 133-foot uphill climb into the blind apex of Turn 1, followed by a sequence of high-speed sweeping corners inspired by Silverstone and Hockenheim.',
    trackCoordinates: [
      [0, 0, 0], [3, 3.8, 1], [6, 4.0, 3], [5, 2.5, 6], [2, 1.2, 7],
      [-2, 0.5, 6], [-6, 0, 4], [-10, 0, 1], [-9, 0.5, -3], [-5, 1.0, -5],
      [-1, 0.5, -3], [0, 0, 0]
    ]
  },
  {
    id: 'jeddah',
    name: 'Jeddah Corniche Circuit',
    country: 'Saudi Arabia',
    city: 'Jeddah',
    lengthKm: '6.174 km',
    turns: 27,
    lapRecord: '1:30.734',
    lapRecordHolder: 'Lewis Hamilton (2021)',
    firstGP: 2021,
    drsZones: 3,
    elevation: '+12m',
    type: 'Street',
    description: 'The fastest street circuit in Formula 1 history, winding along the Red Sea waterfront. Boasting 27 corners, multiple banked sections, and average speeds exceeding 250 km/h between close concrete barriers under state-of-the-art floodlights.',
    trackCoordinates: [
      [0, 0, 0], [2, 0.1, 4], [4, 0.3, 8], [5, 0.2, 12], [3, 0.1, 14],
      [0, 0, 11], [-3, 0.1, 7], [-4, 0.2, 3], [-3, 0.1, -1], [-1, 0, -2],
      [0, 0, 0]
    ]
  },
  {
    id: 'singapore',
    name: 'Marina Bay Street Circuit',
    country: 'Singapore',
    city: 'Marina Bay',
    lengthKm: '4.940 km',
    turns: 19,
    lapRecord: '1:35.867',
    lapRecordHolder: 'Lewis Hamilton (2023)',
    firstGP: 2008,
    drsZones: 3,
    elevation: '+7m',
    type: 'Street',
    description: 'F1\'s original night race set against the spectacular Marina Bay skyline. Highly bumpy, physically grueling with 80%+ tropical humidity, and almost always pushing the full two-hour race time limit.',
    trackCoordinates: [
      [0, 0, 0], [3, 0.1, 1], [6, 0.2, 3], [7, 0.1, 6], [4, 0, 8],
      [1, 0.1, 7], [-2, 0.2, 5], [-5, 0.1, 3], [-7, 0, 0], [-5, 0.1, -3],
      [-2, 0, -2], [0, 0, 0]
    ]
  },
  {
    id: 'hungaroring',
    name: 'Hungaroring',
    country: 'Hungary',
    city: 'Budapest',
    lengthKm: '4.381 km',
    turns: 14,
    lapRecord: '1:16.627',
    lapRecordHolder: 'Lewis Hamilton (2020)',
    firstGP: 1986,
    drsZones: 1,
    elevation: '+36m',
    type: 'Permanent',
    description: 'Often called "Monaco without the barriers". A tight, relentless twist of medium and low-speed corners nestled in a natural valley outside Budapest, where aerodynamic balance, mechanical grip, and strategy take absolute precedence over straight-line speed.',
    trackCoordinates: [
      [0, 0, 0], [3, 0.8, -1], [6, 1.5, 1], [7, 2.2, 4], [4, 2.8, 6],
      [0, 2.0, 7], [-4, 1.2, 5], [-7, 0.6, 2], [-6, 0.2, -2], [-3, 0, -3],
      [0, 0, 0]
    ]
  },
  {
    id: 'redbullring',
    name: 'Red Bull Ring',
    country: 'Austria',
    city: 'Spielberg',
    lengthKm: '4.318 km',
    turns: 10,
    lapRecord: '1:05.619',
    lapRecordHolder: 'Carlos Sainz (2020)',
    firstGP: 1970,
    drsZones: 3,
    elevation: '+65m',
    type: 'Permanent',
    description: 'Set in the majestic Styrian mountains, this compact, high-altitude circuit delivers sub-65-second laps. Three consecutive DRS zones leading into heavy braking zones create non-stop wheel-to-wheel overtakes and fierce racing.',
    trackCoordinates: [
      [0, 0, 0], [4, 2.5, 1], [7, 5.0, 3], [5, 4.2, 6], [1, 2.8, 7],
      [-4, 1.5, 5], [-7, 0.5, 2], [-5, 0.1, -2], [-2, 0, -2], [0, 0, 0]
    ]
  },
  {
    id: 'abudhabi',
    name: 'Yas Marina Circuit',
    country: 'United Arab Emirates',
    city: 'Abu Dhabi',
    lengthKm: '5.281 km',
    turns: 16,
    lapRecord: '1:26.103',
    lapRecordHolder: 'Max Verstappen (2021)',
    firstGP: 2009,
    drsZones: 2,
    elevation: '+5m',
    type: 'Permanent',
    description: 'The opulent twilight season finale venue on Yas Island. Redesigned in 2021 to improve overtaking flow with banked hairpins, broad straights, and the illuminated Yas Hotel straddling the circuit.',
    trackCoordinates: [
      [0, 0, 0], [4, 0.1, -1], [8, 0.2, 1], [9, 0.3, 4], [7, 0.2, 7],
      [3, 0.1, 8], [-1, 0, 7], [-5, 0.1, 4], [-8, 0.2, 1], [-7, 0.1, -2],
      [-3, 0, -2], [0, 0, 0]
    ]
  }
];

