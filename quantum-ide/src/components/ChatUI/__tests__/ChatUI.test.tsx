import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatUI } from '../ChatUI';
import { generateCircuit, createChatSession, addChatMessage } from '../../../lib/api';

// Mock the API functions
jest.mock('../../../lib/api', () => ({
    generateCircuit: jest.fn(),
    createChatSession: jest.fn().mockResolvedValue({ id: 'test-session-id' }),
    addChatMessage: jest.fn()
}));

// Mock the useToast hook
jest.mock('../../ui/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn()
    })
}));

describe('ChatUI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders input and button', () => {
        render(<ChatUI />);
        expect(screen.getByPlaceholderText('Describe your quantum circuit...')).toBeInTheDocument();
        expect(screen.getByText('Generate')).toBeInTheDocument();
    });

    it('handles user input', () => {
        render(<ChatUI />);
        const input = screen.getByPlaceholderText('Describe your quantum circuit...');
        fireEvent.change(input, { target: { value: 'Create a Bell state' } });
        expect(input).toHaveValue('Create a Bell state');
    });

    it('disables input during generation', async () => {
        render(<ChatUI />);
        const input = screen.getByPlaceholderText('Describe your quantum circuit...');
        const button = screen.getByText('Generate');

        // Mock fetch to delay response
        global.fetch = jest.fn(() =>
            new Promise((resolve) =>
                setTimeout(() =>
                    resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            name: 'Bell State',
                            qubits: 2,
                            steps: 2
                        })
                    }),
                    100
                )
            )
        ) as jest.Mock;

        fireEvent.change(input, { target: { value: 'Create a Bell state' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(input).toBeDisabled();
            expect(button).toBeDisabled();
            expect(button).toHaveTextContent('Generating...');
        });
    });

    it('successfully generates and displays circuit', async () => {
        const mockCircuit = {
            name: 'Bell State',
            qubits: 2,
            steps: 2,
            gates: [
                { type: 'h', position: { qubit: 0, step: 0 } },
                { type: 'cx', position: { control: 0, target: 1, step: 1 } }
            ]
        };
        (generateCircuit as jest.Mock).mockResolvedValueOnce(mockCircuit);

        const onCircuitGenerated = jest.fn();
        render(<ChatUI onCircuitGenerated={onCircuitGenerated} />);

        const input = screen.getByPlaceholderText('Describe your quantum circuit...');
        const button = screen.getByText('Generate');

        fireEvent.change(input, { target: { value: 'Create a Bell state' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(generateCircuit).toHaveBeenCalledWith('Create a Bell state');
            expect(onCircuitGenerated).toHaveBeenCalledWith(mockCircuit);
            expect(screen.getByText(/Generated quantum circuit "Bell State"/)).toBeInTheDocument();
        });
    });

    it('handles API errors gracefully', async () => {
        const errorMessage = 'Failed to generate circuit';
        (generateCircuit as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

        render(<ChatUI />);

        const input = screen.getByPlaceholderText('Describe your quantum circuit...');
        const button = screen.getByText('Generate');

        fireEvent.change(input, { target: { value: 'Create an invalid circuit' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(input).not.toBeDisabled();
            expect(button).not.toBeDisabled();
            expect(button).toHaveTextContent('Generate');
        });
    });

    it('maintains chat session and message history', async () => {
        const mockCircuit = {
            name: 'Test Circuit',
            qubits: 1,
            steps: 1,
            gates: []
        };
        (generateCircuit as jest.Mock).mockResolvedValueOnce(mockCircuit);

        render(<ChatUI />);

        // Verify session creation
        await waitFor(() => {
            expect(createChatSession).toHaveBeenCalled();
        });

        const input = screen.getByPlaceholderText('Describe your quantum circuit...');
        const button = screen.getByText('Generate');

        fireEvent.change(input, { target: { value: 'Create a test circuit' } });
        fireEvent.click(button);

        await waitFor(() => {
            // Verify message was added to chat history
            expect(addChatMessage).toHaveBeenCalledWith('test-session-id', {
                role: 'user',
                content: 'Create a test circuit'
            });
            // Verify assistant response was added
            expect(addChatMessage).toHaveBeenCalledWith('test-session-id', {
                role: 'assistant',
                content: expect.stringContaining('Generated quantum circuit "Test Circuit"')
            });
        });
    });
});
