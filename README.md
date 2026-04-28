## Tech Stack

- Frontend: HTML, CSS, JavaScript modules
- Backend: Node.js, Express
- Database: PostgreSQL
- Auth: JWT + bcrypt
- Storage: PostgreSQL for recipes, users, saved recipes

---

## Setup Guide

### 1. Clone the repo

```bash
git clone <repo-url>
cd MacroChef

### 2. Backend setup
#### 2.1 Install dependencies
cd backend
npm install

#### 2.2 Set up environment
PORT=5000
DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/macrochef
JWT_SECRET=dev_secret

#### 2.3 Create DB (pgAdmin or psql)
CREATE DATABASE macrochef

#### 2.4 Start database
node server.js

#### 2.5 Test
http://localhost:5000/api/recipes

### 3 Frontend setup

cd ../frontend
npx serve .

#### 3.1 Open:

http://localhost:3000

### 4. Login/Register

#### 4.1 Use the avatar on the top right, or run these in console if bugging

PORT=5000
DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/macrochef
JWT_SECRET=dev_secret

### 5. What works:-
# localStorage.removeItem("mc_token");
# localStorage.removeItem("mc_user");
# location.reload();

### 6. Important
# Backend must run on :5000
# Frontend must run on :3000
# Only owners can edit/delete recipes