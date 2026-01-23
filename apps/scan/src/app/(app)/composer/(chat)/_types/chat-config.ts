export interface SelectedResource {
  id: string;
  favicon: string | null;
}

export interface ChatConfig {
  model?: string;
  resources?: SelectedResource[];
}
