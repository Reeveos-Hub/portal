from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app: FastAPI):
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://rezvo.co.uk",
        "https://www.rezvo.co.uk",
        "https://dashboard.rezvo.co.uk",
        "https://rezvo.app",
        "https://www.rezvo.app",
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
