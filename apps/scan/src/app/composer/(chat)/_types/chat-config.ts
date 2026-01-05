export type SelectedResource = {
  id: string;
  favicon: string | null;
};

export type ChatConfig = {
  model?: string;
  resources?: SelectedResource[];
};
