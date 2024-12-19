import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileTree } from '../FileTree';
import { FileNode } from '../../../lib/fileSystem';

describe('FileTree', () => {
  const mockFiles: FileNode[] = [
    {
      name: 'src',
      path: '/test/src',
      type: 'directory',
      children: [
        {
          name: 'test.tsx',
          path: '/test/src/test.tsx',
          type: 'file',
        }
      ]
    }
  ];

  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders files and directories', () => {
    render(
      <FileTree
        files={mockFiles}
        onFileSelect={mockOnFileSelect}
        selectedFile={undefined}
        gitStatus={{}}
      />
    );

    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('test.tsx')).toBeInTheDocument();
  });

  it('calls onFileSelect when a file is clicked', () => {
    render(
      <FileTree
        files={mockFiles}
        onFileSelect={mockOnFileSelect}
        selectedFile={undefined}
        gitStatus={{}}
      />
    );

    const fileNode = screen.getByText('test.tsx');
    fireEvent.click(fileNode);

    expect(mockOnFileSelect).toHaveBeenCalledWith('/test/src/test.tsx');
  });

  it('highlights selected file', () => {
    render(
      <FileTree
        files={mockFiles}
        onFileSelect={mockOnFileSelect}
        selectedFile="/test/src/test.tsx"
        gitStatus={{}}
      />
    );

    const fileNode = screen.getByText('test.tsx').parentElement;
    expect(fileNode).toHaveClass('bg-purple-50');
  });

  it('displays git status indicators', () => {
    const gitStatus = {
      '/test/src/test.tsx': {
        staged: false,
        modified: true,
        untracked: false,
        deleted: false
      }
    };

    render(
      <FileTree
        files={mockFiles}
        onFileSelect={mockOnFileSelect}
        selectedFile={undefined}
        gitStatus={gitStatus}
      />
    );

    const fileNode = screen.getByText('test.tsx').parentElement;
    expect(fileNode).toHaveClass('text-yellow-500');
  });
});
