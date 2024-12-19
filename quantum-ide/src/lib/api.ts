import { QuantumCircuit } from '../types/quantum';

/**
 * Generate a quantum circuit from a natural language prompt
 * @param prompt Natural language description of the desired quantum circuit
 * @returns Promise resolving to a QuantumCircuit object
 */
export const generateCircuit = async (prompt: string): Promise<QuantumCircuit> => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Authentication required');
    }

    const response = await fetch('/api/chat/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Failed to generate circuit');
    }

    return response.json();
};

/**
 * Create a new chat session
 * @returns Promise resolving to a ChatSession object
 */
export const createChatSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Authentication required');
    }

    const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Failed to create chat session');
    }

    return response.json();
};

/**
 * Add a message to an existing chat session
 * @param sessionId ID of the chat session
 * @param message Message object to add
 * @returns Promise resolving to the added message
 */
export const addChatMessage = async (sessionId: string, message: { role: string; content: string }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Authentication required');
    }

    const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(message)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Failed to add message');
    }

    return response.json();
};
