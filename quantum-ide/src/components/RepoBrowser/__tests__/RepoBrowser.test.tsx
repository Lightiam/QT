import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RepoBrowser } from '../RepoBrowser';

// Mock fetch
global.fetch = jest.fn();

describe('RepoBrowser', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders repository search input', () => {
    render(<RepoBrowser />);
    expect(screen.getByPlaceholderText('Search repositories...')).toBeInTheDocument();
  });

  it('filters repositories based on search query', async () => {
    const mockRepos = [
      { name: 'repo1', owner: 'owner1', defaultBranch: 'main' },
      { name: 'repo2', owner: 'owner2', defaultBranch: 'main' }
    ];

    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockRepos)
      })
    );

    render(<RepoBrowser />);

    await waitFor(() => {
      expect(screen.getByText('owner1/repo1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.change(searchInput, { target: { value: 'repo1' } });

    expect(screen.getByText('owner1/repo1')).toBeInTheDocument();
    expect(screen.queryByText('owner2/repo2')).not.toBeInTheDocument();
  });

  it('calls onRepositorySelect when repository is clicked', async () => {
    const mockRepos = [
      { name: 'repo1', owner: 'owner1', defaultBranch: 'main' }
    ];

    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockRepos)
      })
    );

    const onRepositorySelect = jest.fn();
    render(<RepoBrowser onRepositorySelect={onRepositorySelect} />);

    await waitFor(() => {
      expect(screen.getByText('owner1/repo1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('owner1/repo1'));
    expect(onRepositorySelect).toHaveBeenCalledWith('owner1', 'repo1');
  });
});
