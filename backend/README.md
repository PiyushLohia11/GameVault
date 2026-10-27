# GameVault Backend — Member 3: Java JDBC Layer

## What This Is
Java DAO + Service layer connecting the GameVault app to the database via JDBC.
Supports **both** frontend delivery options:
1. **React.js Frontend (from GitHub repo):** Runs a built-in lightweight REST API server (`GameVaultServer.java`) on port 8080 with CORS enabled.
2. **Swing UI (Member 4):** Calls the **Service classes** directly in Java without any REST or network layer.

---

## Zero-Installation Setup (No Oracle Needed!)

You do **not** need to install Oracle Database, Docker, or Node.js to develop and test this project.

- **Embedded Database:** We added **H2 Database in Oracle Mode** (`com.h2database:h2`).
- **Auto-Schema:** H2 automatically initializes the schema and loads sample data on startup from `src/main/resources/schema.sql`.
- **Zero Config:** `src/main/resources/db.properties` is pre-configured for H2 out of the box!
- **Switching to Oracle later:** When submitting to your teacher or connecting to college Oracle, simply comment out the H2 line and uncomment the Oracle connection line in `db.properties`.

---

## Architecture

```
                                  ┌───► REST API (GameVaultServer) ──► React.js Frontend (Vite)
[H2 (Oracle Mode) / Real Oracle] ─┴───► Service Layer (Direct)    ──► Swing Desktop UI (Member 4)
```

---

## Project Structure

```
GameVaultBackend/
├── pom.xml                        ← Maven config (Java 8, ojdbc8, H2, HikariCP)
├── test-client.html               ← Double-click to test REST API in any web browser!
├── README.md                      ← Documentation
└── src/
    ├── main/
    │   ├── resources/
    │   │   ├── db.properties      ← H2 embedded (default) or Oracle DB config
    │   │   ├── schema.sql         ← Auto-executed DDL & sample data for H2
    │   │   └── logback.xml        ← Console logging setup
    │   └── java/com/gamevault/
    │       ├── Main.java          ← Terminal demo runner
    │       ├── GameVaultServer.java ← Embedded REST API for React.js frontend
    │       ├── config/
    │       │   └── DBConnection.java ← HikariCP connection pool (supports H2 & Oracle)
    │       ├── model/             ← Domain POJOs (User, Game, UserGame, Review, etc.)
    │       ├── dao/               ← Raw JDBC PreparedStatements
    │       ├── service/           ← Business logic & transaction boundaries
    │       ├── exception/         ← Custom typed exceptions
    │       └── util/              ← InputValidator.java (ratings, playtime, text)
    └── test/java/com/gamevault/   ← JUnit 5 unit tests
```

---

## REST Endpoints for the React.js Frontend

The built-in server `GameVaultServer.java` serves the exact endpoints matching the pages in `PiyushLohia11/GameVault`:

| Page in React | HTTP Method | Endpoint | Description |
|---|---|---|---|
| **DiscoverPage** | `GET` | `/api/games` | Returns all games with developer, genres, platforms |
| **DiscoverPage** | `GET` | `/api/games?genre=RPG` | Filter catalogue by genre |
| **GameDetailsPage** | `GET` | `/api/games?id=1` | Get single game details |
| **MyLibraryPage** | `GET` | `/api/library?userId=1` | Get user's backlog, playtime, status |
| **MyLibraryPage** | `POST` | `/api/library` | Add game to user vault (`{userId, gameId, platformId, status}`) |
| **ReviewsPage** | `GET` | `/api/reviews?gameId=1` | Get reviews for a game |
| **ReviewsPage** | `POST` | `/api/reviews` | Submit critique (`{userId, gameId, rating, reviewText}`) |
| **AchievementsPage**| `GET` | `/api/achievements?gameId=1`| Get game achievements |
| **FriendsPage** | `GET` | `/api/friends?userId=1` | Get user's friends list |
| **DashboardPage** | `GET` | `/api/dashboard?userId=1` | Get dashboard KPIs (total games, playtime, points) |

---

## How to Run Without Installing Anything

### Step 1: Open in VS Code
You already have VS Code installed:
1. Open VS Code.
2. Open the folder: `C:\Users\Yash Agarwal\.gemini\antigravity\scratch\GameVaultBackend`.
3. If prompted to install the **Extension Pack for Java**, click **Install** (it provides standard Java compilation and a 1-click Run button).

### Step 2: Run the Demo or the REST Server
- **To test the core JDBC backend:** Open `src/main/java/com/gamevault/Main.java` and click **Run**.
- **To start the REST API for React:** Open `src/main/java/com/gamevault/GameVaultServer.java` and click **Run**. It starts the server on `http://localhost:8080`.

### Step 3: Test Live in Browser
Open `test-client.html` in Chrome or Edge (just double click the file).
You can click buttons to fetch games, view the library, submit reviews, and verify all database operations with live visual feedback!

---

## How to Connect the React Frontend (`PiyushLohia11/GameVault`)

In the React project, update `src/services/apiConfig.js` to point to your Java backend:
```javascript
export const API_BASE_URL = 'http://localhost:8080/api';
```
Now, whenever React calls `/api/games` or `/api/reviews`, it will fetch live data from your Java JDBC database instead of mock data!
