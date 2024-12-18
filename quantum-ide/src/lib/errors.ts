export class QuantumError extends Error {
  constructor(
    message: string,
    public readonly type: 'INVALID_GATE' | 'INVALID_QUBIT' | 'SIMULATION_ERROR' | 'PARSE_ERROR',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'QuantumError';
  }
}

export function isQuantumError(error: any): error is QuantumError {
  return error instanceof QuantumError;
}
