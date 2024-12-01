// src/services/FileOperations.ts

import { FileNode } from '../types';

export class FileOperations {
  constructor(private electronAPI: Window['electronAPI']) {}

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

  public async addFileHeaders(files: FileNode[]): Promise<void> {
    for (const file of files) {
      if (!file.isDirectory && file.content) {
        const header = `//${file.path}\n`;
        if (!file.content.startsWith(header)) {
          file.content = header + file.content;
          await this.electronAPI.writeFile(file.path, file.content);
        }
      }
    }
  }

  public async readFileContent(filePath: string): Promise<string> {
    return await this.electronAPI.readFileContent(filePath);
  }
}