export type Project = {
  id: string
  slug: string
  name: string
  field: string
  role: string
  period: string
  title: string
  summary: string
  story: string
  details: string[]
  color: string
  logo?: string
  url?: string
  scene:
    | 'conversation'
    | 'research'
    | 'search'
    | 'textile'
    | 'microscope'
    | 'game'
    | 'bank'
    | 'molecule'
    | 'metrics'
}

export const projects: Project[] = [
  {
    id: 'glite',
    slug: 'glite2025',
    name: 'Glite',
    field: 'AI × language',
    role: 'Lead full-stack engineer',
    period: 'From 2025',
    title: 'English learning app',
    summary:
      'Voice conversations, a personal dictionary, and short daily exercises.',
    story:
      'I led full-stack development at Glite, working on voice agents, speech evaluation, and a picture exercise that helped learners see what their words meant.',
    details: [
      'Built the Image Test from first interaction to spoken feedback.',
      'Led the engineering team and used real learning journeys to improve the experience.',
    ],
    color: '#c5edb6',
    logo: '/logos/glite.svg',
    url: 'https://glite.ai',
    scene: 'conversation',
  },
  {
    id: 'quantori',
    slug: 'quantori2024',
    name: 'Quantori',
    field: 'Science × collaboration',
    role: 'Staff software engineer',
    period: '2024–2025',
    title: 'Connect the dots.',
    summary: 'A shared home for research that used to live in pieces.',
    story:
      'Good research rarely happens alone. I built a place where scientists could collect knowledge, connect their work, and move a question forward together.',
    details: [
      'Took the research workspace from prototype to use by more than 70 researchers.',
      'Built the application and its path from development to production.',
    ],
    color: '#98bbf2',
    logo: '/logos/quantori.ico',
    url: 'https://quantori.com',
    scene: 'research',
  },
  {
    id: 'yandex',
    slug: 'yandex2023',
    name: 'Yandex',
    field: 'Search × human workflows',
    role: 'Senior full-stack engineer',
    period: '2023–2024',
    title: 'Less in the way.',
    summary: 'Faster pages. A shorter path to the right person.',
    story:
      'A recruiter wants to find a person, not wrestle with a form. I worked on vacancy publishing, search filters, and interactive content, removing friction from the everyday work.',
    details: [
      'Simplified vacancy publishing and candidate workflows.',
      'Rebuilt the backend behind richer, faster advertisement pages.',
    ],
    color: '#ffd45b',
    url: 'https://yandex.com',
    scene: 'search',
  },
  {
    id: 'akts',
    slug: 'akts2022',
    name: 'AKTS',
    field: 'Commerce × operations',
    role: 'Staff software engineer',
    period: '2022–2023',
    title: 'Catch the season.',
    summary: 'A textile business, a deadline, and something that had to work.',
    story:
      'The market season was not going to wait for software. I built and launched a cloud application for the internal team, then helped the engineering organization grow around it.',
    details: [
      'Launched the first application in one month.',
      'Automated management workflows and led backend development.',
    ],
    color: '#e8a7ca',
    scene: 'textile',
  },
  {
    id: 'epam',
    slug: 'epam2021',
    name: 'EPAM',
    field: 'Science × imaging',
    role: 'Software engineer',
    period: '2021–2022',
    title: 'Look a little closer.',
    summary: 'Whole worlds hiding inside a microscope image.',
    story:
      'A research image can be 30 gigabytes. I built tools that let scientists explore, compare, and annotate those images together, with AI helping refine what they saw.',
    details: [
      'Made thousands of large images searchable and navigable.',
      'Built a shared workspace for more than 30 lab scientists.',
    ],
    color: '#70d2d3',
    url: 'https://www.epam.com',
    scene: 'microscope',
  },
  {
    id: 'sperasoft',
    slug: 'sperasoft2019',
    name: 'Sperasoft',
    field: 'Games × creative tools',
    role: 'Software engineer',
    period: '2019–2021',
    title: 'Give play more room.',
    summary: 'Behind a good game is an artist waiting for a better tool.',
    story:
      'I built game interfaces and the tools behind them. From FIFA 2022 menus to Maya and Perforce integrations, the aim was to spend less time fighting the workflow and more time making the game.',
    details: [
      'Worked with designers and QA on FIFA 2022 interfaces.',
      'Built artist integrations and an in-engine testing framework.',
    ],
    color: '#ea9c79',
    logo: '/logos/sperasoft.png',
    url: 'https://sperasoft.com',
    scene: 'game',
  },
  {
    id: 'kontur',
    slug: 'kontur2017',
    name: 'Kontur',
    field: 'Business × everyday life',
    role: 'Software engineer',
    period: '2017–2019',
    title: 'Make it possible.',
    summary: 'Start a business. Pay a tax. Get on with your day.',
    story:
      'Some useful software disappears into the task it helps you finish. I worked on online business registration and bank integrations that let people handle tax payments without the usual detours.',
    details: [
      'Built APIs and client SDKs used to integrate three major banks.',
      'Made service problems easier to find and diagnose.',
    ],
    color: '#8eafff',
    logo: '/logos/kontur.svg',
    url: 'https://kontur.ru',
    scene: 'bank',
  },
  {
    id: 'lumiprobe',
    slug: 'lumiprobe',
    name: 'Lumiprobe',
    field: 'Open source × chemistry',
    role: 'Open-source contributor',
    period: 'Project work',
    title: 'Every molecule has a name.',
    summary: 'A little grammar. A little chemistry. A satisfying puzzle.',
    story:
      'Molecules have structure. Names have grammar. I worked on the bridge between machine-readable molecular notation and human-readable chemical names, and won an open-source contest along the way.',
    details: [
      'Built a parser for chemical structures and standardized nomenclature.',
      'Published the work so other people could build on it.',
    ],
    color: '#ceaaf6',
    logo: '/logos/lumiprobe.svg',
    url: 'https://github.com/buftio/buftinom',
    scene: 'molecule',
  },
  {
    id: 'marketdata',
    slug: 'marketdata2022',
    name: 'MarketData',
    field: 'Commerce × clarity',
    role: 'Technical lead & consultant',
    period: '2022',
    title: 'See what is happening.',
    summary: 'Useful signals for sellers. Clearer signals for the team.',
    story:
      'I joined a marketplace analytics team to work out what needed attention and make the next steps practical. Better workflows and shared monitoring gave the team a clearer view of its own product.',
    details: [
      'Audited the product and turned the findings into an engineering roadmap.',
      'Introduced shared monitoring, logging, and development workflows.',
    ],
    color: '#a7d9c2',
    scene: 'metrics',
  },
]

export const projectAngle = (index: number) => index * 0.59
export const projectPosition = (index: number): [number, number, number] => [
  Math.sin(projectAngle(index)) * 5.2,
  -1.35,
  Math.cos(projectAngle(index)) * 5.2,
]
