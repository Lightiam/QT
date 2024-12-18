import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../ui/use-toast';
import { generateCircuit, createChatSession, addChatMessage } from '../../lib/api';
import { QuantumCircuit } from '../../types/quantum';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatUIProps {
    onCircuitGenerated?: (circuit: QuantumCircuit) => void;
}

export const ChatUI: React.FC<ChatUIProps> = ({ onCircuitGenerated }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        // Create a new chat session when component mounts
        const initSession = async () => {
            try {
                const session = await createChatSession();
                setSessionId(session.id);
            } catch (error) {
                console.error('Failed to create chat session:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to initialize chat session',
                    variant: 'destructive'
                });
            }
        };
        initSession();
    }, []);

    const handleSubmit = async () => {
        if (!input.trim() || !sessionId) return;

        try {
            setIsLoading(true);
            // Add user message
            const userMessage: Message = {
                role: 'user',
                content: input,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);
            setInput('');

            // Save message to session
            await addChatMessage(sessionId, {
                role: userMessage.role,
                content: userMessage.content
            });

            // Generate circuit from prompt
            const circuit = await generateCircuit(input);

            // Add assistant message
            const assistantMessage: Message = {
                role: 'assistant',
                content: `Generated quantum circuit "${circuit.name}" with ${circuit.qubits} qubits and ${circuit.steps} steps.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);

            // Save assistant message to session
            await addChatMessage(sessionId, {
                role: assistantMessage.role,
                content: assistantMessage.content
            });

            // Notify parent component about the generated circuit
            if (onCircuitGenerated) {
                onCircuitGenerated(circuit);
            }

            toast({
                title: 'Circuit Generated',
                description: `Successfully created quantum circuit: ${circuit.name}`,
                variant: 'default'
            });
        } catch (error) {
            console.error('Error generating circuit:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to generate quantum circuit',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <ScrollArea className="flex-grow p-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                message.role === 'user'
                                    ? 'bg-primary text-primary-foreground ml-auto'
                                    : 'bg-muted'
                            }`}
                        >
                            <p>{message.content}</p>
                            <small className="text-xs opacity-50">
                                {message.timestamp.toLocaleTimeString()}
                            </small>
                        </div>
                    </div>
                ))}
            </ScrollArea>
            <div className="p-4 border-t flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your quantum circuit..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    disabled={isLoading}
                />
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? 'Generating...' : 'Generate'}
                </Button>
            </div>
        </Card>
    );
};
