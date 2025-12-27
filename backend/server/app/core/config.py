import os

from dotenv import load_dotenv

load_dotenv()

FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY") or os.getenv("FIREBASE_API_KEY")

