from pyquil import Program, get_qc
from pyquil.gates import H, X, CNOT, MEASURE
from pyquil.quilbase import DefGate
from ..models import QuantumCircuit, ExecutionResult, ProviderType
import numpy as np
import time
from typing import Optional, Dict

class RigettiQuantumProvider:
    def __init__(self):
        self._qvm_connection = None
        self._quilc_connection = None

    async def initialize(self, api_key: str):
        """Initialize the Rigetti Quantum provider with authentication."""
        # Rigetti authentication is handled through environment variables
        # but we'll store the API key for potential future use
        self._api_key = api_key

    async def get_backend(self, backend_name: Optional[str] = None) -> str:
        """Get the quantum backend to use for execution."""
        if backend_name:
            return backend_name
        return "9q-square-qvm"  # Default to 9-qubit QVM

    def convert_circuit(self, circuit: QuantumCircuit) -> Program:
        """Convert our circuit format to Rigetti's format."""
        program = Program()

        # Add measurement readout register
        ro = program.declare('ro', 'BIT', circuit.qubits)

        for gate in circuit.gates:
            if gate.type == 'H':
                program += H(gate.position['qubit'])
            elif gate.type == 'X':
                program += X(gate.position['qubit'])
            elif gate.type == 'CNOT':
                if gate.control is None:
                    raise ValueError("CNOT gate requires a control qubit")
                program += CNOT(gate.control, gate.position['qubit'])
            elif gate.type == 'MEASURE':
                program += MEASURE(gate.position['qubit'], ro[gate.position['qubit']])

        return program

    def _process_results(self, measurements: np.ndarray, num_qubits: int) -> Dict[str, int]:
        """Process measurement results into counts dictionary."""
        counts = {}
        for measurement in measurements:
            # Convert measurement array to binary string
            binary = ''.join(str(int(bit)) for bit in measurement)
            counts[binary] = counts.get(binary, 0) + 1
        return counts

    async def execute_circuit(self, circuit: QuantumCircuit, shots: int = 1024, backend_name: Optional[str] = None) -> ExecutionResult:
        """Execute a quantum circuit on Rigetti hardware or QVM."""
        start_time = time.time()

        try:
            # Get quantum computer connection
            qc_name = await self.get_backend(backend_name)
            qc = get_qc(qc_name)

            # Convert and compile circuit
            program = self.convert_circuit(circuit)
            executable = qc.compile(program)

            # Run the program
            measurements = qc.run(executable, shots=shots)

            # Process results
            counts = self._process_results(measurements, circuit.qubits)

            # For QVM, we can get the wavefunction
            states = []
            if "qvm" in qc_name.lower():
                wf_program = program.write_memory('wf', [0] * 2**circuit.qubits)
                wavefunction = qc.wavefunction(wf_program)
                amplitudes = wavefunction.amplitudes

                for i in range(circuit.qubits):
                    # Calculate single-qubit state from full wavefunction
                    alpha = np.abs(amplitudes[i*2])
                    beta = np.abs(amplitudes[i*2 + 1])
                    states.append({
                        'qubit': i,
                        'state': {
                            'alpha': float(alpha),
                            'beta': float(beta)
                        }
                    })

            return ExecutionResult(
                measurements=counts,
                states=states,
                provider=ProviderType.RIGETTI,
                backend_used=qc_name,
                execution_time=time.time() - start_time
            )

        except Exception as e:
            raise Exception(f"Rigetti execution error: {str(e)}")
