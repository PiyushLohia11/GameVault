# GameVault — Game Backlog & Achievement Database (Full-Stack)

A full-stack gaming library, backlog tracker, and critique platform for the **College DBMS Project**.

---

## 🏗 Architecture & Tech Stack

```text
[ React Frontend (Vite) ] ──► HTTP JSON API ──► [ Java Backend Server (Port 8080) ] ──► [ H2 / Oracle DB (JDBC) ]
```

### 1. Frontend (React + Vite)
- **Framework:** React 18 + JavaScript (Vite)
- **Routing:** React Router v6
- **Styling:** Vanilla CSS with centralized design tokens (`src/styles/tokens.css`)
- **Theme:** Obsidian Black (`#040404`) & Gold (`#F4BF4E`) gaming aesthetic
- **Icons:** Lucide React

### 2. Backend (Java 17 + JDBC Layer) — *Member 3 Deliverable*
- **Language / Runtime:** Java 17 (Eclipse Temurin / OpenJDK)
- **Networking:** Built-in lightweight REST API server (`GameVaultServer.java`) with CORS support on port `8080`
- **Connection Pool:** HikariCP connection pooling
- **Architecture:** DAO (Data Access Object) & Service layers
- **Database Engine:** Embedded H2 Database running in **Oracle Mode** (`MODE=Oracle`) with automated schema initialization from `schema.sql`. Also supports real Oracle DB (`ojdbc8`) via `db.properties`.
- **Features:** Parameterized queries (SQL injection prevention), transactions, input validation, and detailed logging.

---

## 🚀 Getting Started

### 1. Start the Java Backend (Port 8080)
You must start the backend server first so the frontend can fetch live database records:

- **Option A (One-Click):** Double-click `run-server.bat` (or `backend/run-server.bat`).
- **Option B (VS Code):** Open `backend/src/main/java/com/gamevault/GameVaultServer.java` and click **Run**.
- **Option C (Terminal):**
  ```bash
  cd backend
  java -cp "target/classes;lib/*" com.gamevault.GameVaultServer
  ```

> *The backend will start and listen at `http://localhost:8080`.*

---

### 2. Start the React Frontend (Port 3000)

- **Option A (One-Click):** Double-click `run-frontend.bat`.
- **Option B (Terminal):**
  ```bash
  npm install
  npm run dev
  ```

> *Open your browser at **`http://localhost:3000`**.*

---

## 📡 REST API Endpoints (Java Backend)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/games` | Returns master game catalogue (supports `?genre=...`, `?q=...`, `?id=...`) |
| `GET` | `/api/library?userId=1` | Returns user vault records with playtimes and status |
| `POST` | `/api/library` | Adds a game release to the user's personal vault |
| `PUT` | `/api/library` | Updates status, platform, or playtime for a library record |
| `GET` | `/api/reviews?gameId=1` | Returns critiques and community ratings for a game |
| `POST` | `/api/reviews` | Submits a review (1–10) and recalculates average rating in DB |
| `GET` | `/api/dashboard?userId=1` | Returns aggregate user KPIs (playtime, vault total, points) |
| `GET` | `/api/achievements?gameId=1` | Returns achievement milestones for a game |
| `GET` | `/api/friends?userId=1` | Returns connected friends and social network |
| `GET` | `/api/health` | Healthcheck endpoint (`{"status":"UP"}`) |

---

## 📂 Project Navigation & Routes
- `/` — Dashboard Overview (live KPIs and playtime aggregates)
- `/library` — My Library (personal backlog, playtime tracker, edit & quick-add)
- `/discover` — Discover Catalogue (game search, genre filters, master titles)
- `/games/:id` — Game Details (achievements and community ratings)
- `/achievements` — Achievements & Milestones tracker
- `/friends` — Friends & Social Comparison
- `/reviews` — Game Reviews (live critique submissions & rating calculations)
- `/settings` — User Settings & Preferences
