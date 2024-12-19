import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Card } from '../ui/card';
import { GitBranch } from 'lucide-react';
import { FileTree } from '../FileTree/FileTree';
import type { GitFileStatus } from '../FileTree/FileTree';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: 'python' | 'qsharp' | 'typescript';
  onBreakpointSet?: (line: number) => void;
  breakpoints?: number[];
  currentLine?: number;
  isDebugging?: boolean;
  gitStatus?: {
    modifiedLines: number[];
    addedLines: number[];
    deletedLines: number[];
    fileStatus?: Record<string, GitFileStatus>;
  };
  currentBranch?: string;
  onBranchChange?: (branch: string) => void;
  availableBranches?: string[];
  files?: {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: Array<any>;
  }[];
  onFileSelect?: (path: string) => void;
  selectedFile?: string;
}

export const CodeEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language,
  onBreakpointSet,
  breakpoints = [],
  currentLine,
  isDebugging = false,
  gitStatus = { modifiedLines: [], addedLines: [], deletedLines: [], fileStatus: {} },
  currentBranch,
  onBranchChange,
  availableBranches = [],
  files = [],
  onFileSelect,
  selectedFile
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Add gutter click handler for breakpoints
    editor.onMouseDown((e: any) => {
      if (e.target.type === 'gutter' && e.target.position) {
        const lineNumber = e.target.position.lineNumber;
        onBreakpointSet?.(lineNumber);
      }
    });

    // Set up initial decorations
    updateDecorations();
  };

  const updateDecorations = () => {
    if (!editorRef.current) return;

    // Breakpoint decorations
    const breakpointDecorations = breakpoints.map(line => ({
      range: {
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: 1
      },
      options: {
        isWholeLine: true,
        className: 'breakpoint-decoration',
        glyphMarginClassName: 'breakpoint-glyph',
        glyphMarginHoverMessage: { value: 'Breakpoint' }
      }
    }));

    // Git status decorations
    const gitDecorations = [
      ...gitStatus.modifiedLines.map(line => ({
        range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
        options: {
          isWholeLine: true,
          className: 'modified-line-decoration',
          linesDecorationsClassName: 'modified-line-gutter'
        }
      })),
      ...gitStatus.addedLines.map(line => ({
        range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
        options: {
          isWholeLine: true,
          className: 'added-line-decoration',
          linesDecorationsClassName: 'added-line-gutter'
        }
      })),
      ...gitStatus.deletedLines.map(line => ({
        range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
        options: {
          isWholeLine: true,
          className: 'deleted-line-decoration',
          linesDecorationsClassName: 'deleted-line-gutter'
        }
      }))
    ];

    // Current line decoration when debugging
    const currentLineDecorations = isDebugging && currentLine ? [{
      range: {
        startLineNumber: currentLine,
        startColumn: 1,
        endLineNumber: currentLine,
        endColumn: 1
      },
      options: {
        isWholeLine: true,
        className: 'current-line-decoration'
      }
    }] : [];

    editorRef.current.deltaDecorations([], [...breakpointDecorations, ...gitDecorations, ...currentLineDecorations]);
  };

  // Update decorations when breakpoints or current line changes
  useEffect(() => {
    updateDecorations();
  }, [breakpoints, currentLine, isDebugging]);

  const getLanguageConfig = () => {
    switch (language) {
      case 'qsharp':
        return {
          language: 'csharp', // Use C# highlighting as base for Q#
          theme: 'vs-dark'
        };
      default:
        return {
          language,
          theme: 'vs-dark'
        };
    }
  };

  return (
    <div className="flex h-full">
      {files.length > 0 && (
        <div className="w-64 border-r overflow-y-auto">
          <FileTree
            files={files}
            onFileSelect={onFileSelect!}
            selectedFile={selectedFile}
            gitStatus={gitStatus.fileStatus}
          />
        </div>
      )}
      <div className="flex-1">
        <Card className="w-full h-full min-h-[500px] overflow-hidden">
          {currentBranch && (
            <div className="flex items-center gap-2 p-2 border-b">
              <GitBranch className="h-4 w-4" />
              <select
                value={currentBranch}
                onChange={(e) => onBranchChange?.(e.target.value)}
                className="text-sm border rounded px-2 py-1 bg-transparent"
              >
                {availableBranches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          )}
          <Editor
            height="100%"
            value={value}
            onChange={onChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              glyphMargin: true,
              folding: true,
              lineDecorationsWidth: 16,
              lineNumbersMinChars: 3,
              automaticLayout: true
            }}
            {...getLanguageConfig()}
          />
        </Card>
      </div>
    </div>
  );
};
