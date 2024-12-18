import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Card } from '../../components/ui/card';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: 'python' | 'qsharp' | 'typescript';
  onBreakpointSet?: (line: number) => void;
  breakpoints?: number[];
  currentLine?: number;
  isDebugging?: boolean;
}

export const CodeEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language,
  onBreakpointSet,
  breakpoints = [],
  currentLine,
  isDebugging = false
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

    editorRef.current.deltaDecorations([], [...breakpointDecorations, ...currentLineDecorations]);
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
    <Card className="w-full h-full min-h-[500px] overflow-hidden">
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
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          automaticLayout: true
        }}
        {...getLanguageConfig()}
      />
    </Card>
  );
};
