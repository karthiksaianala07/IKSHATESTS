# 🎓 IkshaTests – Full-Stack CBT & AI-Powered Question Parsing Platform

**IkshaTests** is a premium, high-fidelity Full-Stack Educational Platform designed to simulate India's most demanding entrance examinations: **IIT JEE (Main & Advanced)** and **NEET (UG)**. 

It provides candidates with an online testing experience that exactly replicates the official National Testing Agency (NTA) computer-based environment, backed by rigorous browser-level proctoring rules. For administrators and faculty, the platform integrates automated AI question parsing, enabling direct ingestion of tests from PDF and Microsoft Word files.

---

## 🌟 Key Features

### 1. NTA-Style CBT (Computer Based Test) Console
* **Full-Screen Guard**: Enforces full-screen mode during exams using the HTML5 Fullscreen API to prevent cheating.
* **Proctoring Engine**: Tracks window focus, tab-switching, visibility changes, and multiple screen attempts.
* **Auto-Termination**: Automatically logs violations and submits the examination if security thresholds are bypassed.
* **Interactive Palette**: High-fidelity Question Navigator mimicking the standard color-coded states (Answered, Not Answered, Marked for Review, Not Visited).
* **Subject Switching & Calculator**: Instant tabbed section navigation and custom virtual keypad for integer-type questions.

### 2. Intelligent AI Question Ingestion (OCR Parser)
* **PDF Upload Engine**: Renders PDF pages to images client-side, parses them using Google Gemini 2.5-Flash (with OpenAI GPT-4o-Mini fallback), and extracts questions, subject contexts, chapters, equations, and answer keys.
* **Microsoft Word (.docx) Parser**: Extracts HTML, images, and formatting from Word files, automatically uploading figures to Supabase Storage and mapping structures directly to the database.
* **LaTeX Formula Support**: Integrated KaTeX rendering throughout the exam client and dashboard.

### 3. Comprehensive Aspirant Dashboard
* **Syllabus Coverage Tracker**: Interactive, chapter-wise checklist categorized by Physics, Chemistry, and Mathematics/Biology.
* **Detailed Analytics & Metrics**: View score distributions, question-by-question breakdown, and performance gauges.
* **Reattempt Portal**: Review incorrect responses and re-evaluate answers in an interactive review modal.

---

## 📁 Repository Structure

The project is decoupled into frontend and backend applications:

```bash
IKSHATESTS/
├── backend/                  # Node.js Express API Server
│   ├── config/               # Supabase Client Initializations
│   ├── scratch/              # Integration Test Scripts
│   ├── scripts/              # Utility & Database Setup Scripts
│   ├── server.js             # Main API Endpoints (AI, Auth, Tests, Admin)
│   └── supabase_schema.sql   # Postgres DB Schema & RLS Policies
├── frontend/                 # React 19 Client (Vite, Tailwind v4)
│   ├── public/               # Static Web Assets
│   └── src/                  # React Application Code
│       ├── components/       # Reusable UI Elements (LaTeX, Gauge, Keypad)
│       ├── config/           # API Endpoints & Supabase Configurations
│       ├── context/          # Global Context Providers (AuthContext)
│       ├── pages/            # Core Views (TestConsole, Dashboard, Admin)
│       ├── App.jsx           # Routing & Layout Manager
│       └── main.jsx          # App Entrypoint
├── render.yaml               # Deployment Configuration for Render
├── README.md                 # Project Overview (This file)
├── TECHNICAL_README.md       # Architectural Details & DB Schemas
└── TECHNOLOGIES.md           # Languages, Frameworks, & Dependencies
```

---

## 🚀 Quick Local Setup Guide

Follow these steps to run the application on your local machine.

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** (v9 or higher)

### Step 1: Clone and Configure Backend
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and add the following:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   *The backend will run on* `http://localhost:5000`

### Step 2: Configure Frontend
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory and add the following:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on* `http://localhost:5173`

---

## 📖 Additional Documentation

For more granular technical details, please refer to the following documents:
* Detailed Architectural Blueprint & Database Schemas: [TECHNICAL_README.md](file:///c:/Users/KARTHIK%20SAI%20ANALA/OneDrive/Desktop/IKSHATESTS/TECHNICAL_README.md)
* Complete Technology Stack, Languages & Software Matrix: [TECHNOLOGIES.md](file:///c:/Users/KARTHIK%20SAI%20ANALA/OneDrive/Desktop/IKSHATESTS/TECHNOLOGIES.md)
