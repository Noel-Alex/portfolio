/** Who Noel is, shared by the portfolio home and the résumé so the two never drift apart. */

export const me = {
  name: 'Noel Alex',
  legalName: 'Noel Alex Samuel',
  role: 'AI engineer · data science · data systems',
  intro: 'I build AI and data systems that can show their evidence: crawlers, compilers, OCR pipelines and evaluation harnesses, measured until the numbers are honest.',
  email: 'noelalex404@gmail.com',
  github: 'https://github.com/Noel-Alex',
  linkedin: 'https://www.linkedin.com/in/noel-alex-b1731128b/',
  site: 'https://noel-alex.github.io/portfolio/',
  talk: 'https://www.youtube.com/watch?v=SGLh-A3z4yI',
  resume: `${import.meta.env.BASE_URL}Noel-Alex-Resume.pdf`,
  location: 'Vellore, India · grew up in Riyadh',
}

export const openTo = {
  roles: ['AI / ML engineering', 'ML evaluation', 'Data and backend systems'],
  places: 'Remote, Riyadh, UAE or the US',
  when: 'Graduating 2027',
}

export type Job = { title: string; org: string; when: string; points: string[] }

export const experience: Job[] = [
  {
    title: 'AI Engineer (contract)',
    org: 'Blackridge Technologies / Stravah',
    when: 'Mar–Sep 2026',
    points: [
      'Built AI workflows that extract and reconcile transactions from complex Indian bank-statement PDFs: layout and table reconstruction, OCR, row recovery and ledger consistency checks.',
      'Served GLM-OCR on GPUs with FastAPI, vLLM and Modal (L40S), tuning batching, concurrency, caching, observability and cost, backed by load and quality tests.',
    ],
  },
]

export const education = [
  { school: 'Vellore Institute of Technology, Vellore', detail: 'B.Tech, Computer Science & Engineering (Data Science)', when: '2023–27', note: '' },
  { school: 'New Middle East International School, Riyadh', detail: 'CBSE (Classes X and XII) · Physics subject topper', when: '2023', note: '' },
]

export const leadership: { title: string; when: string; body: string; link?: { label: string; href: string } }[] = [
  { title: 'GDG VIT · Senior Technical Member, AI/ML', when: '2023–26', body: 'Helped run DevJams and Women Techies, ran AI/ML recruitment end to end (256 shortlisted from about 5,000 applicants, about 80 given a project and interviewed by me), and mentored juniors.' },
  { title: 'Inside Google’s DeepMind', when: '2024', body: 'Designed and gave a recorded session for 400+ students, from transformers to AlphaFold.', link: { label: 'Watch the session', href: 'https://www.youtube.com/watch?v=SGLh-A3z4yI' } },
  { title: 'Head Boy · New Middle East International School', when: '2022–23', body: 'Coordinated student welfare, staff liaison and off-campus safety during the return to in-person school, and represented the school at a Middle East CBSE principals’ conference.' },
  { title: 'Riviera 2024, VIT', when: '2024', body: '1st place in arm wrestling and 2nd in powerlifting, in our brackets.' },
]

export const skills: [string, string][] = [
  ['Languages', 'Python, Rust, SQL, TypeScript, C/C++, Java, R'],
  ['ML', 'PyTorch, Transformers, GNNs, NLP / OCR, RAG, evaluation design, pandas, scikit-learn'],
  ['Systems', 'FastAPI, vLLM, Modal, PostgreSQL, NATS JetStream, Qdrant, Docker, Temporal, Linux'],
]

export const certification = 'Oracle Cloud Infrastructure 2025 Generative AI Professional (92%)'
