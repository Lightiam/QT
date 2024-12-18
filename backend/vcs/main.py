from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional
from datetime import timedelta

from .models import QuantumCircuit, Branch, Commit
from .repository import QuantumRepository
from .auth import (
    User, Token, create_access_token, verify_token,
    get_password_hash, verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

app = FastAPI(title="Quantum VCS API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
repo = QuantumRepository()

# In-memory user storage (replace with database in production)
users = {}

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    token_data = verify_token(token)
    if token_data.username not in users:
        raise HTTPException(status_code=401, detail="Invalid user")
    return users[token_data.username]

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users.get(form_data.username)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "roles": user.roles},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/circuits/", response_model=QuantumCircuit)
async def create_circuit(
    name: str,
    content: str,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    return repo.create_circuit(name, content, current_user.username, description)

@app.post("/circuits/{circuit_id}/commit", response_model=Commit)
async def commit_circuit(
    circuit_id: str,
    content: str,
    message: str,
    current_user: User = Depends(get_current_active_user)
):
    return repo.commit_changes(circuit_id, content, message, current_user.username)

@app.post("/branches/", response_model=Branch)
async def create_branch(
    name: str,
    base_branch: str,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    return repo.create_branch(name, base_branch, current_user.username, description)

@app.get("/circuits/{circuit_id}/history", response_model=List[Commit])
async def get_circuit_history(
    circuit_id: str,
    current_user: User = Depends(get_current_active_user)
):
    return repo.get_circuit_history(circuit_id)
