import { QuantumCircuit, QuantumState } from '../types/quantum';
import { QuantumError } from './errors';

interface SimulationResult {
  measurements: { [key: string]: number };
  states: QuantumState[];
}

export async function simulateCircuit(circuit: QuantumCircuit): Promise<SimulationResult> {
  try {
    // Validate circuit before simulation
    if (!circuit.gates || !Array.isArray(circuit.gates)) {
      throw new QuantumError('Invalid circuit: gates must be an array', 'PARSE_ERROR');
    }

    // Validate each gate
    circuit.gates.forEach((gate, index) => {
      if (!gate.position || typeof gate.position.qubit !== 'number') {
        throw new QuantumError(`Invalid gate at index ${index}: missing or invalid qubit position`, 'INVALID_GATE');
      }
      if (gate.position.qubit >= circuit.qubits) {
        throw new QuantumError(`Invalid qubit index ${gate.position.qubit} at gate ${index}`, 'INVALID_QUBIT');
      }
    });

    const response = await fetch('/api/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(circuit),
    });

    if (!response.ok) {
      throw new QuantumError(`Simulation failed: ${response.statusText}`, 'SIMULATION_ERROR');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof QuantumError) {
      throw error;
    }
    throw new QuantumError('Simulation error', 'SIMULATION_ERROR', error);
  }
}

export function convertCircuitToCode(circuit: QuantumCircuit, language: 'python' | 'qsharp'): string {
  switch (language) {
    case 'python':
      return `from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister

# Create quantum registers
qr = QuantumRegister(${circuit.qubits})
cr = ClassicalRegister(${circuit.qubits})
circuit = QuantumCircuit(qr, cr)

${circuit.gates.map(gate => {
  switch (gate.type) {
    case 'H':
      return `circuit.h(${gate.position.qubit})`;
    case 'X':
      return `circuit.x(${gate.position.qubit})`;
    case 'CNOT':
      return `circuit.cx(${gate.control}, ${gate.position.qubit})`;
    case 'MEASURE':
      return `circuit.measure(${gate.position.qubit}, ${gate.position.qubit})`;
    default:
      return '';
  }
}).join('\n')}`;

    case 'qsharp':
      return `namespace QuantumProgram {
    open Microsoft.Quantum.Canon;
    open Microsoft.Quantum.Intrinsic;

    operation RunCircuit() : Result[] {
        use qubits = Qubit[${circuit.qubits}];
        mutable results = new Result[${circuit.qubits}];

        ${circuit.gates.map(gate => {
          switch (gate.type) {
            case 'H':
              return `H(qubits[${gate.position.qubit}]);`;
            case 'X':
              return `X(qubits[${gate.position.qubit}]);`;
            case 'CNOT':
              return `CNOT(qubits[${gate.control}], qubits[${gate.position.qubit}]);`;
            case 'MEASURE':
              return `set results w/= ${gate.position.qubit} <- M(qubits[${gate.position.qubit}]);`;
            default:
              return '';
          }
        }).join('\n        ')}

        return results;
    }
}`;
  }
}

export function parseCodeToCircuit(code: string, language: 'python' | 'qsharp'): QuantumCircuit {
  // This is a simplified parser that looks for common patterns
  const circuit: QuantumCircuit = {
    gates: [],
    qubits: 0,
    steps: 0,
    name: 'Parsed Circuit'
  };

  if (language === 'python') {
    // Extract number of qubits
    const qrMatch = code.match(/QuantumRegister\((\d+)\)/);
    if (qrMatch) {
      circuit.qubits = parseInt(qrMatch[1]);
    }

    // Parse gates
    const gateLines = code.split('\n');
    let step = 0;
    gateLines.forEach(line => {
      if (line.includes('circuit.h')) {
        const qubit = parseInt(line.match(/h\((\d+)\)/)?.[1] || '0');
        circuit.gates.push({ type: 'H', position: { qubit, step } });
        step++;
      } else if (line.includes('circuit.x')) {
        const qubit = parseInt(line.match(/x\((\d+)\)/)?.[1] || '0');
        circuit.gates.push({ type: 'X', position: { qubit, step } });
        step++;
      } else if (line.includes('circuit.cx')) {
        const matches = line.match(/cx\((\d+),\s*(\d+)\)/);
        if (matches) {
          circuit.gates.push({
            type: 'CNOT',
            position: { qubit: parseInt(matches[2]), step },
            control: parseInt(matches[1])
          });
          step++;
        }
      } else if (line.includes('circuit.measure')) {
        const qubit = parseInt(line.match(/measure\((\d+)/)?.[1] || '0');
        circuit.gates.push({ type: 'MEASURE', position: { qubit, step } });
        step++;
      }
    });
    circuit.steps = step;
  }

  return circuit;
}
