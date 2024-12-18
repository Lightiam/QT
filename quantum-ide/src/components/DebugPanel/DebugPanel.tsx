import { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Play, Pause, StepForward, StopCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { QuantumError } from '../../lib/errors';
import { QuantumState } from '../../types/quantum';

interface DebugPanelProps {
  onStep?: () => void;
  onContinue?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  quantumStates?: QuantumState[];
  error?: Error | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  onStep,
  onContinue,
  onPause,
  onStop,
  quantumStates = [],
  error
}) => {
  const [isPaused, setIsPaused] = useState(true);

  const handleContinue = () => {
    setIsPaused(false);
    onContinue?.();
  };

  const handlePause = () => {
    setIsPaused(true);
    onPause?.();
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Quantum Debugger</h3>
        <div className="space-x-2">
          {isPaused ? (
            <Button onClick={handleContinue} size="sm">
              <Play className="w-4 h-4 mr-2" />
              Continue
            </Button>
          ) : (
            <Button onClick={handlePause} size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={onStep} size="sm" variant="outline">
            <StepForward className="w-4 h-4 mr-2" />
            Step
          </Button>
          <Button onClick={onStop} size="sm" variant="outline">
            <StopCircle className="w-4 h-4 mr-2" />
            Stop
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Debug Error</AlertTitle>
          <AlertDescription>
            {error instanceof QuantumError
              ? `${error.message} (${error.type})`
              : error.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Quantum States</h4>
        <div className="grid grid-cols-2 gap-4">
          {quantumStates.map((state, index) => (
            <Card key={index} className="p-3">
              <div className="text-sm">Qubit {state.qubit}</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>|0⟩:</span>
                  <span>{state.state.alpha.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>|1⟩:</span>
                  <span>{state.state.beta.toFixed(4)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
};
