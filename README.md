# PRAHARI (प्रहरी) 🛡️
### Continuous, Rule-Grounded Multimodal AI Audit Engine for MPLADS & Public-Works Schemes

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-orange.svg?style=flat-square)](https://sih.gov.in)
[![Problem Statement ID](https://img.shields.io/badge/PS_ID-26102-blue.svg?style=flat-square)](https://sih.gov.in)
[![Ministry](https://img.shields.io/badge/Ministry-MoSPI_(DIID)-green.svg?style=flat-square)](https://www.mospi.gov.in)
[![Team](https://img.shields.io/badge/Team-The__Semicolons-purple.svg?style=flat-square)]()
[![Team ID](https://img.shields.io/badge/Team_ID-127409-yellow.svg?style=flat-square)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg?style=flat-square)](LICENSE)

---

## 🌐 Live Cloud Deployment

| Component | Platform | Direct Access Link | Notes |
|---|---|---|---|
| **PRAHARI Platform** | Render / Unified | [**https://prahari-audit.onrender.com**](https://prahari-audit.onrender.com) | Unified React SPA + FastAPI backend |
| **Frontend CDN** | Vercel | [**https://prahari-audit.vercel.app**](https://prahari-audit.vercel.app) | Global Edge CDN with automated API rewrites |
| **Interactive Swagger Docs** | Cloud API | [**https://prahari-audit.onrender.com/docs**](https://prahari-audit.onrender.com/docs) | Interactive OpenAPI REST endpoints |
| **Citizen Social Audit** | Open Access | [**https://prahari-audit.onrender.com/citizen/work/1**](https://prahari-audit.onrender.com/citizen/work/1) | Zero-login public QR inspection view |

> 💡 **Deploy in 1 Click:**  
> Connect this repository (`AP-2403/Prahari_SIH_PS1`) to **[Render.com](https://render.com)** (unified container) or **[Vercel.com](https://vercel.com)** (frontend CDN) with zero manual configuration. Detailed steps in the [Cloud Deployment Guide](#-1-click-cloud-deployment-guide) below.

---

## 📽️ Project Demonstration Video

<!-- ======================================================== -->
<!-- DEMO VIDEO PLACEHOLDER SECTION - INSERT VIDEO LINK BELOW -->
<!-- ======================================================== -->

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                      ║
║                      🎬 [ DEMO VIDEO WALKTHROUGH PLACEHOLDER ]                       ║
║                                                                                      ║
║   Watch the complete 19-stage interactive end-to-end audit demonstration:            ║
║   • MoSPI DPR file ingestion & live multi-engine screening pipeline                  ║
║   • National Macro-Telemetry, Leaflet geospatial heatmap & radar charts              ║
║   • Multimodal EXIF/pHash photo audit & statutory 1-year guideline deadline          ║
║   • Explainable SHAP irregular factor attribution with rule citations               ║
║   • Interactive Louvain network cartel graph & citizen whistleblower social audit    ║
║                                                                                      ║
║   👉 Link: [INSERT_YOUTUBE_OR_LOOM_DEMO_VIDEO_URL_HERE]                              ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

> **Note:** Video walkthrough link and preview will be linked directly above prior to final evaluation.

---

## 🏛️ Executive Summary & Context

Under the **Member of Parliament Local Area Development Scheme (MPLADS)**, each Hon'ble Member of Parliament is allocated ₹5 Crore annually to recommend developmental works addressing durable community infrastructure (drinking water, primary education, rural roads, sanitation).

### The Challenge with Traditional Oversight
* **Ex-post & Sample-Driven:** Audits currently occur years after disbursement, inspecting only a fraction of completed works.
* **Siloed Multi-Scheme Overlaps:** Works frequently get duplicate sanctions across convergent schemes (PMGSY, MGNREGA, Smart Cities, State Funds) without detection.
* **Paper-Only Milestones & Ghost Projects:** Progress certificates are submitted without cryptographically verified on-site geolocation or structural verification.
* **Contractor Cartels & Split Tendering:** Shell contractors exploit informal bidding rings to monopolize projects while evading tender ceilings.
* **Lack of Rule-Grounded Explanations:** Generic machine learning black-box scores fail to provide actionable statutory justification to District Collectors or MoSPI officials.

### The Solution: PRAHARI (प्रहरी)
**PRAHARI** shifts MPLADS oversight from **retrospective sample checking** to **continuous, automated, multimodal surveillance**. It ingests raw project registers and utilizes **5 Specialized AI Screening Engines** coupled with **TreeExplainer SHAP explainability** and explicit statutory guideline mapping to safeguard public funds in real time.

---

## 🧠 Core Architecture: 5 Specialized AI Engines

```
                                  ┌───────────────────────────────┐
                                  │   Raw MoSPI Data Ingestion    │
                                  │   (DPRs, CSV Registers, EXIF) │
                                  └───────────────┬───────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 │                                                                 │
                 ▼                                                                 ▼
     ┌───────────────────────┐                                         ┌───────────────────────┐
     │   ENGINE 1: NLP &     │                                         │   ENGINE 2: SURVIVAL  │
     │   Geospatial Radius   │                                         │   & Predictive Delay  │
     │   Duplicate Detector  │                                         │   Risk Scorer         │
     └───────────┬───────────┘                                         └───────────┬───────────┘
                 │                                                                 │
                 │              ┌───────────────────────────────────┐              │
                 ├─────────────►│    COMPREHENSIVE AUDIT ENGINE     │◄─────────────┤
                 │              │    Unified Composite Risk Score   │              │
                 │              │    (0 to 100 Anomaly Index)       │              │
                 │              └─────────────────┬─────────────────┘              │
                 │                                │                                │
     ┌───────────┴───────────┐                    │                    ┌───────────┴───────────┐
     │   ENGINE 3: ISOLATION │                    │                    │   ENGINE 4: COMPUTER  │
     │   FOREST & Benchmark  │                    │                    │   VISION & EXIF pHash │
     │   Financial Overrun   │                    │                    │   Multimodal Progress │
     └───────────────────────┘                    │                    └───────────────────────┘
                                                  ▼
                                      ┌───────────────────────┐
                                      │   ENGINE 5: GRAPH &   │
                                      │   NetworkX Louvain    │
                                      │   Cartel Ring Engine  │
                                      └───────────────────────┘
```

### 1. Engine 1: Multi-Scheme Duplicate Work Detector
* **Semantic & Textual Similarity:** Uses `sentence-transformers` (`paraphrase-multilingual-MiniLM-L12-v2`) and TF-IDF vectorization to detect identical or near-identical asset descriptions across languages.
* **Geospatial Proximity:** Implements the **Haversine formula** to flag works proposed within a 500-meter radius of existing or parallel assets.
* **Temporal Co-occurrence:** Cross-references sanction dates and milestone schedules to identify overlapping budget drawdowns.

### 2. Engine 2: Predictive Delay & Stoppage Risk Scorer
* **Predictive ML:** Gradient Boosting Classifier trained on historical completion trajectories, regional agency backlogs, seasonal monsoon disruption windows, and contractor load.
* **Statutory Rule Grounding:** Encodes **MPLADS Guideline §7.4**, mandating completion within **1 year** of administrative sanction. Flags overdue works with precise day counts.

### 3. Engine 3: Financial Anomaly & Cost Overrun Scorer
* **Anomaly Detection:** Unsupervised `IsolationForest` detecting multi-variable financial outliers.
* **Unit-Rate Benchmarking:** Extracts unit metrics (₹/km of rural road, ₹/sq.m of community hall) using custom regular expressions and compares them against CPWD/State PWD Schedule of Rates (SoR).

### 4. Engine 4: Multimodal Physical Progress & Ghost Work Verification
* **EXIF Geotag Authentication:** Verifies hardware sensor signatures, GPS latitude/longitude, and camera timestamps against the project's sanctioned site coordinate.
* **Perceptual Hashing (`imagehash` / pHash):** Computes visual similarity hashes across 59,000+ national images to block stock photo reuse and identical angle fraud.
* **OpenCV Structural Verification:** Structural Similarity Index (SSIM) and edge gradient analysis across time-sequenced milestones (25% $\rightarrow$ 50% $\rightarrow$ 75% $\rightarrow$ 100%).

### 5. Engine 5: Vendor & Contractor Cartel Risk Network
* **Network Graph Formulation:** Modeled in `NetworkX` with nodes representing registered vendors and directed edges representing shared tenders, common addresses, or joint bidding patterns.
* **Community Detection:** Runs the **Louvain modularity algorithm** (`python-louvain`) to identify suspicious bidding rings and collusion clusters.
* **Concentration Metrics:** Computes the **Gini Coefficient** and Herfindahl-Hirschman Index (HHI) for each constituency to pinpoint vendor monopolization.

---

## 🔍 Explainable AI (XAI) & Rule Grounding

PRAHARI rejects uninterpretable "black-box" risk scoring. Every flagged work includes:
1. **SHAP Feature Attribution:** Quantifies the exact percentage contribution of each feature (e.g., *"+34% due to deviation from State PWD unit rate"*, *"+28% due to photographic reuse across districts"*).
2. **Statutory Guideline Citations:** Direct mapping to the official **MoSPI MPLADS Guidelines Manual**:
   * `MPLADS §7.4`: Statutory 1-Year Completion Deadline.
   * `MPLADS §9.2`: Mandatory Photographic On-Site Inspection & Verification.
   * `MPLADS §12.1`: Prohibition of Splitting of Tenders to bypass Technical Sanction thresholds.
3. **Auditor Feedback Loop:** District collectors can review explanations and submit verdicts (`Verified Issue` vs. `False Alarm`), which feed into ongoing model calibration.

---

## 👥 Role-Based Access Control (RBAC) Architecture

| Persona | Level | Access Scope & Key Capabilities |
|---|---|---|
| **National Admin** | MoSPI / DIID | Macro surveillance across all 543 Lok Sabha + 245 Rajya Sabha constituencies; interactive DPR upload center; engine execution console; national risk heatmap. |
| **Hon'ble MP** | Constituency | Scoped dashboard tracking fund utilization, progress milestones, approved works, and predictive stall alerts within their parliamentary jurisdiction. |
| **District Nodal Officer** | District / Collectorate | Actionable review queues, milestone photo approvals, field verification sign-offs, and contractor accountability audits. |
| **Citizen / Public** | Open Social Audit | Zero-login transparency portal (`/citizen/work/:id`) featuring QR code integration, bilingual progress summaries, citizen ratings, and whistleblower reports directly to the Vigilance Commission. |

---

## 🎨 User Interface & Design System

The application features a modern, accessible interface tailored for government command-and-control operations:
* **Palette:**
  * **Primary / Base:** `#9bdeff` *(Soft Blue)*
  * **Secondary:** `#9bffee` *(Minty Ice)*
  * **Accent:** `#9bacff` *(Soft Periwinkle)*
  * **Dark Neutral:** `#003047` *(Deep Navy)*
  * **Light Neutral:** `#E5F7FF` *(Off-White Ice)*
* **Bilingual Support:** Real-time switchable **English** and **हिन्दी (Hindi)** interface across all metric labels, headers, and AI tooltips.
* **Interactive 19-Stage Demo Tour:** Collision-free, spotlight-focused onboarding engine with 4-quadrant curtain masking, automatic viewport clamping, and flip-side orientation.

---

## 💻 Tech Stack

### Backend
* **Runtime:** Python 3.11+
* **Framework:** FastAPI, Uvicorn
* **Database & ORM:** SQLite / PostgreSQL, SQLAlchemy
* **Machine Learning:** `scikit-learn` (IsolationForest, GradientBoosting), `sentence-transformers`, `shap`
* **Computer Vision:** `imagehash`, `Pillow`, `OpenCV`
* **Network Graph:** `networkx`, `python-louvain`
* **Authentication:** JWT Bearer tokens with Role-Based Scopes

### Frontend
* **Core:** React 18, Vite
* **Styling:** Vanilla CSS + Tailwind CSS utilities
* **Data Visualization:** Recharts (Radial, Bar, Pie, Area, Line trends)
* **Interactive Graph:** `vis-network` (real-time physics-driven cluster rendering)
* **Geospatial Map:** Leaflet.js, OpenStreetMap
* **Icons:** Lucide React

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/AP-2403/Prahari_SIH_PS1.git
cd Prahari_SIH_PS1
```

### 2. Backend Setup
```bash
cd prahari/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server (Port 8010)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload
```
API Documentation will be live at: `http://localhost:8010/docs`

### 3. Frontend Setup
```bash
cd ../prahari-frontend

# Install dependencies
npm install

# Start Vite dev server (Port 5180)
npm run dev
```
Open your browser at: `http://localhost:5180`

---

## ☁️ 1-Click Cloud Deployment Guide

PRAHARI is containerized with a production multi-stage [`Dockerfile`](./Dockerfile) and pre-configured [`render.yaml`](./render.yaml) blueprint to serve both the React frontend and FastAPI backend together on a single port.

### Option A: Deploy on Render.com (Recommended — 100% Free)
1. Sign in to **[dashboard.render.com](https://dashboard.render.com)** using your GitHub account (`AP-2403`).
2. Click **New +** $\rightarrow$ **Blueprint** (or **Web Service**).
3. Select your repository: **`AP-2403/Prahari_SIH_PS1`**.
4. Render will automatically read `render.yaml` and configure:
   - **Environment:** Docker
   - **Plan:** Free
   - **Port:** `10000` (auto-detected via `$PORT`)
5. Click **Apply**. Within ~3–4 minutes, your live production service will be online at:
   `https://prahari-audit.onrender.com`

### Option B: Deploy Frontend on Vercel (Global Edge CDN)
1. Sign in to **[vercel.com](https://vercel.com)** using your GitHub account (`AP-2403`).
2. Click **"Add New..."** $\rightarrow$ **"Project"**.
3. Import your repository: **`AP-2403/Prahari_SIH_PS1`**.
4. Set **Root Directory** to `prahari/prahari-frontend` (or leave root — our included [`vercel.json`](./vercel.json) handles both automatically!).
5. Click **Deploy**. Vercel will build the frontend and serve it at `https://prahari-audit.vercel.app`.
   - All API requests to `/api/*` are automatically reverse-proxied to your backend without CORS issues!

### Option C: Deploy on Hugging Face Spaces (Free 16GB RAM)
1. Go to **[huggingface.co/new-space](https://huggingface.co/new-space)**.
2. Set Space SDK to **Docker** (Blank).
3. Connect your GitHub repository `AP-2403/Prahari_SIH_PS1`.
4. Hugging Face builds the multi-stage Docker container with 16GB RAM for zero-latency AI scoring.

### Option D: Run via Docker Locally
```bash
# Build the unified container
docker build -t prahari:latest .

# Run on port 8010
docker run -p 8010:8010 prahari:latest
```
Visit `http://localhost:8010` to view the full application.

---

## 🔑 Preloaded Demonstration Accounts

| Role | Username | Password | Purpose |
|---|---|---|---|
| **National Admin** | `admin` | `admin123` | Full access to national telemetry, DPR ingestion, and engines |
| **Hon'ble MP** | `mp.singhvi` | `mp2026` | Scoped view for Abhishek Manu Singhvi (Rajya Sabha) |
| **District Officer** | `district.chittoor` | `district123` | District Nodal Officer view for Chittoor constituency |
| **Citizen Portal** | *No Login Required* | — | Open access at `/citizen/work/1` |

---

## 📂 Repository Structure

```
Prahari_SIH_PS1/
├── background/                     # High-resolution architectural assets
├── data/                           # Real/normalized MoSPI dataset registers & DPRs
│   ├── mplads_completed_works_2026-09-22.csv
│   ├── mplads_expenditures_2026-09-22.csv
│   └── mplads_recommended_works_2026-09-22.csv
├── prahari/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── engines/            # 5 AI engines (duplicate, delay, finance, cv, cartel)
│   │   │   ├── routers/            # FastAPI API endpoints (auth, works, dashboard, etc.)
│   │   │   ├── database.py         # SQLAlchemy engine & session manager
│   │   │   ├── models.py           # Relational data models (Works, MPs, Vendors, Photos)
│   │   │   └── schemas.py          # Pydantic input/output schemas
│   │   ├── data/                   # Guideline texts & citation documents
│   │   ├── prahari.db              # Pre-seeded SQLite database (59,275 real works)
│   │   └── requirements.txt        # Python backend dependencies
│   └── prahari-frontend/
│       ├── public/                 # Static assets & sample evidence photos
│       ├── src/
│       │   ├── api/                # Axios client & route handlers
│       │   ├── components/         # Interactive Demo Tour, Charts, Layout, Badges
│       │   ├── context/            # LanguageContext, DemoTourContext
│       │   ├── pages/              # Ministry, District, Upload, Review, VendorGraph, WorkDetail
│       │   ├── App.jsx             # React Router hierarchy
│       │   └── index.css           # Custom design tokens & animations
│       ├── package.json
│       └── vite.config.js
├── PRAHARI_Prototype_Build_README.md # Detailed developer build specification
└── README.md                       # Project overview & architectural guide
```

---

## 🏆 Smart India Hackathon 2026 Participation

* **Problem Statement ID:** 26102
* **Ministry / Department:** Ministry of Statistics and Programme Implementation (MoSPI) — Data Informatics and Innovation Division (DIID)
* **Team:** The_Semicolons (Team ID: 127409)
* **Target Domain:** Automated Audit, Public Expenditure Surveillance, AI & Explainable Governance

---

<p align="center">
  <b>Developed with ❤️ by Team The_Semicolons for SIH 2026</b>
</p>
