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

// Recurring events the association runs. `photo` is from a past edition;
// null renders a placeholder until one is added under public/club/. `type`
// is the event_type the home page links to (/events?type=).
export const FLAGSHIP_EVENTS: {
  title: string
  kind: string
  type: string
  text: string
  photo: string | null
  alt: string
}[] = [
  {
    title: 'Sportiva',
    kind: 'Sport',
    type: 'fest',
    text: 'The association’s sports meet: track, courts and team games.',
    photo: null,
    alt: 'Sportiva',
  },
  {
    title: 'Ideathon',
    kind: 'Ideas',
    type: 'hackathon',
    text: 'Teams pitch solutions to real problems. Ideas first, code optional.',
    photo: null,
    alt: 'Ideathon',
  },
  {
    title: 'CTF',
    kind: 'Security',
    type: 'hackathon',
    text: 'Capture the Flag: teams solve security challenges against the clock. Three editions so far.',
    photo: '/club/ctf.jpg',
    alt: 'A student briefing a group gathered around a laptop at CTF',
  },
  {
    title: 'Game Jam',
    kind: 'Build',
    type: 'fest',
    text: 'Teams build a game in a fixed window, then pitch it to the judges.',
    photo: '/club/game-jam.jpg',
    alt: 'A team presenting their game to the judges at Game Jam',
  },
  {
    title: 'CINTEL Connect',
    kind: 'Stage',
    type: 'fest',
    text: 'The association’s stage night: live music, dance and performances.',
    photo: '/club/cintel-connect.jpg',
    alt: 'Three students performing live music on stage at CINTEL Connect',
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
