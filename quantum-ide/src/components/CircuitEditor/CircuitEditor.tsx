import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Plus, Minus, RotateCcw, Save } from 'lucide-react';
import { QuantumGate } from '../../types/quantum';

interface CircuitEditorProps {
  onSave?: (circuit: QuantumGate[]) => void;
}

export const CircuitEditor: React.FC<CircuitEditorProps> = ({ onSave }) => {
  const [qubits, setQubits] = useState(2);
  const [steps] = useState(4);
  const [gates, setGates] = useState<QuantumGate[]>([]);
  const [selectedGate, setSelectedGate] = useState<'H' | 'X' | 'CNOT' | 'MEASURE'>('H');

  const addQubit = () => setQubits(q => Math.min(q + 1, 8));
  const removeQubit = () => setQubits(q => Math.max(q - 1, 1));

  const handleCellClick = (qubit: number, step: number) => {
    if (selectedGate === 'CNOT') {
      const existingGate = gates.find(
        g => g.position.qubit === qubit && g.position.step === step
      );
      if (!existingGate) {
        setGates([...gates, {
          type: selectedGate,
          position: { qubit, step },
          control: qubit > 0 ? qubit - 1 : qubit + 1
        }]);
      }
    } else {
      const newGates = gates.filter(
        g => !(g.position.qubit === qubit && g.position.step === step)
      );
      setGates([...newGates, { type: selectedGate, position: { qubit, step } }]);
    }
  };

  const clearCircuit = () => setGates([]);

  const handleSave = () => {
    if (onSave) {
      onSave(gates);
    }
  };

  return (
    <Card className="p-4 w-full">
      <div className="flex justify-between mb-4">
        <div className="space-x-2">
          <Button onClick={addQubit} size="sm"><Plus className="w-4 h-4" /></Button>
          <Button onClick={removeQubit} size="sm"><Minus className="w-4 h-4" /></Button>
          <span className="ml-2">Qubits: {qubits}</span>
        </div>
        <div className="space-x-2">
          <Button onClick={clearCircuit} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button onClick={handleSave} variant="default" size="sm">
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          variant={selectedGate === 'H' ? 'default' : 'outline'}
          onClick={() => setSelectedGate('H')}
        >
          H
        </Button>
        <Button
          variant={selectedGate === 'X' ? 'default' : 'outline'}
          onClick={() => setSelectedGate('X')}
        >
          X
        </Button>
        <Button
          variant={selectedGate === 'CNOT' ? 'default' : 'outline'}
          onClick={() => setSelectedGate('CNOT')}
        >
          CNOT
        </Button>
        <Button
          variant={selectedGate === 'MEASURE' ? 'default' : 'outline'}
          onClick={() => setSelectedGate('MEASURE')}
        >
          M
        </Button>
      </div>

      <div className="relative">
        <svg
          width={steps * 60 + 40}
          height={qubits * 60 + 40}
          className="border rounded"
        >
          {Array.from({ length: qubits }).map((_, i) => (
            <line
              key={`line-${i}`}
              x1="20"
              y1={i * 60 + 30}
              x2={steps * 60 + 20}
              y2={i * 60 + 30}
              stroke="black"
              strokeWidth="1"
            />
          ))}

          {gates.map((gate, idx) => {
            const x = gate.position.step * 60 + 20;
            const y = gate.position.qubit * 60 + 30;

            switch (gate.type) {
              case 'H':
                return (
                  <g key={idx}>
                    <rect
                      x={x - 15}
                      y={y - 15}
                      width="30"
                      height="30"
                      fill="white"
                      stroke="black"
                    />
                    <text x={x} y={y + 5} textAnchor="middle">H</text>
                  </g>
                );
              case 'X':
                return (
                  <g key={idx}>
                    <circle
                      cx={x}
                      cy={y}
                      r="15"
                      fill="white"
                      stroke="black"
                    />
                    <text x={x} y={y + 5} textAnchor="middle">X</text>
                  </g>
                );
              case 'CNOT':
                return (
                  <g key={idx}>
                    <line
                      x1={x}
                      y1={gate.control! * 60 + 30}
                      x2={x}
                      y2={y}
                      stroke="black"
                      strokeWidth="1"
                    />
                    <circle
                      cx={x}
                      cy={gate.control! * 60 + 30}
                      r="5"
                      fill="black"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="15"
                      fill="white"
                      stroke="black"
                    />
                    <text x={x} y={y + 5} textAnchor="middle">⊕</text>
                  </g>
                );
              case 'MEASURE':
                return (
                  <g key={idx}>
                    <rect
                      x={x - 15}
                      y={y - 15}
                      width="30"
                      height="30"
                      fill="white"
                      stroke="black"
                    />
                    <text x={x} y={y + 5} textAnchor="middle">M</text>
                  </g>
                );
            }
          })}

          {Array.from({ length: qubits }).map((_, i) =>
            Array.from({ length: steps }).map((_, j) => (
              <rect
                key={`cell-${i}-${j}`}
                x={j * 60 + 5}
                y={i * 60 + 15}
                width="30"
                height="30"
                fill="transparent"
                stroke="transparent"
                className="cursor-pointer hover:stroke-gray-200"
                onClick={() => handleCellClick(i, j)}
              />
            ))
          )}
        </svg>
      </div>
    </Card>
  );
};
