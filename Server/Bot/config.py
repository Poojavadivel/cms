import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
print("[DEBUG] .env file loaded.")

# MongoDB
MONGO_URI = os.getenv("MANGODB_URl")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
if MONGO_URI:
    print("[DEBUG] MongoDB URI loaded successfully.")
else:
    print("[ERROR] MongoDB URI is missing in .env")

# Azure OpenAI
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")  # ✅ ADD THIS

if AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT and AZURE_OPENAI_API_VERSION:
    print("[DEBUG] Azure OpenAI config loaded successfully.")
else:
    print("[ERROR] One or more Azure OpenAI variables are missing in .env")
