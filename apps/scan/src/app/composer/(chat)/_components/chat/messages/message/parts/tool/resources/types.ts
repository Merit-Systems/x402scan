import type { ToolUIPart } from 'ai';

export type InputComponent = React.FC<{
  input: ToolUIPart['input'];
}>;

export type OutputComponent = React.FC<{
  output: ToolUIPart['output'];
  errorText: ToolUIPart['errorText'];
}>;

export type ResourceComponent = {
  input: InputComponent;
  output: OutputComponent;
};

export type ResourceComponentMap = Record<string, ResourceComponent>;
