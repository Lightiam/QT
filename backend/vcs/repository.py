from typing import List, Optional
from datetime import datetime
import uuid
from .models import QuantumCircuit, Branch, Commit

class QuantumRepository:
    def __init__(self):
        # Using in-memory storage as per workflow guidelines
        self.circuits: dict = {}
        self.branches: dict = {}
        self.commits: dict = {}

    def create_circuit(self, name: str, content: str, author: str, description: Optional[str] = None) -> QuantumCircuit:
        circuit_id = str(uuid.uuid4())
        circuit = QuantumCircuit(
            id=circuit_id,
            name=name,
            description=description,
            content=content,
            version="1.0.0",
            branch="main",
            author=author,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata={},
            parent_version=None
        )
        self.circuits[circuit_id] = circuit
        return circuit

    def create_branch(self, name: str, base_branch: str, author: str, description: Optional[str] = None) -> Branch:
        if name in self.branches:
            raise ValueError(f"Branch {name} already exists")

        branch = Branch(
            name=name,
            description=description,
            base_branch=base_branch,
            created_at=datetime.now(),
            last_commit=None,
            author=author
        )
        self.branches[name] = branch
        return branch

    def commit_changes(self, circuit_id: str, content: str, message: str, author: str) -> Commit:
        if circuit_id not in self.circuits:
            raise ValueError(f"Circuit {circuit_id} not found")

        circuit = self.circuits[circuit_id]
        old_content = circuit.content

        # Create commit
        commit_id = str(uuid.uuid4())
        commit = Commit(
            id=commit_id,
            message=message,
            author=author,
            branch=circuit.branch,
            circuit_id=circuit_id,
            parent_commit=circuit.metadata.get("last_commit"),
            created_at=datetime.now(),
            changes={"old": old_content, "new": content}
        )

        # Update circuit
        circuit.content = content
        circuit.updated_at = datetime.now()
        circuit.metadata["last_commit"] = commit_id

        self.commits[commit_id] = commit
        return commit

    def get_circuit_history(self, circuit_id: str) -> List[Commit]:
        if circuit_id not in self.circuits:
            raise ValueError(f"Circuit {circuit_id} not found")

        history = []
        current_commit = self.circuits[circuit_id].metadata.get("last_commit")

        while current_commit:
            commit = self.commits[current_commit]
            history.append(commit)
            current_commit = commit.parent_commit

        return history
