from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.routers import auth, users, food, cart, orders

Base.metadata.create_all(bind=engine) #automatically create all db tables

app = FastAPI(title="Feastly Flying Cutter") #creates the application instance that defines routes and logic

# CORS — update allow_origins with your frontend URL in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://feastly-flying-cutter.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router) #connects APIs to the main app, without this, routes won't work
app.include_router(users.router)
app.include_router(food.router)
app.include_router(cart.router)
app.include_router(orders.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Feastly Flying Cutter API"}