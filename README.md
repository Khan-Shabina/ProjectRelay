# ProjectRelay MVP

A hackathon MVP for project knowledge collection, knowledge-gap detection, and handover reports.

## Requirements
- Java 17+
- Maven 3.6.3+
- Node.js 20+
- MySQL 8+

## 1. Database
Create a MySQL database:
```sql
CREATE DATABASE projectrelay;
```

## 2. Backend
Open a terminal in `backend` and run:
```bash
mvn spring-boot:run
```
The API runs at http://localhost:8080.

If your MySQL username/password differ from `root` / `root`, edit
`backend/src/main/resources/application.properties`.

## 3. Frontend
Open another terminal in `frontend`:
```bash
npm install
npm run dev
```
Open the URL printed by Vite (usually http://localhost:5173).

## Demo flow
1. Add a TASK with status `IN_PROGRESS`, no owner, and no details.
2. Add a DECISION without a reason.
3. Add an ISSUE with status `OPEN`.
4. Click **Scan knowledge gaps**.
5. Click **Generate handover** to see the report.

## MVP limitations
This is a hackathon prototype. It has no login/role-based access yet. Add authentication,
authorization, audit logs, and production secrets management before real deployment.
