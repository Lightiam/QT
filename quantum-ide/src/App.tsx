import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Play, Bug } from 'lucide-react';
import { CircuitEditor } from './components/CircuitEditor/CircuitEditor';
import { CodeEditor } from './components/CodeEditor/CodeEditor';
import { DebugPanel } from './components/DebugPanel/DebugPanel';
import { ChatUI } from './components/ChatUI/ChatUI';
import { QuantumGate } from './types/quantum';
import { simulateCircuit, parseCodeToCircuit, convertCircuitToCode } from './lib/simulator';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { QuantumError } from './lib/errors';
import './styles/editor.css';

const App: React.FC = () => {
  const [code, setCode] = useState(`# Quantum Circuit Code
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit import Aer, execute

# Create quantum registers
qr = QuantumRegister(2)
cr = ClassicalRegister(2)
circuit = QuantumCircuit(qr, cr)

# Add gates
circuit.h(0)  # Hadamard gate on qubit 0
circuit.cx(0, 1)  # CNOT with control=0 and target=1
circuit.measure([0,1], [0,1])  # Measure both qubits`);

  const [isDebugging, setIsDebugging] = useState(false);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [quantumStates, setQuantumStates] = useState([
    { qubit: 0, state: { alpha: 1, beta: 0 } },
    { qubit: 1, state: { alpha: 1, beta: 0 } }
  ]);
  const [debugError, setDebugError] = useState<Error | null>(null);


  const handleRunSimulation = async () => {
    console.log('Running simulation...');
    try {
      // Parse current code to circuit
      const circuit = parseCodeToCircuit(code, 'python');

      // Run simulation
      const result = await simulateCircuit(circuit);

      // Update quantum states
      setQuantumStates(result.states);

      console.log('Simulation result:', result);
    } catch (error) {
      if (error instanceof QuantumError) {
        console.error(`Quantum error during simulation: ${error.message} (${error.type})`);
      } else {
        console.error('Simulation failed:', error);
      }
      throw error; // Let ErrorBoundary handle it
    }
  };

  const handleDebug = () => {
    setIsDebugging(!isDebugging);
    if (!isDebugging) {
      setCurrentStep(0);
    }
  };

  const handleBreakpointSet = (line: number) => {
    setBreakpoints(prev => {
      const index = prev.indexOf(line);
      if (index === -1) {
        return [...prev, line].sort((a, b) => a - b);
      } else {
        return prev.filter(bp => bp !== line);
      }
    });
  };

  const handleStep = async () => {
    try {
      const circuit = parseCodeToCircuit(code, 'python');
      const result = await simulateCircuit({
        ...circuit,
        steps: currentStep + 1
      });
      setQuantumStates(result.states);
      setCurrentStep(prev => prev + 1);
      setDebugError(null);
    } catch (error) {
      setDebugError(error instanceof Error ? error : new Error('Unknown error'));
      if (error instanceof QuantumError) {
        console.error(`Quantum error during debug step: ${error.message} (${error.type})`);
      } else {
        console.error('Debug step failed:', error);
      }
    }
  };

  const handleContinue = async () => {
    try {
      const circuit = parseCodeToCircuit(code, 'python');
      let step = currentStep;
      while (step < circuit.steps && !breakpoints.includes(step + 1)) {
        const result = await simulateCircuit({
          ...circuit,
          steps: step + 1
        });
        setQuantumStates(result.states);
        step++;
      }
      setCurrentStep(step);
      setDebugError(null);
    } catch (error) {
      setDebugError(error instanceof Error ? error : new Error('Unknown error'));
      if (error instanceof QuantumError) {
        console.error(`Quantum error during debug continue: ${error.message} (${error.type})`);
      } else {
        console.error('Debug continue failed:', error);
      }
    }
  };

  const handleStop = () => {
    setIsDebugging(false);
    setCurrentStep(0);
    setQuantumStates([
      { qubit: 0, state: { alpha: 1, beta: 0 } },
      { qubit: 1, state: { alpha: 1, beta: 0 } }
    ]);
  };

  const handleCircuitSave = (gates: QuantumGate[]) => {
    const circuit = {
      gates,
      qubits: Math.max(...gates.map(g => g.position.qubit)) + 1,
      steps: Math.max(...gates.map(g => g.position.step)) + 1,
      name: 'Circuit'
    };
    const newCode = convertCircuitToCode(circuit, 'python');
    setCode(newCode);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quantum Development Platform</h1>
        <div className="space-x-2">
          <Button onClick={handleRunSimulation}>
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
          <Button variant="outline" onClick={handleDebug}>
            <Bug className="w-4 h-4 mr-2" />
            Debug
          </Button>
        </div>
      </div>

      <ErrorBoundary>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Tabs defaultValue="visual" className="w-full">
              <TabsList>
                <TabsTrigger value="visual">Circuit Editor</TabsTrigger>
                <TabsTrigger value="code">Code Editor</TabsTrigger>
                <TabsTrigger value="chat">AI Assistant</TabsTrigger>
              </TabsList>
              <TabsContent value="visual" className="min-h-[500px]">
                <CircuitEditor onSave={handleCircuitSave} />
              </TabsContent>
              <TabsContent value="code" className="min-h-[500px]">
                <CodeEditor
                  value={code}
                  onChange={(newValue) => setCode(newValue || '')}
                  language="python"
                  onBreakpointSet={handleBreakpointSet}
                  breakpoints={breakpoints}
                  currentLine={currentStep + 1}
                  isDebugging={isDebugging}
                />
              </TabsContent>
              <TabsContent value="chat" className="min-h-[500px]">
                <ChatUI onCircuitGenerated={handleCircuitSave} />
              </TabsContent>
            </Tabs>
          </div>
          {isDebugging && (
            <div className="lg:col-span-1">
              <DebugPanel
                quantumStates={quantumStates}
                onStep={handleStep}
                onContinue={handleContinue}
                onPause={() => {}}
                onStop={handleStop}
                error={debugError}
              />
            </div>
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default App;
