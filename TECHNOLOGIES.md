# 🛠️ Technology Stack, Languages & Software Matrix

This document provides a comprehensive catalog of all programming languages, databases, external APIs, frameworks, and npm dependencies used to build and deploy the **IkshaTests** platform.

---

## 🔤 Programming & Configuration Languages

The platform uses a blend of core programming, database querying, and configuration languages:

| Language | Category | Primary Use Case | Features Employed |
| :--- | :--- | :--- | :--- |
| **JavaScript (ES6+)** | Programming | Client logic, router control, Express API endpoints | ES Modules, async/await, Array/Object destructuring, Buffer streams |
| **SQL (PL/pgSQL)** | Database Querying | Supabase Database Schema, constraints, triggers | Row Level Security (RLS) policies, database triggers, cascade deletion |
| **HTML5** | Markup | Main entry page (`index.html`), canvas renders | Screen canvas element, semantic layout (header, nav, main), Fullscreen API |
| **CSS3 (Vanilla & Tailwind)** | Styling | Custom typography, sizing, layout resets | CSS variables, flexible grid/flexbox layouts, responsive design rules |
| **XML / Plist** | Configuration | Safe Exam Browser client rules | Ordered plist dictionaries for security key validation |

---

## 💻 Frontend Client Stack (`/frontend`)

The frontend is a modern single-page React application powered by Vite, utilizing several specialized libraries for math rendering, PDF processing, and icons.

### Core Frameworks & Tooling
* **React 19.2.4** (Core Framework): Manages virtual DOM updates, custom contexts, and reactive state variables.
* **Vite 8.0.1** (Bundler & Build Tool): Extremely fast HMR (Hot Module Replacement) and optimized production compilation.
* **Tailwind CSS v4.2.2** (Styling Engine): Modern utility-first CSS engine built for speed, styling custom themes with design-system tokens.

### Client Dependencies (from `package.json`)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` | `^19.2.4` | Component framework core logic |
| `react-dom` | `^19.2.4` | React rendering binding for web browsers |
| `react-router-dom` | `^7.13.2` | Client-side routing, query parameter parsing, dynamic parameter matching (`/test/:id`) |
| `axios` | `^1.13.6` | Promise-based HTTP client to fetch REST payloads from the API server |
| `@supabase/supabase-js` | `^2.103.2` | Supabase JavaScript client for Auth integrations and profile tracking |
| `@tailwindcss/vite` | `^4.2.2` | Vite plugin integrating the Tailwind CSS compiler directly into the build pipeline |
| `katex` | `^0.17.0` | High-speed TeX math rendering tool for displaying complex formulas, indices, and math matrices |
| `pdfjs-dist` | `^6.0.227` | Mozilla's PDF.js library to render uploaded PDF documents as image files client-side |
| `lucide-react` | `^1.0.1` | Sleek, light-weight vector icon library |

### Frontend DevDependencies
* `eslint` (`^9.39.4`): Linter to maintain clean code quality and enforce standards.
* `postcss` (`^8.5.8`), `autoprefixer` (`^10.4.27`): Custom CSS parser and prefix-injector for legacy browser compatibility.
* `concurrently` (`^9.2.1`): Runs multiple CLI tasks concurrently (used during local cross-workspace integration tests).

---

## ⚙️ Backend API Server Stack (`/backend`)

The backend is built on Node.js using Express.js to bridge file uploads, database queries, and AI generation tasks.

### Core Frameworks
* **Node.js** (Runtime): Executing backend operations, file processing, and environment management.
* **Express.js v5.2.1** (API Framework): Routing engine handling JSON bodies, file buffers, and CORS policies.

### Server Dependencies (from `package.json`)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `express` | `^5.2.1` | Server framework for routing requests and returning JSON models |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing middleware enabling secure frontend-backend communication |
| `multer` | `^2.2.0` | Middleware for handling `multipart/form-data` uploads, managing document memory buffers |
| `@google/genai` | `^2.9.0` | Google Gemini SDK to parse scanned paper images and extract structured STEM questions |
| `openai` | `^6.44.0` | OpenAI Node SDK acting as a fallback parser (using `gpt-4o-mini`) when Gemini rate-limits are reached |
| `mammoth` | `^1.12.0` | Word document (`.docx`) file converter. Parses formatting and uploads document images |
| `@supabase/supabase-js` | `^2.103.2` | Supabase Admin Client initialized with service keys to bypass RLS policies during question ingestion |
| `dotenv` | `^17.4.2` | Loads local environment variables from `.env` files |
| `nodemailer` | `^9.0.3` | SMTP engine for user notification dispatches and access logs |

---

## 🗄️ Database, Storage & BaaS (Supabase)

Supabase serves as the backend infrastructure suite, providing:

* **PostgreSQL (v15+)**: Relational database engine powering transaction management.
* **Row-Level Security (RLS)**: Fine-grained security filter rules built directly into Postgres tables based on user credentials.
* **Supabase Auth**: Mock-backed verification engine, utilizing custom profiles for student and administrator roles.
* **Supabase Storage**: Object bucket hosting diagrams, graphs, and paper illustrations.

---

## ☁️ Infrastructure, Deployment & Third-Party Apps

* **Render (current)**: Hosting for both static frontend files (Vite output) and web service server containers (defined in `render.yaml`).
* **Safe Exam Browser (SEB)**: Client software that intercepts web parameters to run high-security proctored exams on candidate computers.
* **Gemini 2.5-Flash & 2.0-Flash APIs**: AI models providing image comprehension and JSON-schema structured output.
* **OpenAI GPT-4o-Mini API**: High-efficiency fallback model for document parsing.
