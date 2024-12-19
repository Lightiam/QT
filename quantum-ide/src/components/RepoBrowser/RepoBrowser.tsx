import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { GitBranch, GitCommit, Search, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Repository {
  name: string;
  owner: string;
  description?: string;
  defaultBranch: string;
}

interface Branch {
  name: string;
  commit: {
    sha: string;
    message: string;
  };
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

interface RepoBrowserProps {
  onRepositorySelect?: (owner: string, name: string) => void;
  onBranchSelect?: (branch: string) => void;
  selectedRepository?: string;
  className?: string;
}

export const RepoBrowser: React.FC<RepoBrowserProps> = ({
  onRepositorySelect,
  onBranchSelect,
  selectedRepository,
  className
}) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>();

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const output = await fetch('/api/gh/repos');
      const data = await output.json();
      setRepositories(data.map((repo: any) => ({
        name: repo.name,
        owner: repo.owner,
        description: repo.description,
        defaultBranch: repo.defaultBranch
      })));
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (owner: string, repo: string) => {
    try {
      const output = await fetch(`/api/gh/repos/${owner}/${repo}/branches`);
      const data = await output.json();
      setBranches(data.map((branch: any) => ({
        name: branch.name,
        commit: {
          sha: branch.commit.sha,
          message: branch.commit.message
        }
      })));
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchCommits = async (owner: string, repo: string, branch: string) => {
    try {
      const output = await fetch(`/api/gh/repos/${owner}/${repo}/commits?branch=${branch}`);
      const data = await output.json();
      setCommits(data.map((commit: any) => ({
        sha: commit.sha,
        message: commit.message,
        author: commit.author,
        date: commit.date
      })));
    } catch (error) {
      console.error('Failed to fetch commits:', error);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className={cn("flex flex-col h-full bg-white", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            prefix={<Search className="h-4 w-4 text-gray-400" />}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={fetchRepositories}
            disabled={loading}
            className="hover:bg-purple-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-1/2 border-r">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {filteredRepositories.map((repo) => (
                <Button
                  key={`${repo.owner}/${repo.name}`}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left",
                    selectedRepository === `${repo.owner}/${repo.name}` &&
                    "bg-purple-50 text-purple-900 hover:bg-purple-100"
                  )}
                  onClick={() => {
                    onRepositorySelect?.(repo.owner, repo.name);
                    fetchBranches(repo.owner, repo.name);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    <span className="truncate">{repo.owner}/{repo.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="p-2 border-b">
            <select
              className="w-full p-2 rounded border bg-transparent hover:border-purple-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              value={selectedBranch}
              onChange={(e) => {
                const branch = e.target.value;
                setSelectedBranch(branch);
                onBranchSelect?.(branch);
                if (selectedRepository) {
                  const [owner, repo] = selectedRepository.split('/');
                  fetchCommits(owner, repo, branch);
                }
              }}
            >
              <option value="">Select a branch</option>
              {branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {commits.map((commit) => (
                <div
                  key={commit.sha}
                  className="p-2 rounded border hover:bg-purple-50"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GitCommit className="h-4 w-4" />
                    <span className="font-mono">{commit.sha.slice(0, 7)}</span>
                  </div>
                  <p className="mt-1 text-sm">{commit.message}</p>
                  <div className="mt-1 text-xs text-gray-500">
                    {commit.author} • {new Date(commit.date).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
};
