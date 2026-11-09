# Yantra Autonomous ITIL Orchestration Platform — Comprehensive Development Logs

**Repository:** `https://github.com/sarvesh-huddedar_yash/Yantra`  
**Working Directory:** `/home/sar/dev/yantra`  
**Target Project Folder:** `/home/sar/dev/yantra/Yantra`  
**ServiceNow Instance:** `https://dev364281.service-now.com`  
**Local LLM Engine:** Docker container `llama-cpu-server` running `ghcr.io/ggml-org/llama.cpp:server` on `http://localhost:8080/v1`  
**Default Active Model:** `Qwen3-0.6B-Q4_K_M-Instruct.gguf`  
**Persistent Memory File:** `soul.txt` (Root & UI synced)  
**Documentation Generated:** 2026-11-09  

---

## Table of Contents
1. [Project Overview & Architectural Objectives](#1-project-overview--architectural-objectives)
2. [Phase 1: Environment Setup & Local Repository Clone](#2-phase-1-environment-setup--local-repository-clone)
3. [Phase 2: Security Hardening & Secret Sanitization](#3-phase-2-security-hardening--secret-sanitization)
4. [Phase 3: Local LLM Engine Discovery & Runtime Optimization](#4-phase-3-local-llm-engine-discovery--runtime-optimization)
5. [Phase 4: Design & Implementation of Persistent Memory (soul.txt)](#5-phase-4-design--implementation-of-persistent-memory-soultxt)
6. [Phase 5: Interactive-First Engineering Hub UI & Co-Pilot Console](#6-phase-5-interactive-first-engineering-hub-ui--co-pilot-console)
7. [Phase 6: Full CRUD Operations for LLM Assignment Rules](#7-phase-6-full-crud-operations-for-llm-assignment-rules)
8. [Phase 7: End-to-End Verification & Test Matrices](#8-phase-7-end-to-end-verification--test-matrices)
9. [File System & Architecture Reference](#9-file-system--architecture-reference)

---

## 1. Project Overview & Architectural Objectives

Yantra is an autonomous enterprise ITIL orchestration and execution platform designed to automate and supervise the lifecycle of ServiceNow Incident Management (`incident`), Service Requests (`sc_request`), and Request Items (`sc_req_item`).

### Core Design Principles:
1. **Zero Secret Leakage:** No plaintext credentials committed to version control; full `.env` encapsulation.
2. **Interactive-First Engineer Experience:** Rather than presenting irreversible direct automated outputs, the console gives the engineer complete visibility, consultation choices, and interactive decision overrides at each stage.
3. **Evolving Local Memory (`soul.txt`):** The system continuously evolves its triage and routing policies without retraining weights by writing structured decision records to local disk and injecting them into the Local LLM's context.
4. **Governance Guard:** Tickets in `Closed Complete` or `Resolved` states immediately trigger execution aborts, preventing unauthorized changes to historical ServiceNow records.

---

## 2. Phase 1: Environment Setup & Local Repository Clone

### 2.1 Repository Cloning
- **Remote Repository:** `https://github.com/sarvesh-huddedar_yash/Yantra.git`
- **Authentication Challenge:** The repository is private within the enterprise GitHub organization (`yashai`). Initial clone over standard HTTPS was rejected (`Authentication failed`).
- **Resolution:** Generated a GitHub Personal Access Token (PAT) with SAML single sign-on (SSO) authorization and cloned via credentialed HTTPS:
  ```bash
  git clone https://<PAT>@github.com/sarvesh-huddedar_yash/Yantra.git /home/sar/dev/yantra/Yantra
  ```
- **Remote URL Sanitization:** Stripped the embedded PAT from `.git/config` immediately following clone to ensure the token was not preserved on disk in git remotes:
  ```bash
  git remote set-url origin https://github.com/sarvesh-huddedar_yash/Yantra.git
  ```

### 2.2 Dependency Installation
- Installed Node.js dependencies in `/home/sar/dev/yantra/Yantra/ui`:
  ```bash
  cd /home/sar/dev/yantra/Yantra/ui && npm install
  ```
- Verified system packages: Node.js (v20+), Python 3.12, Docker engine, and Linux kernel utilities.

---

## 3. Phase 2: Security Hardening & Secret Sanitization

### 3.1 Audit Findings
Initial scan revealed hardcoded plaintext credentials (`<SERVICE_NOW_DEV_PASSWORD>`) and hardcoded ServiceNow instance URLs (`https://dev364281.service-now.com`) across:
- **28 Python Scripts** in `ui/src/` (`import_cmdb_inventory.py`, `create_support_groups.py`, `verify_groups.py`, etc.)
- **7 UI JavaScript/JSX Components** (`serverSnowClient.js`, `ServiceNowAdminView.jsx`, `Navbar.jsx`, `DashboardView.jsx`, `ServiceNowGeneratorView.jsx`, `MissingInfoManagerView.jsx`, `test_snow.js`)

### 3.2 Remediation Strategy
1. **Centralized Environment File (`ui/.env`):**
   ```env
   # ServiceNow Instance Credentials
   SNOW_INSTANCE_URL=https://dev364281.service-now.com
   SNOW_USERNAME=admin
   SNOW_PASSWORD=<SERVICE_NOW_DEV_PASSWORD>

   # Local LLM Engine Configuration
   LOCAL_AI_ENDPOINT=http://localhost:8080/v1
   LOCAL_AI_MODEL=/models/Qwen3-0.6B-Q4_K_M-Instruct.gguf
   LOCAL_AI_PROVIDER=llama_cpp

   # Vite Frontend Environment Variables
   VITE_SNOW_INSTANCE_URL=https://dev364281.service-now.com
   VITE_LOCAL_AI_ENDPOINT=http://localhost:8080/v1
   VITE_LOCAL_AI_MODEL=/models/Qwen3-0.6B-Q4_K_M-Instruct.gguf
   ```
2. **Python Shared Config Module (`ui/src/snow_config.py`):**
   Created a single Python configuration provider that dynamically parses `ui/.env` and falls back to system environment variables.
3. **Automated Code Replacement:**
   Replaced all hardcoded string references across all 28 Python scripts and 7 UI components to consume `snow_config` or `process.env`.
4. **Git Security Enforcement:**
   Added `.env` and `ui/.env` to `.gitignore`. Verified exclusion with `git check-ignore -v ui/.env`.
5. **Syntax Correction:**
   Resolved missing closing brace errors in `ui/src/test_sc_request.py` and validated syntax across the codebase with `python3 -m compileall ui/src/`.

---

## 4. Phase 3: Local LLM Engine Discovery & Runtime Optimization

### 4.1 Local Inference Infrastructure
- Detected an active Docker container `llama-cpu-server` running `ghcr.io/ggml-org/llama.cpp:server` on host port `8080`:
  - OpenAI-compatible endpoints: `http://localhost:8080/v1/models` and `http://localhost:8080/v1/chat/completions`.
- Discovered 4 high-performance GGUF models stored locally in `/home/sar/dev/llama.cpp/llama.cpp/models`:
  1. `Qwen3-0.6B-Q4_K_M-Instruct.gguf` (Active runtime model, ~65-72 tokens/s on CPU)
  2. `DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf`
  3. `Hermes-2-Pro-Llama-3-8B-Q4_K_M.gguf`
  4. `Llama-3.2-1B-Instruct-Q4_K_M.gguf`

### 4.2 Reasoning Model Output Nuance
Reasoning-focused models (Qwen3 and DeepSeek-R1) output their internal thinking chain into the `reasoning_content` field rather than standard `content`.
Updated `callLocalLlmChat()` in `serverSnowClient.js` to reliably parse:
```javascript
const rawReply = (choice?.message?.content && choice.message.content.trim()) ||
                 (choice?.message?.reasoning_content && choice.message.reasoning_content.trim()) ||
                 '';
```

---

## 5. Phase 4: Design & Implementation of Persistent Memory (`soul.txt`)

### 5.1 Storage Architecture
Created persistent memory files at:
- `/home/sar/dev/yantra/Yantra/soul.txt`
- `/home/sar/dev/yantra/Yantra/ui/soul.txt`

### 5.2 Record Schema
Each operational decision is encapsulated in an immutable, human-readable, and machine-parsable `[DECISION_RECORD]` block:
```
[DECISION_RECORD]
ID: Unique Rule Identifier (e.g. RULE-INIT-001)
TIMESTAMP: ISO-8601 Timestamp of Decision
STAGE: Operational Stage (e.g. Triage Routing, Parameter Gate, Runbook)
TICKET: Target Ticket / Work Item Reference
CRITERIA: Condition triggering this rule
DEFAULT_RECOMMENDATION: What AI or base taxonomy initially suggested
ENGINEER_DECISION: The override or choice made by the engineer
RULE: The generalized operational rule to remember and enforce
REASON: The engineer's technical rationale
AUTHOR: Engineer Name / Platform Role
```

### 5.3 Baseline Rules Seeded
1. **`RULE-INIT-001`**: Service restart requests for IIS, Web servers, or Application daemons (`W3SVC`, `Tomcat`, `Kestrel`) route directly to **Application Support** instead of Server Infrastructure (OS Team).
2. **`RULE-INIT-002`**: Database engine recycling and lock remediation (`MSSQLSERVER`, `PostgreSQL`) route to **Application Support** / DBA team.
3. **`RULE-INIT-003`**: If target CI is an enterprise Application Server (`BLR-APP-*` or `PNE-APP-*`) and service daemon is unspecified, infer default service daemon as `W3SVC`.
4. **`RULE-INIT-004`**: Production tier CIs (`PRD-*`, `DC-001`) strictly require engineer interactive approval before initiating service shutdown phases.

### 5.4 Local LLM Context Injection
Updated `evaluateTicketWithAi()` in `serverSnowClient.js`:
- Loads all rules from `soul.txt` dynamically on every ticket evaluation.
- Injects rules into the Local LLM system prompt.
- When an engineer's operational decision in `soul.txt` matches a work item, the engine:
  - Overrides generic base taxonomy.
  - Elevates routing confidence to **99%**.
  - Cites the specific Rule ID and operational rationale directly in its chain of reasoning.

---

## 6. Phase 5: Interactive-First Engineering Hub UI & Co-Pilot Console

### 6.1 Interactive Command Bar
Located directly above the ticket details in `EngineerWorkspaceView.jsx`:
- **`[🤖 Consult Local LLM & Soul]`**: Evaluates ticket on demand referencing `soul.txt`.
- **`[💬 Interactive LLM Console]`**: Toggles the collapsible embedded chat console.
- **`[Override & Teach soul.txt]`**: Formulates a new operational policy and saves it into `soul.txt`.
- **`[🧠 soul.txt (X Rules)]`**: Opens the persistent memory inspector.

### 6.2 Soul-Aware Stage 1 (Taxonomy Assignment Router)
- **Active Soul Memory Banner**: Displays matching rules applied to the current ticket.
- **Decision Controls**:
  - `[Reassign to Identified: Application Support]`: Direct 1-click update to ServiceNow.
  - `[Override & Teach soul.txt]`: Formulates a new operational policy and saves it into `soul.txt`.
  - `[Set App Support]` / `[Set OS Team]`: Direct quick-assignment buttons.
  - `[Ask LLM Co-Pilot Why →]`: Queries the local model for explanation.

### 6.3 Interactive Local LLM Co-Pilot Console
- Embedded real-time chat powered by the local Docker container on `http://localhost:8080/v1`.
- Pre-built quick inquiry prompt chips:
  - *"Why route service restart to Application Support?"*
  - *"Does this CI have dependent services before restart?"*
  - *"Draft a PowerShell verification script for W3SVC"*
  - *"Explain how soul.txt rules apply to this ticket"*
- Real-time performance metrics (tokens/second throughput and latency in milliseconds).

### 6.4 ITIL Governance Guard
Maintained strict state verification: If ticket status is `Closed Complete` or `Resolved`, all automated processing, triage re-routing, parameter requests, and runbook executions are locked and historical audit evidence is preserved.

---

## 7. Phase 6: Full CRUD Operations for LLM Assignment Rules

To allow users to maintain and evolve their local LLM memory over time, full Create, Read, Update, and Delete capabilities were built across the backend and frontend.

### 7.1 Backend Block Parsing & Manipulation (`serverSnowClient.js`)
To prevent corruption of comments, section headers, or whitespace in `soul.txt`, the engine uses structural block parsing:
```javascript
function getBlockRuleId(block) {
  const lines = block.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('ID:') && !trimmed.startsWith('#')) {
      return trimmed.replace(/^ID:\s*/, '').trim();
    }
  }
  return null;
}

function splitBlock(block) {
  const lines = block.split('\n');
  const fieldLines = [];
  const trailingLines = [];
  let pastAuthor = false;
  for (const line of lines) {
    if (!pastAuthor) {
      fieldLines.push(line);
      if (line.trim().startsWith('AUTHOR:')) pastAuthor = true;
    } else {
      trailingLines.push(line);
    }
  }
  return {
    fields: fieldLines.join('\n'),
    trailing: trailingLines.join('\n')
  };
}
```

### 7.2 Backend API Routes (`vite.config.js`)
1. **`POST /api/soul/create-rule`** (and `commit-decision`): Appends a new rule block to `soul.txt`.
2. **`POST /api/soul/update-rule`**: Locates block by `id`, swaps updated fields, preserves trailing comments, and writes to disk.
3. **`POST /api/soul/delete-rule`**: Locates block by `id`, preserves any trailing comments by attaching to predecessor block, and deletes the record.
4. **`GET /api/soul/read`**: Returns all parsed rule objects and raw file content.

### 7.3 Frontend UI Controls

#### 1. In Engineering Hub (`EngineerWorkspaceView.jsx`)
- **Soul Memory Inspector Modal (`showSoulModal`)**:
  - `[+ Create New Rule]` button in modal header.
  - `[Edit]` button on every rule card opens pre-filled Edit Dialog.
  - `[Delete]` button on every card prompts for confirmation and deletes rule.
  - Live search bar filtering rules by ID, keyword, CI pattern, or group.
  - Raw `soul.txt` preview window.
- **Stage 1 Active Banner**:
  - Direct `[Edit Rule]` and `[Delete]` buttons embedded directly within the active Soul Rule alert banner.
- **Edit Rule Dialog (`showEditModal`)**:
  - Full modal allowing modification of stage, criteria, ticket reference, default recommendation, engineer decision group, rule statement, and reason.

#### 2. In LLM Configuration & Governance View (`LlmConfigView.jsx`)
- Under **Administration ➔ Tools Configuration ➔ Local AI & LLM Engine**:
- Added **Tab 5**: `5. LLM Assignment Rules & Soul Memory (X Rules)`
- Complete centralized administration interface with rule cards, keyword search, `[+ Create Assignment Rule]`, `[Edit]`, `[Delete]`, and raw disk preview.

---

## 8. Phase 7: End-to-End Verification & Test Matrices

### 8.1 API Test Results

| Step | Action | Request Payload / Command | Response Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Read Soul Memory** | `GET /api/soul/read` | `{"success":true,"totalRules":7,"rules":[...]}` | **PASS** |
| 2 | **Create Rule** | `POST /api/soul/create-rule` (ID: `RULE-TEST-E2E-001`) | `{"success":true,"ruleId":"RULE-TEST-E2E-001","totalRules":8}` | **PASS** |
| 3 | **Update Rule** | `POST /api/soul/update-rule` (Decision ➔ `Application Support`) | `{"success":true,"ruleId":"RULE-TEST-E2E-001","totalRules":8}` | **PASS** |
| 4 | **Verify Readback** | `GET /api/soul/read` (Query: `RULE-TEST-E2E-001`) | Returned updated rule with `Application Support` decision | **PASS** |
| 5 | **Delete Rule** | `POST /api/soul/delete-rule` (`{"id":"RULE-TEST-E2E-001"}`) | `{"success":true,"ruleId":"RULE-TEST-E2E-001","totalRules":7}` | **PASS** |
| 6 | **Confirm Deletion** | `GET /api/soul/read` | Verified record removed; totalRules reset to 7 | **PASS** |
| 7 | **LLM Dynamic Inference** | `POST /api/llm/evaluate-ticket` (Ticket: `RITM0010026`) | Qwen3 model cited `RULE-INIT-001`, recommended `Application Support` with 99% confidence | **PASS** |
| 8 | **Interactive Chat** | `POST /api/llm/interactive-chat` | Qwen3 responded citing `RULE-INIT-001` at ~31 tokens/s | **PASS** |

### 8.2 Frontend Production Build
Executed full Vite production build:
```bash
cd /home/sar/dev/yantra/Yantra/ui && npm run build
```
- Modules Transformed: **11,528**
- Build Time: **6.77s**
- Errors: **0**
- Warnings: **0 critical** (Standard chunk size informational notice)

---

## 9. File System & Architecture Reference

### Key Modified & Created Files

```
/home/sar/dev/yantra/
├── DEVELOPMENT_LOGS.md                               <-- Primary development log (Root)
├── Yantra/
│   ├── DEVELOPMENT_LOGS.md                           <-- Synchronized repository copy
│   ├── soul.txt                                      <-- Root persistent soul memory file
│   ├── .gitignore                                    <-- Hardened with ui/.env exclusions
│   └── ui/
│       ├── .env                                      <-- Encapsulated credentials & LLM endpoints
│       ├── soul.txt                                  <-- Synchronized UI soul memory file
│       ├── serverSnowClient.js                       <-- SNow client, soul CRUD engine, LLM caller
│       ├── vite.config.js                            <-- Vite dev server & backend API middleware
│       └── src/
│           ├── snow_config.py                        <-- Central Python credential provider
│           └── components/
│               ├── EngineerWorkspaceView.jsx         <-- Engineering Hub with Soul Co-Pilot & CRUD
│               └── admin/
│                   ├── LlmConfigView.jsx             <-- LLM configuration & Tab 5 Soul Rule Admin
│                   └── ServiceNowAdminView.jsx       <-- Sanitized ServiceNow connectivity
```

---

## 10. Operational Summary

The Yantra platform has evolved from static automation into an **Interactive, Soul-Aware Autonomous ITIL Orchestration System**:
- All operations are backed by the real **Local LLM (`llama.cpp` on port 8080)**.
- Engineers maintain **100% governance and oversight** with interactive consultation, live co-pilot assistance, and full CRUD control over assignment rules.
- Decisions recorded in **`soul.txt`** persist indefinitely across restarts, enabling the platform to continually adapt to team preferences and operational realities.
