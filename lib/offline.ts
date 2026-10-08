// Built-in planner: works with NO AI key. Used when no key is set or when the AI call fails,
// so the app always returns a roadmap for whatever job the user types.
import type { Roadmap, RNode, StepPlan } from "./schema";
import { normalize } from "./schema";
import type { ChatContext } from "./types";
import type { PlanInput, StepInput } from "./prompts";

type N = [id: string, label: string, phase: number, type: RNode["type"], weeks: number, desc: string, requires: string[]];
type Domain = {
  key: string;
  kw: RegExp;
  label: string;
  phases: string[];
  nodes: N[];
  paths: Roadmap["paths"];
  repo: { name: string; why: string };
  resource: { title: string; why: string };
  qs: { q: string; hint: string }[];
  companies: string;
  salary: string;
};

const PH = ["Foundations", "Core skills", "Proof of work", "Getting hired"];

const DOMAINS: Domain[] = [
  {
    key: "ml", label: "AI / Machine Learning", kw: /machine learning|\bml\b|\bai\b|artificial|deep learning|nlp|llm|computer vision|data scientist|mlops/i,
    phases: ["Maths & Python", "ML core", "Projects & deployment", "Getting hired"],
    nodes: [
      ["py", "Python for data work", 0, "skill", 4, "Functions, OOP basics, NumPy and Pandas on real CSV files.", []],
      ["math", "Maths: linear algebra, stats, probability", 0, "skill", 6, "Vectors, matrices, distributions, hypothesis tests and gradients.", []],
      ["git", "Git & GitHub", 0, "skill", 1, "Commits, branches, pull requests and a clean repo.", []],
      ["sk", "Classical ML with scikit-learn", 1, "skill", 6, "Regression, trees, boosting, cross-validation and feature engineering.", ["py", "math"]],
      ["dl", "Deep learning with PyTorch", 1, "skill", 7, "Tensors, autograd, CNNs, training loops and regularisation.", ["sk"]],
      ["nlp", "NLP and transformers (Hugging Face)", 1, "skill", 5, "Tokenisation, embeddings, fine-tuning and evaluation.", ["dl"]],
      ["cert", "TensorFlow / Azure AI-900 style certification", 1, "cert", 3, "A recognised certificate to back up the portfolio.", ["sk"]],
      ["kag", "Kaggle competition (top 30%)", 2, "project", 5, "Tabular or NLP competition with a public notebook and write-up.", ["sk"]],
      ["dep", "Project: deploy a model API", 2, "project", 5, "FastAPI + Docker + a simple UI, hosted free, with monitoring notes.", ["dl", "git"]],
      ["mlops", "MLOps basics: MLflow, DVC, CI", 2, "skill", 3, "Track experiments and version data and models.", ["dep"]],
      ["intern", "ML intern / junior data role", 3, "role", 8, "Apply with 2 deployed projects and a Kaggle write-up.", ["kag", "dep", "cert"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Add domain depth and system design for ML.", ["intern", "mlops", "nlp"]],
    ],
    paths: [
      { who: "Engineering student", journey: ["Python + maths", "Kaggle", "ML internship", "ML Engineer"], tip: "A deployed model beat a long list of courses." },
      { who: "Analyst switching careers", journey: ["SQL & Pandas", "scikit-learn", "Data Scientist", "ML role"], tip: "Domain knowledge from the old job was the differentiator." },
    ],
    repo: { name: "microsoft/ML-For-Beginners", why: "A structured 12-week curriculum with notebooks and quizzes." },
    resource: { title: "fast.ai Practical Deep Learning + Andrew Ng's ML Specialization", why: "Free, project-first and widely respected by hiring teams." },
    qs: [{ q: "Explain bias vs variance and how you would diagnose each.", hint: "Learning curves, train vs validation error." }, { q: "How do you handle an imbalanced dataset?", hint: "Metrics (PR-AUC), resampling, class weights." }],
    companies: "product companies, analytics firms and AI startups (Google, Microsoft, Amazon, Flipkart, Fractal, Mu Sigma, Sarvam-type startups)",
    salary: "Freshers in India typically see roughly 6–15 LPA, rising quickly with deployed work; check current Glassdoor/AmbitionBox ranges.",
  },
  {
    key: "data", label: "Data / Analytics", kw: /data analy|analytics|business intelligence|\bbi\b|power ?bi|tableau|data engineer|\bsql\b|reporting/i,
    phases: ["Foundations", "Core tools", "Proof of work", "Getting hired"],
    nodes: [
      ["excel", "Excel & Google Sheets for analysis", 0, "skill", 2, "Pivot tables, lookups, cleaning and charts.", []],
      ["sql", "SQL (joins, windows, CTEs)", 0, "skill", 4, "Query real datasets; practise on 50+ problems.", []],
      ["stat", "Statistics for analysts", 0, "skill", 4, "Distributions, A/B tests, confidence intervals, correlation.", []],
      ["py", "Python: Pandas & Matplotlib", 1, "skill", 5, "Clean, reshape and visualise data in notebooks.", ["stat"]],
      ["bi", "Power BI or Tableau dashboards", 1, "skill", 4, "Data model, DAX/calculated fields, interactive dashboards.", ["excel", "sql"]],
      ["cert", "Microsoft PL-300 (Power BI) certification", 1, "cert", 3, "Recognised credential for BI roles.", ["bi"]],
      ["story", "Data storytelling & business metrics", 1, "skill", 2, "Turn numbers into a recommendation a manager can act on.", ["stat"]],
      ["case", "Project: end-to-end analysis on a public dataset", 2, "project", 4, "Question → SQL → Python → dashboard → 1-page insight memo.", ["sql", "py"]],
      ["dash", "Project: live KPI dashboard", 2, "project", 3, "Publish a Power BI/Tableau Public dashboard with a clear story.", ["bi", "story"]],
      ["intern", "Data analyst intern / junior analyst", 3, "role", 8, "Apply with the case study and dashboard portfolio.", ["case", "dash", "cert"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Add domain metrics and stakeholder communication.", ["intern"]],
    ],
    paths: [
      { who: "Commerce / BSc graduate", journey: ["Excel + SQL", "Power BI", "Analyst intern", "Data Analyst"], tip: "A dashboard on a real dataset got more calls than certificates." },
      { who: "Operations executive", journey: ["SQL on work data", "Dashboards", "Internal move", "Analyst"], tip: "Solving a real problem at the current job built the portfolio." },
    ],
    repo: { name: "microsoft/Data-Science-For-Beginners", why: "A 10-week project-based curriculum covering the analyst workflow." },
    resource: { title: "Kaggle Learn (Pandas, SQL, Data Viz) + Google Data Analytics", why: "Free, short, hands-on lessons." },
    qs: [{ q: "Write a SQL query for the second-highest salary per department.", hint: "DENSE_RANK() over a partition." }, { q: "A KPI dropped 10% last week. How do you investigate?", hint: "Segment, check data quality, compare periods." }],
    companies: "banks, healthcare networks, e-commerce, consulting firms and analytics shops (Deloitte, EY, Accenture, Flipkart, Swiggy, hospital chains)",
    salary: "Entry analysts in India often start around 3.5–8 LPA; check AmbitionBox for your city.",
  },
  {
    key: "cyber", label: "Cybersecurity", kw: /cyber|security|ethical hack|pentest|penetration|soc analyst|infosec|malware/i,
    phases: ["IT foundations", "Security core", "Proof of work", "Getting hired"],
    nodes: [
      ["net", "Networking fundamentals (TCP/IP, DNS, HTTP)", 0, "skill", 4, "How traffic flows; Wireshark basics.", []],
      ["linux", "Linux & command line", 0, "skill", 3, "Permissions, processes, bash scripting.", []],
      ["py", "Python for security scripting", 0, "skill", 3, "Automate recon, parse logs and call APIs.", []],
      ["sec", "CompTIA Security+ certification", 1, "cert", 6, "Industry-standard baseline certificate.", ["net"]],
      ["web", "Web security: OWASP Top 10", 1, "skill", 5, "SQLi, XSS, auth flaws and how to fix them.", ["net"]],
      ["siem", "SOC tools: Splunk / Wazuh / ELK", 1, "skill", 4, "Log analysis, alerts and incident triage.", ["linux"]],
      ["ctf", "TryHackMe & Hack The Box practice", 2, "project", 8, "Complete learning paths and 20+ rooms; write public walkthroughs.", ["web", "linux"]],
      ["lab", "Project: home SOC / pentest lab", 2, "project", 4, "VMs, a SIEM and a documented attack-and-detect scenario.", ["siem", "py"]],
      ["cert2", "eJPT or CEH certification", 2, "cert", 5, "Practical certificate for entry-level pentest roles.", ["ctf"]],
      ["intern", "SOC analyst L1 / security intern", 3, "role", 8, "Apply with walkthroughs, lab report and certificates.", ["sec", "lab", "ctf"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Specialise in cloud or application security.", ["intern", "cert2"]],
    ],
    paths: [
      { who: "CS student", journey: ["TryHackMe", "Security+", "SOC L1", "Security Analyst"], tip: "Public write-ups proved skill better than a CV line." },
      { who: "IT support engineer", journey: ["Security+", "Home lab", "SOC analyst", "Pentester"], tip: "Helpdesk experience made incident triage easy to learn." },
    ],
    repo: { name: "OWASP/CheatSheetSeries", why: "Concise, authoritative fixes for every common web vulnerability." },
    resource: { title: "TryHackMe learning paths + OWASP Juice Shop", why: "Legal, hands-on practice environments." },
    qs: [{ q: "Explain the difference between XSS and CSRF.", hint: "Who is tricked: the browser's trust in the site vs the site's trust in the browser." }, { q: "Walk me through triaging a phishing alert.", hint: "Headers, URL/attachment analysis, scope, containment." }],
    companies: "SOC providers, banks, IT services and product security teams (TCS, Wipro, Deloitte, Palo Alto, CrowdStrike, banks' SOCs)",
    salary: "SOC L1 roles in India commonly start around 3–7 LPA and grow fast with certifications and CTF proof.",
  },
  {
    key: "cloud", label: "Cloud / DevOps", kw: /devops|cloud|sre|site reliability|kubernetes|aws|azure|gcp|infrastructure|platform engineer/i,
    phases: ["Foundations", "Core platform", "Proof of work", "Getting hired"],
    nodes: [
      ["linux", "Linux, networking & shell scripting", 0, "skill", 4, "Processes, systemd, SSH, DNS, bash.", []],
      ["git", "Git & CI basics", 0, "skill", 2, "Branching strategy and GitHub Actions pipelines.", []],
      ["py", "Python or Go for automation", 0, "skill", 3, "Scripts, APIs and small tools.", []],
      ["aws", "AWS Cloud Practitioner → Solutions Architect Associate", 1, "cert", 8, "Core services: EC2, S3, IAM, VPC, RDS.", ["linux"]],
      ["docker", "Docker & containers", 1, "skill", 3, "Images, compose, registries and best practices.", ["linux"]],
      ["k8s", "Kubernetes (CKA-level)", 1, "skill", 7, "Pods, deployments, services, ingress, Helm.", ["docker"]],
      ["iac", "Terraform (Infrastructure as Code)", 1, "skill", 4, "Modules, state, remote backends.", ["aws"]],
      ["obs", "Monitoring: Prometheus & Grafana", 2, "skill", 3, "Metrics, alerts, dashboards and logs.", ["k8s"]],
      ["pipe", "Project: full CI/CD to Kubernetes", 2, "project", 5, "Push to Git → test → build → deploy with Terraform-managed infra.", ["iac", "k8s", "git"]],
      ["intern", "Junior DevOps / cloud support engineer", 3, "role", 8, "Apply with the pipeline repo and an architecture diagram.", ["pipe", "aws", "obs"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Add cost optimisation and security hardening.", ["intern"]],
    ],
    paths: [
      { who: "Sysadmin / support engineer", journey: ["AWS cert", "Docker + K8s", "Cloud engineer", "DevOps Engineer"], tip: "A documented CI/CD project mattered more than extra certs." },
      { who: "CS graduate", journey: ["Linux + Git", "AWS SAA", "DevOps intern", "DevOps Engineer"], tip: "Free-tier labs with written READMEs were enough to get interviews." },
    ],
    repo: { name: "bregman-arie/devops-exercises", why: "Large question bank for interviews across Linux, Docker, K8s and cloud." },
    resource: { title: "AWS Skill Builder + roadmap.sh/devops", why: "Free official training plus a clear learning order." },
    qs: [{ q: "What happens when you run kubectl apply on a Deployment?", hint: "API server, etcd, controller, scheduler, kubelet." }, { q: "How do you roll back a bad release safely?", hint: "Versioned artefacts, rolling/blue-green, health checks." }],
    companies: "cloud-first product companies and IT services (Amazon, Microsoft, Red Hat, Thoughtworks, Infosys, Razorpay, Zerodha)",
    salary: "Junior DevOps in India often starts near 4–10 LPA; Kubernetes + AWS proof pushes this higher.",
  },
  {
    key: "mobile", label: "Mobile Development", kw: /mobile|android|ios|flutter|react native|kotlin|swift\b|app developer/i,
    phases: ["Foundations", "Core stack", "Proof of work", "Getting hired"],
    nodes: [
      ["prog", "Programming fundamentals (Dart / Kotlin / JS)", 0, "skill", 5, "Variables, OOP, async, collections.", []],
      ["git", "Git & GitHub", 0, "skill", 2, "Branches and pull requests.", []],
      ["ui", "Mobile UI layouts & navigation", 1, "skill", 4, "Widgets/Composables, responsive layouts, routing.", ["prog"]],
      ["state", "State management (Riverpod / ViewModel / Redux)", 1, "skill", 4, "Predictable state and architecture.", ["ui"]],
      ["api", "REST APIs, JSON & local storage", 1, "skill", 3, "Networking, caching, SQLite/Room/Hive.", ["prog"]],
      ["fb", "Firebase: auth, Firestore, push", 1, "skill", 3, "Backend-as-a-service for fast products.", ["api"]],
      ["app1", "Project: full CRUD app with auth", 2, "project", 5, "Login, list, detail, offline cache.", ["state", "fb", "git"]],
      ["pub", "Publish an app on Play Store / TestFlight", 2, "project", 3, "Release build, store listing, privacy policy.", ["app1"]],
      ["test", "Testing & CI for mobile", 2, "skill", 2, "Unit/widget tests and automated builds.", ["app1"]],
      ["intern", "Junior mobile developer / intern", 3, "role", 8, "Apply with the published app and clean repos.", ["pub", "test"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Add performance profiling and app architecture depth.", ["intern"]],
    ],
    paths: [
      { who: "Self-taught Flutter developer", journey: ["Dart + Flutter", "Published app", "Freelance gigs", "Mobile Developer"], tip: "A live Play Store link beat any certificate." },
      { who: "Engineering student", journey: ["Android basics", "College app", "Internship", "Android Developer"], tip: "Shipping one polished app was the deciding factor." },
    ],
    repo: { name: "android/architecture-samples", why: "Official reference for clean mobile architecture." },
    resource: { title: "Official Flutter / Android Developers docs and codelabs", why: "Always current and free." },
    qs: [{ q: "How does state management differ between stateless and stateful UI?", hint: "Where state lives and what triggers rebuilds." }, { q: "How do you keep an app usable offline?", hint: "Local DB, sync queue, conflict handling." }],
    companies: "app-first startups and product companies (Swiggy, PhonePe, Paytm, Zomato, Google, Cred, product studios)",
    salary: "Junior mobile developers in India typically start around 4–10 LPA.",
  },
  {
    key: "design", label: "UI/UX Design", kw: /design|ux|\bui\b|figma|product designer|graphic|visual|interaction/i,
    phases: ["Design basics", "Core craft", "Portfolio", "Getting hired"],
    nodes: [
      ["prin", "Design principles: layout, colour, typography", 0, "skill", 3, "Hierarchy, spacing, contrast and grids.", []],
      ["figma", "Figma proficiency", 0, "skill", 3, "Frames, auto-layout, components, variants, prototypes.", []],
      ["res", "UX research methods", 1, "skill", 4, "Interviews, surveys, personas, journey maps.", ["prin"]],
      ["ia", "Information architecture & wireframing", 1, "skill", 3, "Flows, sitemaps and low-fidelity wireframes.", ["res", "figma"]],
      ["ds", "Design systems & accessibility (WCAG)", 1, "skill", 4, "Tokens, components, contrast, keyboard use.", ["figma"]],
      ["cert", "Google UX Design certificate", 1, "cert", 6, "Structured case-study practice.", ["res"]],
      ["case1", "Case study 1: redesign an existing app", 2, "project", 4, "Problem → research → solution → usability test.", ["ia", "ds"]],
      ["case2", "Case study 2: design a product end-to-end", 2, "project", 5, "A full concept with a clickable prototype.", ["case1"]],
      ["test", "Usability testing & metrics", 2, "skill", 2, "Run 5-user tests and report findings.", ["case1"]],
      ["intern", "Junior designer / design intern", 3, "role", 8, "Apply with a portfolio of 2–3 strong case studies.", ["case2", "test", "cert"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Add domain knowledge and product thinking.", ["intern"]],
    ],
    paths: [
      { who: "Self-taught designer", journey: ["Figma + Dribbble", "2 case studies", "Design intern", "UI/UX Designer"], tip: "Process write-ups mattered more than pretty screens." },
      { who: "Engineering graduate", journey: ["Google UX cert", "Redesign projects", "Startup designer", "Product Designer"], tip: "Showing technical empathy helped with developer hand-off." },
    ],
    repo: { name: "Search GitHub for: design system open source", why: "Study how real teams document components and tokens." },
    resource: { title: "Figma Learn + Nielsen Norman Group articles", why: "Free official training plus the best usability research." },
    qs: [{ q: "Walk me through your design process on a recent project.", hint: "Problem, users, options, decision, outcome." }, { q: "How do you design for accessibility?", hint: "Contrast, focus order, labels, touch targets." }],
    companies: "product startups, fintech and design studios (Razorpay, CRED, Zomato, Adobe, Google, Figma-first startups)",
    salary: "Junior designers in India typically start around 3.5–9 LPA depending on portfolio quality.",
  },
  {
    key: "pm", label: "Product Management", kw: /product manager|product management|\bpm\b|\bapm\b|program manager|business analyst/i,
    phases: ["Foundations", "Core PM skills", "Proof of work", "Getting hired"],
    nodes: [
      ["pm0", "Product fundamentals & user thinking", 0, "skill", 3, "Problem vs solution, jobs-to-be-done, product lifecycle.", []],
      ["data", "Product analytics & SQL basics", 0, "skill", 4, "Funnels, retention, cohorts, A/B tests.", []],
      ["tech", "Tech literacy for PMs", 0, "skill", 3, "APIs, databases, system design basics.", []],
      ["prd", "Writing PRDs & user stories", 1, "skill", 3, "Clear scope, acceptance criteria and metrics.", ["pm0"]],
      ["prio", "Prioritisation frameworks (RICE, MoSCoW)", 1, "skill", 2, "Make trade-offs defensible.", ["pm0", "data"]],
      ["ux", "Working with design and engineering", 1, "skill", 3, "Roadmaps, sprints, Figma hand-off.", ["tech"]],
      ["teardown", "Project: 3 product teardowns", 2, "project", 3, "Analyse real products with metrics and improvement ideas.", ["prio"]],
      ["mvp", "Project: ship a small MVP with a team", 2, "project", 6, "Use no-code or a student team; measure results.", ["prd", "ux"]],
      ["intern", "APM / product intern / business analyst", 3, "role", 8, "Apply with teardowns and the MVP story.", ["teardown", "mvp"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Develop domain depth and stakeholder leadership.", ["intern"]],
    ],
    paths: [
      { who: "Engineer moving to product", journey: ["Own a feature", "PRDs", "Associate PM", "Product Manager"], tip: "Shipping a measurable feature was the strongest bridge." },
      { who: "MBA / business graduate", journey: ["Teardowns", "BA role", "APM", "Product Manager"], tip: "A concrete MVP story beat frameworks name-dropping." },
    ],
    repo: { name: "Search GitHub for: product management resources", why: "Find curated PRD templates and case-interview prep lists." },
    resource: { title: "Lenny's Newsletter + Reforge free articles + Google PM notes", why: "Real practitioner playbooks." },
    qs: [{ q: "How would you improve Google Maps for delivery riders?", hint: "Segment users, pick a problem, solutions, metric." }, { q: "A key metric dropped 15%. What do you do?", hint: "Verify data, segment, hypothesise, act." }],
    companies: "product startups and large tech (Flipkart, Swiggy, Razorpay, Microsoft, Google, Meesho, Paytm)",
    salary: "APM roles in India often range around 10–25 LPA at product firms; lower in service/BA roles.",
  },
  {
    key: "marketing", label: "Digital Marketing", kw: /marketing|seo|growth|social media|content|brand|copywrit|ads\b/i,
    phases: ["Foundations", "Core channels", "Proof of work", "Getting hired"],
    nodes: [
      ["fund", "Marketing fundamentals & funnels", 0, "skill", 3, "Positioning, funnels, audience research.", []],
      ["copy", "Copywriting & content strategy", 0, "skill", 4, "Hooks, landing pages, content calendars.", []],
      ["seo", "SEO (technical + content)", 1, "skill", 5, "Keyword research, on-page SEO, backlinks.", ["fund"]],
      ["ads", "Paid ads: Google & Meta", 1, "skill", 5, "Campaign structure, creatives, budgets, ROAS.", ["fund"]],
      ["analytics", "GA4 & marketing analytics", 1, "skill", 3, "Events, conversions, dashboards.", ["fund"]],
      ["cert", "Google Ads / HubSpot certifications", 1, "cert", 3, "Free recognised certificates.", ["ads"]],
      ["site", "Project: grow a blog or page to 1,000 visits", 2, "project", 8, "Document the SEO and content process with numbers.", ["seo", "copy", "analytics"]],
      ["camp", "Project: run a small paid campaign", 2, "project", 3, "Spend ₹2–5k and report CAC/ROAS.", ["ads", "analytics"]],
      ["intern", "Marketing executive / growth intern", 3, "role", 8, "Apply with measurable results.", ["site", "camp", "cert"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Specialise in a channel or in growth.", ["intern"]],
    ],
    paths: [
      { who: "Content creator", journey: ["Own blog", "SEO results", "Agency role", "Digital Marketer"], tip: "Real traffic numbers did the talking." },
      { who: "BBA graduate", journey: ["Certificates", "Campaign project", "Intern", "Growth Marketer"], tip: "A written case study with ROI got the offer." },
    ],
    repo: { name: "Search GitHub for: marketing analytics templates", why: "Reusable reporting and tracking templates." },
    resource: { title: "Google Digital Garage + HubSpot Academy", why: "Free courses with certificates." },
    qs: [{ q: "How do you measure the success of a campaign?", hint: "Goal → KPI → attribution → learnings." }, { q: "How would you grow organic traffic for a new site?", hint: "Intent, content clusters, technical SEO, links." }],
    companies: "D2C brands, agencies and SaaS firms (Mamaearth, boAt, Zomato, Ogilvy, HubSpot-style SaaS startups)",
    salary: "Entry-level marketing in India commonly starts around 2.5–6 LPA; performance marketers grow faster.",
  },
  {
    key: "finance", label: "Finance / Accounting", kw: /financ|account|\bca\b|chartered|banker|banking|investment|equity|audit|tax|cfa|trader|trading/i,
    phases: ["Foundations", "Core finance", "Proof of work", "Getting hired"],
    nodes: [
      ["acc", "Accounting fundamentals", 0, "skill", 5, "Journal, ledgers, financial statements.", []],
      ["excel", "Advanced Excel & financial modelling", 0, "skill", 5, "Formulas, scenarios, three-statement model.", []],
      ["fm", "Corporate finance & valuation", 1, "skill", 6, "DCF, multiples, WACC.", ["acc"]],
      ["mkt", "Markets, economy & instruments", 1, "skill", 4, "Equity, debt, derivatives basics.", ["acc"]],
      ["cert", "NISM / CFA Level 1 / CA stage as relevant", 1, "cert", 12, "A credential recognised by the industry.", ["acc"]],
      ["model", "Project: model a listed company", 2, "project", 5, "Three-statement model with valuation and memo.", ["excel", "fm"]],
      ["pitch", "Project: equity research report", 2, "project", 4, "A 5-page report with thesis and risks.", ["mkt", "model"]],
      ["intern", "Finance intern / analyst trainee", 3, "role", 8, "Apply with model, report and certificates.", ["model", "pitch", "cert"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Add sector depth.", ["intern"]],
    ],
    paths: [
      { who: "Commerce graduate", journey: ["NISM + Excel", "Equity report", "Analyst trainee", "Financial Analyst"], tip: "A published equity report stood out on resumes." },
      { who: "CA / CFA candidate", journey: ["Exam track", "Articleship / internship", "Analyst", "Associate"], tip: "Pairing exams with modelling projects was key." },
    ],
    repo: { name: "Search GitHub for: financial modeling excel templates", why: "Study well-structured modelling templates." },
    resource: { title: "NSE Academy + Corporate Finance Institute free courses + Damodaran's website", why: "Rigorous, free valuation learning." },
    qs: [{ q: "Walk me through a DCF.", hint: "FCF forecast, WACC, terminal value, equity bridge." }, { q: "How do the three statements link?", hint: "Net income, cash, retained earnings, balance." }],
    companies: "banks, brokerages, Big 4 and research houses (HDFC, ICICI, Kotak, Deloitte, KPMG, Motilal Oswal)",
    salary: "Entry finance roles in India typically start around 3–8 LPA; IB and research can be higher.",
  },
  {
    key: "game", label: "Game Development", kw: /game (dev|design|program|art)|unity|unreal|godot/i,
    phases: ["Foundations", "Core engine", "Proof of work", "Getting hired"],
    nodes: [
      ["csh", "C# or C++ fundamentals", 0, "skill", 5, "OOP, data structures, memory basics.", []],
      ["math", "Game maths: vectors & physics", 0, "skill", 3, "Transforms, collisions, interpolation.", []],
      ["eng", "Unity or Unreal fundamentals", 1, "skill", 6, "Scenes, prefabs, input, animation, UI.", ["csh"]],
      ["ai", "Gameplay systems & AI behaviours", 1, "skill", 4, "State machines, pathfinding, game feel.", ["eng", "math"]],
      ["art", "Level design & basic art pipeline", 1, "skill", 3, "Blockouts, assets, lighting.", ["eng"]],
      ["jam", "Project: game jam entry (48 h)", 2, "project", 2, "Ship a tiny game fast; publish on itch.io.", ["eng"]],
      ["game", "Project: polished vertical slice", 2, "project", 8, "A 10-minute playable build with menus and audio.", ["ai", "art", "jam"]],
      ["intern", "Junior gameplay programmer / intern", 3, "role", 8, "Apply with two playable builds and a demo reel.", ["game"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Add optimisation and multiplayer basics.", ["intern"]],
    ],
    paths: [
      { who: "Hobbyist developer", journey: ["Game jams", "itch.io games", "Indie studio", "Gameplay Programmer"], tip: "Playable builds beat degrees for gaming studios." },
      { who: "CS student", journey: ["C# + Unity", "Vertical slice", "Studio intern", "Game Developer"], tip: "A short demo reel with metrics of performance helped." },
    ],
    repo: { name: "godotengine/godot-demo-projects", why: "Official demos covering common gameplay patterns." },
    resource: { title: "Unity Learn + Brackeys tutorials + GDC Vault talks", why: "Free engine and design training." },
    qs: [{ q: "How do you make movement feel responsive?", hint: "Input buffering, coyote time, acceleration curves." }, { q: "How would you optimise a laggy scene?", hint: "Profile first, batching, pooling, LOD." }],
    companies: "game studios and mobile publishers (Nazara, Zynga, Ubisoft, Games2win, indie studios)",
    salary: "Junior game developers in India often start around 3–8 LPA.",
  },
  {
    key: "gov", label: "Government / Civil Services", kw: /upsc|ias\b|ips\b|civil serv|government|ssc|bank po|ibps|railway|psc\b|teacher|ctet|defence|nda\b/i,
    phases: ["Foundation", "Syllabus coverage", "Practice & mocks", "Final stretch"],
    nodes: [
      ["syl", "Decode syllabus & previous-year papers", 0, "skill", 2, "Know weightage and the pattern before reading anything.", []],
      ["ncert", "NCERT / basic books for core subjects", 0, "skill", 8, "Build base concepts for GS or the main subjects.", []],
      ["news", "Daily current affairs habit", 1, "skill", 4, "Newspaper + monthly compilation + notes.", ["syl"]],
      ["opt", "Core subject deep-dive / optional", 1, "skill", 10, "Standard books and short notes.", ["ncert"]],
      ["write", "Answer writing / quant & reasoning practice", 1, "skill", 6, "Daily practice with feedback.", ["syl"]],
      ["mock", "Weekly full-length mock tests", 2, "project", 10, "Analyse every mock; maintain an error log.", ["opt", "news", "write"]],
      ["rev", "3 structured revisions", 2, "skill", 8, "Spaced revision of short notes.", ["opt"]],
      ["prelim", "Qualify the prelims / first stage", 3, "role", 6, "Exam-day strategy and time management.", ["mock", "rev"]],
      ["target", "TARGET", 3, "milestone", 8, "Main exam, interview and final selection.", ["prelim"]],
    ],
    paths: [
      { who: "Working aspirant", journey: ["Syllabus", "Weekend study", "Mocks", "Selection"], tip: "Consistent mocks and revision beat long study hours." },
      { who: "Full-time aspirant", journey: ["NCERT", "Optional", "Test series", "Interview"], tip: "Error logs from mocks fixed repeated mistakes." },
    ],
    repo: { name: "Search GitHub for: exam preparation notes", why: "Open-source note collections can supplement your own." },
    resource: { title: "Official exam notification + previous-year papers + NCERT books", why: "The source of truth for every exam." },
    qs: [{ q: "Why do you want this service/role?", hint: "Honest, specific motivation tied to real experience." }, { q: "Discuss a recent policy and its impact.", hint: "Context, pros, cons, a balanced conclusion." }],
    companies: "UPSC/State PSCs, SSC, banks (IBPS/SBI), railways and teaching boards",
    salary: "Pay is set by government pay scales; check the latest official notification for your exam.",
  },
  {
    key: "web", label: "Web Development", kw: /web|front.?end|back.?end|full.?stack|react|node|javascript|\bjs\b|html|django|mern|next\.?js|api developer/i,
    phases: ["Foundations", "Core stack", "Proof of work", "Getting hired"],
    nodes: [
      ["html", "HTML, CSS & responsive layout", 0, "skill", 3, "Semantic markup, Flexbox/Grid, mobile-first design.", []],
      ["js", "Modern JavaScript (ES2023)", 0, "skill", 5, "Closures, async/await, modules and the DOM.", []],
      ["git", "Git & GitHub workflow", 0, "skill", 2, "Branches, pull requests and code review.", []],
      ["ts", "TypeScript", 1, "skill", 4, "Types, generics and typing API responses.", ["js"]],
      ["react", "React & Next.js", 1, "skill", 7, "Hooks, routing, data fetching, forms.", ["html", "js"]],
      ["node", "Node.js, Express & REST APIs", 1, "skill", 5, "Routing, auth (JWT), validation, error handling.", ["js"]],
      ["db", "Databases: PostgreSQL & MongoDB", 1, "skill", 4, "Schema design, queries, indexes, ORMs.", ["node"]],
      ["a11y", "Accessibility & performance basics", 1, "cert", 3, "WCAG basics and Lighthouse optimisation.", ["html"]],
      ["test", "Testing: Vitest/Jest & Playwright", 2, "skill", 3, "Unit tests plus one end-to-end flow.", ["react"]],
      ["full", "Project: full-stack app with auth & payments", 2, "project", 7, "Deployed on Vercel/Render with a real database.", ["react", "db", "ts", "git"]],
      ["intern", "Junior developer / intern role", 3, "role", 8, "Apply with the deployed project and a clean GitHub.", ["full", "test", "a11y"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Add system design and domain knowledge.", ["intern"]],
    ],
    paths: [
      { who: "Self-taught, then startup intern", journey: ["Free web course", "Open-source fixes", "Startup internship", "Developer"], tip: "Contributions to a real repo opened more doors than certificates." },
      { who: "Engineering student", journey: ["College projects", "Hackathon", "Campus placement", "Developer"], tip: "A deployed project beat a long skills list." },
    ],
    repo: { name: "freeCodeCamp/freeCodeCamp", why: "Huge open-source learning platform; read how a large codebase is organised." },
    resource: { title: "MDN Web Docs + The Odin Project + roadmap.sh/frontend", why: "Free, accurate and project-based." },
    qs: [{ q: "Explain the event loop in JavaScript.", hint: "Call stack, task queue, microtasks." }, { q: "How would you optimise a slow React page?", hint: "Profile, memoisation, code splitting, lazy loading." }],
    companies: "startups, product companies and IT services (Razorpay, Zoho, Freshworks, Swiggy, TCS, Infosys, remote startups)",
    salary: "Junior web developers in India typically start around 3.5–10 LPA depending on skills and portfolio.",
  },
  {
    key: "swe", label: "Software Engineering", kw: /software|\bsde\b|engineer|programmer|developer|coder|java\b|python|c\+\+|golang|backend/i,
    phases: ["CS foundations", "Core engineering", "Proof of work", "Getting hired"],
    nodes: [
      ["lang", "One language deeply (Java / Python / C++)", 0, "skill", 6, "Syntax, OOP, standard library, debugging.", []],
      ["dsa", "Data structures & algorithms", 0, "skill", 10, "Arrays, trees, graphs, DP; 200+ problems.", []],
      ["git", "Git & Linux basics", 0, "skill", 2, "Version control and the shell.", []],
      ["db", "Databases & SQL", 1, "skill", 4, "Normalisation, indexes, transactions.", ["lang"]],
      ["os", "OS, networks & CS fundamentals", 1, "skill", 5, "Processes, memory, TCP/IP, HTTP.", ["lang"]],
      ["sd", "System design basics", 1, "skill", 5, "Scaling, caching, queues, load balancing.", ["db", "os"]],
      ["proj", "Project: scalable backend service", 2, "project", 6, "REST API, DB, caching, Docker, tests, README.", ["lang", "db", "git"]],
      ["lc", "Interview practice: contests & mocks", 2, "project", 8, "Timed contests and mock interviews.", ["dsa"]],
      ["intern", "SDE intern / junior engineer", 3, "role", 8, "Apply with the project and a strong problem-solving record.", ["proj", "lc"]],
      ["target", "TARGET", 3, "milestone", 6, "Target role. Deepen system design and ownership.", ["intern", "sd"]],
    ],
    paths: [
      { who: "Tier-3 college student", journey: ["DSA daily", "Contests", "Off-campus intern", "SDE"], tip: "Consistent problem-solving plus one project broke the college barrier." },
      { who: "Non-CS graduate", journey: ["Python", "DSA + projects", "Support role", "Software Engineer"], tip: "Strong projects offset the missing degree." },
    ],
    repo: { name: "jwasham/coding-interview-university", why: "A complete, widely used study plan for software interviews." },
    resource: { title: "NeetCode + CS50 + MIT OpenCourseWare", why: "Free, rigorous problem-solving and CS fundamentals." },
    qs: [{ q: "Reverse a linked list and explain complexity.", hint: "Three pointers, O(n) time, O(1) space." }, { q: "Design a URL shortener.", hint: "ID generation, storage, caching, scaling." }],
    companies: "product companies and services firms (Google, Microsoft, Amazon, Adobe, Atlassian, Zoho, Infosys, TCS)",
    salary: "Junior software engineers in India range widely, roughly 4–25+ LPA by company tier.",
  },
];

const GENERIC: Domain = {
  key: "generic", label: "Your field", kw: /./,
  phases: ["Foundations", "Core skills", "Proof of work", "Getting hired"],
  nodes: [
    ["map", "Understand the role: job posts & day-in-the-life", 0, "skill", 2, "Read 20 job posts, note common skills and tools, talk to 2–3 people in the role.", []],
    ["base", "Core fundamentals of the field", 0, "skill", 6, "Learn the standard concepts through one structured free course and a good book.", []],
    ["tools", "Industry tools & workflow", 1, "skill", 5, "Pick the 2–3 tools that appear in most job posts and practise daily.", ["map"]],
    ["adv", "Intermediate skills & specialisation", 1, "skill", 6, "Go deeper in the area most job posts emphasise.", ["base"]],
    ["cert", "One recognised certification", 1, "cert", 4, "Choose a respected credential listed in real job posts.", ["base"]],
    ["p1", "Project 1: solve a small real problem", 2, "project", 4, "Document the problem, process and results.", ["tools"]],
    ["p2", "Project 2: portfolio-grade capstone", 2, "project", 6, "A complete deliverable that shows end-to-end ability.", ["adv", "p1"]],
    ["net", "Networking: LinkedIn, communities, mentors", 2, "skill", 3, "Share your work publicly and ask for feedback.", ["p1"]],
    ["intern", "Internship or entry-level role", 3, "role", 8, "Apply with your portfolio, referrals and a tailored resume.", ["p2", "cert", "net"]],
    ["target", "TARGET", 3, "milestone", 6, "Target role. Keep growing with feedback and harder projects.", ["intern"]],
  ],
  paths: [
    { who: "Student building a portfolio", journey: ["Fundamentals", "Two projects", "Internship", "Target role"], tip: "Visible proof of work beat a long list of courses." },
    { who: "Career switcher", journey: ["Transferable skills", "Certificate + project", "Entry role", "Target role"], tip: "Link the old experience to the new field in your story." },
  ],
  repo: { name: "Search GitHub for: awesome <your field>", why: "Curated 'awesome' lists collect the best learning resources." },
  resource: { title: "roadmap.sh, official docs and one structured free course", why: "A clear order plus authoritative material." },
  qs: [{ q: "Why this field, and what proof do you have of interest?", hint: "A project, a story, a number." }, { q: "Describe a problem you solved and how you measured success.", hint: "Situation, action, result." }],
  companies: "companies listing this role on LinkedIn, Naukri and Wellfound; filter by your city",
  salary: "Check current ranges on AmbitionBox, Glassdoor and LinkedIn for this exact title and city.",
};

export function detectDomain(goal: string): Domain {
  const g = goal.toLowerCase();
  // Game roles are checked first so "game designer" is not mistaken for UI/UX design.
  const game = DOMAINS.find((d) => d.key === "game");
  if (game && game.kw.test(g)) return game;
  return DOMAINS.find((d) => d.kw.test(g)) ?? GENERIC;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function offlineRoadmap(i: PlanInput): Roadmap {
  const d = detectDomain(i.goal);
  const goal = cap(i.goal.trim());
  const knownL = i.known.map((k) => k.toLowerCase());
  let nodes: RNode[] = d.nodes.map(([id, label, phase, type, weeks, desc, requires]) => ({
    id,
    label: id === "target" ? goal.slice(0, 70) : label,
    phase,
    type,
    weeks,
    desc: id === "target" ? `${desc} This is your goal: ${goal}.` : desc,
    requires: [...requires],
  }));

  // Level adjusts effort: beginners need more time, intermediates less.
  const mult = /beginner/i.test(i.level) ? 1.25 : /intermediate/i.test(i.level) ? 0.75 : /basics/i.test(i.level) ? 0.9 : 1;
  nodes.forEach((n) => (n.weeks = Math.max(1, Math.round(n.weeks * mult))));

  // Re-plan: leave out steps the learner already knows or finished.
  if (knownL.length) nodes = nodes.filter((n) => n.id === "target" || !knownL.includes(n.label.toLowerCase()));

  // Respect the "map size" setting by trimming optional certs/skills from the middle.
  const maxN = Math.max(8, i.settings.n);
  while (nodes.length > maxN) {
    const idx = nodes.findIndex((n) => n.phase === 1 && (n.type === "cert" || n.type === "skill") && n.id !== "target");
    if (idx < 0) break;
    nodes.splice(idx, 1);
  }

  const months = i.months;
  const total = nodes.reduce((a, n) => a + n.weeks, 0);
  const needMonths = ((total * 10) / i.hours / 4.33).toFixed(1);
  const fit = Number(needMonths) <= months ? "fits inside" : "is longer than";
  const extra = [i.settings.bg && `Built around your background (${i.settings.bg}).`, i.settings.region && `Location noted: ${i.settings.region}.`].filter(Boolean).join(" ");

  return normalize({
    title: goal,
    summary: `A ${d.key === "generic" ? "step-by-step" : d.label.toLowerCase()} route to "${goal}": ${d.phases.join(" → ")}. At ${i.hours} h/week it takes about ${needMonths} months, which ${fit} your ${months}-month goal. ${extra}`.trim(),
    phases: d.phases.length ? d.phases : PH,
    nodes,
    paths: d.paths,
  });
}

/* ------------------------------ step plans ------------------------------ */
export function offlineStep(i: StepInput): StepPlan {
  const d = detectDomain(i.goal);
  const L = i.label;
  const byType: Record<string, { title: string; brief: string; steps: string[] }> = {
    skill: {
      title: `Mini build: apply "${L}"`,
      brief: `Build one small, finished thing that uses "${L}" and could be shown to a recruiter. Keep the scope small enough to finish in a weekend.`,
      steps: ["Write the goal in one sentence", `Learn only what you need of ${L}`, "Build the smallest working version", "Add a README with a screenshot or result"],
    },
    cert: {
      title: `Exam sprint for "${L}"`,
      brief: "Treat the certificate like a 2-week sprint: official syllabus, practice questions, then a timed mock.",
      steps: ["Download the official exam guide", "Map each topic to a free resource", "Do two timed practice tests", "Book the exam only after scoring consistently above the pass mark"],
    },
    project: {
      title: `Ship version 1 of: ${L}`,
      brief: "Scope it down, build it end to end, deploy or publish it, and write down what you learned.",
      steps: ["Define users, problem and success metric", "Build the core flow first", "Publish it (live link or report)", "Write a short case study"],
    },
    role: {
      title: `Application sprint: ${L}`,
      brief: "Spend a weekend on a focused job-hunt sprint using your portfolio and referrals.",
      steps: ["Tailor your resume to 10 job posts", "Message 10 people for referrals", "Apply to 15 roles", "Track replies and refine"],
    },
    milestone: {
      title: "Final readiness check",
      brief: "Audit your portfolio, resume and interview prep against 10 real job posts for this exact role.",
      steps: ["List the top 10 required skills from job posts", "Mark what your portfolio proves", "Fill the biggest gap with a mini-project", "Do two mock interviews"],
    },
  };
  const project = byType[i.type] ?? byType.skill;
  const own = d.qs;
  const generic = [
    { q: `What is "${L}" and where have you used it?`, hint: "Define it simply, then give a concrete example from a project." },
    { q: `What mistakes do beginners make with "${L}"?`, hint: "Name two real mistakes and how you avoid them." },
  ];
  return {
    project,
    repo: d.repo,
    questions: [...own.slice(0, 2), ...generic],
    resource: { title: `${d.resource.title}`, why: `${d.resource.why} Search it for "${L}".` },
  };
}

/* -------------------------------- coach chat -------------------------------- */
export function offlineChat(question: string, c: ChatContext): string {
  const q = question.toLowerCase();
  const d = detectDomain(c.goal);
  const steps = c.steps;
  const open = steps.filter((s) => s.status === "available");
  const done = steps.filter((s) => s.status === "done" || s.status === "known");
  const first = open[0]?.label ?? steps[0]?.label ?? "the first step on your map";
  const hrs = c.hours;
  const goal = c.goal || "your goal";

  if (!steps.length) {
    return `**Start here:** type your dream job in the box above and press **Map my path**. Then I can explain each step, build a weekly plan and quiz you.`;
  }
  if (/simple|explain.*roadmap|roadmap.*explain/.test(q))
    return `**Your roadmap in simple words** for **${goal}**:\n- ${d.phases.join(" → ")}\n- ${steps.length} steps, ${done.length} cleared\n- Start with **${first}** and work through the open steps left to right.\n- Prove skills with projects, then apply for the stepping-stone role.`;
  if (/this week|what should i do/.test(q))
    return `**This week (${hrs} h):**\n- 60%: learn **${first}**\n- 30%: build something small with it\n- 10%: write notes and update your portfolio\nNext: ${open[1]?.label ?? "the next open step"}.`;
  if (/skip|shorten/.test(q))
    return `**What you can shorten:**\n- Skip anything you can already do: use "I already know this".\n- Certificates are optional if you have strong projects.\n- Never skip projects and the stepping-stone role: they are what employers see.`;
  if (/sprint|4-week|4 week|week plan|1-week/.test(q))
    return `**4-week sprint (${hrs} h/week):**\n- Week 1: learn the basics of **${first}**\n- Week 2: build a mini project\n- Week 3: extend it and add tests/notes\n- Week 4: publish it, write a README and share it on LinkedIn/GitHub.`;
  if (/free|resource/.test(q))
    return `**Free resources:**\n- ${d.resource.title}\n- ${d.resource.why}\n- Repo to study: ${d.repo.name}\nStart with **${first}**.`;
  if (/mock|interview|quiz/.test(q)) {
    const t = c.selected ? `**${c.selected}**` : `**${first}**`;
    return `**Mock interview on ${t}:**\n- ${d.qs[0]?.q}\n- ${d.qs[1]?.q}\n- What project proves you can do this?\nAnswer in 90 seconds each: situation, action, result.`;
  }
  if (/certif/.test(q)) {
    const certs = steps.filter((s) => /cert|exam|PL-300|Security\+|AWS|CFA|NISM/i.test(s.label)).map((s) => s.label);
    return `**Certificates:**\n${certs.length ? certs.map((x) => `- ${x}`).join("\n") : "- None are mandatory on this map."}\n- Pay only for one that appears in real job posts for ${goal}.\n- Projects usually matter more.`;
  }
  if (/compan|hire/.test(q)) return `**Who hires for this:** ${d.companies}.\nCheck LinkedIn, Naukri and Wellfound for the exact title in your city.`;
  if (/salary|growth|pay/.test(q)) return `**Pay and growth:** ${d.salary}\nTreat these as rough ranges and verify on current job sites.`;
  if (/gap|review/.test(q))
    return `**Plan review:**\n- Do you have at least 2 public projects? Add them if not.\n- Is there a stepping-stone role or internship step? Apply early.\n- ${done.length}/${steps.length} steps cleared: focus on the open ones in the earliest phase.\n- Add networking: share your work weekly.`;
  if (/resume|bullet/.test(q))
    return `**Resume bullet formula:** Action + what you built + result.\n- "Built <project> with <tool>, serving <users>, cutting <time> by <x>%."\n- "Published <project> on GitHub with a README and demo link."\nReplace the placeholders with real numbers only.`;
  if (/compare|similar/.test(q))
    return `**Comparing roles:** list the top 10 skills from job posts for both, then count the overlap. High overlap means you can target both with one portfolio. Tell me the other role and I'll compare in more detail.`;
  if (/motivat|consisten/.test(q))
    return `**Stay consistent:**\n- Fix a daily 30–60 min slot.\n- Track a streak.\n- Ship something every 2 weeks.\n- Study with a friend or in a community.\n- Celebrate each cleared step.`;
  if (/5 hours|only.*hours|less time/.test(q))
    return `**With 5 h/week:** the plan takes about ${(Math.ceil(steps.length * 4.5 * 10 / 5 / 4.33)).toString()} months, so cut scope:\n- Do 1 skill at a time.\n- Skip optional certificates.\n- Build one strong project instead of three.\n- Use the "I already know this" button for what you know.`;
  return `**About "${question.slice(0, 80)}":**\n- Your target is **${goal}** with ${steps.length} steps (${done.length} cleared).\n- Next best step: **${first}**.\n- Ask me about a plan, resources, interview questions, certificates, companies or salary.`;
}
