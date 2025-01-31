
from urllib.parse import quote_plus
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
import ollama
from mongoengine import connect, disconnect, Document, StringField, DateTimeField, IntField, EmailField
import os
from datetime import datetime, timedelta
from typing import Optional
import shutil
import jwt
from passlib.hash import bcrypt

USERNAME = "ayushsrivastava310803"
PASSWORD = "Ayush@310803"
username = quote_plus(USERNAME)
password = quote_plus(PASSWORD)
connection_string = f"mongodb+srv://{username}:{password}@cluster0.top9b.mongodb.net/?retryWrites=true&w=majority"


app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Document
class Chat(Document):
    role = StringField(required=True)
    content = StringField(required=True)
    timestamp = DateTimeField(default=datetime.now)
    meta = {'collection': 'chats'}

# Pydantic Model
class ChatRequest(BaseModel):
    prompt: str

@app.on_event("startup")
async def startup_db_client():
    connect(db='test_db', host=connection_string)

@app.on_event("shutdown")
async def shutdown_db_client():
    disconnect()


async def generate_response_stream(messages):
    try:
        response = ollama.chat("llama3.2", messages=messages)
        bot_response = response["message"]["content"].strip()
        
        # Save assistant response to MongoDB
        Chat(role="assistant", content=bot_response).save()
        
        yield bot_response
    except Exception as e:
        yield f"Error generating response: {str(e)}"

# Chat Endpoint
@app.post("/chat")
async def chat(request: ChatRequest):
    user_prompt = request.prompt.strip()
    if not user_prompt:
        raise HTTPException(status_code=400, detail="Please enter a valid message.")

    # Save user message to MongoDB
    Chat(role="user", content=user_prompt).save()

    # Prepare messages for LLM
    chat_history = Chat.objects().order_by("timestamp")
    messages = [{"role": chat.role, "content": chat.content} for chat in chat_history]
    messages.append({"role": "user", "content": user_prompt})

    # Return streaming response
    return StreamingResponse(generate_response_stream(messages), media_type="text/plain")

@app.get("/history")
async def get_history():
    chats = Chat.objects().order_by("timestamp")
    return [{"role": chat.role, "content": chat.content} for chat in chats]


token_secret = "9f1c7fdb202a4d3886c01560b4b83be2b00f4b8e350f4b1587ee93b3d1d9e4fa"
 
def create_jwt_token(username: str):
    payload = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, token_secret, algorithm="HS256")
 
def decode_jwt_token(token: str):
    try:
        payload = jwt.decode(token, token_secret, algorithms=["HS256"])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
 
# MongoEngine Model
class User(Document):
    username = StringField(required=True, unique=True)
    password = StringField(required=True)
    age = IntField(required=True)
    profession = StringField(required=True)
    email = EmailField(required=True, unique=True)
    phonenumber = StringField(required=True)
    description = StringField()
    profile_picture = StringField()
 
# Directory for Profile Pictures
UPLOAD_DIR = "profile_pictures"
os.makedirs(UPLOAD_DIR, exist_ok=True)
 
@app.post("/signup/")
def signup(
    username: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    age: int = Form(...),
    profession: str = Form(...),
    email: EmailStr = Form(...),
    phonenumber: str = Form(...),
    description: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None)
):
    # Check if email or username already exists
    if User.objects(username=username).first() or User.objects(email=email).first():
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    # Validate passwords
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
 
    # Hash password
    hashed_password = bcrypt.hash(password)
 
    # Handle profile picture upload
    profile_picture_path = None
    if profile_picture:
        file_location = f"{UPLOAD_DIR}/{profile_picture.filename}"
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(profile_picture.file, buffer)
        profile_picture_path = file_location
    
    user = User(
        username=username,
        password=hashed_password,
        age=age,
        profession=profession,
        email=email,
        phonenumber=phonenumber,
        description=description,
        profile_picture=profile_picture_path,
    )
    user.save()
    
    token = create_jwt_token(username)
    return {"message": "User registered successfully", "user_id": str(user.id), "token": token}
 
@app.post("/login/")
def login(username: str = Form(...), password: str = Form(...)):
    user = User.objects(username=username).first()
    if not user or not bcrypt.verify(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid username, or password")
    token = create_jwt_token(user.username)
    return {"access_token": token, "token_type": "bearer"}
 
@app.post("/signout/")
def signout(token: str = Form(...)):
    username = decode_jwt_token(token)
    return {"message": "User signed out successfully", "username": username}