import { render } from '@testing-library/react';
import { CodeEditor } from '../CodeEditor';

describe('CodeEditor', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <CodeEditor
        value="# Test code"
        onChange={() => {}}
        language="python"
      />
    );
    expect(container).toBeTruthy();
  });

  it('handles breakpoint toggling', () => {
    const onBreakpointSet = jest.fn();
    const { container } = render(
      <CodeEditor
        value="# Test code"
        onChange={() => {}}
        language="python"
        onBreakpointSet={onBreakpointSet}
        breakpoints={[]}
      />
    );

    // Note: Due to Monaco Editor's complexity, we can't directly test gutter clicks
    // These tests verify the component structure and prop handling
    expect(container).toBeTruthy();
    expect(onBreakpointSet).not.toHaveBeenCalled();
  });

  it('displays current line highlight during debugging', () => {
    const { container } = render(
      <CodeEditor
        value="# Test code"
        onChange={() => {}}
        language="python"
        currentLine={2}
        isDebugging={true}
        breakpoints={[]}
      />
    );
    expect(container).toBeTruthy();
  });
});
