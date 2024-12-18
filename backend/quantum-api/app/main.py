from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .models import (
    ExecutionRequest, ExecutionResult, ProviderType,
    ChatMessage, ChatSession, QuantumCircuit
)
from .providers.ibm import IBMQuantumProvider
from .providers.rigetti import RigettiQuantumProvider
from .providers.google import GoogleQuantumProvider
from .providers.microsoft import MicrosoftQuantumProvider
from .services.openai_service import OpenAIService
from .security.auth import (
    Token, User, create_access_token, get_current_user,
    verify_scope, get_password_hash, verify_password, get_user
)
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Quantum Development Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve index.html for client-side routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404)
    return FileResponse("static/index.html")

# Initialize providers
ibm_provider = IBMQuantumProvider()
rigetti_provider = RigettiQuantumProvider()
google_provider = GoogleQuantumProvider()
microsoft_provider = MicrosoftQuantumProvider()

@app.on_event("startup")
async def startup_event():
    """Initialize quantum providers on startup."""
    ibm_token = os.getenv("IBM_QUANTUM_TOKEN")
    rigetti_token = os.getenv("RIGETTI_API_KEY")
    google_creds = os.getenv("GOOGLE_QUANTUM_CREDENTIALS")
    ms_workspace = os.getenv("MICROSOFT_QUANTUM_WORKSPACE")

    if ibm_token:
        await ibm_provider.initialize(ibm_token)
    if rigetti_token:
        await rigetti_provider.initialize(rigetti_token)
    if google_creds:
        await google_provider.initialize(google_creds)
    if ms_workspace:
        await microsoft_provider.initialize(ms_workspace)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint to get JWT token."""
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username, "scopes": user.scopes},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/execute", response_model=ExecutionResult)
async def execute_circuit(
    request: ExecutionRequest,
    user: User = Depends(verify_scope(["execute"]))
) -> ExecutionResult:
    """Execute a quantum circuit on the specified provider."""
    try:
        if request.provider == ProviderType.IBM:
            return await ibm_provider.execute_circuit(
                request.circuit,
                shots=request.shots,
                backend_name=request.backend_name
            )
        elif request.provider == ProviderType.RIGETTI:
            return await rigetti_provider.execute_circuit(
                request.circuit,
                shots=request.shots,
                backend_name=request.backend_name
            )
        elif request.provider == ProviderType.GOOGLE:
            return await google_provider.execute_circuit(
                request.circuit,
                shots=request.shots,
                backend_name=request.backend_name
            )
        elif request.provider == ProviderType.MICROSOFT:
            return await microsoft_provider.execute_circuit(
                request.circuit,
                shots=request.shots,
                backend_name=request.backend_name
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Provider {request.provider} not implemented yet"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.post("/api/chat/generate", response_model=QuantumCircuit)
async def generate_circuit_from_prompt(
    prompt: str,
    user: User = Depends(verify_scope(["execute"]))
) -> QuantumCircuit:
    """Generate a quantum circuit from a natural language prompt."""
    try:
        openai_service = OpenAIService()
        return await openai_service.generate_quantum_circuit(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/sessions", response_model=ChatSession)
async def create_chat_session(
    user: User = Depends(verify_scope(["execute"]))
) -> ChatSession:
    """Create a new chat session."""
    return ChatSession()

@app.post("/api/chat/sessions/{session_id}/messages", response_model=ChatMessage)
async def add_chat_message(
    session_id: str,
    message: ChatMessage,
    user: User = Depends(verify_scope(["execute"]))
) -> ChatMessage:
    """Add a message to an existing chat session."""
    try:
        # In a real implementation, we would store these in a database
        # For now, we just return the message with a timestamp
        return message
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
