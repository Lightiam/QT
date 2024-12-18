import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from ..main import app, users
from ..auth import get_password_hash
from ..models import User

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_user():
    user = User(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        roles=["user"]
    )
    users["testuser"] = user
    users["testuser"].password = get_password_hash("testpass")
    return user

def test_create_access_token(client, test_user):
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_create_circuit(client, test_user):
    # First get token
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass"}
    )
    token = response.json()["access_token"]

    # Create circuit
    headers = {"Authorization": f"Bearer {token}"}
    circuit_data = {
        "name": "test_circuit",
        "content": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\ncreg c[2];\nh q[0];\ncx q[0],q[1];\n",
        "description": "Test quantum circuit"
    }
    response = client.post("/circuits/", headers=headers, json=circuit_data)
    assert response.status_code == 200
    assert response.json()["name"] == "test_circuit"
    assert response.json()["author"] == "testuser"

def test_create_branch(client, test_user):
    # Get token
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create branch
    branch_data = {
        "name": "feature/test",
        "base_branch": "main",
        "description": "Test feature branch"
    }
    response = client.post("/branches/", headers=headers, json=branch_data)
    assert response.status_code == 200
    assert response.json()["name"] == "feature/test"
    assert response.json()["author"] == "testuser"

def test_commit_changes(client, test_user):
    # Get token and create circuit first
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create initial circuit
    circuit_data = {
        "name": "test_circuit_commit",
        "content": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\n",
        "description": "Test circuit for commits"
    }
    response = client.post("/circuits/", headers=headers, json=circuit_data)
    circuit_id = response.json()["id"]

    # Make changes and commit
    new_content = "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\nh q[0];\n"
    commit_data = {
        "content": new_content,
        "message": "Added Hadamard gate"
    }
    response = client.post(
        f"/circuits/{circuit_id}/commit",
        headers=headers,
        json=commit_data
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Added Hadamard gate"
    assert response.json()["author"] == "testuser"

def test_get_circuit_history(client, test_user):
    # Get token and create circuit with commits
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create circuit
    circuit_data = {
        "name": "test_circuit_history",
        "content": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\n",
        "description": "Test circuit for history"
    }
    response = client.post("/circuits/", headers=headers, json=circuit_data)
    circuit_id = response.json()["id"]

    # Make multiple commits
    commits = [
        ("h q[0];\n", "Added H gate"),
        ("h q[0];\ncx q[0],q[1];\n", "Added CNOT gate")
    ]

    for content, message in commits:
        client.post(
            f"/circuits/{circuit_id}/commit",
            headers=headers,
            json={"content": content, "message": message}
        )

    # Get history
    response = client.get(
        f"/circuits/{circuit_id}/history",
        headers=headers
    )
    assert response.status_code == 200
    history = response.json()
    assert len(history) == 2
    assert history[0]["message"] == "Added CNOT gate"
    assert history[1]["message"] == "Added H gate"
