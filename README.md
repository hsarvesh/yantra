# Yantra: Autonomous ITIL Orchestration & Execution Platform

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![Material UI](https://img.shields.io/badge/MUI-5.16-007FFF.svg)](https://mui.com/)
[![ServiceNow](https://img.shields.io/badge/ServiceNow-Utah%20%7C%20Washington-81B5A1.svg)](https://www.servicenow.com/)
[![Local AI](https://img.shields.io/badge/Local%20AI-LM%20Studio%20%7C%20Ollama-F97316.svg)](https://lmstudio.ai/)

Yantra is an enterprise-grade Autonomous ITIL Orchestration & Engineering Execution Platform. It bridges live ServiceNow ITSM records (Incidents, Service Requests, Request Items) with local AI reasoning engines (Ollama, LM Studio, vLLM) and human-in-the-loop automation runners.

---

## 🌟 Key Capabilities

### 1. Unified Multi-Ticket ITSM Ingestion
- Real-time bidirectional synchronization with ServiceNow Table APIs (`incident`, `sc_request`, `sc_req_item`).
- Unified triage queue with live category chips (`INC`, `REQ`, `RITM`), priority badges, and quick search.
- Interactive drill-down with direct deep-links into ServiceNow records.

### 2. Autonomous Local AI Triage & Taxonomy Routing
- Evaluates ticket summaries and descriptions against enterprise ITIL taxonomy structures (12 Support Groups).
- Detects group mismatches and enables 1-click group reassignment in ServiceNow.
- Runs on local LLM endpoints (LM Studio, Ollama) for zero-data-leakage enterprise governance.
- Built-in Local AI Engine configuration portal with model discovery (`/v1/models`), live connection probing, and prompt engineering.

### 3. Runbook Readiness & "Waiting for User Input" Handling
- Automatically parses incoming tickets against Standard Operating Procedures (SOPs).
- Validates mandatory execution parameters: Target Configuration Item (CI), Datacenter Location/IP, and Service/Daemon name.
- If information is missing, local AI drafts contextual clarification requests, transitions ticket status to **Waiting for User Input** (or **On Hold**), and pauses the execution gate.
- Re-evaluates readiness in real time upon parameter submission.

### 4. Human-in-the-Loop Execution & Cryptographic Auditing
- Verified procedural runners (e.g., Windows IIS Web Service, SQL Server Engine, Linux Nginx, SNMP Telemetry).
- Live MID Server streaming logs with color-coded operational phases (Shutdown, Flush, Startup, Socket Verification).
- Cryptographic SHA-256 execution proof generated upon task completion.
- Local AI work note synthesis for executive-ready engineering commentary.
- Tamper-proof commit directly into ServiceNow Work Notes stream with permanent closure.

### 5. Strict Terminal Abort Governance Guard
- Enforces ITIL compliance: If any ticket is in `Closed Complete`, `Closed`, or `Resolved` status (e.g., Incident `6`/`7`, RITM `3`, REQ `closed_complete`):
  - Immediately aborts all automated triage, routing, and runner executions.
  - Locks procedural controls to prevent unauthorized modifications to historical records.
  - Displays immutable audit proof and direct inspection links.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       ServiceNow                            │
│           (Incidents, Requests, Request Items, CMDB)        │
└───────────────▲─────────────────────────────▲───────────────┘
                │                             │
    REST / Table API (g_ck)         Work Notes & State Patch
                │                             │
┌───────────────▼─────────────────────────────▼───────────────┐
│              Yantra Orchestration Middleware                │
│              (Vite Proxy + serverSnowClient)                │
└───────────────▲─────────────────────────────▲───────────────┘
                │                             │
        Inference Stream              Interactive Controls
                │                             │
┌───────────────▼─────────────┐ ┌─────────────▼───────────────┐
│     Local AI Engine         │ │    Engineer Execution Hub   │
│   (LM Studio / Ollama)      │ │   (React + Material UI)     │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ / v22+ recommended)
- **Local AI Provider** (Optional for AI features): [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.com/) running locally on `http://127.0.0.1:1234` or `http://localhost:11434`
- **ServiceNow Instance**: Dev or Production instance with REST API access

### Installation

1. Clone repository:
   ```bash
   git clone <repository-url>
   cd Yantra
   ```

2. Configure environment variables:
   ```bash
   cp ui/.env.example ui/.env
   ```
   Edit `ui/.env` with your ServiceNow instance credentials and local AI settings:
   ```env
   SNOW_INSTANCE_URL=https://your-instance.service-now.com
   SNOW_USERNAME=admin
   SNOW_PASSWORD=your_password
   LOCAL_AI_ENDPOINT=http://127.0.0.1:1234/v1
   LOCAL_AI_MODEL=gemma
   ```

3. Install frontend dependencies:
   ```bash
   cd ui
   npm install
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Repository Structure

```
Yantra/
├── README.md                                          # Project documentation
├── .gitignore                                         # Git ignore rules (ignores secrets & dependencies)
├── Service_Request_Fulfilment_Execution_BRD.docx      # Business Requirements Document
└── ui/
    ├── .env.example                                   # Sample environment configuration
    ├── package.json                                   # NPM dependencies & scripts
    ├── vite.config.js                                 # Vite configuration & backend proxy middleware
    ├── serverSnowClient.js                            # ServiceNow client & Local AI orchestrator
    ├── Enterprise_ITSM_Taxonomy.xlsx                  # Imported corporate taxonomy dataset
    └── src/
        ├── App.jsx                                    # Main navigation & module tabs
        ├── main.jsx                                   # React application root
        └── components/
            ├── ItsmDashboardView.jsx                  # State of ITSM & KPI Dashboard
            ├── EngineerWorkspaceView.jsx              # Human-in-the-Loop Engineering Hub
            ├── LocalAiConfigurationView.jsx           # Local LLM Discovery & Configuration
            └── ServiceNowAdminView.jsx                # ServiceNow Connection & Schema Diagnostics
```

---

## 🔒 Security & Compliance

- **Zero-Credential Leaks**: Passwords and session cookies are loaded exclusively from local `.env` files which are excluded from source control.
- **Air-Gapped AI Support**: Local LLM endpoints ensure confidential ticket content and internal CI hostnames are never transmitted to external cloud providers.
- **Cryptographic Audit Proof**: All service executions generate an immutable SHA-256 digest committed directly into ServiceNow Work Notes.

---

## 📄 License
Internal Enterprise Automation Project. All rights reserved.
