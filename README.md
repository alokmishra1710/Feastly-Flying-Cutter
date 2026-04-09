# Feastly Flying Cutter

A food ordering web app I built to learn full-stack development. Users can browse
the menu, add items to cart, and place orders. There's also an admin panel to
manage the menu, users, and order statuses.

**Live:** https://feastly-flying-cutter.vercel.app

## What it does

- Sign up and log in securely with reCAPTCHA
- Reset forgotten password directly from the login page
- Browse food menu with photos from Pexels API
- Search and filter menu by category
- Add items to cart, adjust quantity with +/- buttons
- Place orders with a delivery address
- Cancel a pending order before it's being prepared
- View order history with food names, prices and live status
- Search through past orders by ID, address or food name
- Change password from profile page
- Admin can add/edit/delete food items and toggle availability
- Admin can update order status (Pending → Preparing → Out for Delivery → Delivered)
- Admin can manage users — create, promote/demote, delete accounts

## Tech Stack

- **Backend** - Python (FastAPI), PostgreSQL, SQLAlchemy, Alembic
- **Frontend** - React, JavaScript, Vite
- **Auth** - JWT tokens, Argon2 password hashing, Google reCAPTCHA
- **Hosting** - Vercel (frontend), Render (backend), Neon (PostgreSQL)
- **Other** - Pexels API for food images

## Architecture

```
frontend (React + Vite) — Vercel
      |
      | HTTP requests (Axios)
      |
backend (FastAPI) — Render
      |
      |-- routers/
      |     |-- auth.py       (signup, login, forgot password)
      |     |-- food.py       (menu management)
      |     |-- cart.py       (cart operations, quantity update)
      |     |-- orders.py     (order placement, status update, cancel)
      |     |-- users.py      (user management, change password)
      |
      |-- models/             (database tables)
      |-- schemas/            (request/response shapes)
      |-- core/               (JWT, hashing, config)
      |
      v
PostgreSQL database (Neon)
```

## How it works

**Signup / Login**
- User fills the form and completes reCAPTCHA
- Password is hashed using Argon2 before storing
- On login, server returns a JWT token
- That token is saved in browser and sent with every request
- Forgot password lets users reset via email + reCAPTCHA — no admin needed

**Browsing Menu**
- Menu page is public, no login needed
- Food images are fetched from Pexels API based on food name
- Users can search and filter by category
- Items marked unavailable by admin are greyed out and can't be added to cart

**Cart and Orders**
- User adds items to cart (stored in database, not browser)
- Quantity can be adjusted with +/- buttons directly in the cart
- On checkout, user enters delivery address
- Server calculates total price (never trusts the frontend price)
- Food name and price are captured at order time so history stays accurate
- Order is saved, cart is cleared — all in one database transaction
- Pending orders can be cancelled by the user before admin starts preparing

**Order Status**
- Admin updates order status from the admin panel
- Status goes: Pending → Preparing → Out for Delivery → Delivered
- Users see the current status with a visual timeline on their orders page

**Admin Panel**
- Admin logs in with same login page
- Backend checks is_admin flag on every admin request
- Admin can manage menu, toggle item availability, manage users and update orders

## Database Tables

```
users       → stores all accounts (is_admin flag separates roles)
food_items  → the menu (includes is_available flag)
carts       → items added to cart by each user
orders      → placed orders with address, total and status
order_items → individual items per order with food_name and price at that time
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
RECAPTCHA_SECRET=your_recaptcha_secret
DISABLE_RECAPTCHA=true
```

Backend runs on `http://localhost:8000`  
Frontend runs on `http://localhost:5173`  
API docs available at `http://localhost:8000/docs`

## What I Learned

- How REST APIs actually work in a real project
- JWT authentication and why password hashing matters
- Connecting a React frontend to a Python backend
- Working with databases using SQLAlchemy ORM and Alembic migrations
- Handling real issues like CORS, DB connection pooling and cold starts
- Deploying a full-stack app across Vercel, Render and Neon

## Known Issues / Future Plans

- No tests written yet
- Want to add email notifications when order status changes
- Pagination for admin orders and users list

## Screenshots

![Menu](screenshots/menu.png)
![Admin](screenshots/admin.png)
![Cart](screenshots/cart.png)
