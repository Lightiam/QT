import React from 'react';
import { Tree, TreeItem } from '../../components/ui/tree';
import { Folder, File } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (path: string) => void;
  selectedFile?: string;
  gitStatus?: Record<string, GitFileStatus>;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export type GitFileStatus = 'modified' | 'added' | 'deleted' | 'untracked';

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  onFileSelect,
  selectedFile,
  gitStatus = {}
}) => {
  const renderNode = (node: FileNode) => {
    const isSelected = node.path === selectedFile;
    const status = gitStatus[node.path];

    const getStatusColor = (status?: GitFileStatus) => {
      switch (status) {
        case 'modified': return 'text-yellow-500';
        case 'added': return 'text-green-500';
        case 'deleted': return 'text-red-500';
        case 'untracked': return 'text-gray-400';
        default: return '';
      }
    };

    return (
      <TreeItem
        key={node.path}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
          isSelected && 'bg-purple-50 dark:bg-purple-900',
          getStatusColor(status)
        )}
        onClick={() => node.type === 'file' && onFileSelect(node.path)}
      >
        {node.type === 'directory' ? (
          <>
            <Folder className="h-4 w-4" />
            <span>{node.name}</span>
          </>
        ) : (
          <>
            <File className="h-4 w-4" />
            <span>{node.name}</span>
          </>
        )}
      </TreeItem>
    );
  };

  const renderTree = (nodes: FileNode[]) => {
    return nodes.map(node => (
      <div key={node.path}>
        {renderNode(node)}
        {node.children && node.children.length > 0 && (
          <div className="ml-4">
            {renderTree(node.children)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <Tree>
      {renderTree(files)}
    </Tree>
  );
};
