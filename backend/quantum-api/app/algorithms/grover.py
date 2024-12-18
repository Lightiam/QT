from typing import List, Callable, Optional
from ..models import QuantumCircuit, QuantumGate

def create_grover_circuit(
    num_qubits: int,
    oracle_function: Callable[[List[int]], bool],
    num_iterations: Optional[int] = None
) -> QuantumCircuit:
    """
    Create a Grover's algorithm circuit for searching marked states.

    Args:
        num_qubits: Number of qubits in the circuit
        oracle_function: Function that marks target states (returns True for marked states)
        num_iterations: Optional number of Grover iterations (if None, uses optimal π/4√N)

    Returns:
        QuantumCircuit: Circuit implementing Grover's algorithm
    """
    # Calculate optimal number of iterations if not specified
    if num_iterations is None:
        N = 2 ** num_qubits
        num_iterations = int(3.14159 * (N ** 0.5) / 4)

    circuit = QuantumCircuit(
        gates=[],
        qubits=num_qubits,
        steps=1 + 3 * num_iterations,  # Initial H gates + iterations * (oracle + diffusion)
        name="Grover Search",
        description=f"Grover's algorithm with {num_iterations} iterations on {num_qubits} qubits"
    )

    # Initialize superposition with Hadamard gates
    for qubit in range(num_qubits):
        circuit.gates.append(QuantumGate(
            type='H',
            position={'qubit': qubit, 'step': 0}
        ))

    current_step = 1
    for _ in range(num_iterations):
        # Apply oracle (implemented as controlled-Z gates based on oracle function)
        for state in range(2 ** num_qubits):
            if oracle_function([int(x) for x in format(state, f'0{num_qubits}b')]):
                # Mark state with phase flip (equivalent to controlled-Z)
                circuit.gates.append(QuantumGate(
                    type='X',
                    position={'qubit': num_qubits - 1, 'step': current_step}
                ))

        current_step += 1

        # Diffusion operator (Grover's diffusion)
        for qubit in range(num_qubits):
            # H gates before diffusion
            circuit.gates.append(QuantumGate(
                type='H',
                position={'qubit': qubit, 'step': current_step}
            ))

        # Multi-controlled X gate implemented with CNOTs
        for qubit in range(num_qubits - 1):
            circuit.gates.append(QuantumGate(
                type='CNOT',
                position={'qubit': qubit + 1, 'step': current_step + 1},
                control=qubit
            ))

        for qubit in range(num_qubits):
            # H gates after diffusion
            circuit.gates.append(QuantumGate(
                type='H',
                position={'qubit': qubit, 'step': current_step + 2}
            ))

        current_step += 3

    # Add final measurements
    for qubit in range(num_qubits):
        circuit.gates.append(QuantumGate(
            type='MEASURE',
            position={'qubit': qubit, 'step': current_step}
        ))

    return circuit
