import { render, screen, fireEvent } from '@testing-library/react';
import { DebugPanel } from '../DebugPanel';
import { QuantumError } from '../../../lib/errors';
import { QuantumState } from '../../../types/quantum';

describe('DebugPanel', () => {
  const mockQuantumStates: QuantumState[] = [
    { qubit: 0, state: { alpha: 1, beta: 0 } },
    { qubit: 1, state: { alpha: 0.707, beta: 0.707 } }
  ];

  it('renders quantum states correctly', () => {
    render(<DebugPanel quantumStates={mockQuantumStates} />);
    expect(screen.getByText('Qubit 0')).toBeInTheDocument();
    expect(screen.getByText('Qubit 1')).toBeInTheDocument();
  });


  it('handles debug controls correctly', () => {
    const onStep = jest.fn();
    const onContinue = jest.fn();
    const onStop = jest.fn();

    render(
      <DebugPanel
        quantumStates={mockQuantumStates}
        onStep={onStep}
        onContinue={onContinue}
        onStop={onStop}
      />
    );

    fireEvent.click(screen.getByText('Step'));
    expect(onStep).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Continue'));
    expect(onContinue).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Stop'));
    expect(onStop).toHaveBeenCalled();
  });

  it('displays quantum error correctly', () => {
    const error = new QuantumError('Invalid quantum operation', 'INVALID_GATE');
    render(
      <DebugPanel
        error={error}
        quantumStates={[]}
        onStep={() => {}}
        onContinue={() => {}}
        onStop={() => {}}
      />
    );

    expect(screen.getByText('Debug Error')).toBeInTheDocument();
    expect(screen.getByText('Invalid quantum operation (INVALID_GATE)')).toBeInTheDocument();
  });

  it('displays generic error correctly', () => {
    const error = new Error('Generic error message');
    render(
      <DebugPanel
        error={error}
        quantumStates={[]}
        onStep={() => {}}
        onContinue={() => {}}
        onStop={() => {}}
      />
    );

    expect(screen.getByText('Debug Error')).toBeInTheDocument();
    expect(screen.getByText('Generic error message')).toBeInTheDocument();
  });
});
