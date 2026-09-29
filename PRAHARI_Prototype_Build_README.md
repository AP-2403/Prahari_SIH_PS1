# PRAHARI — Prototype Build Instructions
**Continuous, Rule-Grounded Multimodal AI Audit Engine for MPLADS & Public-Works Schemes**
Team: The_Semicolons | Team ID: 127409 | SIH 2026 | PS ID: 26102 (MoSPI — DIID)

> **Purpose of this document:** This is a build brief for an AI coding agent (Claude Code / Antigravity / similar). It describes exactly what to build for a **hackathon-grade working prototype** — not the full production system described in the technical-approach doc. The goal is a demo that *looks and behaves* like a real product, runs entirely on synthetic/mock data (no live eSAKSHI access), and clearly demonstrates all 5 AI engines and all 4 role-based dashboards end to end.

---

## 1. What "prototype" means here (read this first)

Do **not** try to stand up Neo4j, Kubernetes, Airflow, Bhashini, Google Earth Engine, or a fine-tuned LLM. Those are the *production* vision. For the prototype, every one of those is **simulated or substituted** with something lightweight that produces the same visible behavior. The judge should see a believable, interactive product — the backend can be honest shortcuts as long as the UI, data, and reasoning outputs look real and are internally consistent.

**Guiding rule:** every screen must show *real computed numbers from real (synthetic) data*, not hardcoded strings. Generate a synthetic dataset once, run genuine (simple) algorithms over it, and let the UI reflect actual results — this is what makes a demo convincing.

---

## 2. Simplified Prototype Stack

| Layer | Production doc says | **Build this instead** |
|---|---|---|
| Backend | FastAPI + Celery | **FastAPI** only (no Celery — run "background" jobs as simple async functions or on-demand endpoints) |
| DB | PostgreSQL + PostGIS + Neo4j + Redis | **SQLite** (via SQLAlchemy) for everything, including graph edges as a simple `vendor_edges` table. No Redis — just cache in memory with `functools.lru_cache` if needed. |
| ML | XGBoost, PyTorch, Isolation Forest, Autoencoder, lifelines | **scikit-learn only**: `IsolationForest` for anomaly detection, `GradientBoostingClassifier` or `LogisticRegression` for delay prediction. Skip PyTorch/autoencoder/lifelines — note in the UI that these are "roadmap" if asked, but the working demo uses IsolationForest + GradientBoosting. |
| NLP | IndicBERT/LaBSE, spaCy | **`sentence-transformers`** with a small multilingual model (`paraphrase-multilingual-MiniLM-L12-v2`) for near-duplicate work descriptions; simple **regex** for quantity/unit extraction instead of spaCy pipelines |
| CV | YOLOv8, OpenCV, EXIF, imagehash | **`imagehash`** (real, it's a 1-line library) for photo-reuse detection; **`Pillow`**'s EXIF reader for GPS/timestamp; **skip YOLOv8** — instead show a mocked "object detected: road ✅ / mismatch ⚠️" label driven by filename/metadata rules, clearly good enough for a demo |
| Geospatial | PostGIS, Earth Engine, Bhuvan, Leaflet | **Haversine distance in Python** (no PostGIS needed at this scale) + **Leaflet.js** on the frontend (real, free, no API key needed with OpenStreetMap tiles). Skip satellite imagery entirely — replace with a "before/after" **static image pair per work** you generate/mock, captioned "simulated satellite check." |
| Graph | Neo4j, PyTorch Geometric | **NetworkX** in Python (real) with **Louvain via `python-louvain`** (real, one pip install) for vendor clustering. Render the graph on the frontend with **`react-force-graph` or `vis-network`**. |
| Explainability | SHAP | **Real SHAP** on the IsolationForest/GradientBoosting models — this is genuinely easy to wire up and worth doing for real, it's your strongest "wow" feature |
| AI Assistant | LLM+RAG, text-to-SQL, Bhashini | **Anthropic API (Claude)** call with the MPLADS guideline text pasted into the system prompt (poor-man's RAG — a few thousand words of guidelines fits directly in context, no vector DB needed for a prototype). For text-to-SQL, give Claude the DB schema in the prompt and ask it to emit SQL, then execute it server-side against SQLite (read-only connection). Skip Bhashini — do a **text-only bilingual toggle** (Hindi/English UI labels) instead of real voice. |
| Frontend | React, Tailwind, ECharts | **Keep as-is** — React + Vite + Tailwind CSS + **Recharts** (simpler than ECharts, faster to build) |
| Auth | JWT role-based | **A simple role picker on login** (no real auth needed for demo) — dropdown: Ministry / State / District / MP / Citizen, each showing scoped data |
| Deployment | Docker/K8s/MeghRaj | **Just run locally**: `uvicorn` for backend, `npm run dev` for frontend. Optionally a single `docker-compose.yml` for judges who want to run it themselves. |

This substitution list is the single most important part of this document — it prevents scope creep that kills hackathon prototypes.

---

## 3. The Two-Panel Model: Admin vs User (core of this prototype)

The earlier draft of this brief scoped 5 fine-grained roles (Ministry/State/District/MP/Citizen). For the **working prototype demo**, collapse that into **two panels**, because the centerpiece of this demo is: *someone uploads their own data, the system processes it live, and both an admin and an end-user see the results reflected in real dashboards.* The 5-role scoping from §12 still applies as a filter *within* these two panels (an admin can view "as Ministry" or "as District"; a user logs in as a specific MP or district viewer) — but build the upload → process → visualize loop first, since that's the actual product demo.

### 3.1 Admin Panel — what it contains, how it works

The Admin Panel is for whoever owns/operates PRAHARI (Ministry/DIID staff in real life). It is the **only** panel that can bring new data into the system and control the engines.

**Contains:**
1. **Data Upload Center** — drag-and-drop (or file picker) for CSV/XLSX files of works, payments, vendors, or photos-with-metadata. Supports uploading a fresh dataset *or* incremental additions to the existing synthetic dataset.
2. **Upload validation & preview** — before committing, show a preview table of the parsed rows, flag any column-mapping issues or missing required fields, let the admin confirm or fix mappings (simple dropdown: "map your column `amt_rs` → `sanctioned_amount`").
3. **Processing Console** — a live-updating status view once the admin confirms: shows each stage running (parsing → feature engineering → 5 engines → risk scoring → dashboard refresh) with a progress bar and short log lines, so it visibly *does the work* rather than instantly appearing.
4. **Review & Verification Queue** — every flagged work appears here; the admin marks it "Verified — genuine issue" or "False alarm," which writes to `OfficerFeedback` and is what the UI describes as feeding the retraining loop.
5. **Engine Control** — manual "Re-run all engines" button, and a small settings panel to adjust engine weights/thresholds live (great demo moment: nudge the anomaly threshold and watch the alert count change).
6. **Full cross-cutting analytics** — the Ministry/State/District dashboard views from §12 all live inside the Admin Panel, unrestricted.

### 3.2 User Panel — what it contains, how it works

The User Panel is for an MP's office, a district officer, or (via the public QR link) a citizen — anyone *consuming* insights rather than feeding in data.

**Contains:**
1. **My Works Dashboard** — scoped automatically to the logged-in user's MP/district (chosen at a simple login/role-select screen — now backed by a real login screen, see §18).
2. **Progress & Fund Utilization view** — the chart set described in §13.1.
3. **Work Detail drill-down** — click any work to see its risk score, SHAP "why" reasons, photo, and map pin — same component as admin uses, just read-only (no verify/reject buttons).
4. **Duplicate/Anomaly Alerts relevant to them** — same review queue as admin, but *read-only*: a user can add a comment or "flag for review," which pushes it into the Admin Panel's queue, but cannot close it themselves.
5. **AI Assistant chat** — ask questions in natural language about their own works only (scope-limited text-to-SQL: always append a `WHERE mp_id = :current_user_mp_id` style filter server-side, regardless of what the LLM generates, so a user can never query outside their scope).
6. **Citizen sub-view** — a stripped-down, no-login variant of this panel reachable via a public link/QR code per work, showing only that one work's public-safe status (see §12's Citizen row).

### 3.3 How the two panels connect (the actual demo loop)

```
ADMIN uploads works.csv / payments.csv
        ▼
Backend parses + validates → preview shown to admin → admin confirms
        ▼
Processing Console shows live stages (parse → features → 5 engines → scoring)
        ▼
New/updated records + risk scores land in the DB
        ▼
USER PANEL dashboards refresh automatically (poll or manual "refresh" button)
   showing updated progress %, duplicate flags, fund utilization, map pins
        ▼
USER drills into a flagged work, reads the SHAP "why", asks the assistant a
follow-up question, optionally flags it for review
        ▼
ADMIN sees it land in the Review Queue, verifies it, marks feedback
```

This loop — upload something real, watch it get processed, see it appear as a scored, explained, chartable insight on the other panel — **is the single most important thing this prototype needs to nail.** Everything else in this document supports that loop.

---

## 4. Repository structure to generate

```
prahari/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, CORS, router includes
│   │   ├── database.py            # SQLAlchemy engine/session
│   │   ├── models.py              # ORM models (see §6)
│   │   ├── seed_data.py           # Synthetic dataset generator (see §5)
│   │   ├── routers/
│   │   │   ├── works.py           # CRUD + list/filter works
│   │   │   ├── risk.py            # GET risk score + SHAP explanation for a work
│   │   │   ├── engines.py         # POST /run-engines (re-score everything)
│   │   │   ├── vendors.py         # Graph data, Louvain clusters
│   │   │   ├── dashboard.py       # Aggregates per role (Ministry/State/District/MP)
│   │   │   ├── upload.py          # File upload, column-mapping preview, processing job status
│   │   │   ├── assistant.py       # Claude-powered chat + text-to-SQL
│   │   │   └── citizen.py         # Public QR-scan lookup for a single work
│   │   ├── engines/
│   │   │   ├── compliance.py      # Rule engine (§7.1)
│   │   │   ├── financial_anomaly.py   # IsolationForest + Benford's law (§7.2)
│   │   │   ├── duplicate_ghost.py     # Text similarity + geo + photo hash (§7.3)
│   │   │   ├── vendor_network.py      # NetworkX + Louvain (§7.4)
│   │   │   ├── predictive_delay.py    # GradientBoosting classifier (§7.5)
│   │   │   └── explain.py             # SHAP wrapper, produces plain-English reasons
│   │   └── schemas.py             # Pydantic response models
│   ├── data/mplads_guidelines.md  # Condensed real MPLADS guideline text for RAG-lite
│   ├── requirements.txt
│   └── run.sh
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── MinistryDashboard.jsx
│   │   │   ├── StateDashboard.jsx
│   │   │   ├── DistrictDashboard.jsx
│   │   │   ├── MPDashboard.jsx
│   │   │   ├── WorkDetail.jsx         # single work: score, SHAP reasons, photo, map
│   │   │   ├── VendorGraph.jsx        # interactive network view
│   │   │   ├── Assistant.jsx          # chat UI
│   │   │   ├── AdminUpload.jsx        # drag-drop upload + column-mapping preview
│   │   │   ├── ProcessingConsole.jsx  # live stage/progress log after upload confirm
│   │   │   ├── ReviewQueue.jsx        # admin verify/reject flagged works
│   │   │   └── CitizenView.jsx        # public, no login, QR-scan landing page
│   │   ├── components/
│   │   │   ├── RiskBadge.jsx
│   │   │   ├── AlertList.jsx
│   │   │   ├── HeatMap.jsx            # Leaflet
│   │   │   ├── ProgressDonut.jsx      # chart #1, §13.1
│   │   │   ├── FundUtilizationGauge.jsx  # chart #3, §13.1
│   │   │   ├── DuplicatePanel.jsx     # chart #2, §13.1
│   │   │   ├── RiskHistogram.jsx      # chart #5, §13.1
│   │   │   ├── TrendChart.jsx         # Recharts
│   │   │   ├── ShapReasonCard.jsx
│   │   │   └── RoleSwitcher.jsx
│   │   ├── api/client.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/assets/                  # drop generated images here (see §17)
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml
└── README.md                       # points back to this build doc
```

---

## 5. Real dataset ingestion — use the actual MoSPI/eSAKSHI export files, not synthetic data as the base

Seven real files are available (from `mplads.mospi.gov.in`) and **must be the primary seed data**, not a placeholder. This is a major upgrade from a purely synthetic demo: judges can see the platform running on real national numbers. Synthetic data is now only a *supplement* for the few things the real export doesn't contain (see §5.8). Load order matters — allocations and MP identity first, then works, then expenditures, because expenditures join back to works/MPs by name, not by a clean foreign key.

### 5.1 `Allocated_Limit_for_Honble_MPs__Loksabha_1_.csv` (544 rows)
Columns: `Sr. No.`, `State`, `Hon'ble Members of Parliaments`, `Constituency`, `Allocated AMOUNT (₹)`.
→ Loads into `MP` table: `name` (already plain uppercase, e.g. `AASHTIKAR PATIL NAGESH BAPURAO`), `state`, `constituency`, `entitlement_total`, `house = 'Lok Sabha'`.

### 5.2 `Allocated_Limit_for_Honble_MPs_Rajya_sabha.csv` (233 rows)
Columns: `Sr. No.`, `State`, `Hon'ble Members of Parliament`, `Elected/Nominated`, `Allocated AMOUNT (₹)`.
→ Same `MP` table, `house = 'Rajya Sabha'`. **Important data-cleaning step:** names here look like `"Dr. Abhishek Manu Singhvi (2026-32) (2026-2032)"` — honorifics (`Dr.`, `Shri`, `Smt.`, `Kumari`) and trailing term-year parentheses must be **stripped and normalized to uppercase** before this MP can be matched against the other five files, which use plain uppercase names with no honorific (e.g. `mplads_mp_summary` has `"Smt. Sudha Murty (2024-30)"` in some rows too — the same cleaning function must run on every file, not just this one). Write one shared `normalize_mp_name()` utility used everywhere a name is read.

### 5.3 `mplads_recommended_works_2026-09-22.csv` (15,640 rows)
Columns: `Work ID`, `Work Description`, `Category`, `MP Name`, `Constituency`, `State`, `House`, `Recommended Amount (₹)`, `Recommendation Date`, `Has Images`, `IDA`.
→ Loads into `Work` with `status = 'Recommended'`, `sanctioned_amount = Recommended Amount`, `sanctioned_date = Recommendation Date`, `has_images` boolean, `implementing_agency = IDA`. This is your **pending/backlog** work list — use it to drive the Predictive Delay Engine (§7.5) and the Progress chart's "Not Started/Recommended" bucket.

### 5.4 `mplads_completed_works_2026-09-22.csv` (45,817 rows)
Columns: `Work ID`, `Work Description`, `Category`, `MP Name`, `Constituency`, `State`, `House`, `Final Amount (₹)`, `Completed Date`, `Has Images`, `Average Rating`, `IDA`.
→ Loads into the same `Work` table with `status = 'Completed'`, `final_amount`, `completion_date`. **Note the actual data quirk:** Work IDs in this file and in the recommended-works file **do not overlap** (verified: 0 shared IDs across 44,028 vs 15,241 unique IDs) — this snapshot's "recommended" list is only recently-recommended, still-pending works, not the full historical backlog the completed works were drawn from. Do **not** try to join completed→recommended by Work ID to compute "days from recommendation to completion" — that field isn't reliably derivable from this snapshot; use `completion_date` recency and category-level benchmarks instead, and say so plainly in any "processing time" chart rather than presenting a fabricated number.

### 5.5 `mplads_expenditures_2026-09-22.csv` (108,695 rows)
Columns: `MP Name`, `Constituency`, `State`, `House`, `Work Description`, `Vendor`, `IDA`, `Expenditure Amount (₹)`, `Expenditure Date`, `Payment Status`.
→ Loads into `Payment`. **This file has no Work ID** — it only carries the free-text `Work Description`. Join each payment to a `Work` row by: (a) exact match on normalized MP name + Constituency + Work Description, falling back to (b) the same **LaBSE/sentence-transformers cosine similarity** used by the Duplicate Detector (§7.3) — reuse that model here as the join key resolver, threshold ≥0.9 for an auto-match, 0.75–0.9 queued as "needs admin confirmation" in the Upload/Processing Console, below 0.75 left as an **unmatched/orphan payment** (which is itself a flaggable anomaly — money spent with no traceable sanctioned work, see §19).

### 5.6 `mplads_mp_summary_2026-09-22.csv` (774 rows — one per MP)
Columns include `Allocated Amount`, `Amount Recommended`, `Total Expenditure`, `Utilization %`, `Completed Works`, `Recommended Works`, `Completion Rate %`, `Balance Not Yet Paid to Vendors (₹)`, `Transaction Count`, `Successful Payments`, `Pending Payments`, `Average Rating`.
→ This is a **pre-aggregated rollup** — use it directly to populate the MP-level dashboard cards without re-deriving totals from raw works/payments (much faster), but also use it as a **cross-check**: recompute the same totals from the raw `Work`/`Payment` tables you just ingested and flag any MP where your recomputed number disagrees with this file's number by >2% — a disagreement usually means a join failure upstream (see §5.5) and is worth surfacing to the admin as a data-quality warning, not silently ignored.

### 5.7 `json_2026-09-22.json`
A single national-totals snapshot (`totalAllocated`, `totalExpenditure`, `completionRate`, `pendingWorks`, etc.). → Use this to render the **Ministry Panel's top-line KPI strip** (the four/five big numbers above the heatmap) and as a sanity check that your ingested totals roughly reconcile with the official cached dashboard figures.

### 5.8 What the real data does *not* contain — synthetic augmentation still needed for exactly these
- **No GPS coordinates, no lat/lng** — `Work` has no location field in any file. Geocode by `Constituency`/`State` centroid for map plotting (good enough for a national heatmap), and clearly label the map as constituency-level, not exact-site-level, since site-level PostGIS proximity checks (§ old duplicate-detector geo check) aren't possible on this data as-is.
- **No actual photo files** — `Has Images` is a boolean, not a URL or blob. The image-based checks in §7.3 and the new §9 progress-verification feature need **actual image bytes**, which this export doesn't provide. Two options: (a) build the Admin Upload flow to accept real photos an agency/officer uploads live (this is the realistic, honest version — see §9), and/or (b) for demo purposes only, synthetically attach a small number of stock construction photos (with injected EXIF) to ~50 sampled completed works so the photo-check UI has something to show on first load — clearly label these in the UI as "sample" data, never claim they're the real MPLADS photos.
- **No confirmed fraud/ground-truth labels** — as before, this is genuinely true even in production; `IsolationForest` and the autoencoder are chosen specifically because they don't need labels (§8 covers how their outputs become a percentage).

This seed/ingestion pipeline (real data + the two labelled synthetic gaps above) is now the single most important piece of the build — the demo's credibility comes from it being real national numbers, not a toy dataset.

---

## 6. Core data model

```python
MP(id, name, name_raw, house, state, constituency, entitlement_total,
   allocated_amount, amount_recommended, total_expenditure, utilization_pct,
   completed_works_count, recommended_works_count, completion_rate_pct,
   balance_unpaid, transaction_count, successful_payments, pending_payments)
Work(id, work_id_source, title, category, mp_id, state, constituency,
     implementing_agency, sanctioned_amount, final_amount, sanctioned_date,
     completion_date, status,          # 'Recommended' | 'Completed'
     has_images, avg_rating, lat, lng, unit_quantity, unit_type)
Vendor(id, name)
Payment(id, work_id, vendor_id, amount, payment_date, payment_status,
        match_confidence, match_method)   # how this payment was joined to a Work — see §5.5
Photo(id, work_id, file_path, gps_lat, gps_lng, timestamp, phash, is_synthetic_sample)
ProgressCheck(id, work_id, previous_photo_id, new_photo_id, authenticity_score_0_100,
              subcheck_breakdown_json, verdict, computed_at)   # see §9
RiskScore(id, work_id, score_0_100, engine_breakdown_json, shap_reasons_json,
          confidence_by_irregularity_json,   # see §8
          guideline_clause, computed_at)
OfficerFeedback(id, work_id, flag_true_or_false, note, officer_role, created_at)
User(id, username, password_hash, role,   # 'admin' | 'mp_user' | 'district_user'
     linked_mp_id, linked_constituency)   # see §18
```

`engine_breakdown_json` stores each of the 5 engines' individual sub-scores; `shap_reasons_json` stores the top 3–5 SHAP-driven, plain-English reasons (see §7.6).

---

## 7. The five engines — what to actually implement

### 7.1 Compliance Rule Engine (deterministic, no ML)
Hard-code these real MPLADS rules as Python `if/else` checks against each work:
- SC/ST earmarking: flag if cumulative SC-area spend < 15% or ST-area spend < 7.5% of an MP's entitlement to date
- Ineligible category check (e.g. land acquisition, religious structures, private property — maintain a small denylist)
- Trust/society funding cap (currently ≤ ₹1 crore per trust/institution — verify against the current guideline text you include in `mplads_guidelines.md` and cite it)
- 1-year completion norm breach
Each violated rule contributes a fixed point value to the risk score and produces a guideline-clause citation string.

### 7.2 Financial Anomaly Engine
- `IsolationForest` on features: unit cost vs. category peer median, payment timing vs. sanction date, amount vs. threshold proximity
- Benford's Law check: leading-digit distribution of payment amounts per agency, flag agencies with high chi-square deviation
- "Just-under-threshold" clustering: flag amounts within 5% below any approval threshold

### 7.3 Duplicate & Ghost-Work Detector
- Embed all `title_en`/`title_hi` with `sentence-transformers`, cosine-similarity search for near-duplicates (threshold ~0.85)
- Haversine distance <50m between two works with similarity above threshold → "likely split work"
- `imagehash.phash()` on all photos, flag any pair with Hamming distance < 6 across *different* works
- EXIF GPS vs. work's registered lat/lng — flag if >2km apart; EXIF timestamp vs. claimed completion date — flag if outside a ±30 day window

### 7.4 Vendor Network Intelligence
- Build a NetworkX graph: MP → District → Agency → Vendor edges, weighted by total payment value
- Run `python-louvain` community detection, surface clusters where the same 2–3 vendors recur across ≥3 agencies
- Simple concentration metric: vendor's % share of district total spend

### 7.5 Predictive Delay & Lapse Engine
- `GradientBoostingClassifier` trained on synthetic labels (works you seeded as "completed on time" vs. "delayed") using features: work age, category, agency's historical on-time rate, days since last payment
- Output: probability of missing deadline, surfaced as a 0–100 "delay risk"

### 7.6 Explainability (SHAP)
- Run `shap.TreeExplainer` on the IsolationForest/GradientBoosting outputs
- Convert the top 3 SHAP features into a plain-English sentence template, e.g.: *"Flagged mainly because: unit cost is 2.1x the district peer average; vendor holds 58% of this agency's total spend; photo GPS is 3.4km from the registered work site."*
- Attach the relevant guideline clause string from the Compliance Engine where applicable

Combine all 5 engines' outputs into a single weighted 0–100 score (simple weighted sum is fine — document the weights, don't over-engineer this).

---

## 8. Confidence / accuracy percentages — how each irregularity type gets a number, not just a flag

Every irregularity the platform surfaces must show a **confidence percentage**, not a bare yes/no flag — this is what makes an alert feel like an analytical finding rather than a guess. Different detection methods produce percentages in genuinely different, correct ways; don't fake a single formula across all of them.

| Irregularity type | Detection method | How the % is computed | Notes |
|---|---|---|---|
| **Guideline/compliance violation** (SC/ST earmark, ineligible category, funding cap, deadline breach) | Deterministic rule | **100% if the rule is violated, 0% if not** — there's no statistical uncertainty in a rule match, so don't manufacture a fake confidence interval here. Severity (how far over the cap, how many days overdue) becomes a separate "severity" sub-score shown alongside the 100%. |
| **Cost/unit-price outlier** | `IsolationForest.decision_function()` | Convert the raw decision score to a **percentile rank against all other works in the same category**: `confidence = 100 × (1 − percentile_rank(score))`. A work whose cost is more anomalous than 95% of its peers shows "95% anomaly confidence." Recompute percentiles per category (roads vs. drinking water have very different cost distributions) — never rank across mixed categories. |
| **Financial-record anomaly (autoencoder)** | Reconstruction error (MSE) from the trained autoencoder | Same percentile-rank approach: `confidence = 100 × percentile_rank(reconstruction_error)` **within the training population**. Additionally expose the raw MSE in the SHAP-reason panel so an analyst can see the actual magnitude, not just the rank. |
| **Predictive delay/lapse risk** | `GradientBoostingClassifier.predict_proba()` | This one is a genuine model probability — use `predict_proba()[:, 1] × 100` directly as "probability of missing deadline," no rescaling needed. Report the model's **held-out validation accuracy/AUC once, in the admin's Engine Control panel** (§3.1), so the confidence numbers on individual works are backed by a stated overall model accuracy rather than presented as if perfectly reliable. |
| **Duplicate/split-work text match** | Cosine similarity from `sentence-transformers` embeddings | The similarity score **is** the confidence directly: `confidence = cosine_similarity × 100`. Show it as "94% text-match confidence" next to the two work descriptions side by side. |
| **Vendor concentration/collusion** | Louvain community + concentration ratio | Confidence = the vendor's **% share of the agency/district's total spend** — again the metric itself is the natural percentage, don't invent a second derived score on top of it. |
| **Reused/duplicate photo** | `imagehash` Hamming distance | `confidence = 100 × (1 − hamming_distance / max_possible_distance)` (max is typically 64 for a standard phash) — a distance of 2 out of 64 reports as ~97% confidence the photos are the same image. |
| **Progress-photo authenticity** | Ensemble of CV sub-checks | See §9 — this one has its own weighted breakdown since it combines several signals. |
| **Balance/utilization mismatch** (e.g. 100% utilization with 0% completion) | Deterministic rule on `mplads_mp_summary` fields | 100% if the mismatch condition is met, same treatment as compliance rules — this is a data fact, not a statistical estimate. |
| **Orphan/unmatched payment** | Join-confidence from §5.5 | Report `100 − match_confidence` as the "orphan risk" — a payment the join step matched at only 40% confidence surfaces as a 60% "possible unmatched/misattributed expenditure" flag. |

**One rule that must hold everywhere:** never show a bare percentage without the method name next to it (e.g. "97% photo-match confidence (perceptual hash)" not just "97%") — a judge or officer should always be able to tell whether a number came from a deterministic rule, a statistical percentile, or a trained model's own probability, because those carry very different evidentiary weight and conflating them is exactly the kind of black-box behavior SHAP-based explainability (§7.6) exists to avoid.

---

## 9. Image-based progress verification (new capability — upload & compare)

This is a genuinely new engine, separate from the five in §7, and it's the one place in the platform where a **person actively uploads something and gets an answer back**, so it deserves its own build section. Because the real MPLADS export has no actual photo bytes (§5.8), this feature is fed by **live uploads** — an implementing agency or field officer uploads a progress photo at a checkpoint (e.g. 25/50/75/100%), and the system checks it against the **previous checkpoint's photo for that same work** to verify genuine physical progress occurred, rather than the same photo (or an unrelated one) being reused.

### 9.1 Flow
1. Admin or User uploads a photo for a specific `work_id`, tagged with a claimed progress percentage.
2. Backend pulls the **most recent previously-uploaded photo** for that same work (if none exists, this upload just becomes the new baseline — nothing to compare yet).
3. Runs the sub-checks in §9.2 against the (previous, new) pair.
4. Combines them into a single **Progress Authenticity Score (0–100%)**, stored on `ProgressCheck` with the full breakdown.
5. Surfaces a verdict: **"Genuine progress detected"** / **"No visible change — possible reused photo"** / **"Inconclusive — needs manual review"**, plus the same "why" breakdown pattern used everywhere else in the product (§7.6-style plain-English reasons, one per sub-check).

### 9.2 Sub-checks (all real, pip-installable, no training data required)

| Sub-check | Library | What it measures | Signal |
|---|---|---|---|
| **Reused-photo detection** | `imagehash` (perceptual hash) | Hamming distance between previous and new photo's phash | Near-0 distance → very likely the exact same image re-uploaded |
| **Structural similarity** | `scikit-image` (`structural_similarity`, SSIM) | Overall visual similarity after aligning/resizing both images to the same dimensions | SSIM close to 1.0 even when not a literal duplicate → recompressed/cropped copy of the same shot, still no real change |
| **Edge-density change** | `OpenCV` (Canny edge detection) | % change in detected-edge pixel density between the two photos | A genuine construction site gains structure (new edges: walls, road markings, pillars) over time; near-zero change is suspicious for a site claimed to have progressed |
| **Histogram/scene shift** | `OpenCV` (color histogram comparison) | Whether the two photos plausibly show the same physical scene from a similar angle | Wild scene mismatch → possibly a different location entirely, not just "no progress" |
| **EXIF cross-check** | `Pillow`/`piexif` | GPS distance between the two photos' embedded coordinates (should be small, same site); timestamp ordering (new photo's timestamp must be after the previous one, and consistent with the claimed elapsed time) | GPS >100m apart, or a timestamp that's earlier than the previous checkpoint, or absent EXIF entirely → flag for manual review, don't auto-reject (many phones/apps strip EXIF on upload, so absence alone is weak evidence) |
| **Scene-sanity check (optional, stretch goal)** | `ultralytics` YOLOv8n (pretrained, no fine-tuning needed) | Confirms the photo is an outdoor/construction-plausible scene at all (not e.g. a screenshot, a document photo, or an indoor selfie) | A cheap sanity filter, not a real "is this a road" classifier — say so plainly in the UI copy, don't oversell it as verifying the specific work category |

Weight these into the single Progress Authenticity Score as a simple documented weighted sum (e.g. 30% reused-photo check, 25% SSIM, 20% edge-density, 15% EXIF, 10% scene-sanity) — same "keep it simple, document the weights" philosophy as the main risk score in §7. Report the score with the method-labelled percentage rule from §8 (e.g. "8% authenticity confidence — near-identical image detected via perceptual hash, 97% match to the previous upload").

### 9.3 Where this lives in the UI
Admin Panel: a "Verify Progress Photo" action inside the Review Queue (§3.1), showing the previous/new photos side by side with the breakdown. User Panel: the upload control sits on the Work Detail page (§3.2) so an MP's office or field agency can submit a checkpoint photo directly; the authenticity result is shown back to them immediately, and low-confidence results are what lands in the Admin review queue.

---

## 10. Expanded financial & data-quality validation checks (beyond the five core engines)

The real export (§5) supports several concrete checks that go beyond what §7 already covers — build these as additional rule/statistical modules inside the Financial Anomaly Engine (§7.2) rather than new top-level engines, since they share its infrastructure:

| Check | Computed from | Signal it catches |
|---|---|---|
| **Utilization-without-delivery** | `mplads_mp_summary`: `Utilization %` ≈100 but `Completion Rate %` ≈0 | Funds fully allocated/recommended but nothing delivered — a real, directly computable red flag on this exact dataset |
| **Missing photographic evidence** | `Has Images = false` on a **completed** work | A completed work with no photo evidence at all — straightforward compliance gap, no ML needed |
| **Cost-per-unit outlier** | Regex-extracted quantity/unit from `Work Description` (e.g. "450m", "2km") ÷ `Final Amount`, compared to category peer median | Genuine unit-cost benchmarking on the real free-text descriptions — reuses the spaCy/regex approach from the original engine design |
| **Round-number payment clustering** | Leading/trailing digits of `Expenditure Amount` | Suspiciously round payments (₹5,00,000 exactly, repeatedly) cluster more than natural spending patterns would predict |
| **Benford's Law deviation** | Leading-digit distribution of `Expenditure Amount`, grouped by `IDA`/agency | Chi-square deviation from Benford's expected distribution per agency |
| **Vendor concentration** | `Vendor` field in `mplads_expenditures`, grouped by IDA/constituency | One vendor holding an outsized % share of an agency's total spend |
| **Payment-backlog mismatch** | `Balance Not Yet Paid to Vendors` vs. `Successful Payments`/`Pending Payments` counts in `mplads_mp_summary` | Large unpaid balance alongside a high completed-works count — vendors possibly not being paid for delivered work, or a reporting gap |
| **Duplicate/split work (real text)** | Near-duplicate `Work Description` + same MP + same Constituency across two different `Work ID`s | The actual duplicate-detector logic (§7.3), run for real on the genuine 45,817-row completed-works file rather than only on synthetic data |
| **Orphan expenditure** | Payments from §5.5 that fail to match any `Work` above the 0.75 similarity threshold | Money spent with no traceable sanctioned work behind it |
| **MP-summary reconciliation mismatch** | Recomputed totals vs. `mplads_mp_summary`'s own reported totals (§5.6) | A data-pipeline integrity check as much as a fraud check — surfaces upstream join problems to the admin |

Every one of these should produce a row in the same `RiskScore.confidence_by_irregularity_json` structure from §8, so the Work Detail page's "why" panel can list all of them side by side with their own correctly-typed confidence percentage.

---

## 11. API surface (FastAPI)

```
POST /api/auth/login            {username, password}      → session token + role + scope (see §18)
GET  /api/auth/me                                          → current user's role/scope, for the frontend to route correctly
POST /api/admin/upload           (multipart file)        → accepts CSV/XLSX, returns a preview + column-mapping suggestion + upload_id
POST /api/admin/upload/{id}/confirm   {column_mapping}    → commits mapped rows into the DB, kicks off processing job, returns job_id
GET  /api/admin/upload/{job_id}/status                    → polls processing stage: parsing/features/engine name/scoring/done, plus a short log array for the Processing Console UI
GET  /api/works?district=&mp=&status=&min_risk=       → filtered work list with scores
GET  /api/works/{id}                                    → full detail incl. photos, SHAP reasons, confidence_by_irregularity breakdown
POST /api/works/{id}/progress-photo   (multipart file, claimed_pct)  → runs the §9 sub-checks against the previous photo, returns the Progress Authenticity Score + breakdown
POST /api/engines/run                                    → re-score entire dataset (for demo "refresh" button)
GET  /api/vendors/graph                                  → nodes+edges for the network view
GET  /api/vendors/clusters                                → Louvain cluster list
GET  /api/dashboard/{role}?id=                            → aggregated stats scoped to role (see §12)
POST /api/assistant/chat        {message}                → Claude response, RAG-lite over guidelines
POST /api/assistant/query       {message}                → Claude emits SQL, backend executes read-only, returns table
GET  /api/citizen/work/{id}                                → public-safe subset of a work's data (for QR scan)
POST /api/feedback              {work_id, verdict, note}  → officer marks flag true/false (feeds retraining note in §18/§3.1)
```

For the text-to-SQL endpoint: pass the schema from §6 in the system prompt, instruct Claude to return **only** a SQL SELECT statement, reject anything that isn't a SELECT before executing (basic safety), and return the query + results.

---

## 12. Dashboards — what each role sees

| Role | Scope | Key widgets |
|---|---|---|
| **Ministry** | All 774 MPs/nationwide (demo: your 30) | National heatmap (Leaflet, clustered by risk), top-10 highest-risk districts, fund-lapse-risk gauge, vendor collusion cluster count |
| **State** | One state | District comparison bar chart, state-level SC/ST earmark compliance %, works nearing deadline |
| **District** | One district | Work list with risk badges, alert queue, "mark verified" action (writes to `OfficerFeedback`) |
| **MP** | Own works only | Entitlement utilization gauge, own works' risk scores, plain-language explanations, chat assistant |
| **Citizen (public, no login)** | One work, via QR/link | Sanctioned amount, status, photo, simple "reported vs verified" badge — no financial drill-down, no other works visible |

Every dashboard's numbers must come from the live SQLite data + engine outputs — no hardcoded mockups in the JSX.

---

## 13. UI/UX direction

### 10.1 Required charts — build exactly these, wired to real computed data

This is the explicit chart list the dashboards must contain (both Admin and User panels reuse the same components, just scoped differently):

| # | Chart | Type | Data it shows |
|---|---|---|---|
| 1 | **Progress Overview** | Donut + supporting stacked bar | Works split into Completed / In Progress / Delayed / Not Started, both as a % donut and a per-district stacked bar |
| 2 | **Duplicate & Ghost-Work Panel** | Stat card + table | Count of flagged duplicate/split/ghost works, with a table linking each pair (click → side-by-side comparison of the two works: descriptions, photos, distance apart) |
| 3 | **Fund Utilization** | Gauge/progress ring + trend line | Sanctioned amount vs. **Amount Used** vs. **Amount Left**, per MP/district, plus a month-over-month spend trend line |
| 4 | **Where Funds Are Used** | Leaflet map, pins/clusters colored by risk | Every work plotted at its lat/lng, colored green/amber/red by risk score, clustered at zoomed-out levels; clicking a pin opens the Work Detail panel |
| 5 | **Risk Distribution** | Histogram/bar | Count of works per risk-score bucket (0–19, 20–39, … 80–100) so an admin can see the overall health at a glance |
| 6 | **Vendor Network** | Force-directed graph | Vendor/agency nodes sized by total payment value, colored by Louvain cluster, so collusion rings are visually obvious |

Charts 1, 3 and 4 must appear on **every** scoped dashboard (Ministry/State/District/MP) — only the data scope changes, not the chart set. Chart 2 and 6 are primarily Admin Panel / District+ views. All charts read live from `/api/dashboard/{role}` and `/api/vendors/graph` — never hardcode chart data in the frontend.

### 10.2 General direction

- **Visual language:** trustworthy govt-tech, not flashy startup. Deep navy/indigo primary (`#1E3A5F` or similar), white space, one accent color for risk (amber→red gradient for score), green for verified/clean. Avoid gradients-everywhere and neon.
- **Typography:** a clean sans (Inter or similar), bilingual-ready (Devanagari fallback stack for Hindi labels).
- **Risk score is always a colored badge + number**, never just a number. 0–39 green, 40–69 amber, 70–100 red.
- **Every alert card must show a "why" on click/hover** — this is the product's core differentiator, don't bury it.
- **Map view is the hero of the Ministry dashboard** — lead with it.
- Keep it snappy: skeleton loaders while the (fast, local) API responds, no fake spinners longer than the real wait.
- Language toggle (EN/HI) in the top nav — even partial coverage (just labels, not full i18n) sells the accessibility story.

Refer to a frontend design skill/guide if available in your coding environment for concrete Tailwind tokens — don't default to generic Bootstrap-blue styling.

---

## 14. Demo / judge-walkthrough script (build the data to support this narrative)

1. **Open Ministry dashboard** → national heatmap shows 3–4 red-clustered districts
2. **Click a red district** → drill into District dashboard → see a work flagged 82/100
3. **Click the work** → SHAP explanation shows unit-cost outlier + reused photo + guideline clause citation, map shows the sanctioned location vs. the photo's EXIF GPS pin 3km away
4. **Open Vendor Network view** → show the Louvain-detected collusion ring the seed data planted, spanning 3 agencies
5. **Ask the AI assistant** (in Hindi-labelled UI, English text is fine for the demo) *"मेरे जिले में कौन से काम समय सीमा से अधिक हैं?"* → text-to-SQL pulls the real overdue list
6. **Mark a flag as "verified — false alarm"** on the District dashboard → mention this feeds the feedback loop for retraining (this can just be a note in the UI copy — you don't need to actually retrain live)
7. **Scan the citizen QR view** (open the public link) → show the same work with public-safe info only

---

## 15. Build order (suggested)

1. `seed_data.py` + models + SQLite — get realistic data existing first, everything else depends on it being right
2. Compliance + Financial Anomaly engines (fastest wins, no embeddings needed)
3. Basic FastAPI routes + a bare React shell hitting them (prove the pipe works end to end early)
4. Duplicate/Ghost-Work + Vendor Network engines
5. Predictive Delay engine + SHAP wrapper
6. Full dashboard UI polish (maps, charts, risk badges)
7. AI Assistant (chat + text-to-SQL) last — it's the most impressive but least load-bearing if time runs short
8. Citizen QR view — cheap to add, good judge-appeal, do it if time allows

---

## 16. What to explicitly *not* build (say this if asked, don't apologize for it)

Neo4j, Kubernetes, Airflow, Bhashini voice I/O, Google Earth Engine/Bhuvan satellite imagery, PyTorch Geometric, real YOLOv8 inference, JWT auth, Docker Compose beyond a nice-to-have. These are correctly listed in the technical-approach document as the production architecture; the prototype demonstrates the *same capabilities and reasoning* with lighter-weight, real, working substitutes. Judges evaluate whether the approach and demo are sound, not whether you deployed Kubernetes over a weekend.

---

## 17. Image & visual assets — ask before building, don't invent placeholders

**Do not silently drop in stock photos, generic SVG blobs, or AI-generated images on your own.** Instead, as one of your first outputs (before or alongside the initial scaffold), give the user a short list of exactly which images/graphics the UI needs, each with a ready-to-use image-generation prompt, so the user can generate them externally and drop the files into an `/assets` folder. Build the UI so it degrades gracefully (a clean solid-color/gradient placeholder with the right aspect ratio) until those files are supplied — never block the build waiting on them.

Likely asset needs to ask about (adjust based on what you actually design):

| Asset | Where used | Suggested size | Example generation prompt to hand the user |
|---|---|---|---|
| **Landing/login hero background** | Behind the role-select/login screen | 1920×1080, subtle | *"A minimal, abstract illustration of interconnected nodes and a subtle India map outline in deep navy and amber tones, flat vector style, lots of negative space, no text, suitable as a website hero background"* |
| **Empty-state illustration (no alerts)** | Shown when a dashboard has zero flagged works | 600×400, transparent bg | *"A simple flat-vector illustration of a magnifying glass over a clean checklist with a green checkmark, minimal navy/white/amber palette, no text, transparent background"* |
| **Empty-state illustration (no results/search)** | Search/filter with no matches | 600×400, transparent bg | *"A flat-vector illustration of an empty folder with a small question mark, minimal line-art style, navy and grey palette, transparent background"* |
| **Processing/loading animation** | Admin Upload Processing Console | Lottie JSON or short looping GIF, square | *"A minimal looping animation of a document being scanned by a magnifying glass with small checkmarks appearing, flat vector style, navy and amber color palette, seamless loop, transparent background"* — if generating a static fallback instead of Lottie: *"A flat-vector icon of a gear and a document mid-scan, navy and amber, transparent background"* |
| **Success/verified illustration** | Shown after an admin verifies a flag as resolved | 500×400, transparent bg | *"A flat-vector illustration of a shield with a checkmark and a small clipboard, navy and green palette, minimal and clean, transparent background"* |
| **Fraud/anomaly-flag illustration** | Alert detail empty/intro state | 500×400, transparent bg | *"A flat-vector illustration of a document with a red exclamation mark and a magnifying glass, minimal navy and red-amber palette, transparent background"* |
| **App logo / emblem** | Top nav, favicon | 512×512, transparent bg | *"A minimal geometric emblem combining a shield outline and a small checkmark, single navy color, flat, transparent background, suitable as an app logo"* |
| **Government-style header banner (optional)** | Top of the Ministry/citizen views for authenticity | 1600×200 | *"A subtle, professional horizontal banner texture in deep navy with a faint geometric pattern, suitable as a website header background strip, no text, no photos of real people or emblems"* |

If the design calls for anything beyond this list (a mascot, a specific icon set style, dark-mode variants, etc.), list it the same way — name, where it's used, size, and a prompt — rather than substituting your own generated image or leaving a broken `<img>` tag.

---

## 18. Login & demo accounts for the Admin/User panels

Both panels sit behind a real (if lightweight) login screen — not just a role dropdown — since a login flow is part of what was asked for and it makes the demo feel like an actual product rather than a toy switcher.

### 18.1 What to build
- A `User` table (see §6) with `username`, `password_hash` (use `bcrypt`/`passlib`, don't store plaintext even in a prototype), `role`, and for non-admin users a `linked_mp_id` or `linked_constituency` that scopes everything they see.
- `POST /api/auth/login {username, password}` → returns a simple session token (a signed JWT is fine, or even just an opaque server-side session id stored in SQLite — real JWT-and-refresh-token infrastructure is overkill here). `GET /api/auth/me` returns the current user's role and scope so the frontend knows which panel/dashboard to render.
- A plain login page (`Login.jsx`) with username/password fields — no "forgot password," no email verification, no real security hardening needed for a hackathon prototype, just enough that it isn't a fake dropdown.

### 18.2 Seed these demo accounts (so judges can log in immediately)

| Username | Password | Role | Scope |
|---|---|---|---|
| `admin` | `admin123` | Admin | Full access — upload, review queue, engine controls, all dashboards |
| `mp.singhvi` | `mp2026` | MP User | Scoped to `Dr. Abhishek Manu Singhvi` (a real MP in the Rajya Sabha allocation file) — pick 2–3 more real MP names from the ingested data and seed one login each, favoring MPs with a mix of high and low completion rates so the demo shows contrasting dashboards |
| `district.chittoor` | `district123` | District User | Scoped to `CHITTOOR` constituency (present in the real completed-works data) |
| `citizen` | *(none — public link, no login)* | Citizen | Reached only via the public QR/work-link flow from §3.2, never via this login screen |

Seeding logins against **real MP names and constituencies already present in the ingested data** (rather than generic "user1/user2") is a small touch that makes the demo noticeably more convincing — when the judge logs in as `mp.singhvi`, they should see that specific MP's real allocation, real completion rate, and real flagged works, not placeholder numbers.

---

## 19. What to hand back for the PPT

Once built, capture for slide use:
- 3–4 clean full-page screenshots (Ministry heatmap, Work Detail w/ SHAP reasons, Vendor Graph, Assistant chat)
- One annotated screenshot with callout arrows explaining the SHAP "why" panel — this is your strongest single visual
- A GIF or short screen recording of the click-through in §14, for a live-demo backup slide

This build README is the spec — the coding agent should be able to go from this document directly to a running `npm run dev` + `uvicorn` demo without further clarification on scope.
