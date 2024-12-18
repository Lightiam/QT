from pydantic import BaseModel
from typing import List, Dict, Optional, Union
from enum import Enum
from datetime import datetime
import uuid

class ProviderType(str, Enum):
    IBM = "ibm"
    RIGETTI = "rigetti"
    GOOGLE = "google"
    MICROSOFT = "microsoft"

class QuantumGate(BaseModel):
    type: str
    position: Dict[str, int]
    control: Optional[int] = None

class QuantumCircuit(BaseModel):
    gates: List[QuantumGate]
    qubits: int
    steps: int
    name: str
    description: Optional[str] = None

class ExecutionRequest(BaseModel):
    circuit: QuantumCircuit
    provider: ProviderType
    shots: int = 1024
    backend_name: Optional[str] = None

class ExecutionResult(BaseModel):
    measurements: Dict[str, int]
    states: List[Dict[str, Union[int, Dict[str, float]]]]
    provider: ProviderType
    backend_used: str
    execution_time: float

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = datetime.utcnow()

class ChatSession(BaseModel):
    id: str = str(uuid.uuid4())
    messages: List[ChatMessage] = []
    circuit: Optional[QuantumCircuit] = None
