export type SelectedResource = {
  id: string;
  favicon: string | null;
};

export interface ChatPreferences {
  selectedChatModel?: string;
  resources?: SelectedResource[];
}
