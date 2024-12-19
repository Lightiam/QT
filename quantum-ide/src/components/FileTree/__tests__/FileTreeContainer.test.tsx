import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { FileTreeContainer } from '../FileTreeContainer';
import { FileSystem } from '../../../lib/fileSystem';

jest.mock('../../../lib/fileSystem');

describe('FileTreeContainer', () => {
  const mockFileSystem = {
    getFileTree: jest.fn()
  };

  beforeEach(() => {
    (FileSystem as jest.Mock).mockImplementation(() => mockFileSystem);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    render(
      <FileTreeContainer
        workingDirectory="/test"
        onFileSelect={() => {}}
      />
    );

    expect(screen.getByText('Loading file tree...')).toBeInTheDocument();
  });

  it('renders file tree after loading', async () => {
    const mockTree = {
      name: 'root',
      path: '/test',
      type: 'directory' as const,
      children: [
        {
          name: 'test.txt',
          path: '/test/test.txt',
          type: 'file' as const,
          gitStatus: {
            staged: false,
            modified: true,
            untracked: false,
            deleted: false
          }
        }
      ]
    };

    mockFileSystem.getFileTree.mockResolvedValueOnce(mockTree);

    render(
      <FileTreeContainer
        workingDirectory="/test"
        onFileSelect={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  it('shows error state when loading fails', async () => {
    const errorMessage = 'Failed to load file tree';
    mockFileSystem.getFileTree.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <FileTreeContainer
        workingDirectory="/test"
        onFileSelect={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
