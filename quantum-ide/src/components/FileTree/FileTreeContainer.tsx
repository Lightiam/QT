import React, { useEffect, useState } from 'react';
import { FileTree } from './FileTree';
import { FileSystem, FileNode, GitStatus } from '../../lib/fileSystem';
import { Spinner } from '../../components/ui/spinner';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { GitFileStatus } from './FileTree';

interface FileTreeContainerProps {
  workingDirectory: string;
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}

export const FileTreeContainer: React.FC<FileTreeContainerProps> = ({
  workingDirectory,
  onFileSelect,
  selectedFile
}) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gitStatus, setGitStatus] = useState<Record<string, GitFileStatus>>({});

  const fileSystem = new FileSystem(workingDirectory);

  const convertGitStatusToFileStatus = (status: GitStatus): GitFileStatus => {
    if (status.deleted) return 'deleted';
    if (status.staged) return 'added';
    if (status.modified) return 'modified';
    if (status.untracked) return 'untracked';
    return 'modified';
  };

  const convertGitStatusMap = (node: FileNode): Record<string, GitFileStatus> => {
    const result: Record<string, GitFileStatus> = {};
    if (node.gitStatus) {
      result[node.path] = convertGitStatusToFileStatus(node.gitStatus);
    }
    node.children?.forEach(child => {
      Object.assign(result, convertGitStatusMap(child));
    });
    return result;
  };

  const loadFileTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const root = await fileSystem.getFileTree();
      setFiles(root.children || []);
      setGitStatus(convertGitStatusMap(root));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load file tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFileTree();
  }, [workingDirectory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner className="h-6 w-6 text-purple-600" />
        <span className="ml-2">Loading file tree...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <FileTree
      files={files}
      onFileSelect={onFileSelect}
      selectedFile={selectedFile}
      gitStatus={gitStatus}
    />
  );
};
