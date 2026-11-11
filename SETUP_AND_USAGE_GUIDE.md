# Idégeneratorn (Idea Generator) — Local Setup & Complete User Guide

A comprehensive guide to cloning, installing, running, configuring, and leveraging the full capabilities of **Idégeneratorn**.

---

## Table of Contents
1. [Overview & Core Architecture](#1-overview--core-architecture)
2. [Prerequisites](#2-prerequisites)
3. [Step-by-Step Local Setup](#3-step-by-step-local-setup)
4. [Configuring LLM Providers](#4-configuring-llm-providers)
   - [Hosted Providers (OpenRouter, Anthropic, OpenAI)](#hosted-providers)
   - [Local Models (Ollama, LM Studio, MLX)](#local-models)
   - [Storage & Security of API Keys](#storage--security-of-api-keys)
5. [Using the App to Its Fullest Extent](#5-using-the-app-to-its-fullest-extent)
   - [1. Creating & Configuring Boards](#1-creating--configuring-boards)
   - [2. The Interactive Infinite Canvas](#2-the-interactive-infinite-canvas)
   - [3. Seeding Ideas (Manual Text, Links, and Leads)](#3-seeding-ideas)
   - [4. Expanding Ideas (Branching Generations)](#4-expanding-ideas)
   - [5. Combining Ideas (Cross-Breeding)](#5-combining-ideas)
   - [6. The Calibrated Jury & Medal Scoring](#6-the-calibrated-jury--medal-scoring)
   - [7. Autonomous Autopilot Mode](#7-autonomous-autopilot-mode)
   - [8. Scouts (X / Twitter Trends & AI Research Papers)](#8-scouts)
   - [9. Cross-Board Collaboration (Guests & Spinoffs)](#9-cross-board-collaboration)
   - [10. Generating Claude Code Projects (One-Click Kickoffs)](#10-generating-claude-code-projects)
   - [11. Trends Dashboard & Markdown Reports](#11-trends-dashboard--markdown-reports)
   - [12. Exhibition Mode](#12-exhibition-mode)
6. [CLI Commands & Calibration](#6-cli-commands--calibration)
7. [Troubleshooting & FAQ](#7-troubleshooting--faq)

---

## 1. Overview & Core Architecture

**Idégeneratorn** is an evolutionary idea engine built as a local-first application. Instead of one-off chat threads, it treats ideation as an evolutionary graph:
- **Nodes** are concepts with titles, pitches, jury scores, keywords, and lineage.
- **Edges** represent parental relationships (expansions and crosses).
- **The Engine** evaluates ideas against a specific board goal using a calibrated 3–15 scoring matrix, dynamically branching the most promising concepts and crossing strong parents.
- **Node.js + Embedded SQLite**: Uses Node's built-in `node:sqlite` (`DatabaseSync`), requiring zero external database configuration or setup.

---

## 2. Prerequisites

- **Node.js**: Version **22+** (recommended: Node 22 LTS or newer).
- **Git**: Installed and accessible in your shell.
- **Browser**: Any modern browser (Chrome, Firefox, Safari, Edge).
- **LLM Access**: An API key for OpenRouter, Anthropic, or OpenAI — or a local instance of Ollama / LM Studio.

---

## 3. Step-by-Step Local Setup

### Step 1: Clone the Repository
Open your terminal and clone the repository:

```bash
git clone https://github.com/CLIC-Ethiopia/idea-generator-2.git
cd idea-generator-2
```

### Step 2: Install Dependencies
The application has minimal dependencies (`@anthropic-ai/sdk`):

```bash
npm install
```

### Step 3: Run the Verification Tests (Optional but Recommended)
Run the built-in 50 unit tests to verify your environment and `node:sqlite` compatibility:

```bash
npm test
```
*You should see all 50 tests pass (`1..50 pass 50`).*

### Step 4: Configure Environment Variables (Optional)
You can configure environment variables via an `.env` file or export them directly in your shell:

```bash
cp .env.example .env
```

Edit `.env` to customize settings:
```bash
# Server port and host
PORT=3000
HOST=0.0.0.0
DB_FILE=data/ideas.db

# Optional fallback keys (can also be entered in the web UI)
OPENROUTER_API_KEY="sk-or-v1-..."
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
```

### Step 5: Start the Server

- **Development Mode** (auto-reloads on file changes):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

The server will print:
```text
Idégeneratorn: http://localhost:3000
```

### Step 6: Access the App
Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 4. Configuring LLM Providers

Every AI operation (branching, crossing, jury scoring, summarizing, and web scout analysis) requires an LLM.

### Hosted Providers

1. In the top-right corner of the app header, click the **🔑 (App Settings)** button.
2. Enter your API key for your chosen provider:
   - **OpenRouter (Recommended)**: Gives access to `anthropic/claude-sonnet-5.5` (the calibrated default judge) as well as `x-ai/grok-4.3` (which powers live search for the X trend scout).
   - **Anthropic**: Direct first-party Claude models (`claude-sonnet-5.5`, `claude-opus-5-5`, etc.).
   - **OpenAI**: GPT-4o, o1, etc.
   - **Azure OpenAI / Microsoft Foundry**: For deployed enterprise and Copilot models.
3. Click the **Test (`…`)** button next to the input to verify that your key connects successfully.
4. Click **Save (`Spara`)**.

### Local Models

If you prefer offline or zero-cost execution:
1. Start your local server, e.g., **Ollama**:
   ```bash
   ollama run qwen3:8b
   ```
2. In the app settings (🔑), locate **Ollama (local)** (default URL: `http://localhost:11434`).
3. Click **Test** to load the available models into the app's catalog.
4. In **Board Settings (⚙)**, assign your local model (e.g. `ollama:qwen3:8b`) to roles such as Expand or Combine.

### Storage & Security of API Keys
- Keys entered in the UI are stored exclusively in your browser's `localStorage` (`ideagen.settings.v1`).
- On connection, they are sent to the local server in memory only and are **never written to disk or logged**.
- Budget safety limits can be configured in the settings (default: $5.00/day safety cap).

---

## 5. Using the App to Its Fullest Extent

### 1. Creating & Configuring Boards
- Click the board title in the top bar or open the board dropdown (`Tavlor ▾`) and select **`＋ New Board`**.
- **Title**: A concise name for your ideation space (e.g. *"AI for Education"*).
- **Goal**: The North Star statement (e.g. *"Build an AI-powered SaaS tool that reduces teacher grading workloads by 80%"*). Every prompt and jury decision factors this goal in!
- **Persona Template**:
  - **Inventor (`Uppfinnaren`)**: Practical mechanisms, bold leaps, real-world utility.
  - **Business (`Affärsstrategen`)**: Business models, unit economics, defensibility, pricing.
  - **Sustainability (`Omställaren`)**: Resource reduction, circular economy, community impact.
  - **Wild Card (`Galningen`)**: Provocative, lateral thinking, assumption-breaking concepts.
- **Language**: Toggle between **EN** (English) and **SV** (Swedish) at any time with the header button.

### 2. The Interactive Infinite Canvas
- **Pan**: Click and drag any empty canvas area.
- **Zoom**: Mouse wheel, pinch-to-zoom, or the `＋` / `−` buttons on the bottom right.
- **Fit to Screen**: Press `f` on your keyboard or click the `⤢` button.
- **Family Lineage Highlighting**: Hover over any idea bubble to illuminate its ancestors and descendants while dimming unrelated nodes.
- **Bubble Size**: Nodes dynamically expand as their jury score increases (3/15 is small; 13–15/15 gold is large with a radiant gold halo).

### 3. Seeding Ideas
- **Quick Seed**: Type any raw idea into the text bar at the bottom (`Frö / Seed`) and press **Enter** (or press `/` from anywhere on the canvas to focus the input).
- **Web Link Distillation**: Paste a URL (e.g., `https://arxiv.org/abs/...` or a blog post). The server fetches the page, strips boilerplate, and distills the core insight into a title and pitch.
- **Double Click Canvas**: Double click any coordinate to place a seed at that specific canvas location.

### 4. Expanding Ideas (Branching Generations)
1. Click any node on the canvas to open the inspection panel on the right.
2. Click **`＋ Expand` (`＋ Utveckla`)**.
3. The LLM creates 3 distinct offspring arranged in an arc around the parent:
   - A **close variation** that sharpens the core idea.
   - A **domain transfer** borrowing mechanisms from another field.
   - A **bold leap** challenging baseline assumptions.

### 5. Combining Ideas (Cross-Breeding)
You can cross-breed two separate concepts into a single hybrid:
- **Method A (Drag & Drop)**: Click and drag one idea node directly onto another. A dotted line will appear; release to combine.
- **Method B (Picker)**: Click a node, click **`⚡ Combine with...` (`⚡ Korsbefrukta`)**, and then click the target node on the canvas.
- The hybrid is placed midway between the parents and inherits links from both.

### 6. The Calibrated Jury & Medal Scoring
Every new idea is automatically queued for judging:
- **Criteria (1–5 scale each)**:
  - **Originality**: Novelty and freshness.
  - **Feasibility**: Practical execution likelihood.
  - **Impact**: Potential transformative effect on the board's goal.
- **Medal Thresholds**:
  - 🥉 **Bronze**: 9–10 / 15
  - 🥈 **Silver**: 11–12 / 15
  - 🥇 **Gold**: 13–15 / 15 *(Gold is intentionally rare and triggers a celebration burst)*
- **Keywords**: The jury tags each concept with 2–4 canonical keywords used for global cross-board trend tracking.
- **Manual Overrides**: You can manually award medals or override scores in the right-hand panel.

### 7. Autonomous Autopilot Mode
Let the server breed the board automatically:
1. In the header bar, click the **`Manual` (`Manuell`)** pill to toggle it to **`Auto`**.
2. In **Board Settings (⚙)**, configure:
   - **Pace**: Seconds between steps (default: 10s).
   - **Rate Limits**: Max steps per hour and max USD budget per calendar day.
3. The algorithm runs tournament selection on existing scores to select the strongest parent pairs for combination, interspersed with expansions of promising unbranched concepts.
4. Autopilot runs in the background even if you close your browser tab.

### 8. Scouts (Trends & Research)
Click the **`Leads` (`Uppslag`)** button in the top bar to open the scouts sidebar:
- **X Trends**: Discovers live social trends related to your goal (requires OpenRouter with Grok). Only verified URLs cited by the search engine are presented.
- **AI Research**: Pulls recent academic papers (ArXiv, Hugging Face) matching your goal.
- **Seed from a Lead**: Click the `＋` on any lead or drag it directly onto the canvas to convert it into a board seed.

### 9. Cross-Board Collaboration
- **Announce (`📣 Annonsera`)**: Send an exceptional idea as a "guest" to other boards in your workspace. It retains a link back to its origin and can be crossed with concepts on the new board.
- **Spinoff (`⤴ Avknoppa`)**: Turn an exciting idea into the goal of an entirely new dedicated board with one click.

### 10. Generating Claude Code Projects
Turn an abstract gold idea into a production-ready codebase kickoff:
1. Select the idea and click **`→ Project` (`→ Projekt`)** (or enable auto-project generation on Gold in Board Settings).
2. The engine writes a structured project folder containing:
   - `CLAUDE.md`: Comprehensive kickoff brief with MVP features, non-goals, suggested stack, ordered first steps, open questions, and lineage.
   - `README.md`: With the command to launch the project.
   - `idea.json`: Machine-readable metadata and score lineage.
   - `vault/Home.md`: An initialized Obsidian notebook for working notes.
   - `.git`: An initialized Git repository with `main` branch.
3. Click **Copy Command** in the panel and paste it into your terminal:
   ```bash
   cd "~/Projekt/idea-projects/your-idea-slug" && claude
   ```

### 11. Trends Dashboard & Markdown Reports
- **Dashboard (`Översikt`)**: Visualizes keyword trends across all boards, showing frequencies, mean scores, sparklines over time, and filtered drill-downs.
- **Report (`Rapport`)**: Generates an executive summary of progress across all boards, including total ideas, medals, spend, active Claude Code projects, and high-level AI synthesis.
- **Export Markdown (`Exportera`)**: Downloads the entire board as a structured Markdown document with summaries and idea rankings.

### 12. Exhibition Mode
- Click **`Exhibit` (`Utställning`)** to enter full-screen presentation mode.
- Designed for workshops, demo halls, and live brainstorming sessions.
- Displays a clean dark-mode board with live rankings, prominent goals, and auto-camera tracking as visitors submit seeds.

---

## 6. CLI Commands & Calibration

The project includes built-in scripts in `package.json`:

```bash
# Start development server with file watching
npm run dev

# Start server in production mode
npm start

# Run all 50 automated tests (mocked LLM, offline)
npm test

# Run syntax and type validation
npm run lint

# Calibrate the jury prompt against benchmark weak/strong ideas (~$0.07 cost)
npm run calibrate

# Calibrate against a specific model
npm run calibrate -- --model ollama:qwen3:8b
```

---

## 7. Troubleshooting & FAQ

#### Q: I submitted text on the canvas but nothing happened.
- **Check Board Selection**: Ensure a board is open (title visible in the top bar).
- **Check API Key**: Open 🔑 (Settings). If using cloud providers, verify that your key is entered and passes the Test (`…`) check.
- **Check Terminal**: Look for any HTTP 502 error logs explaining which provider failed.

#### Q: Where is my data saved?
- Data is stored in SQLite at `data/ideas.db`.
- It persists across server restarts. You can back it up or copy it at any time:
  ```bash
  cp data/ideas.db data/ideas-backup.db
  ```

#### Q: How do I run on a different port?
- Pass the `PORT` environment variable:
  ```bash
  PORT=8080 npm start
  ```

#### Q: Can I run completely offline?
- Yes! Install [Ollama](https://ollama.com/), run a local model like `ollama run qwen3:8b`, and in the app settings set Ollama as the provider for generation roles.

---

*Enjoy breeding and discovering breakthrough ideas with Idégeneratorn!*
