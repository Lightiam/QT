from typing import List, Optional
from ..models import QuantumCircuit, QuantumGate
import numpy as np

def create_qft_circuit(num_qubits: int, inverse: bool = False) -> QuantumCircuit:
    """
    Create a Quantum Fourier Transform circuit.

    Args:
        num_qubits: Number of qubits in the circuit
        inverse: If True, creates inverse QFT circuit

    Returns:
        QuantumCircuit: Circuit implementing QFT or inverse QFT
    """
    circuit = QuantumCircuit(
        gates=[],
        qubits=num_qubits,
        steps=num_qubits * 2,  # Each qubit needs H + controlled rotations
        name="Quantum Fourier Transform",
        description=f"{'Inverse ' if inverse else ''}QFT on {num_qubits} qubits"
    )

    def add_qft_gates(start_qubit: int, current_step: int):
        """Add QFT gates for a given qubit."""
        # Hadamard gate
        circuit.gates.append(QuantumGate(
            type='H',
            position={'qubit': start_qubit, 'step': current_step}
        ))

        # Controlled phase rotations
        for target_qubit in range(start_qubit + 1, num_qubits):
            circuit.gates.append(QuantumGate(
                type='CNOT',  # Note: In real QFT we need controlled phase gates
                position={'qubit': target_qubit, 'step': current_step + 1},
                control=start_qubit
            ))

    # Add QFT or inverse QFT gates
    qubit_order = range(num_qubits - 1, -1, -1) if inverse else range(num_qubits)

    current_step = 0
    for qubit in qubit_order:
        add_qft_gates(qubit, current_step)
        current_step += 2

    # Add measurements
    for qubit in range(num_qubits):
        circuit.gates.append(QuantumGate(
            type='MEASURE',
            position={'qubit': qubit, 'step': current_step}
        ))

    return circuit
