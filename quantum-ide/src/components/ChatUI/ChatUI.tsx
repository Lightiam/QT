import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../ui/use-toast';
import { generateCircuit, createChatSession, addChatMessage } from '../../lib/api';
import { QuantumCircuit } from '../../types/quantum';
import { GitService } from '../../lib/gitService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatUIProps {
    onCircuitGenerated?: (circuit: QuantumCircuit) => void;
    currentRepository?: string;
}

export const ChatUI: React.FC<ChatUIProps> = ({ onCircuitGenerated, currentRepository }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
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

    const handleGitCommand = async (command: string): Promise<string> => {
        try {
            const result = await GitService.executeCommand(command);
            if (!result.success) {
                throw new Error(result.error || 'Git command failed');
            }
            return result.message;
        } catch (error) {
            throw error;
        }
    };

    const handleSubmit = async () => {
        if (!input.trim() || !sessionId) return;

        try {
            setIsLoading(true);
            const userMessage: Message = {
                role: 'user',
                content: input,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);
            setInput('');

            await addChatMessage(sessionId, {
                role: userMessage.role,
                content: userMessage.content
            });

            const { command, isGitCommand } = await GitService.parseNaturalLanguage(input);

            if (isGitCommand && command) {
                const gitResponse = await handleGitCommand(command);
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: gitResponse,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                await addChatMessage(sessionId, {
                    role: assistantMessage.role,
                    content: assistantMessage.content
                });
                toast({
                    title: 'Git Command Executed',
                    description: 'Successfully executed Git command',
                    variant: 'default'
                });
            } else {
                const circuit = await generateCircuit(input);
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: `Generated quantum circuit "${circuit.name}" with ${circuit.qubits} qubits and ${circuit.steps} steps.`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                await addChatMessage(sessionId, {
                    role: assistantMessage.role,
                    content: assistantMessage.content
                });
                if (onCircuitGenerated) {
                    onCircuitGenerated(circuit);
                }
                toast({
                    title: 'Circuit Generated',
                    description: `Successfully created quantum circuit: ${circuit.name}`,
                    variant: 'default'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Operation failed',
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
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
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
                    placeholder={currentRepository ? "Enter Git command or describe quantum circuit..." : "Describe your quantum circuit..."}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    disabled={isLoading}
                />
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    {isLoading ? 'Processing...' : 'Send'}
                </Button>
            </div>
        </Card>
    );
};
