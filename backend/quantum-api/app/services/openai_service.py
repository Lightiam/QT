from datetime import datetime
from openai import OpenAI
from typing import Dict, List, Optional
from ..models import QuantumCircuit, QuantumGate
import json
import os
from fastapi import HTTPException

class OpenAIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.client = OpenAI(api_key=api_key)

    def _parse_circuit_json(self, json_str: str) -> QuantumCircuit:
        try:
            data = json.loads(json_str)
            gates = [
                QuantumGate(
                    type=gate["type"],
                    position=gate["position"],
                    control=gate.get("control")
                )
                for gate in data["gates"]
            ]
            return QuantumCircuit(
                gates=gates,
                qubits=data["qubits"],
                steps=data["steps"],
                name=data["name"],
                description=data.get("description")
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse quantum circuit from response: {str(e)}"
            )

    async def generate_quantum_circuit(self, prompt: str) -> QuantumCircuit:
        """Generate a quantum circuit from a natural language prompt."""
        try:
            system_prompt = """You are a quantum computing expert. Convert natural language descriptions into quantum circuits.
            Output only valid JSON that matches this schema:
            {
                "gates": [
                    {
                        "type": "string (H, X, Y, Z, CNOT, etc.)",
                        "position": {"qubit": "int", "step": "int"},
                        "control": "optional int (for controlled gates)"
                    }
                ],
                "qubits": "int (total number of qubits)",
                "steps": "int (total number of time steps)",
                "name": "string (circuit name)",
                "description": "string (optional description)"
            }
            Ensure all quantum operations are valid and physically realizable."""

            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,  # Lower temperature for more consistent outputs
                max_tokens=1000
            )

            # Extract the JSON string from the response
            circuit_json = response.choices[0].message.content.strip()
            return self._parse_circuit_json(circuit_json)

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate quantum circuit: {str(e)}"
            )
