# 🍽️ Feastly Flying Cutter

A full-stack food ordering web application built with **FastAPI** (Python) and **React**. Features JWT authentication, role-based access control, a complete cart and order system, and a rich admin dashboard.

> **Live Demo:** _Deploy and add your URL here_  
> **Backend API Docs:** `http://localhost:8000/docs` (Swagger UI, auto-generated)

---

## 📸 Screenshots

| Menu Page | Cart | Admin Panel |
|-----------|------|-------------|
| ![Menu](screenshots/menu.png) | ![Cart](screenshots/cart.png) | ![Admin](screenshots/admin.png) |

---

## ✨ Features

### Customer
- 🔐 Signup / Login with JWT authentication
- 🍕 Browse menu with real food photos, search, and category filters
- 🛒 Add to cart, remove items, update quantities
- 📦 2-step checkout with delivery address
- 🎉 Free delivery on orders above ₹199
- 📋 Order history with status timeline

### Admin
- 📊 Dashboard — total users, orders, revenue, recent activity
- 📦 View all orders from all users with full details
- 🍽️ Add, edit, and delete food items inline
- 👥 Create users, promote/demote admins, delete accounts
- 🔒 All admin routes protected server-side (not just frontend)

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | FastAPI (Python) | Async, fast, auto-generates Swagger docs |
| **ORM** | SQLAlchemy | Pythonic DB access, relationship management |
| **Database** | PostgreSQL | Production-grade relational DB |
| **Validation** | Pydantic v2 | Request validation + response serialization |
| **Auth** | JWT (HS256) + Argon2 | Stateless auth, memory-hard password hashing |
| **Frontend** | React 18 + Vite | Fast HMR, component-based UI |
| **Routing** | React Router v6 | Client-side routing with protected routes |
| **HTTP Client** | Axios | Interceptors for auto token attachment |
| **Styling** | Custom CSS | Dark luxury theme, CSS variables, animations |
| **Images** | Pexels API + TheMealDB | Real food photos matched by name |
| **Bot Protection** | Google reCAPTCHA v2 | Prevents automated signups |

---

## 🏗️ Architecture

```
feastly-flying-cutter/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app, CORS, router registration
│       ├── core/
│       │   ├── config.py        # Settings, env var loading & validation
│       │   ├── database.py      # SQLAlchemy engine, session, Base
│       │   └── security.py      # Argon2 hashing, JWT creation
│       ├── models/
│       │   └── models.py        # SQLAlchemy ORM models (5 tables)
│       ├── schemas/
│       │   └── schemas.py       # Pydantic request/response schemas
│       ├── routers/
│       │   ├── deps.py          # get_current_user JWT dependency
│       │   ├── auth.py          # POST /auth/signup, /auth/login
│       │   ├── food.py          # GET/POST/PATCH/DELETE /food/
│       │   ├── cart.py          # GET/POST/DELETE /cart/
│       │   ├── orders.py        # GET/POST /orders/, GET /orders/all
│       │   └── users.py         # GET/POST/PATCH/DELETE /users/
│       └── services/
│           └── recaptcha.py     # Google reCAPTCHA v2 verification
└── frontend/
    └── src/
        ├── api/index.js         # All API calls in one place
        ├── context/
        │   ├── AuthContext.jsx  # Global auth state (JWT + user info)
        │   ├── CartContext.jsx  # Cart item count for navbar badge
        │   └── ToastContext.jsx # Global toast notifications
        ├── components/
        │   ├── Navbar.jsx       # Sticky nav with dropdown, cart badge
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── SignupPage.jsx
            ├── MenuPage.jsx     # Food grid with images + search + filters
            ├── CartPage.jsx     # 2-step checkout flow
            ├── OrdersPage.jsx   # Order history with status timeline
            ├── ProfilePage.jsx  # Account info + delete account
            └── AdminPage.jsx    # Full admin dashboard (4 tabs)
```

---

## 🗄️ Database Schema

```
users          food_items       carts
─────────      ──────────       ─────
id (PK)        id (PK)          id (PK)
email          name             user_id (FK → users)
password       description      food_id (FK → food_items)
is_admin       price            quantity
created_at

orders                    order_items
──────────                ───────────
id (PK)                   id (PK)
user_id (FK → users)      order_id (FK → orders)
total_price               food_id (FK → food_items)
address                   quantity
created_at                price_at_order  ← snapshot at purchase time
```

> `price_at_order` locks the price when the order is placed — future price changes by admin don't affect historical orders.

---

## 🔒 Security Design

| Concern | Solution |
|---------|----------|
| Password storage | Argon2 hashing (PHC winner, memory-hard) — never stored plain |
| Authentication | JWT HS256 tokens, 24-hour expiry, secret in `.env` |
| Authorization | Server-side `is_admin` check on every admin route |
| Price integrity | Total price calculated server-side — client price never trusted |
| Data isolation | Users can only access their own cart and orders |
| Bot protection | Google reCAPTCHA v2 on signup and login |
| Config security | All secrets in `.env`, validated at startup |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns JWT + user info |

### Food Menu
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/food/` | Public | List all food items |
| POST | `/food/` | Admin | Add new food item |
| PATCH | `/food/{id}` | Admin | Update food item (partial) |
| DELETE | `/food/{id}` | Admin | Remove food item |

### Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/cart/` | JWT | Get current user's cart |
| POST | `/cart/` | JWT | Add item (merges quantity if exists) |
| DELETE | `/cart/{id}` | JWT | Remove item from cart |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders/` | JWT | Place order (clears cart, locks prices) |
| GET | `/orders/` | JWT | Get current user's orders |
| GET | `/orders/all` | Admin | Get all orders from all users |

### Users (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/` | Admin | List all users |
| POST | `/users/` | Admin | Create user manually |
| PATCH | `/users/{id}/toggle-admin` | Admin | Promote or demote admin |
| DELETE | `/users/{id}` | Admin/Self | Delete account |

> Full interactive docs available at `http://localhost:8000/docs`

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL running locally

### 1. Clone the repository
```bash
git clone https://github.com/alokmishra1710/feastly-flying-cutter.git
cd feastly-flying-cutter
```

### 2. Backend setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file (see Environment Variables below)
cp .env.example .env
# Edit .env with your values

# Start the backend
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`  
Swagger docs at: `http://localhost:8000/docs`

### 3. Frontend setup
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

The Vite dev server proxies all API requests to `localhost:8000` automatically — no CORS issues in development.

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
# Required
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/feastly
JWT_SECRET=your-very-long-random-secret-key-here

# Optional
RECAPTCHA_SECRET=your-google-recaptcha-v2-secret-key
DISABLE_RECAPTCHA=true   # Set to false in production
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | Secret for signing JWT tokens — make it long and random |
| `RECAPTCHA_SECRET` | No | Google reCAPTCHA v2 server secret |
| `DISABLE_RECAPTCHA` | No | Set `true` in development to skip reCAPTCHA |

> **Note:** The app validates `DATABASE_URL` and `JWT_SECRET` at startup and refuses to run if they are missing.

---

## 🗝️ First Admin Setup

New users are regular users by default. To create the first admin:

1. Sign up normally through the UI
2. Connect to your database and run:
```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```
3. Log out and log back in
4. You can now use the Admin Panel → Users tab to promote other users

---

## 🧠 Key Design Decisions

**Why Argon2 over bcrypt?**  
Argon2 won the Password Hashing Competition (2015) and is memory-hard, making GPU brute-force attacks impractical. bcrypt is old but solid — Argon2 is strictly better.

**Why is total price calculated server-side?**  
Never trust the client for financial data. If the frontend sent the price, a malicious user could set it to ₹0.01. The server fetches fresh prices from the DB on every order.

**Why does OrderItem store `price_at_order`?**  
Food prices change over time. Storing the price at purchase time means historical orders always show what the customer actually paid — critical for accounting and dispute resolution.

**Why `db.flush()` before adding OrderItems?**  
`flush()` sends the INSERT to the database and returns the auto-generated `order.id` without committing. This lets OrderItems reference the new order ID within the same atomic transaction.

**Why OAuth2PasswordRequestForm for login?**  
FastAPI's standard for the OAuth2 Password Flow. Expects `application/x-www-form-urlencoded` with `username` and `password` fields. The benefit: Swagger UI (`/docs`) has built-in support — you can test login directly in the browser.

---

## 📦 Requirements

**Backend** (`backend/requirements.txt`):
```
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
pydantic[email]
python-jose[cryptography]
passlib[argon2]
python-dotenv
httpx
```

**Frontend** (`frontend/package.json`):
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  }
}
```

---

## 🔮 Planned Improvements

- [ ] Alembic database migrations (replace `create_all`)
- [ ] JWT refresh token system
- [ ] Rate limiting on auth endpoints (slowapi)
- [ ] Pytest test suite with CI via GitHub Actions
- [ ] Docker + docker-compose for one-command setup
- [ ] Real order status field (pending → preparing → delivered)
- [ ] WebSocket for live order status updates
- [ ] Email verification on signup

---

## 👨‍💻 Author

**Baish** — [github.com/alokmishra1710](https://github.com/alokmishra1710)

---

## 📄 License

MIT License — feel free to use this project as a reference or starting point.
