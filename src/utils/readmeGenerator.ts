import { ProjectContext, FileNode, OutputFormat } from '../types';

interface AIReadmeOptions {
    context: ProjectContext;
    format: OutputFormat;
    selectedFiles: FileNode[];
    customHeader?: string;
}

async function generateAIReadme(options: AIReadmeOptions): Promise<string> {
    const { context, format, selectedFiles } = options;
    let content = '';

    // Project Header
    if (format.format.includeProjectContext) {
        content += `<${context.name}>\n\n`;
        
        if (format.header?.title) {
            content += `# ${format.header.title}\n`;
        }

        if (format.header?.description || context.description) {
            content += `\n${format.header?.description || context.description}\n`;
        }

        // Stack Information
        content += '\n## Tech Stack\n';
        content += `- Type: ${context.stack.type}\n`;
        content += `- Framework: ${context.stack.framework.join(', ')}\n`;
        content += `- Language: ${context.stack.language}\n`;
        content += `- Testing: ${context.stack.testing.join(', ')}\n`;
        content += `- Styling: ${context.stack.styling.join(', ')}\n`;
        
        // Custom Sections
        if (format.header?.customSections) {
            Object.entries(format.header.customSections).forEach(([title, text]) => {
                content += `\n## ${title}\n${text}\n`;
            });
        }
        
        content += '\n';
    }

    // Rest of the content...
    return content;
}