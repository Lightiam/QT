import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  gitStatus?: GitStatus;
  children?: FileNode[];
}

export interface GitStatus {
  staged: boolean;
  modified: boolean;
  untracked: boolean;
  deleted: boolean;
}

export class FileSystem {
  private workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  async getFileTree(): Promise<FileNode> {
    try {
      const { stdout: gitStatus } = await execAsync('git status --porcelain', {
        cwd: this.workingDirectory
      });

      const gitStatusMap = new Map<string, GitStatus>();
      gitStatus.split('\n').filter(Boolean).forEach(line => {
        const [status, filePath] = line.trim().split(' ').filter(Boolean);
        if (filePath) {
          gitStatusMap.set(filePath, {
            staged: status.includes('A') || status.includes('M'),
            modified: status.includes('M') || status === '??',
            untracked: status === '??',
            deleted: status.includes('D')
          });
        }
      });

      const { stdout: files } = await execAsync('git ls-files', {
        cwd: this.workingDirectory
      });

      const root: FileNode = {
        name: path.basename(this.workingDirectory),
        path: this.workingDirectory,
        type: 'directory',
        children: []
      };

      const allFiles = [...new Set([
        ...files.split('\n').filter(Boolean),
        ...Array.from(gitStatusMap.keys())
      ])];

      allFiles.forEach(filePath => {
        this.addFileToTree(root, filePath, gitStatusMap.get(filePath));
      });

      return root;
    } catch (error) {
      console.error('Error getting file tree:', error);
      throw error;
    }
  }

  private addFileToTree(root: FileNode, filePath: string, gitStatus?: GitStatus) {
    const parts = filePath.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const currentPath = path.join(
        this.workingDirectory,
        parts.slice(0, index + 1).join('/')
      );

      if (isFile) {
        if (!current.children) {
          current.children = [];
        }
        current.children.push({
          name: part,
          path: currentPath,
          type: 'file',
          gitStatus
        });
      } else {
        if (!current.children) {
          current.children = [];
        }
        let dir = current.children.find(
          child => child.name === part && child.type === 'directory'
        );
        if (!dir) {
          dir = {
            name: part,
            path: currentPath,
            type: 'directory',
            children: []
          };
          current.children.push(dir);
        }
        current = dir;
      }
    });
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`cat "${filePath}"`, {
        cwd: this.workingDirectory
      });
      return stdout;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await execAsync(`echo "${content}" > "${filePath}"`, {
        cwd: this.workingDirectory
      });
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await execAsync(`rm "${filePath}"`, {
        cwd: this.workingDirectory
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    try {
      await execAsync(`mkdir -p "${dirPath}"`, {
        cwd: this.workingDirectory
      });
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  }

  async getGitStatus(filePath: string): Promise<GitStatus> {
    try {
      const { stdout } = await execAsync(`git status --porcelain "${filePath}"`, {
        cwd: this.workingDirectory
      });
      const status = stdout.trim().slice(0, 2);
      return {
        staged: status.includes('A') || status.includes('M'),
        modified: status.includes('M') || status === '??',
        untracked: status === '??',
        deleted: status.includes('D')
      };
    } catch (error) {
      console.error('Error getting git status:', error);
      throw error;
    }
  }
}
