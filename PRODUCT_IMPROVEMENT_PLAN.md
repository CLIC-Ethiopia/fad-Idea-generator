# Idégeneratorn — Product Improvement Plan & Consumer-Ready Specification

A comprehensive, research-backed product roadmap and technical specification designed to elevate **Idégeneratorn** from an experimental genetic brainstorming tool into a production-grade, consumer-ready creative intelligence platform.

This specification draws upon UX/UI paradigms, cognitive ergonomics, and spatial interaction patterns from leading AI canvas tools (**Miro Intelligent Canvas**, **Napkin AI**, **Heuristica**, **Whimsical**, and **Ideanote**).

---

## Table of Contents
1. [Vision & Design Constitution](#1-vision--design-constitution)
2. [Pillar 1: Canvas Ergonomics & Graph Navigation](#2-pillar-1-canvas-ergonomics--graph-navigation)
   - [1.1 Branch Folding & Progressive Disclosure](#11-branch-folding--progressive-disclosure)
   - [1.2 Interactive Mini-Map / Radar Navigator](#12-interactive-mini-map--radar-navigator)
   - [1.3 Semantic Auto-Clustering & Visual Grouping](#13-semantic-auto-clustering--visual-grouping)
   - [1.4 Multi-View Mode Switcher (Tree vs. 2x2 Matrix vs. Kanban)](#14-multi-view-mode-switcher)
   - [1.5 Smart Bezier Edge Routing & Label Collision Avoidance](#15-smart-bezier-edge-routing)
3. [Pillar 2: In-Canvas Contextual Actions & Micro-Interactions](#3-pillar-2-in-canvas-contextual-actions)
   - [2.1 Hover-Intent Floating Radial Action Bar](#21-hover-intent-floating-radial-action-bar)
   - [2.2 AI Lineage & Breeding Rationale (Visual Provenance)](#22-ai-lineage--breeding-rationale)
   - [2.3 Devil's Advocate / Stress-Test Mode](#23-devils-advocate--stress-test-mode)
   - [2.4 Inline Node Editing & Direct Typing](#24-inline-node-editing)
4. [Pillar 3: Keyboard-First Creative Velocity](#4-pillar-3-keyboard-first-creative-velocity)
   - [3.1 Speed-of-Thought Hotkeys](#31-speed-of-thought-hotkeys)
   - [3.2 Slash Command Palette (`/`)](#32-slash-command-palette)
5. [Pillar 4: Human-in-the-Loop Autopilot Controls & Safety](#5-pillar-4-human-in-the-loop-autopilot-controls)
   - [4.1 Step-by-Step Preview & Simulation](#41-step-by-step-preview--simulation)
   - [4.2 Rollback Timeline & Generation History](#42-rollback-timeline--generation-history)
   - [4.3 Starred Anchors & Genetic Priority](#43-starred-anchors--genetic-priority)
6. [Pillar 5: Production Output & Real-World Export](#6-pillar-5-production-output--real-world-export)
   - [6.1 Pitch Deck & Executive Summary Generator](#61-pitch-deck--executive-summary-generator)
   - [6.2 High-Res Vector SVG / PNG Canvas Export](#62-high-res-vector-svg--png-canvas-export)
   - [6.3 Task & Issue Tracker Handoff (GitHub / Linear / Trello)](#63-task--issue-tracker-handoff)
7. [Pillar 6: First-Run Experience & Consumer Polish](#7-pillar-6-first-run-experience--consumer-polish)
   - [7.1 60-Second Interactive Onboarding Flow](#71-60-second-interactive-onboarding-flow)
   - [7.2 Pre-Built Template Gallery](#72-pre-built-template-gallery)
   - [7.3 Touch & Mobile Tablet Optimizations](#73-touch--mobile-tablet-optimizations)
8. [Technical Architecture & Implementation Roadmap](#8-technical-architecture--implementation-roadmap)

---

## 1. Vision & Design Constitution

### The Problem
Traditional brainstorming tools are either static digital whiteboards that require manual typing, or chat-based LLM interfaces that bury ideas in sequential text streams. Idégeneratorn solves this through **evolutionary idea synthesis** (genetic recombination, automated judging, and web-grounded research).

However, as generation counts grow from 10 to 100+ ideas:
1. **Canvas Chaos**: Nodes tangle, overlap, and create high cognitive load.
2. **Action Distance**: Users have to navigate side panels and dialogs rather than directly manipulating ideas on the canvas.
3. **Black-Box Generations**: Users need clear visual reasons why two ideas were bred and what traits each contributed.
4. **Disconnection from Execution**: Brainstorming value drops if ideas cannot immediately export into actionable project artifacts.

### The Consumer-Ready Standard
A consumer-ready creative platform must satisfy five rules:
- **Zero Blank Canvas Anxiety**: The user never stares at an empty screen without obvious, single-click entry points.
- **Speed of Thought**: Any standard operation (expand, breed, evaluate, delete) takes ≤ 1 click or 1 keystroke.
- **Progressive Disclosure**: Detailed metrics, full prompts, and complex settings stay hidden until explicitly requested.
- **AI as Co-Pilot**: The AI proposes, suggests, and scores, but the human user always feels completely in control of the direction.
- **Tangible Outputs**: The session always concludes with exportable, structured artifacts (action plans, pitch decks, code bases).

---

## 2. Pillar 1: Canvas Ergonomics & Graph Navigation

### 1.1 Branch Folding & Progressive Disclosure
- **Concept**: Complex trees with dozens of sub-ideas clutter the screen. Parent nodes should display a small pill indicator (`−` / `+ N sub-ideas`) on their right edge.
- **Behavior**:
  - Clicking `−` collapses all descendant children and edges into the parent node with a smooth spring animation (200ms ease-out).
  - A subtle halo or stack badge appears behind the parent node indicating the number of hidden descendants (e.g., `+5`).
  - Clicking `+5` expands the branch back into full view.
  - Collapsing recalculates canvas bounds without jarring camera jumps.
- **Keyboard Shortcut**: `Alt + Click` or `[` to collapse branch, `]` to expand branch.

### 1.2 Interactive Mini-Map / Radar Navigator
- **Concept**: A non-intrusive floating radar window in the lower-left corner (180px × 120px) showing the global canvas topology.
- **Features**:
  - Displays miniaturized node dots colored by medal status (Gold: yellow, Silver: slate, Bronze: bronze, Unscored: muted blue).
  - Highlights a glowing translucent rectangle representing the user's current camera viewport.
  - **Drag to Pan**: Dragging the viewport rectangle in the mini-map smoothly pans the main canvas.
  - **Click to Teleport**: Clicking anywhere on the mini-map instantly centers the canvas on that cluster.
  - Can be toggled with `M` or a subtle expand/collapse chevron button.

### 1.3 Semantic Auto-Clustering & Visual Grouping
- **Concept**: Instead of scattered nodes, the canvas groups semantically related concepts inside soft, pastel-tinted boundary clouds (like Miro frames or Heuristica concept zones).
- **Behavior**:
  - A lightweight clustering pass (based on keywords or embeddings) groups ideas sharing tags or parent themes (e.g., *"B2B Enterprise Distribution"*, *"Hardware & Sensors"*, *"Gamification & Viral Growth"*).
  - Renders a rounded, translucent hull around the cluster with an editable header label.
  - Selecting a cluster header allows moving the entire cluster across the canvas as a single unit.

### 1.4 Multi-View Mode Switcher (Tree vs. 2x2 Matrix vs. Kanban)
Different stages of creativity require different mental models:
- **View A: Evolutionary Tree (Current Default)**:
  - Best for: Divergent ideation, tracking genetic lineage and mutations.
- **View B: 2x2 Impact vs. Feasibility Matrix**:
  - Best for: Convergence and prioritization.
  - Horizontal Axis: **Feasibility / Practicality** (derived from Judge Score: Realiserbarhet).
  - Vertical Axis: **Novelty & Impact** (derived from Judge Scores: Höjd + Djup).
  - Top-Right Quadrant ("Quick Wins & Moonshots") highlights the highest-fitness ideas immediately.
  - Dragging a node in Matrix view allows the user to manually re-rank its feasibility or impact.
- **View C: Kanban Pipeline**:
  - Best for: Converting ideas into work streams.
  - Columns: `🌱 Raw Seeds` → `🔬 Scored Candidates` → `⭐ Gold Medalists` → `🚀 Active Projects`.

### 1.5 Smart Bezier Edge Routing & Label Collision Avoidance
- **Edge Routing**: Replace rigid lines with smooth cubic Bezier splines that dynamically avoid routing directly through intermediate node rectangles.
- **Parentage Distinction**:
  - Primary Parent edge: Solid accent-colored line with flow arrow.
  - Secondary Recombination Parent edge: Dotted or dual-toned line.
- **Collision Avoidance**: Force-directed simulation incorporates a minimum 30px node-padding bounding box to prevent overlapping cards regardless of tree depth.

---

## 3. Pillar 2: In-Canvas Contextual Actions & Micro-Interactions

### 3.1 Hover-Intent Floating Radial Action Bar
Eliminate the need to travel back and forth to the side panel for standard operations:
- **Trigger**: Hovering over or selecting an idea node displays a sleek, circular 4-button floating toolbar directly adjacent to the node:
  1. **⚡ Expand (`E`)**: Triggers immediate 3-way divergent expansion.
  2. **🔗 Breed (`B`)**: Initiates interactive wire-dragging mode. The user drags a wire from this node and drops it onto another node to breed them immediately.
  3. **⚖️ Critique (`C`)**: Asks the jury AI to generate a brutal counterargument / stress-test.
  4. **⭐ Gold (`G`)**: Toggles gold medal / anchor status.

### 3.2 AI Lineage & Breeding Rationale (Visual Provenance)
- **Concept**: When looking at a synthetic idea, users must immediately understand *why* the AI created it.
- **UI Element**: Selecting any combined idea draws an animated glowing path back to both Parent 1 and Parent 2, and renders a compact **"Synthesis Recipe"** card in the inspector:
  - `Parent A [Contribution]`: *"Provided the offline mesh-networking protocol."*
  - `Parent B [Contribution]`: *"Provided the interactive peer-review incentive model."*
  - `Emergent Mutation`: *"Combined into a self-hosted school mesh that syncs whenever one device connects to the internet."*

### 3.3 Devil's Advocate / Stress-Test Mode
- **Concept**: Great products require rigorous critique, not just sycophantic praise.
- **Feature**: An option in the evaluation panel to toggle the Jury from **"Encouraging Mentor"** to **"Brutal Angel Investor / Red Team"**.
- **Output**: Generates 3 concrete failure modes:
  1. *Customer Adoption Friction* (Why users will refuse to switch).
  2. *Unit Economics Trap* (Hidden costs or margin killers).
  3. *Technical Edge Case* (Where the architecture fails in production).

### 3.4 Inline Node Editing & Direct Typing
- **Double-Click to Edit**: Double-clicking an idea's title or description on canvas turns it into an auto-expanding inline `contenteditable` textarea.
- **Instant Save**: Pressing `Cmd/Ctrl + Enter` or clicking outside saves immediately via `/api/ideas/:id` without opening modals.
- **Color Tagging**: Quick color picker (Slate, Emerald, Amber, Violet, Rose) on node corners to organize themes visually.

---

## 4. Pillar 3: Keyboard-First Creative Velocity

Brainstorming happens at the speed of thought. Any delay caused by moving a mouse to click distant buttons disrupts the creative state of flow.

### 4.1 Speed-of-Thought Hotkeys
| Key | Action | Context |
|---|---|---|
| `Tab` | Create a child branch (expands current node) | Node selected |
| `Enter` | Create a peer sibling idea | Node selected |
| `Space` | Center and frame current selection | Canvas / Node |
| `F` | Zoom to Fit entire board | Canvas |
| `1` – `5` | Assign manual 1–5 score to active idea | Node selected |
| `G` | Award Gold Medal / Pin as Anchor | Node selected |
| `Del` / `Backspace` | Archive / soft-delete idea | Node selected |
| `Cmd/Ctrl + Z` | Undo last canvas or AI action | Global |
| `Cmd/Ctrl + Shift + Z` | Redo action | Global |
| `/` | Open Quick Command Runner | Global |

### 4.2 Slash Command Palette (`/`)
Typing `/` opens an interactive, fuzzy-searchable floating command bar:
- `/expand`: Expands current or highlighted idea.
- `/combine [id1] [id2]`: Breeds two specific ideas.
- `/judge-all`: Runs jury evaluations on all unscored ideas.
- `/autopilot on [pace]`: Starts autopilot with specified interval.
- `/search [query]`: Dispatches X/Research scouts on the topic.
- `/export [markdown|png|pdf]`: Directly exports board content.
- `/matrix`: Switches view to Impact vs. Feasibility matrix.

---

## 5. Pillar 4: Human-in-the-Loop Autopilot Controls & Safety

### 5.1 Step-by-Step Preview & Simulation
- **The Issue**: Autopilot running in the dark can burn tokens and create redundant ideas.
- **The Solution**: An optional **"Confirm Next Step"** toggle in autopilot settings.
- **Visual Presentation**:
  - The board shows a pulsating dotted indicator over the two candidate parent ideas.
  - A small floating prompt states: *"Autopilot proposal: Breed #12 (Solar Mesh) with #19 (Micropayments). [Run Step (Space)] [Pick Different Partner (Tab)] [Skip]"*.

### 5.2 Rollback Timeline & Generation History
- **Concept**: A visual revision scrubber at the bottom of the canvas (like a video editing timeline).
- **Capability**:
  - Shows milestone dots for each generation step: `Gen 0 (Seeds)` → `Gen 1` → `Gen 2` → `Gen 3`.
  - Scrubbing the slider backward dims nodes born after that generation, allowing users to see the evolution in chronological time-lapse.
  - A **"Revert to Here"** button removes branches generated after that point if an exploration went off course.

### 5.3 Starred Anchors & Genetic Priority
- **Concept**: In biology, elite traits must be preserved.
- **Implementation**:
  - Marking an idea with the **Anchor** icon (⚓) locks it into the breeding pool permanently.
  - The genetic selection algorithm weights Anchors 3× higher during parent pairing, ensuring subsequent generations inherit the user's favorite breakthrough ideas.

---

## 6. Pillar 5: Production Output & Real-World Export

### 6.1 Pitch Deck & Executive Summary Generator
- **Concept**: A 1-click button that compiles the board into an executive-ready proposal.
- **Generated Sections**:
  1. **Problem Statement & Goal**: Direct extraction from the board's configuration.
  2. **Market & Trend Context**: Real findings collected by X and Academic Research scouts.
  3. **The Top Solutions (Gold Medalists)**: Title, one-line summary, detailed thesis, novelty rating, feasibility score.
  4. **Lineage Tree**: Diagram representing how the solution emerged.
  5. **Claude Code Kickoff Instructions**: Step-by-step technical implementation path.
- **Export Formats**: Interactive HTML Presentation, Clean Markdown (`.md`), and Print-Ready PDF.

### 6.2 High-Res Vector SVG / PNG Canvas Export
- **Export Options**:
  - **Full Board Snapshot**: Captures the entire bounding area at 2×/4× retina resolution.
  - **Selection Snapshot**: Exports only highlighted branches or clusters with a transparent background.
  - **Mermaid.js / PlantUML Code**: Copies raw text diagram syntax to clipboard for insertion into GitHub READMEs and Notion docs.

### 6.3 Task & Issue Tracker Handoff
- **GitHub Issues Integration**: Click *"Export to GitHub"* to convert selected Gold ideas into formatted GitHub issues with user stories and acceptance criteria.
- **Linear / Trello / Jira**: Download a standardized CSV or JSON task payload ready for 1-click import into agile boards.

---

## 7. Pillar 6: First-Run Experience & Consumer Polish

### 7.1 60-Second Interactive Onboarding Flow
When a new user opens the app for the first time:
- **Step 1 (The Spark)**: A guided prompt box asks: *"What problem or domain are you exploring today?"* (e.g., *"AI tools for elderly care"*).
- **Step 2 (The First Seed)**: The AI generates Seed #1 directly at `(0, 0)`.
- **Step 3 (The First Branch)**: An animated tooltip prompts the user: *"Click '⚡ Expand' or press Tab to watch the AI branch out 3 alternative angles."*
- **Step 4 (The First Breeding)**: The user drags a line between two ideas and watches the genetic synthesizer fuse them.
- Within 60 seconds, the user understands the core loop without reading documentation.

### 7.2 Pre-Built Template Gallery
Offer 6 curated starter boards in the "New Board" modal:
1. **Tech Startup Idea Discovery**: System prompt tuned for lean business models, unfair advantages, and viral distribution.
2. **Scientific / Academic Research Exploration**: System prompt tuned for cross-disciplinary paper synthesis and hypothesis formulation.
3. **Consumer App & Game Concept Design**: Tuned for core mechanics, dopamine loops, and emotional hook ideation.
4. **SaaS Feature Prioritization**: Tuned for B2B workflow bottlenecks, retention hooks, and churn reduction.
5. **Creative Writing & Narrative Worldbuilding**: Tuned for character conflict, plot twists, and unique magic/sci-fi rules.
6. **Hardware & IoT Product Innovation**: Tuned for bill-of-materials constraints, sensor combinations, and ergonomics.

### 7.3 Touch & Mobile Tablet Optimizations
- Full multi-touch support for iPad and Android tablets:
  - Two-finger pinch-to-zoom.
  - Two-finger pan.
  - Long-press on an idea to trigger the contextual radial action menu.
  - Floating onscreen keyboard-friendly search bar.

---

## 8. Technical Architecture & Implementation Roadmap

```
+-----------------------------------------------------------------------------------+
|                           PROPOSED IMPLEMENTATION PHASES                          |
+-----------------------------------------------------------------------------------+
| Phase 1: Spatial Ergonomics  --> Branch folding, Mini-map, Bounding clusters      |
| Phase 2: In-Canvas Controls  --> Radial action menu, Drag-to-breed wire, Inline edit|
| Phase 3: Speed & Navigation  --> Tab/Enter hotkeys, Slash command runner (/)      |
| Phase 4: Convergence & Views --> 2x2 Impact Matrix view, Timeline scrubber        |
| Phase 5: Handoff & Export    --> High-res SVG, Slide deck markdown, Task export   |
+-----------------------------------------------------------------------------------+
```

### Key Technical Patterns for Future Implementation

#### 1. Canvas Rendering Performance (`public/js/graph.js`)
- Maintain existing lightweight 2D Canvas rendering loop, adding a spatial grid / quadtree index for fast `$O(\log n)$` hover-detection as node counts exceed 500.
- For the Mini-map, render a second, throttled 10fps canvas buffer referencing the primary node store.

#### 2. Local State & Hotkeys (`public/js/app.js`)
- Centralize hotkey dispatching into a dedicated `hotkeys.js` module that checks `document.activeElement` to ensure keyboard commands do not intercept regular typing inside inputs.

#### 3. Reversible Operations (`server/db.ts` & `server/engine.ts`)
- Introduce a `generation_batch_id` column in `ideas` table to allow atomic rollback of multi-step autopilot or batch generation runs.

---
*Created: 2026-11-11 · Source specification for Idégeneratorn development.*
