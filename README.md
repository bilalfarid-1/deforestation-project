# 🌲 GreenGuard 2.0: Deforestation Detection Backend & Geospatial ML Core

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg)](https://www.python.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7.svg)](https://sequelize.org/)

The enterprise-grade backend and machine learning engine for **GreenGuard**, designed to power real-time geospatial forest monitoring, multi-temporal canopy change detection, and automated environmental complaint dispatching.

Engineered to seamlessly serve the [GreenGuard Frontend (`waniah321/green-guard`)](https://github.com/waniah321/green-guard).

---

## 🚀 Key Capabilities & Features

1. **Live Bi-Temporal Geospatial Analysis (`POST /api/reports/analyze`)**:
   - Compares Sentinel-2 satellite pairs ($T_1$ baseline vs $T_2$ current) across any quarter (2018–2025).
   - Computes multi-spectral vegetation indices ($\Delta\text{NDVI}$, $\Delta\text{NBR}$, $\Delta\text{EVI}$) and deep learning model ensemble inferences.
   - Generates high-resolution bi-temporal layers ($T_1$, $T_2$, and Delta Overlay with red deforestation clusters).
   - Decomposes monitored areas into localized sub-sectors (`MGH-422`, `MGH-104`, `MGH-208`, etc.) with confidence scores and alert statuses (`Critical`, `Warning`, `Stable`).

2. **Zero-Config Resilient Multi-DB Layer**:
   - Supports production **PostgreSQL** with automatic fallback to an embedded **SQLite** database (`data/greenguard.sqlite`) if PostgreSQL is offline—guaranteeing 100% startup reliability with zero local setup friction.

3. **Complete Report & History Persistence (`/api/reports`)**:
   - Enables saving analysis scans, listing past history, deleting records, and generating audit-ready PDF reports.

4. **Multi-Dimensional News Aggregator (`/api/news`)**:
   - Full-text search and filtering by query (`q`), category, specific date, month/year, date ranges, and sorting (newest/oldest/relevance).

5. **Community Forest Watchdog (`/api/community`)**:
   - Discussion forum with categorization (`Forest Protection`, `Satellite Tech`, `Reforestation`), upvoting, and volunteer group directories.

6. **Official Authority Complaint Dispatcher (`/api/send-complaint`)**:
   - Dispatches formatted HTML/text alert emails to environmental authorities with embedded analysis summaries.

7. **Identity & Security Services (`/api/auth`)**:
   - Bcrypt password hashing, JWT token authentication, and 6-digit OTP delivery for registration and password resets.

---

## 🛠️ Architecture Overview

```text
deforestation-project/
├── src/
│   ├── config/
│   │   ├── db.ts               # Dual-dialect database manager (PostgreSQL + SQLite fallback)
│   │   └── mail.ts             # Nodemailer transport with dev stream logger
│   ├── controllers/
│   │   ├── authController.ts   # Signup, verify OTP, signin, forgot/reset password
│   │   ├── reportController.ts # Live analysis, report persistence, history
│   │   ├── newsController.ts   # Multi-criteria filter & news search
│   │   ├── communityController.ts # Forum posts & upvotes
│   │   └── complaintController.ts # Official email complaint dispatcher
│   ├── models/
│   │   ├── User.ts
│   │   ├── PendingUser.ts
│   │   ├── AnalysisReport.ts
│   │   ├── CommunityPost.ts
│   │   ├── NewsArticle.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── reportRoutes.ts
│   │   ├── newsRoutes.ts
│   │   ├── communityRoutes.ts
│   │   ├── complaintRoutes.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces & types
│   └── server.ts               # Express application entrypoint
├── ml/
│   ├── inference_engine.py     # Python CLI & bi-temporal change detection
│   ├── spectral_engine.py      # NDVI, NBR, EVI, subsector tiling
│   ├── synthetic_satellite.py  # Realistic satellite synthesizers
│   ├── model_architectures.py  # DeepLabV3+, Attention U-Net, UNet++
│   └── requirements.txt        # Python dependencies
├── config/
│   ├── project_config.py       # 8 Sub-Himalayan AOI definitions
│   └── verify_aois.py          # Geometric boundary validator
├── gee_scripts/                # Earth Engine data export scripts
├── test/
│   └── test_api.ts             # Automated End-to-End API test suite
├── package.json
└── tsconfig.json
```

---

## 📦 Quickstart & Installation

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Install Python ML Dependencies (Optional for ML Renderer)
```bash
pip install -r ml/requirements.txt
```

### 3. Configure Environment (`.env`)
Create a `.env` file (copied from `.env.example`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=greenguard_super_secret_jwt_key_2026

# Database (defaults to zero-config SQLite)
DB_DIALECT=sqlite
DB_STORAGE=./data/greenguard.sqlite

# SMTP Mail Settings (Optional)
EMAIL_USER=greenguard.satellite@gmail.com
EMAIL_PASS=your_email_app_password
TARGET_COMPLAINT_EMAIL=waniahmaryam@gmail.com
```

### 4. Start Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

### 5. Build for Production
```bash
npm run build
npm start
```

### 6. Run Automated Test Suite
```bash
npm run test:api
```

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Initiate registration; sends 6-digit OTP |
| `POST` | `/api/auth/verify-otp` | Verify registration OTP and issue JWT |
| `POST` | `/api/auth/signin` | Authenticate user credentials |
| `POST` | `/api/auth/forgot-password` | Dispatch password reset OTP |
| `POST` | `/api/auth/reset-password` | Verify reset OTP and update password |

### Satellite Analysis & Reports (`/api/reports`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/reports/analyze` | Run live bi-temporal deforestation detection |
| `POST` | `/api/reports` | Save analysis scan to database history |
| `GET` | `/api/reports` | Fetch all historical reports |
| `GET` | `/api/reports/:id` | Fetch specific report by ID |
| `DELETE` | `/api/reports/:id` | Delete report by ID |

### News & Intelligence (`/api/news`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/news` | Query news by keyword (`q`), `category`, `specificDate`, `month`, `year`, `fromDate`, `toDate`, and `sortBy` |

### Community Hub (`/api/community`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/community/posts` | Fetch discussion threads (with category filter) |
| `POST` | `/api/community/posts` | Create new discussion |
| `POST` | `/api/community/posts/:id/upvote` | Upvote a discussion |

### Complaints Dispatcher (`/api/send-complaint`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/send-complaint` | Dispatch complaint email to authorities with attached scan report |

---

## 🛡️ License
MIT License. Built for environmental protection and sustainable forest management.
