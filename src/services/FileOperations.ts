// src/services/FileOperations.ts
import { FileNode } from '../types';

export class FileOperations {
  private projectRoot: string = '';

  constructor(private electronAPI: Window['electronAPI']) {}

  public setProjectRoot(root: string) {
    this.projectRoot = root;
  }

  public async savePrompt(content: string, projectRoot: string): Promise<void> {
    const filePath = `${projectRoot}/aireadme.txt`;
    await this.electronAPI.writeFile(filePath, content);
  }

  public async copyToClipboard(content: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy to clipboard');
    }
  }

  public async addFileHeaders(files: FileNode[]): Promise<{
    modified: string[];
    skipped: string[];
    errors: {path: string; error: string}[];
  }> {
    if (!this.projectRoot) {
      throw new Error('Project root not set');
    }

    const results = {
      modified: [] as string[],
      skipped: [] as string[],
      errors: [] as {path: string; error: string}[]
    };

    for (const file of files) {
      if (!file.isDirectory) {
        try {
          const content = await this.electronAPI.readFileContent(file.path);
          const relativePath = file.path.replace(this.projectRoot, '')
            .replace(/^[/\\]+/, ''); // Remove leading slashes/backslashes
          const header = `//${relativePath}\n`;
          
          const normalizedContent = content.trimStart();
          const headerVariations = [
            header,
            header.trim(),
            `//${relativePath.replace(/\\/g, '/')}`, // Handle Windows paths
            `//${relativePath.replace(/\//g, '\\')}` // Handle Unix paths
          ];
          
          if (headerVariations.some(h => normalizedContent.startsWith(h))) {
            results.skipped.push(file.path);
            continue;
          }

          await this.electronAPI.writeFile(file.path, header + content);
          results.modified.push(file.path);
        } catch (error) {
          results.errors.push({
            path: file.path,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    return results;
  }

  public async readFileContent(filePath: string): Promise<string> {
    return await this.electronAPI.readFileContent(filePath);
  }
}