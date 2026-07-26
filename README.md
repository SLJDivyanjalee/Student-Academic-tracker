# LevelUp : Student Academic Tracker

website we built to keep track of student's uni life - timetable, tasks,
assignments/exams, attendance, and a study planner that auto-schedules study
sessions around everything else. There's also a small gamification layer
(streaks/progress) to make it less boring to use.
and anyone who not a student can also scedule their works by using tasks feature

Frontend is plain HTML/CSS/JS. Backend is Java, talking to a MySQL database.

```
LevelUp website/
- frontend/   HTML/CSS/JS pages
- backend/    Java API (src, sql schema, db config)
- Dockerfile

```

## How to run it

**You need:** JDK 21+, and MySQL (or MariaDB) running locally.

1. Load the database:
   ```bash
   mysql -u root -p < "LevelUp website/backend/sql/schema.sql"
   ```

2. Set up your DB config:
   ```bash
   cd "LevelUp website/backend"
   cp db.properties.example db.properties
   ```
   Then fill in `db.url`, `db.user`, `db.password`. The mail and AI
   (Gemini) settings at the bottom are optional - leave them blank and those
   features just quietly turn themselves off.

3. Compile and run:
   ```bash
   mkdir -p bin
   find src -name "*.java" > sources.txt
   javac -cp "lib/*" -d bin @sources.txt
   java -cp "bin:lib/*" com.levelup.Main
   ```
   Server starts on `localhost:8080`. Check it worked:
   ```bash
   curl http://localhost:8080/api/health
   ```

The backend also serves the frontend folder as static files, so once it's
running you can just open `http://localhost:8080` in a browser.

(There's a Dockerfile too to deploy this somewhere like Render.)

## How it's put together

Pretty standard 3-layer setup for every feature (tasks, subjects, attendance,
timetable, etc.):

```
Controller  -> handles the HTTP request, checks you're logged in
Service     -> validation + actual logic
Dao         -> the SQL / talks to the database

```

`Main.java` just wires up a plain `HttpServer` (no Spring, kept it simple)
and points each URL prefix like `/api/tasks` at its controller.

**Auth:** login/register returns a random token that gets stored in a
`sessions` table, and the frontend sends it back as `Authorization: Bearer
<token>` on every request after that. Passwords are hashed, never
stored as plain text.

**Frontend:** one HTML file per page, sharing `style.css`. `api.js` has all
the `fetch()` calls to the backend and attaches the token automatically.

## OOP concepts we used

- `AcademicItem` is an abstract class that `Assignment` and `Exam` both
  extend , shared stuff (due dates, notifications) lives in the parent,
  and each subclass overrides `getType()`/`getNotificationMessage()` for
  its own behavior. Classic inheritance + polymorphism.
- `CrudDao<T, ID>` is a generic interface (create/find/update/delete) that
  most of my DAO classes implement, so they're all shaped the same way.
- `Notifiable` interface : anything that can say "I'm due soon" implements
  this.
- `AttendanceService` : when you log
  attendance, it notifies a list of `ProgressObserver`s instead of being
  hardcoded to update progress/streaks directly.
- Custom exceptions (`ValidationException`, `ResourceNotFoundException`,
  `ConflictException`) instead of throwing generic errors everywhere, one
  place (`HttpUtil`) turns these into the right HTTP status code.
- Setters validate themselves (e.g. you can't set an assignment weight above
  100 or a blank title) so bad data can't sneak in.

## API endpoints

Everything needs `Authorization: Bearer <token>` except health/auth.

- **Auth** `/api/auth` - register, login, logout, forgot/reset-password, me
- **Onboarding** `/api/onboarding` - status, complete
- **Subjects** `/api/subjects` - CRUD
- **Tasks** `/api/tasks` - CRUD (filter by `?status=`)
- **Assignments/Exams** `/api/assignments-exams` - CRUD (filter by `?itemType=`)
- **Attendance** `/api/attendance` - CRUD + `/summary` for per-subject %
- **Timetable** `/api/timetable` - CRUD
- **Study Planner** `/api/planner` - `/settings`, `/generate`, `/sessions` CRUD
- **Profile** `/api/profile` - get/update, `/password`, `/reset`, delete account
- **Calendar** `/api/calendar` - items by date range, `/due-soon`
- **Progress** `/api/progress/streak`
- **AI help** `/api/ai/ask` - asks Gemini a question about the current page

## Notes:

- Every DB query is scoped by `user_id` so people can't see each other's data.

- The study planner treats lectures/assignments/exams/tasks as fixed and just
  flags conflicts. it never moves them. It only auto-fills the free gaps
  with study sessions, weighted toward whatever exam is coming up soonest.