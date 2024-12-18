from qiskit import IBMQ, QuantumCircuit as QiskitCircuit, QuantumRegister, ClassicalRegister
from qiskit.providers.ibmq import IBMQBackend
from ..models import QuantumCircuit, ExecutionResult, ProviderType
import time
from typing import Optional

class IBMQuantumProvider:
    def __init__(self):
        self._provider = None

    async def initialize(self, token: str):
        """Initialize the IBM Quantum provider with authentication token."""
        IBMQ.save_account(token, overwrite=True)
        self._provider = IBMQ.load_account()

    async def get_backend(self, backend_name: Optional[str] = None) -> IBMQBackend:
        """Get the quantum backend to use for execution."""
        if not self._provider:
            raise ValueError("Provider not initialized. Call initialize() first.")

        if backend_name:
            return self._provider.get_backend(backend_name)
        return self._provider.get_backend('ibmq_qasm_simulator')

    def convert_circuit(self, circuit: QuantumCircuit) -> QiskitCircuit:
        """Convert our circuit format to Qiskit's format."""
        qr = QuantumRegister(circuit.qubits)
        cr = ClassicalRegister(circuit.qubits)
        qc = QiskitCircuit(qr, cr)

        for gate in circuit.gates:
            if gate.type == 'H':
                qc.h(gate.position['qubit'])
            elif gate.type == 'X':
                qc.x(gate.position['qubit'])
            elif gate.type == 'CNOT':
                if gate.control is None:
                    raise ValueError("CNOT gate requires a control qubit")
                qc.cx(gate.control, gate.position['qubit'])
            elif gate.type == 'MEASURE':
                qc.measure(gate.position['qubit'], gate.position['qubit'])

        return qc

    async def execute_circuit(self, circuit: QuantumCircuit, shots: int = 1024, backend_name: Optional[str] = None) -> ExecutionResult:
        """Execute a quantum circuit on IBM Quantum hardware or simulator."""
        start_time = time.time()

        backend = await self.get_backend(backend_name)
        qiskit_circuit = self.convert_circuit(circuit)

        job = backend.run(qiskit_circuit, shots=shots)
        result = job.result()

        counts = result.get_counts()
        statevector = None
        if hasattr(result, 'get_statevector'):
            statevector = result.get_statevector()

        # Convert results to our format
        states = []
        if statevector:
            for i in range(circuit.qubits):
                states.append({
                    'qubit': i,
                    'state': {
                        'alpha': abs(statevector[i*2]),
                        'beta': abs(statevector[i*2 + 1])
                    }
                })

        return ExecutionResult(
            measurements=counts,
            states=states,
            provider=ProviderType.IBM,
            backend_used=backend.name(),
            execution_time=time.time() - start_time
        )
