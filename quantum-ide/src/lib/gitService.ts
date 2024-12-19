import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitCommandResult {
  success: boolean;
  message: string;
  error?: string;
}

export class GitService {
  static async executeCommand(command: string): Promise<GitCommandResult> {
    try {
      const { stdout, stderr } = await execAsync(`gh ${command}`);
      return {
        success: true,
        message: stdout,
        error: stderr || undefined
      };
    } catch (error) {
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async parseNaturalLanguage(input: string): Promise<{ command: string; isGitCommand: boolean }> {
    const gitKeywords = [
      'commit', 'push', 'pull', 'branch', 'checkout', 'merge',
      'status', 'log', 'clone', 'fetch', 'repository', 'repo'
    ];

    const lowercaseInput = input.toLowerCase();
    const containsGitKeyword = gitKeywords.some(keyword => lowercaseInput.includes(keyword));

    if (!containsGitKeyword) {
      return { command: '', isGitCommand: false };
    }

    // Basic command mapping
    if (lowercaseInput.includes('show status')) {
      return { command: 'status', isGitCommand: true };
    }
    if (lowercaseInput.includes('show branches')) {
      return { command: 'branch -a', isGitCommand: true };
    }
    if (lowercaseInput.includes('show commits') || lowercaseInput.includes('show log')) {
      return { command: 'log --oneline', isGitCommand: true };
    }
    if (lowercaseInput.match(/create .*branch/)) {
      const branchName = lowercaseInput.match(/create (.*)branch/)?.[1]?.trim();
      if (branchName) {
        return { command: `branch ${branchName}`, isGitCommand: true };
      }
    }
    if (lowercaseInput.match(/switch to .*branch/)) {
      const branchName = lowercaseInput.match(/switch to (.*)branch/)?.[1]?.trim();
      if (branchName) {
        return { command: `checkout ${branchName}`, isGitCommand: true };
      }
    }

    return { command: '', isGitCommand: true };
  }
}
