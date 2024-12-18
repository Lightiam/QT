import pytest
from unittest.mock import patch, MagicMock
from app.services.openai_service import OpenAIService
from app.models import QuantumCircuit

@pytest.fixture
def openai_service():
    return OpenAIService()

@pytest.mark.asyncio
async def test_generate_quantum_circuit_success(openai_service):
    mock_response = {
        "choices": [{
            "message": {
                "content": """
                {
                    "name": "Bell State",
                    "qubits": 2,
                    "gates": [
                        {"type": "h", "position": {"qubit": 0, "step": 0}},
                        {"type": "cx", "position": {"control": 0, "target": 1, "step": 1}}
                    ]
                }
                """
            }
        }]
    }

    with patch('openai.ChatCompletion.create', return_value=mock_response):
        circuit = await openai_service.generate_quantum_circuit("Create a Bell state")

        assert isinstance(circuit, QuantumCircuit)
        assert circuit.name == "Bell State"
        assert circuit.qubits == 2
        assert len(circuit.gates) == 2
        assert circuit.gates[0]["type"] == "h"
        assert circuit.gates[1]["type"] == "cx"

@pytest.mark.asyncio
async def test_generate_quantum_circuit_invalid_response():
    service = OpenAIService()
    mock_response = {
        "choices": [{
            "message": {
                "content": "Invalid JSON response"
            }
        }]
    }

    with patch('openai.ChatCompletion.create', return_value=mock_response):
        with pytest.raises(ValueError, match="Failed to parse OpenAI response"):
            await service.generate_quantum_circuit("Create an invalid circuit")

@pytest.mark.asyncio
async def test_generate_quantum_circuit_api_error():
    service = OpenAIService()

    with patch('openai.ChatCompletion.create', side_effect=Exception("API Error")):
        with pytest.raises(Exception, match="Failed to generate quantum circuit"):
            await service.generate_quantum_circuit("Test prompt")

@pytest.mark.asyncio
async def test_generate_quantum_circuit_validates_schema():
    service = OpenAIService()
    mock_response = {
        "choices": [{
            "message": {
                "content": """
                {
                    "name": "Invalid Circuit",
                    "qubits": "not a number",
                    "gates": []
                }
                """
            }
        }]
    }

    with patch('openai.ChatCompletion.create', return_value=mock_response):
        with pytest.raises(ValueError, match="Invalid circuit schema"):
            await service.generate_quantum_circuit("Create an invalid circuit")
