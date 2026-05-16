/**
 * Markdown Formatter
 * 
 * Utilities for formatting and manipulating Markdown content
 */

/**
 * Format a heading
 */
export function heading(level: number, text: string): string {
  return `${'#'.repeat(level)} ${text}\n\n`;
}

/**
 * Format a paragraph
 */
export function paragraph(text: string): string {
  return `${text}\n\n`;
}

/**
 * Format a code block
 */
export function codeBlock(code: string, language: string = ''): string {
  return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
}

/**
 * Format inline code
 */
export function inlineCode(text: string): string {
  return `\`${text}\``;
}

/**
 * Format a list
 */
export function list(items: string[], ordered: boolean = false): string {
  return items.map((item, index) => {
    const prefix = ordered ? `${index + 1}.` : '-';
    return `${prefix} ${item}`;
  }).join('\n') + '\n\n';
}

/**
 * Format a table
 */
export function table(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
  
  return `${headerRow}\n${separator}\n${dataRows}\n\n`;
}

/**
 * Format a link
 */
export function link(text: string, url: string): string {
  return `[${text}](${url})`;
}

/**
 * Format bold text
 */
export function bold(text: string): string {
  return `**${text}**`;
}

/**
 * Format italic text
 */
export function italic(text: string): string {
  return `*${text}*`;
}

/**
 * Format a blockquote
 */
export function blockquote(text: string): string {
  return text.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
}

/**
 * Format a horizontal rule
 */
export function horizontalRule(): string {
  return '---\n\n';
}

/**
 * Extract section from markdown content
 */
export function extractSection(content: string, sectionName: string): string | null {
  const lines = content.split('\n');
  const sectionRegex = new RegExp(`^#+\\s+${sectionName}\\s*$`, 'i');
  
  let startIndex = -1;
  let endIndex = lines.length;
  let sectionLevel = 0;
  
  // Find section start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && sectionRegex.test(line)) {
      startIndex = i;
      const match = line.match(/^(#+)/);
      sectionLevel = (match && match[1]) ? match[1].length : 0;
      break;
    }
  }
  
  if (startIndex === -1) {
    return null;
  }
  
  // Find section end (next heading of same or higher level)
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line) {
      const match = line.match(/^(#+)\s/);
      if (match && match[1] && match[1].length <= sectionLevel) {
        endIndex = i;
        break;
      }
    }
  }
  
  return lines.slice(startIndex, endIndex).join('\n');
}

/**
 * Replace section in markdown content
 */
export function replaceSection(content: string, sectionName: string, newContent: string): string {
  const lines = content.split('\n');
  const sectionRegex = new RegExp(`^#+\\s+${sectionName}\\s*$`, 'i');
  
  let startIndex = -1;
  let endIndex = lines.length;
  let sectionLevel = 0;
  
  // Find section start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && sectionRegex.test(line)) {
      startIndex = i;
      const match = line.match(/^(#+)/);
      sectionLevel = (match && match[1]) ? match[1].length : 0;
      break;
    }
  }
  
  if (startIndex === -1) {
    // Section not found, append at end
    return content + '\n\n' + newContent;
  }
  
  // Find section end
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line) {
      const match = line.match(/^(#+)\s/);
      if (match && match[1] && match[1].length <= sectionLevel) {
        endIndex = i;
        break;
      }
    }
  }
  
  // Replace section
  const before = lines.slice(0, startIndex).join('\n');
  const after = lines.slice(endIndex).join('\n');
  
  return `${before}\n${newContent}\n${after}`.trim() + '\n';
}

/**
 * Get all section names from markdown content
 */
export function getSectionNames(content: string): string[] {
  const lines = content.split('\n');
  const sections: string[] = [];
  
  for (const line of lines) {
    const match = line.match(/^#+\s+(.+)$/);
    if (match && match[1]) {
      sections.push(match[1].trim());
    }
  }
  
  return sections;
}

/**
 * Sanitize text for markdown
 */
export function sanitize(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

/**
 * Create a table of contents from markdown content
 */
export function createTableOfContents(content: string, maxLevel: number = 3): string {
  const lines = content.split('\n');
  const toc: string[] = ['## Table of Contents\n'];
  
  for (const line of lines) {
    const match = line.match(/^(#+)\s+(.+)$/);
    if (match && match[1] && match[2]) {
      const level = match[1].length;
      const title = match[2].trim();
      
      if (level <= maxLevel && level > 1) {
        const indent = '  '.repeat(level - 2);
        const anchor = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        toc.push(`${indent}- [${title}](#${anchor})`);
      }
    }
  }
  
  return toc.join('\n') + '\n\n';
}

/**
 * Wrap text to specified width
 */
export function wrapText(text: string, width: number = 80): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}

// Made with Bob
