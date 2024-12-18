from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class QuantumCircuit(BaseModel):
    """Represents a quantum circuit with version control metadata."""
    id: str
    name: str
    description: Optional[str]
    content: str  # Circuit definition in QASM or custom format
    version: str
    parent_version: Optional[str]
    branch: str
    author: str
    created_at: datetime
    updated_at: datetime
    metadata: dict  # Additional circuit metadata

class Branch(BaseModel):
    """Represents a branch in the version control system."""
    name: str
    description: Optional[str]
    base_branch: Optional[str]
    created_at: datetime
    last_commit: Optional[str]
    author: str

class Commit(BaseModel):
    """Represents a commit in the version control system."""
    id: str
    message: str
    author: str
    branch: str
    circuit_id: str
    parent_commit: Optional[str]
    created_at: datetime
    changes: dict  # Stores diff information
