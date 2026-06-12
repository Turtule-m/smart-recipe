# FoodApp

Recipe suggestion app monorepo scaffold.

## Structure

- `client`: Vite + React + Tailwind
- `server`: Node.js + Express + PostgreSQL auth API

## Setup

```bash
npm install
cp server/.env.example server/.env
```

Update `server/.env` with your PostgreSQL connection string and JWT secret.

Apply the database schema:

```bash
npm run db:schema
```

Run the API:

```bash
npm run dev:server
```

Run the client shell:

```bash
npm run dev:client
```

## API

Health check:

```http
GET http://localhost:5000/health
```

Register:

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Login:

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Search recipes by ingredient list:

```http
GET http://localhost:5000/api/recipes?ingredients=chicken_breast,garlic
```

The free TheMealDB V1 API supports filtering by one ingredient at a time, so the server queries each ingredient and returns meals found in every result set.

Identify ingredients from an uploaded image:

```http
POST http://localhost:5000/api/identify-ingredients
Content-Type: multipart/form-data

image=<file>
```

The server reads `LOGMEAL_TOKEN` from `server/.env` and forwards the image to LogMeal before querying TheMealDB with the first detected ingredient.
