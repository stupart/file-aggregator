// src/services/PromptBuilder.ts

import { FileNode, ProjectContext, PromptSection, PromptOptions } from '../types';

export class PromptBuilder {
  private sections: PromptSection[] = [];
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  public clearSections(): void {
    this.sections = [];
  }   

  public addIdentity(identity: string): void {
    this.sections.push({
      type: 'identity',
      content: `<identity>\n${identity}\n</identity>\n\n`,
      optional: true
    });
  }

  public addProject(context: ProjectContext): void {
    const content = `<project>\n${this.formatProjectContext(context)}\n</project>\n\n`;
    this.sections.push({
      type: 'project',
      content,
      optional: true
    });
  }

  public addTask(task: string): void {
    this.sections.push({
      type: 'task',
      content: `<task>\n${task}\n</task>\n\n`,
      optional: true
    });
  }

  public addFileTree(structure: FileNode): void {
    const treeContent = this.generateFileTree(structure);
    this.sections.push({
      type: 'fileTree',
      content: `<file-tree>\n${treeContent}</file-tree>\n\n`,
      optional: true
    });
  }

  public addFiles(files: FileNode[]): void {
    const filesContent = this.formatFiles(files);
    this.sections.push({
      type: 'files',
      content: filesContent
    });
  }

  public async generatePrompt(options: PromptOptions): Promise<string> {
    const { projectName, identity, task } = options;
    let output = `<${projectName}-codebase>\n\n`;

    // Add identity if present
    if (identity) {
        output += `<identity>\n${identity}\n</identity>\n\n`;
    }

    // Add project context if present
    if (options.projectContext) {
        output += `<project>\n${this.formatProjectContext(options.projectContext)}\n</project>\n\n`;
    }

    // Add task if present
    if (task) {
        output += `<task>\n${task}\n</task>\n\n`;
    }
    
    // Add sections in specific order
    const orderedTypes: PromptSection['type'][] = [
      'identity',
      'project',
      'task',
      'fileTree',
      'files'
    ];

    for (const type of orderedTypes) {
      const section = this.sections.find(s => s.type === type);
      if (section && (!section.optional || this.shouldIncludeSection(type, options))) {
        output += section.content;
      }
    }

    output += `</${projectName}-codebase>`;
    return output;
  }

  private shouldIncludeSection(type: PromptSection['type'], options: PromptOptions): boolean {
    switch (type) {
      case 'fileTree':
        return !!options.includeFileTree;
      case 'identity':
        return !!options.identity;
      case 'project':
        return !!options.projectContext;
      case 'task':
        return !!options.task;
      default:
        return true;
    }
  }

  private formatProjectContext(context: ProjectContext): string {
    return `Type: ${context.stack.type}
Framework: ${context.stack.framework.join(', ')}
Language: ${context.stack.language}
Testing: ${context.stack.testing.join(', ')}
Styling: ${context.stack.styling.join(', ')}
${context.description ? `\nDescription: ${context.description}` : ''}`;
  }

  private generateFileTree(node: FileNode, depth: number = 0): string {
    const indent = '  '.repeat(depth);
    let output = `${indent}${node.path}\n`;

    if (node.children) {
      for (const child of node.children) {
        output += this.generateFileTree(child, depth + 1);
      }
    }

    return output;
  }

  private formatFiles(files: FileNode[]): string {
    return files.map(file => {
        const relativePath = file.path.replace(this.projectRoot, '')
            .replace(/^[/\\]+/, ''); // Remove leading slashes/backslashes
        const header = `//${relativePath}`;
        return `<${file.name}>\n${header}\n${file.content || ''}\n</${file.name}>\n\n`;
    }).join('');
  }
}

