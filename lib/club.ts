// Facts about the CINTEL Student Association, shared by the public header,
// footer, home and contact pages. Keep copy here factual — no taglines.

export const CLUB = {
  name: 'CINTEL Student Association',
  shortName: 'CINTEL',
  department: 'Department of Computational Intelligence',
  institution: 'SRM Institute of Science and Technology',
  campus: 'Kattankulathur',
  email: 'studentassociation.cintel.ktr@srmist.edu.in',
} as const

export const SOCIALS = [
  { label: 'Instagram', handle: '@cintel_association', href: 'https://www.instagram.com/cintel_association/' },
  { label: 'LinkedIn', handle: 'cintel-association', href: 'https://www.linkedin.com/company/cintel-association' },
  { label: 'GitHub', handle: 'Cintel-Student-Association', href: 'https://github.com/Cintel-Student-Association' },
] as const

// Tech team credited in the "Developed by" section above the footer.
// Photos live in public/team/.
// linkedin: null hides the link until one is added.
// Heads are shown in the first row, members in the row below.
export type TechTeamMember = {
  name: string
  role: 'head' | 'member'
  photo: string
  linkedin: string | null
}

export const TECH_TEAM: TechTeamMember[] = [
  { name: 'Jayashrii SH', role: 'head', photo: '/team/jayashrii.jpg', linkedin: 'https://www.linkedin.com/in/jayashrii' },
  {
    name: 'Prathamesh Nithyanandan',
    role: 'head',
    photo: '/team/prathamesh.jpg',
    linkedin: 'https://www.linkedin.com/in/prathamesh-nithyanandan-156014373/',
  },
  { name: 'Atharv Arya', role: 'member', photo: '/team/atharv.jpg', linkedin: 'https://www.linkedin.com/in/atharv-arya-9990b2375/' },
  { name: 'Asmitha Rajeshraj', role: 'member', photo: '/team/asmitha.jpg', linkedin: 'https://www.linkedin.com/in/asmitha-rajeshraj' },
  { name: 'Aadith Geeth Mohan', role: 'member', photo: '/team/aadith.jpg', linkedin: 'https://www.linkedin.com/in/aadithgeethmohan/' },
]

export type ClubEvent = {
  title: string
  kind: string
  // event_type the home page links to (/events?type=)
  type: string
  text: string
  // From a past edition; null renders a poster tile in the sphere.
  photo: string | null
  alt: string
}

export type ArchivedEvent = ClubEvent & { year: string; facts: string[] }

// Events from the association's Annual Report 2025–26, shown as past events.
export const ARCHIVE_2025_26: ArchivedEvent[] = [
  {
    title: 'DIGITHON 3.0',
    year: '2025–26',
    kind: 'Hackathon',
    type: 'hackathon',
    text: 'The association’s 24-hour flagship hackathon, with tracks in AI, cybersecurity, data science and full-stack.',
    facts: ['24 hours', '200+ participants'],
    photo: '/club/digithon.jpg',
    alt: 'Teams working on laptops during DIGITHON 3.0',
  },
  {
    title: 'CTF 2025',
    year: '2025',
    kind: 'Security',
    type: 'hackathon',
    text: 'Capture the flag across cryptography, web exploitation, forensics, reverse engineering and OSINT.',
    facts: ['12 hours', '120+ participants · 40 teams'],
    photo: '/club/ctf-2025.jpg',
    alt: 'A winning team receiving their prize at CTF 2025, with the leaderboard behind them',
  },
  {
    title: 'IDEATHON 2.0',
    year: '2025–26',
    kind: 'Ideas',
    type: 'hackathon',
    text: 'Teams pitched ideas in AI, sustainability, healthcare and smart systems to faculty and industry judges.',
    facts: ['5-minute pitches', '30+ teams'],
    photo: '/club/ideathon.jpg',
    alt: 'A team working through their idea on laptops at IDEATHON 2.0',
  },
  {
    title: 'PyQuest 2025',
    year: '2025',
    kind: 'Coding',
    type: 'hackathon',
    text: 'A Python contest over three rounds: qualifier, semi-final and a live finale on campus.',
    facts: ['45 teams', 'Top 10 in the finale'],
    photo: '/club/pyquest.jpg',
    alt: 'PyQuest 2025 winners on stage with a faculty member',
  },
  {
    title: 'BugBusters 2025',
    year: '2025',
    kind: 'Debugging',
    type: 'hackathon',
    text: 'Find and fix broken code in Python, C++ and Java against the clock.',
    facts: ['3 rounds', '60+ participants'],
    photo: '/club/bugbusters.jpg',
    alt: 'BugBusters 2025 participants holding their certificates',
  },
  {
    title: 'Sportiva 2026',
    year: '2026',
    kind: 'Sport',
    type: 'fest',
    text: 'The department’s sports fest: athletics, cricket, football, badminton and more.',
    facts: ['300+ athletes', '15+ sports'],
    photo: '/club/sportiva.jpg',
    alt: 'A football match on the ground during Sportiva 2026',
  },
]

// Events held so far in 2026–27.
export const ARCHIVE_2026_27: ArchivedEvent[] = [
  {
    title: 'CTF 2026',
    year: '2026',
    kind: 'Security',
    type: 'hackathon',
    text: 'Capture the flag: teams solve security challenges against the clock.',
    facts: [],
    photo: '/club/ctf-2026.jpg',
    alt: 'A full lecture hall of students on laptops during CTF 2026',
  },
  {
    title: 'Game Jam 2026',
    year: '2026',
    kind: 'Games',
    type: 'fest',
    text: 'Teams build a game in a fixed window, then pitch it to the judges.',
    facts: [],
    photo: '/club/game-jam-2026.jpg',
    alt: 'A team walking a judge through their game at Game Jam 2026',
  },
]

// Past events by academic year, newest first.
export const ARCHIVE_PERIODS: { period: string; events: ArchivedEvent[] }[] = [
  { period: '2026–27', events: ARCHIVE_2026_27 },
  { period: '2025–26', events: ARCHIVE_2025_26 },
]

export const ARCHIVE_ALL: ArchivedEvent[] = ARCHIVE_PERIODS.flatMap((p) => p.events)

// Everything the association runs, for the "What we run" sphere.
export const FLAGSHIP_EVENTS: ClubEvent[] = [
  ...ARCHIVE_2025_26,
  {
    title: 'Game Jam',
    kind: 'Games',
    type: 'fest',
    text: 'Teams build a game in a fixed window, then pitch it to the judges.',
    photo: '/club/game-jam.jpg',
    alt: 'A team presenting their game to the judges at Game Jam',
  },
  {
    title: 'Learn. Leap. Lead.',
    kind: 'Talk',
    type: 'talk',
    text: 'A talk session for students, run by the association.',
    photo: '/club/learn-leap-lead.jpg',
    alt: 'A packed lecture hall at the Learn. Leap. Lead. session',
  },
]

export const EVENT_TYPE_LABELS: Record<string, string> = {
  workshop: 'Workshop',
  seminar: 'Seminar',
  fest: 'Fest',
  hackathon: 'Hackathon',
  talk: 'Talk',
  other: 'Other',
}

export const REGISTRATION_MODE_LABELS: Record<string, string> = {
  solo: 'Solo',
  team: 'Team',
  both: 'Solo or team',
}
