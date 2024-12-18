import cirq
import cirq_google
from ..models import QuantumCircuit, ExecutionResult, ProviderType
import numpy as np
import time
from typing import Optional, Dict, List
from google.auth import credentials
import os

class GoogleQuantumProvider:
    def __init__(self):
        self._engine = None
        self._processor = None

    async def initialize(self, credentials_path: str):
        """Initialize the Google Quantum provider with authentication."""
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
        self._engine = cirq_google.Engine()

    async def get_backend(self, backend_name: Optional[str] = None) -> str:
        """Get the quantum backend to use for execution."""
        if backend_name:
            self._processor = self._engine.get_processor(backend_name)
            return backend_name
        return "simulator"

    def convert_circuit(self, circuit: QuantumCircuit) -> cirq.Circuit:
        """Convert our circuit format to Cirq's format."""
        qubits = [cirq.LineQubit(i) for i in range(circuit.qubits)]
        cirq_circuit = cirq.Circuit()

        for gate in circuit.gates:
            if gate.type == 'H':
                cirq_circuit.append(cirq.H(qubits[gate.position['qubit']]))
            elif gate.type == 'X':
                cirq_circuit.append(cirq.X(qubits[gate.position['qubit']]))
            elif gate.type == 'CNOT':
                if gate.control is None:
                    raise ValueError("CNOT gate requires a control qubit")
                cirq_circuit.append(cirq.CNOT(
                    qubits[gate.control],
                    qubits[gate.position['qubit']]
                ))
            elif gate.type == 'MEASURE':
                cirq_circuit.append(cirq.measure(
                    qubits[gate.position['qubit']],
                    key=f'q{gate.position["qubit"]}'
                ))

        return cirq_circuit

    def _process_results(self, result: cirq.Result, num_qubits: int) -> Dict[str, int]:
        """Process measurement results into counts dictionary."""
        counts = {}
        for measurement in result.measurements.values():
            # Convert measurement array to binary string
            binary = ''.join(str(int(bit)) for bit in measurement[0])
            counts[binary] = counts.get(binary, 0) + 1
        return counts

    async def execute_circuit(self, circuit: QuantumCircuit, shots: int = 1024, backend_name: Optional[str] = None) -> ExecutionResult:
        """Execute a quantum circuit on Google Quantum hardware or simulator."""
        start_time = time.time()

        try:
            backend = await self.get_backend(backend_name)
            cirq_circuit = self.convert_circuit(circuit)

            if backend == "simulator":
                # Use Cirq's simulator
                simulator = cirq.Simulator()
                result = simulator.run(cirq_circuit, repetitions=shots)

                # For simulator, we can get the final state
                final_state_vector = simulator.simulate(cirq_circuit).final_state_vector
                states = []
                for i in range(circuit.qubits):
                    # Calculate single-qubit state from state vector
                    qubit_state = final_state_vector[i*2:(i+1)*2]
                    states.append({
                        'qubit': i,
                        'state': {
                            'alpha': float(np.abs(qubit_state[0])),
                            'beta': float(np.abs(qubit_state[1]))
                        }
                    })
            else:
                # Use Google Quantum hardware
                result = self._processor.run(
                    program=cirq_circuit,
                    repetitions=shots,
                )
                states = []  # Hardware execution doesn't provide state vector

            counts = self._process_results(result, circuit.qubits)

            return ExecutionResult(
                measurements=counts,
                states=states,
                provider=ProviderType.GOOGLE,
                backend_used=backend,
                execution_time=time.time() - start_time
            )

        except Exception as e:
            raise Exception(f"Google Quantum execution error: {str(e)}")
