export interface QuantumGate {
  type: 'H' | 'X' | 'CNOT' | 'MEASURE';
  position: {
    qubit: number;
    step: number;
  };
  control?: number;
}

export interface QuantumCircuit {
  gates: QuantumGate[];
  qubits: number;
  steps: number;
  name: string;
  description?: string;
}

export interface QuantumState {
  qubit: number;
  state: {
    alpha: number;  // Amplitude of |0⟩
    beta: number;   // Amplitude of |1⟩
  };
}
