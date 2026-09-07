export type Check = 'technical' | 'project' | 'security' | 'clarify'
export type Evidence = 'application' | Check | 'salary'
export type Candidate = {
  id: string
  name: string
  role: string
  tags: string[]
  years: number
  ask: number
  floor: number
  intro: string
  project: string
  evidence: Record<Check, string>
  qualified: boolean
  discrepancy: boolean
  rejectProof: Evidence[]
  review: string
}

export const vacancy = {
  role: 'Senior full-stack engineer',
  tags: ['React', 'TypeScript', 'Python', 'PostgreSQL'],
  years: 3,
  seats: 2,
  checks: 12,
  cap: 120,
  budget: 220,
}

export const evidenceNames: Record<Evidence, string> = {
  application: 'Application',
  technical: 'Round 1 · Stack',
  project: 'Round 2 · Project',
  security: 'Security check',
  clarify: 'Follow-up documents',
  salary: 'Salary conversation',
}

export const candidates: Candidate[] = [
  {
    id: 'mira',
    name: 'Mira Solano',
    role: 'Senior iOS engineer',
    tags: ['Swift', 'SwiftUI', 'TypeScript'],
    years: 7,
    ask: 100,
    floor: 95,
    intro: 'I build iPhone apps. I would like to try web development next.',
    project: 'A travel app with offline maps and a small TypeScript bridge.',
    evidence: {
      technical:
        'Explains Swift concurrency clearly. Has used TypeScript for an app bridge. Has not shipped React, Python, or a PostgreSQL service.',
      project:
        'Owned offline maps and the iOS release pipeline. A separate team built the server and website.',
      security:
        'Identity and employment dates match. Seven years of iOS work confirmed.',
      clarify:
        'The reference confirms mobile development. There is no missing web project.',
    },
    qualified: false,
    discrepancy: false,
    rejectProof: ['application', 'technical', 'project'],
    review:
      'An experienced iOS engineer, but this vacancy needs production React, Python, and PostgreSQL. The application already showed the mismatch.',
  },
  {
    id: 'denis',
    name: 'Denis Karpov',
    role: 'Senior full-stack engineer',
    tags: ['React', 'TypeScript', 'Python', 'PostgreSQL', 'AWS'],
    years: 6,
    ask: 110,
    floor: 100,
    intro:
      'Six years building web products. I led the complete checkout rebuild.',
    project: 'A new React checkout and Python payment service for a busy shop.',
    evidence: {
      technical:
        'Calls TypeScript a browser runtime and says a database transaction keeps a page open. Cannot explain the React or Python code in the submitted project.',
      project:
        'The checkout is a tutorial repository. Commit history shows a README change. The candidate cannot identify a feature they implemented.',
      security:
        'The only employer listed confirms one year as a support intern, with no engineering lead role. The reference covers twelve months; the application claims six years.',
      clarify:
        'The candidate confirms that the six years included watching programming videos. There is no additional employment record.',
    },
    qualified: false,
    discrepancy: false,
    rejectProof: ['technical', 'project', 'security', 'clarify'],
    review:
      'The tags matched, but the experience did not. Either interview or the employment check exposed the fabricated seniority.',
  },
  {
    id: 'aiko',
    name: 'Aiko Tanaka',
    role: 'Senior full-stack engineer',
    tags: ['React', 'TypeScript', 'Python', 'PostgreSQL', 'AWS ECS'],
    years: 6,
    ask: 125,
    floor: 110,
    intro:
      'I like owning a feature from the React screen to the database. Open to discussing the offer.',
    project: 'A research workspace built with Next.js, Django, and PostgreSQL.',
    evidence: {
      technical:
        'Explains typed React forms, Python API validation, and a PostgreSQL transaction that prevents duplicate submissions. Gives examples from shipped code.',
      project:
        'Owned the research workspace and its AWS ECS deployment. Explains a slow-query incident, the index added, and how the team verified the fix.',
      security:
        'Identity, references, and six years of production work match the application. Documents are clear.',
      clarify:
        'The project reference confirms the same dates and responsibilities.',
    },
    qualified: true,
    discrepancy: false,
    rejectProof: [],
    review:
      'A fit for the role and stack. The initial salary request was negotiable: 110 credits leaves enough budget for the other seat.',
  },
  {
    id: 'samuel',
    name: 'Samuel Okafor',
    role: 'Full-stack engineer',
    tags: ['Python', 'React', 'TypeScript', 'PostgreSQL', 'Docker'],
    years: 5,
    ask: 105,
    floor: 105,
    intro:
      'Five years taking internal tools from rough requirements to daily use.',
    project:
      'A dispatch tool at Northwind Logistics. Reference attached under NW Freight.',
    evidence: {
      technical:
        'Explains React state ownership, typed API clients, Python background jobs, and database constraints. Has shipped all four required technologies.',
      project:
        'Built the dispatch workflow and a PostgreSQL audit trail. Describes a retry bug, the duplicate jobs it caused, and an idempotency key that fixed it.',
      security:
        'Identity matches. Employment reference names NW Freight, while the CV says Northwind Logistics. The dates match. Request the company-name record before clearing the file.',
      clarify:
        'The attached registry record confirms Northwind Logistics was renamed NW Freight. The same manager confirms all five years. The document discrepancy is resolved.',
    },
    qualified: true,
    discrepancy: true,
    rejectProof: [],
    review:
      'A fit for the role. The different employer names were a company rename, resolved with one follow-up. A flagged document was a question to answer.',
  },
  {
    id: 'lena',
    name: 'Lena Fischer',
    role: 'Senior backend engineer',
    tags: ['Java', 'Kotlin', 'Kafka', 'PostgreSQL'],
    years: 8,
    ask: 110,
    floor: 105,
    intro:
      'Eight years on JVM services. I am looking for another backend role.',
    project: 'A Kotlin order service and a Kafka event pipeline.',
    evidence: {
      technical:
        'Strong Java and PostgreSQL knowledge. Has not worked with production Python, React, or TypeScript.',
      project:
        'Explains event ordering and recovery in detail. The work is excellent, but it is entirely backend JVM development.',
      security:
        'Identity and eight years of backend work are confirmed. Documents are clear.',
      clarify: 'The candidate confirms a preference for JVM backend work.',
    },
    qualified: false,
    discrepancy: false,
    rejectProof: ['application', 'technical', 'project', 'clarify'],
    review:
      'Strong experience in a different stack and role. A referral to a JVM team would make sense; this full-stack vacancy would not.',
  },
  {
    id: 'rustam',
    name: 'Rustam Aliyev',
    role: 'Principal full-stack engineer',
    tags: ['Python', 'React', 'TypeScript', 'PostgreSQL', 'Terraform'],
    years: 10,
    ask: 150,
    floor: 135,
    intro:
      'Looking to lead architecture across several teams. Salary is at principal level.',
    project:
      'A platform shared by six product teams, with Python services and React tools.',
    evidence: {
      technical:
        'Excellent knowledge of the required stack. Explains API boundaries, query plans, and React rendering tradeoffs.',
      project:
        'Led the shared platform. Wants a cross-team architecture role, rather than the hands-on feature ownership this vacancy needs.',
      security:
        'Identity, references, and ten years of engineering work are confirmed. Documents are clear.',
      clarify:
        'The candidate confirms that cross-team architecture responsibility is a requirement for the next role.',
    },
    qualified: false,
    discrepancy: false,
    rejectProof: ['application', 'project', 'clarify', 'salary'],
    review:
      'The stack matched, but the role and salary band did not. The minimum was 135 credits, above the 120-credit limit. Seniority alone does not make a fit.',
  },
]
