# Feastly Flying Cutter

A food ordering web app I built to learn full-stack development. Users can browse
the menu, add items to cart, and place orders. There's also an admin panel to
manage the menu and users.

## What it does

- Sign up and log in securely
- Browse food menu with photos
- Add items to cart and place orders
- View your order history
- Admin can add/edit/delete food items, manage users and view all orders

## Tech Stack

- **Backend** - Python (FastAPI), PostgreSQL, SQLAlchemy
- **Frontend** - React, JavaScript
- **Auth** - JWT tokens, Argon2 password hashing
- **Other** - Google reCAPTCHA, Pexels API for food images

## Architecture

```
frontend (React)
      |
      | HTTP requests (Axios)
      |
backend (FastAPI)
      |
      |-- routers/
      |     |-- auth.py       (signup, login)
      |     |-- food.py       (menu management)
      |     |-- cart.py       (cart operations)
      |     |-- orders.py     (order placement)
      |     |-- users.py      (user management)
      |
      |-- models/             (database tables)
      |-- schemas/            (request/response shapes)
      |-- core/               (JWT, hashing, config)
      |
      v
PostgreSQL database
```

## How it works

**Signup / Login**
- User fills the form and completes reCAPTCHA
- Password is hashed using Argon2 before storing
- On login, server returns a JWT token
- That token is saved in browser and sent with every request

**Browsing Menu**
- Menu page is public
- Food images are fetched from Pexels API based on food name
- Users can search and filter by category

**Cart and Orders**
- User adds items to cart (stored in database, not browser)
- On checkout, user enters delivery address
- Server calculates total price (never trusts the frontend price)
- Order is saved, cart is cleared — all in one database transaction

**Admin Panel**
- Admin logs in with same login page
- Backend checks is_admin flag on every admin request
- Admin can manage menu, users and view all orders

## Database Tables

```
users       → stores all accounts (is_admin flag separates roles)
food_items  → the menu
carts       → items added to cart by each user
orders      → placed orders with delivery address and total
order_items → individual items in each order with price at that time
```

## How to Run Locally

**Backend**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

You'll need a `.env` file inside the `backend/` folder:
```
DATABASE_URL=your_postgresql_url
JWT_SECRET=any_long_random_string
DISABLE_RECAPTCHA=true
```

Backend runs on `http://localhost:8000`  
Frontend runs on `http://localhost:5173`  
API docs available at `http://localhost:8000/docs`

## What I Learned

- How REST APIs actually work in a real project
- JWT authentication and why password hashing matters
- Connecting a React frontend to a Python backend
- Working with databases using SQLAlchemy ORM
- How to structure a full-stack project properly

## Known Issues / Future Plans

- Want to add proper database migrations with Alembic
- No tests written yet

## Screenshots

![Menu](screenshots/menu.png)
![Admin](screenshots/admin.png)
![Cart](screenshots/cart.png)
