# Daylist TODO Application - Detailed Solution

## 1. Solution Overview

This project is a small full-stack TODO application implemented with React 17, Django REST Framework, MongoDB 7, and Docker Compose.

The application lets a user view, add, edit, complete, and delete TODOs. The frontend communicates with the backend over HTTP, while MongoDB is the source of persistent data.

## 2. Repository Structure

```text
.
├── docker-compose.yml       # Local service orchestration
├── Dockerfile               # Python API image definition
├── SOLUTION.md              # This implementation guide
├── src/
│   ├── requirements.txt     # Python dependencies
│   ├── app/                 # React application
│   │   ├── package.json
│   │   └── src/
│   │       ├── App.js       # UI and API interaction logic
│   │       ├── App.css      # Application styles
│   │       └── App.test.js  # React tests
│   └── rest/                # Django API
│       ├── manage.py
│       └── rest/
│           ├── settings.py
│           ├── urls.py
│           └── views.py
└── db/                      # MongoDB files mounted by Docker Compose
```

## 3. Running the Application

### Prerequisites

- Docker Desktop with Docker Compose support.
- Git, if cloning the repository.
- A Windows PowerShell terminal for the commands below.

### Configure the source path

From the repository root, set `ADBREW_CODEBASE_PATH` to the absolute path of the `src` directory:

```powershell
$env:ADBREW_CODEBASE_PATH = "D:\Hackthons_and _projects\adb_test-master\src"
```

This variable is used by `docker-compose.yml` to mount the source code and MongoDB data into the containers. Set it again in each new terminal session unless it has been configured permanently.

### Build and start the services

```powershell
docker compose build
docker compose up -d
docker compose ps
```

Open the application at [http://localhost:3000](http://localhost:3000). The API is available at [http://localhost:8000/todos/](http://localhost:8000/todos/).

To stop the services:

```powershell
docker compose down
```

The MongoDB directory is mounted from `src/db`, so data remains available when containers are recreated. Do not delete that directory if the local database contents are needed.

## 4. Container Responsibilities

### `app`

The `app` service uses the `node:20` image, mounts the source into `/src`, installs JavaScript dependencies, and starts the Create React App development server on port 3000.

### `api`

The `api` service is built from `Dockerfile`. It uses Python 3.8, installs `src/requirements.txt`, and starts Django on `0.0.0.0:8000`.

The API container receives `MONGO_HOST=mongo` and `MONGO_PORT=27017`. The hostname `mongo` resolves to the MongoDB Compose service inside the Docker network.

### `mongo`

The `mongo` service uses MongoDB 7, listens on port 27017, and stores its database files in the repository's `src/db` directory through a volume mount.

## 5. Backend Design

The API routes are defined in `src/rest/rest/urls.py` and implemented in `src/rest/rest/views.py`.

The backend connects directly to MongoDB with PyMongo:

```python
db = MongoClient(mongo_uri)['test_db']
```

The application uses the `todos` collection. Django models, serializers, and SQLite are not used for TODO persistence.

### Data shape

MongoDB stores documents like this:

```json
{
  "_id": "ObjectId",
  "description": "Prepare project documentation",
  "completed": false
}
```

The API converts MongoDB's `ObjectId` to a string before returning it to the browser:

```json
{
  "id": "66f000000000000000000001",
  "description": "Prepare project documentation",
  "completed": false
}
```

This keeps MongoDB-specific values out of the JSON API contract.

## 6. API Contract

All endpoints use a trailing slash.

### List TODOs

```http
GET /todos/
```

Response:

```json
{
  "todos": [
    {
      "id": "66f000000000000000000001",
      "description": "Prepare project documentation",
      "completed": false
    }
  ]
}
```

### Create a TODO

```http
POST /todos/
Content-Type: application/json

{
  "description": "Prepare project documentation"
}
```

The backend trims whitespace and rejects an empty description with HTTP 400. A successful request returns HTTP 201 and the created TODO.

### Update a TODO

```http
PATCH /todos/<todo_id>/
Content-Type: application/json

{
  "completed": true
}
```

The endpoint also accepts a trimmed `description`. Invalid IDs return HTTP 400, missing TODOs return HTTP 404, and an empty update returns HTTP 400.

### Delete a TODO

```http
DELETE /todos/<todo_id>/
```

A successful deletion returns HTTP 204. Invalid IDs return HTTP 400 and unknown TODOs return HTTP 404.

### Quick PowerShell checks

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:8000/todos/

Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/todos/ `
  -ContentType "application/json" `
  -Body '{"description":"Review the API"}'
```

## 7. Frontend Data Flow

`src/app/src/App.js` uses React hooks only:

- `useState` stores TODOs, form values, edit state, and errors.
- `useEffect` loads TODOs when the component first mounts.
- `loadTodos` performs `GET /todos/` and normalizes the response.
- `handleSubmit` validates and creates a TODO with `POST /todos/`, then calls `loadTodos` to retrieve the latest database state.
- `updateTodo` sends `PATCH` requests for completion and editing.
- `deleteTodo` sends `DELETE` requests and removes the deleted item from local state.

The API base URL can be configured with `REACT_APP_API_URL`. If it is not provided, the frontend defaults to `http://localhost:8000`. URLs are normalized so both a host URL and a URL ending in `/todos` work correctly.

## 8. Validation and Error Handling

Validation occurs in both layers:

1. The React form rejects blank or whitespace-only descriptions before making a request.
2. The Django API repeats this validation so clients cannot bypass the rule.
3. Each frontend request checks `response.ok`.
4. API error messages are displayed to the user when available.
5. Invalid MongoDB IDs are handled without allowing `ObjectId` parsing errors to escape.
6. The API returns appropriate HTTP status codes for invalid input, missing records, successful creation, and successful deletion.

## 9. Verification Checklist

After starting the containers, verify:

- [ ] `docker compose ps` shows `app`, `api`, and `mongo` as running.
- [ ] The React interface loads at port 3000.
- [ ] `GET /todos/` returns JSON.
- [ ] A valid TODO can be created from the UI.
- [ ] The new TODO appears after submission.
- [ ] Completing a TODO persists after refreshing the page.
- [ ] Editing a TODO persists after refreshing the page.
- [ ] Deleting a TODO removes it from the list and database.
- [ ] A blank description displays a validation error and is not stored.

## 10. Troubleshooting

### Containers do not start

Check service logs:

```powershell
docker compose logs --tail=100 api
docker compose logs --tail=100 app
docker compose logs --tail=100 mongo
```

Make sure Docker Desktop is running and that `ADBREW_CODEBASE_PATH` points to the `src` directory, not the repository root.

### The frontend cannot reach the API

Confirm that the API responds directly:

```powershell
Invoke-WebRequest http://localhost:8000/todos/
```

Also check that port 8000 is not already used by another process. CORS is enabled in Django for local development.

### The app container is slow to start

The container runs `npm install` every time it starts. The first startup may take several minutes while dependencies are downloaded:

```powershell
docker compose logs -f app
```

### MongoDB data is unavailable

Confirm that the `mongo` container is running and that the `src/db` directory is mounted. The API must use the Docker hostname `mongo` from inside the API container; `localhost` would refer to the API container itself.

## 11. Design Notes and Future Improvements

The current implementation is intentionally small and appropriate for the assignment. For production use, reasonable next steps would be:

- Move the Django secret key and CORS policy to environment variables.
- Add automated API tests for validation, CRUD operations, and invalid ObjectIds.
- Add React tests for loading, submission, error, editing, completion, and deletion.
- Add a MongoDB health check and service dependency conditions in Compose.
- Pin the Node image and modernize legacy Python dependencies in a controlled upgrade.
- Add pagination and indexes if the TODO collection grows significantly.
- Add authentication and authorization before exposing the API publicly.
