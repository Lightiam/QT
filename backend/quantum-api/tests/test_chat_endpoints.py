import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, MagicMock

client = TestClient(app)

def test_create_chat_session():
    response = client.post(
        "/api/chat/sessions",
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 200
    assert "id" in response.json()

def test_create_chat_session_unauthorized():
    response = client.post("/api/chat/sessions")
    assert response.status_code == 401

def test_add_chat_message():
    session_id = "test-session"
    message = {
        "role": "user",
        "content": "Create a Bell state circuit"
    }

    response = client.post(
        f"/api/chat/sessions/{session_id}/messages",
        json=message,
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 200
    assert response.json()["role"] == message["role"]
    assert response.json()["content"] == message["content"]

@pytest.mark.asyncio
async def test_generate_circuit_from_prompt():
    mock_circuit = {
        "name": "Test Circuit",
        "qubits": 2,
        "gates": []
    }

    with patch('app.services.openai_service.OpenAIService.generate_quantum_circuit',
              return_value=mock_circuit):
        response = client.post(
            "/api/chat/generate",
            json={"prompt": "Create a test circuit"},
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        assert response.json() == mock_circuit


def test_generate_circuit_unauthorized():
    response = client.post(
        "/api/chat/generate",
        json={"prompt": "Create a test circuit"}
    )
    assert response.status_code == 401

def test_generate_circuit_invalid_prompt():
    response = client.post(
        "/api/chat/generate",
        json={},
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 422
