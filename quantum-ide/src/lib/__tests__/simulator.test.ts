import { simulateCircuit, parseCodeToCircuit } from '../simulator';
import { QuantumError } from '../errors';
import { QuantumCircuit, QuantumGate } from '../../types/quantum';

describe('simulateCircuit', () => {
  const mockCircuit: QuantumCircuit = {
    gates: [
      { type: 'H', position: { qubit: 0, step: 0 } },
      { type: 'CNOT', position: { qubit: 1, step: 1 }, control: 0 }
    ],
    qubits: 2,
    steps: 2,
    name: 'Test Circuit'
  };

  it('validates circuit gates array', async () => {
    const invalidCircuit = {
      ...mockCircuit,
      gates: undefined
    } as unknown as QuantumCircuit;

    await expect(simulateCircuit(invalidCircuit))
      .rejects
      .toThrow(new QuantumError('Invalid circuit: gates must be an array', 'PARSE_ERROR'));
  });

  it('validates gate positions', async () => {
    const invalidGate = { type: 'H' } as unknown as QuantumGate;
    const invalidCircuit: QuantumCircuit = {
      ...mockCircuit,
      gates: [invalidGate]
    };

    await expect(simulateCircuit(invalidCircuit))
      .rejects
      .toThrow(new QuantumError('Invalid gate at index 0: missing or invalid qubit position', 'INVALID_GATE'));
  });

  it('validates qubit indices', async () => {
    const invalidCircuit: QuantumCircuit = {
      ...mockCircuit,
      gates: [{ type: 'H', position: { qubit: 5, step: 0 } } as QuantumGate],
      qubits: 2
    };

    await expect(simulateCircuit(invalidCircuit))
      .rejects
      .toThrow(new QuantumError('Invalid qubit index 5 at gate 0', 'INVALID_QUBIT'));
  });
});

describe('parseCodeToCircuit', () => {
  it('parses Python Qiskit code correctly', () => {
    const code = `
from qiskit import QuantumCircuit, QuantumRegister
qr = QuantumRegister(2)
circuit = QuantumCircuit(qr)
circuit.h(0)
circuit.cx(0, 1)
circuit.measure(1, 1)
    `.trim();

    const circuit = parseCodeToCircuit(code, 'python');
    expect(circuit.qubits).toBe(2);
    expect(circuit.gates).toHaveLength(3);
    expect(circuit.gates[0]).toEqual({
      type: 'H',
      position: { qubit: 0, step: 0 }
    });
    expect(circuit.gates[1]).toEqual({
      type: 'CNOT',
      position: { qubit: 1, step: 1 },
      control: 0
    });
    expect(circuit.gates[2]).toEqual({
      type: 'MEASURE',
      position: { qubit: 1, step: 2 }
    });
  });
});
