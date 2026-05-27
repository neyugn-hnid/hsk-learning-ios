declare module "expo-file-system" {
  export const documentDirectory: string | null;
  export const EncodingType: {
    UTF8: string;
  };

  export function getInfoAsync(uri: string): Promise<{
    exists: boolean;
    uri: string;
    size?: number;
    modificationTime?: number;
    isDirectory?: boolean;
  }>;

  export function readAsStringAsync(
    uri: string,
    options?: { encoding?: string },
  ): Promise<string>;

  export function writeAsStringAsync(
    uri: string,
    contents: string,
    options?: { encoding?: string },
  ): Promise<void>;
}

declare module "expo-document-picker" {
  export type DocumentPickerAsset = {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  };

  export type DocumentPickerResult =
    | { canceled: true; assets: null }
    | { canceled: false; assets: DocumentPickerAsset[] };

  export function getDocumentAsync(options?: {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }): Promise<DocumentPickerResult>;
}
