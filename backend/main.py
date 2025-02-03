
from urllib.parse import quote_plus
from fastapi import FastAPI, HTTPException, UploadFile, File, Form,Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
import ollama
from mongoengine import connect, disconnect, Document, StringField, DateTimeField, IntField, EmailField
import os
from datetime import datetime, timedelta,time
from typing import Optional
import shutil
import jwt
from passlib.hash import bcrypt
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import JWTError
from fastapi.security import OAuth2PasswordRequestForm
import time
import PyPDF2
from io import BytesIO
import whisper

from PIL import Image
import pytesseract
import io
# connection_string = f"mongodb+srv://{username}:{password}@cluster0.top9b.mongodb.net/?retryWrites=true&w=majority"
MONGO_URL = "mongodb://localhost:27017/auraom_db"
connect(host=MONGO_URL)

SECRET_KEY="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d7e9"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

app = FastAPI()
blacklisted_tokens = set()
def is_token_blacklisted(jti: str) -> bool:
    return jti in blacklisted_tokens

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# origins = [
#     "http://localhost:3000"
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Load Whisper model for speech-to-text
whisper_model = whisper.load_model("base",device= "cpu", in_memory=True)  # Use "small" or "medium" for better accuracy

@app.on_event("startup")
async def startup_event():
    global whisper_model
    whisper_model = whisper.load_model("base")
    


# MongoDB Document
class Chat(Document):
    role = StringField(required=True)
    content = StringField(required=True)
    timestamp = DateTimeField(default=datetime.now)
    meta = {'collection': 'chats'}

# Pydantic Model
class ChatRequest(BaseModel):
    prompt: str


UPLOAD_DIR = "profile_pictures"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ========== Password Hashing ==========
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ========== OAuth2 for Authentication ==========
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")

# ========== MongoDB User Model ==========
class User(Document):
    email = StringField(required=True, unique=True)
    username = StringField(required=True)
    hashed_password = StringField(required=True)
    age = IntField(required=True)
    profession = StringField(required=True)
    phonenumber = StringField(required=True)
    description = StringField()
    profile_picture = StringField()

# ========== MongoDB Chat Model ==========
class Chat(Document):
    role = StringField(required=True, choices=["user", "assistant"])
    content = StringField(required=True)
    timestamp = DateTimeField(default=lambda: time())

# ========== Pydantic Models ==========
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str
    age: int
    profession: str
    phonenumber: str
    description: Optional[str] = None

class ChatRequest(BaseModel):
    prompt: str

app = FastAPI()

waiting_for_response = False  # Global flag to prevent multiple chat requests

# ========== Utility Functions ==========
def hash_password(password: str):
    """Hash password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    """Verify if the password is correct."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta):
    """Create a JWT token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ========== Sign Up Route ==========
@app.post("/signup")
def signup(
    email: EmailStr = Form(...),
    password: str = Form(...),
    username: str = Form(...),
    age: int = Form(...),
    profession: str = Form(...),
    phonenumber: str = Form(...),
    description: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None)
):
    """Register a new user with hashed password and JWT authentication."""
    if User.objects(email=email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    profile_picture_path = None
    if profile_picture:
        file_location = f"{UPLOAD_DIR}/{profile_picture.filename}"
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(profile_picture.file, buffer)
        profile_picture_path = file_location

    hashed_password = hash_password(password)

    user = User(
        email=email,
        username=username,
        hashed_password=hashed_password,
        age=age,
        profession=profession,
        phonenumber=phonenumber,
        description=description,
        profile_picture=profile_picture_path
    )
    user.save()

    return {"message": "User registered successfully"}

# ========== Login Route ==========
@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and return JWT token."""
    user = User.objects(username=form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    return {"access_token": access_token, "token_type": "bearer"}

# ========== Get Current User ==========
def get_current_user(token: str = Depends(oauth2_scheme)):
    """Verify JWT token and return current user."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = User.objects(username=username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========== Fetch User Info ==========
@app.get("/user")
def get_user(user: User = Depends(get_current_user)):
    """Fetch authenticated user's details."""
    return {
        "email": user.email,
        "username": user.username,
        "age": user.age,
        "profession": user.profession,
        "phonenumber": user.phonenumber,
        "description": user.description,
        "profile_picture": user.profile_picture
    }
    
class ChatRequest(BaseModel):
    prompt: str

@app.post("/chat")
async def chat(request: ChatRequest, user: User = Depends(get_current_user)):
    """Chat endpoint using Ollama AI with JWT authentication."""
    global waiting_for_response

    if waiting_for_response:
        return {"response": "Please wait for the previous response to be generated."}

    waiting_for_response = True  # Lock the next request

    try:
        user_prompt = request.prompt.strip()
        if not user_prompt:
            raise HTTPException(status_code=400, detail="Please enter a valid message.")

        # Save user message to MongoDB with proper timestamp format
        Chat(role="user", content=user_prompt, timestamp=datetime.utcnow()).save()

        # Fetch chat history (oldest first)
        chat_history = Chat.objects().order_by("timestamp")
        messages = []
        
        # Append chat history messages
        for chat in chat_history:
            messages.append({"role": chat.role, "content": chat.content})

        # Append the latest user message at the end
        messages.append({"role": "user", "content": user_prompt})

        # Simulate slight delay before sending request
        time.sleep(0.5)

        # Generate response using Ollama
        response = ollama.chat("llama3.2", messages=messages)

        if not response or "message" not in response or "content" not in response["message"]:
            bot_response = "I'm sorry, I couldn't generate a response. Please try again."
        else:
            bot_response = response["message"]["content"].strip()

        # Save the conversation in MongoDB
        Chat(role="user", content=user_prompt, timestamp=datetime.utcnow()).save()
        Chat(role="assistant", content=bot_response, timestamp=datetime.utcnow()).save()

        # Additional sleep to ensure data is stored properly
        time.sleep(0.3)

        return {"response": bot_response}

    finally:
        time.sleep(0.2)
        waiting_for_response = False
        
def invalidate_token(token: str) -> None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        jti = payload.get("jti")  
        if jti:
            blacklisted_tokens.add(jti) 
        else:
            blacklisted_tokens.add(token)  
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/User_logout/")
async def logout(token: str = Depends(oauth2_scheme)):
    invalidate_token(token) 
    return {"message": "Successfully logged out"}

async def generate_response_stream(messages):
    try:
        response = ollama.chat("llama3.2", messages=messages)
        bot_response = response["message"]["content"].strip()
        
        # Save assistant response to MongoDB
        Chat(role="assistant", content=bot_response).save()
        
        yield bot_response
    except Exception as e:
        yield f"Error generating response: {str(e)}"
        
@app.post("/upload")
async def chat_with_attachment(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    user: User = Depends(get_current_user)
):
    global waiting_for_response
    if waiting_for_response:
        raise HTTPException(status_code=429, detail="Please wait for the previous response.")
    waiting_for_response = True

    try:
        # Read and process file
        content = await file.read()
        extracted_text = ""
        
        if file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            try:
                # Use OCR to extract text from images
                image = Image.open(io.BytesIO(content))
                extracted_text = pytesseract.image_to_string(image)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

        elif file.filename.endswith('.pdf'):
            with BytesIO(content) as pdf_buffer:
                pdf_reader = PyPDF2.PdfReader(pdf_buffer)
                extracted_text = "\n".join([page.extract_text() for page in pdf_reader.pages])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        # if file.filename.endswith('.png') or ('.jpg'):
        #     extracted_text = content.decode('utf-8')
        # elif file.filename.endswith('.pdf'):
        #     with BytesIO(content) as pdf_buffer:
        #         pdf_reader = PyPDF2.PdfReader(pdf_buffer)
        #         extracted_text = "\n".join([page.extract_text() for page in pdf_reader.pages])
        # else:
        #     raise HTTPException(status_code=400, detail="Unsupported file type")

        # Combine prompt and extracted text
        full_prompt = f"{prompt}\n\nFile content:\n{extracted_text}" if prompt else extracted_text
        print(full_prompt, "==============================")
        # Save to database
        Chat(role="user", content=full_prompt, timestamp=datetime.utcnow()).save()

        # Get chat history
        chat_history = Chat.objects().order_by("timestamp")
        messages = [{"role": chat.role, "content": chat.content} for chat in chat_history]

        # Generate response
        response = ollama.chat("llama3.2", messages=messages)
        bot_response = response["message"]["content"].strip()

        # Save response
        Chat(role="assistant", content=bot_response, timestamp=datetime.utcnow()).save()

        return {"response": bot_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        waiting_for_response = False
        
@app.post("/chat/voice")
async def chat_with_voice(
    audio_file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    global waiting_for_response
    if waiting_for_response:
        raise HTTPException(status_code=429, detail="Please wait for the previous response.")
    waiting_for_response = True

    try:
        # Save audio temporarily
        temp_file = f"temp_{audio_file.filename}"
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        # Transcribe audio
        result = whisper_model.transcribe(temp_file)
        transcribed_text = result["text"]

        # Save to database
        Chat(role="user", content=transcribed_text, timestamp=datetime.utcnow()).save()

        # Get chat history
        chat_history = Chat.objects().order_by("timestamp")
        messages = [{"role": chat.role, "content": chat.content} for chat in chat_history]

        # Generate response
        response = ollama.chat("llama3.2", messages=messages)
        bot_response = response["message"]["content"].strip()

        # Save response
        Chat(role="assistant", content=bot_response, timestamp=datetime.utcnow()).save()

        return {"response": bot_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        waiting_for_response = False
        if os.path.exists(temp_file):
            os.remove(temp_file)
        


# # Chat Endpoint
# @app.post("/chat")
# async def chat(request: ChatRequest,user:User = Depends(get_current_user)):
#     user_prompt = request.prompt.strip()
#     if not user_prompt:
#         raise HTTPException(status_code=400, detail="Please enter a valid message.")

#     # Save user message to MongoDB
#     Chat(role="user", content=user_prompt).save()

#     # Prepare messages for LLM
#     chat_history = Chat.objects().order_by("timestamp")
#     messages = [{"role": chat.role, "content": chat.content} for chat in chat_history]
#     messages.append({"role": "user", "content": user_prompt})

#     # Return streaming response
#     return StreamingResponse(generate_response_stream(messages), media_type="text/plain")

# @app.get("/history")
# async def get_history():
#     chats = Chat.objects().order_by("timestamp")
#     return [{"role": chat.role, "content": chat.content} for chat in chats]


# token_secret = "9f1c7fdb202a4d3886c01560b4b83be2b00f4b8e350f4b1587ee93b3d1d9e4fa"
 
# def create_jwt_token(username: str):
#     payload = {
#         "sub": username,
#         "exp": datetime.utcnow() + timedelta(days=1)
#     }
#     return jwt.encode(payload, token_secret, algorithm="HS256")
 
# def decode_jwt_token(token: str):
#     try:
#         payload = jwt.decode(token, token_secret, algorithms=["HS256"])
#         return payload["sub"]
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Token expired")
#     except jwt.InvalidTokenError:
#         raise HTTPException(status_code=401, detail="Invalid token")
 
# # MongoEngine Model
# class User(Document):
#     username = StringField(required=True, unique=True)
#     password = StringField(required=True)
#     age = IntField(required=True)
#     profession = StringField(required=True)
#     email = EmailField(required=True, unique=True)
#     phonenumber = StringField(required=True)
#     description = StringField()
#     profile_picture = StringField()
 
# # Directory for Profile Pictures
# UPLOAD_DIR = "profile_pictures"
# os.makedirs(UPLOAD_DIR, exist_ok=True)
 
# @app.post("/signup/")
# def signup(
#     username: str = Form(...),
#     password: str = Form(...),
#     confirm_password: str = Form(...),
#     age: int = Form(...),
#     profession: str = Form(...),
#     email: EmailStr = Form(...),
#     phonenumber: str = Form(...),
#     description: Optional[str] = Form(None),
#     profile_picture: Optional[UploadFile] = File(None)
# ):
#     # Check if email or username already exists
#     if User.objects(username=username).first() or User.objects(email=email).first():
#         raise HTTPException(status_code=400, detail="Email or username already registered")
    
#     # Validate passwords
#     if password != confirm_password:
#         raise HTTPException(status_code=400, detail="Passwords do not match")
 
#     # Hash password
#     hashed_password = bcrypt.hash(password)
 
#     # Handle profile picture upload
#     profile_picture_path = None
#     if profile_picture:
#         file_location = f"{UPLOAD_DIR}/{profile_picture.filename}"
#         with open(file_location, "wb") as buffer:
#             shutil.copyfileobj(profile_picture.file, buffer)
#         profile_picture_path = file_location
    
#     user = User(
#         username=username,
#         password=hashed_password,
#         age=age,
#         profession=profession,
#         email=email,
#         phonenumber=phonenumber,
#         description=description,
#         profile_picture=profile_picture_path,
#     )
#     user.save()
    
#     token = create_jwt_token(username)
#     return {"message": "User registered successfully", "user_id": str(user.id), "token": token}
 
# @app.post("/login/")
# def login(username: str = Form(...), password: str = Form(...)):
#     user = User.objects(username=username).first()
#     if not user or not bcrypt.verify(password, user.password):
#         raise HTTPException(status_code=400, detail="Invalid username, or password")
#     token = create_jwt_token(user.username)
#     return {"access_token": token, "token_type": "bearer"}
 
# @app.post("/signout/")
# def signout(token: str = Form(...)):
#     username = decode_jwt_token(token)
#     return {"message": "User signed out successfully", "username": username}

