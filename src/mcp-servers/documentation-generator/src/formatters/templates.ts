/**
 * Documentation Templates
 * 
 * Provides base templates for different documentation types
 */

import * as md from './markdown.js';

/**
 * Get onboarding guide template
 */
export function getOnboardingTemplate(projectName: string = 'Project'): string {
  return `# ${projectName} - Onboarding Guide

Welcome to the ${projectName} codebase! This guide will help you get started with understanding and contributing to the project.

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Codebase Structure](#codebase-structure)
- [Development Workflow](#development-workflow)
- [Key Concepts](#key-concepts)
- [Common Tasks](#common-tasks)
- [Resources](#resources)

## Project Overview

### Description

[Brief description of what this project does]

### Key Technologies

- Technology 1
- Technology 2
- Technology 3

### Architecture Overview

[High-level architecture description]

## Getting Started

### Prerequisites

- Requirement 1
- Requirement 2
- Requirement 3

### Installation

\`\`\`bash
# Clone the repository
git clone [repository-url]

# Install dependencies
[installation commands]
\`\`\`

### Configuration

[Configuration instructions]

### Running the Project

\`\`\`bash
# Development mode
[run command]

# Production mode
[production command]
\`\`\`

## Codebase Structure

### Directory Organization

\`\`\`
project-root/
├── src/           # Source code
├── tests/         # Test files
├── docs/          # Documentation
└── config/        # Configuration files
\`\`\`

### Key Modules

- **Module 1**: Description
- **Module 2**: Description
- **Module 3**: Description

### Entry Points

[Description of main entry points]

## Development Workflow

### Making Changes

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

### Testing

\`\`\`bash
# Run tests
[test command]
\`\`\`

### Code Review Process

[Code review guidelines]

## Key Concepts

### Design Patterns

[Important design patterns used]

### Core Business Logic

[Where to find core logic]

### Data Flow

[How data flows through the system]

## Common Tasks

### Adding a New Feature

1. Step 1
2. Step 2
3. Step 3

### Fixing a Bug

1. Step 1
2. Step 2
3. Step 3

### Running Tests

\`\`\`bash
[test commands]
\`\`\`

### Debugging

[Debugging tips and tools]

## Resources

### Important Files

- \`file1.ext\` - Description
- \`file2.ext\` - Description

### External Documentation

- [Link 1](url)
- [Link 2](url)

### Team Contacts

- Role 1: Contact info
- Role 2: Contact info

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
}

/**
 * Get API reference template
 */
export function getAPIReferenceTemplate(projectName: string = 'Project'): string {
  return `# ${projectName} - API Reference

Complete API reference for the ${projectName} codebase.

## Table of Contents

- [Overview](#overview)
- [Core APIs](#core-apis)
- [Module Documentation](#module-documentation)
- [Data Structures](#data-structures)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

### Purpose

[Description of the API/codebase purpose]

### Main Components

- Component 1
- Component 2
- Component 3

## Core APIs

### Function/Class Name

**Description**: [What it does]

**Signature**:
\`\`\`typescript
function functionName(param1: Type1, param2: Type2): ReturnType
\`\`\`

**Parameters**:
- \`param1\` (Type1): Description
- \`param2\` (Type2): Description

**Returns**: Description of return value

**Example**:
\`\`\`typescript
const result = functionName(value1, value2);
\`\`\`

## Module Documentation

### Module Name

**Purpose**: [Module purpose]

**Public Interface**:
- Function 1
- Function 2
- Class 1

**Usage**:
\`\`\`typescript
import { Function1 } from 'module-name';
\`\`\`

## Data Structures

### Structure Name

\`\`\`typescript
interface StructureName {
  field1: Type1;
  field2: Type2;
}
\`\`\`

**Fields**:
- \`field1\`: Description
- \`field2\`: Description

## Configuration

### Environment Variables

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| VAR_NAME | string | Description | default |

### Config Files

[Configuration file descriptions]

## Error Handling

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| ERR_001 | Error description | How to fix |

### Exception Types

[Exception type descriptions]

## Examples

### Common Usage Pattern

\`\`\`typescript
// Example code
\`\`\`

### Integration Example

\`\`\`typescript
// Integration example
\`\`\`

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
}

/**
 * Get FAQ template
 */
export function getFAQTemplate(projectName: string = 'Project'): string {
  return `# ${projectName} - Frequently Asked Questions

Common questions and answers about the ${projectName} codebase.

## Table of Contents

- [General Questions](#general-questions)
- [Setup and Installation](#setup-and-installation)
- [Development Questions](#development-questions)
- [Architecture Questions](#architecture-questions)
- [Common Issues](#common-issues)
- [Contributing](#contributing)
- [Deployment and Operations](#deployment-and-operations)

## General Questions

### What is this project?

[Answer]

### What problem does it solve?

[Answer]

### Who maintains it?

[Answer]

### What's the project history?

[Answer]

## Setup and Installation

### How do I set up the development environment?

[Answer with steps]

### What are the system requirements?

[Answer]

### What are common installation issues?

**Issue**: [Description]
**Solution**: [How to fix]

### How do I configure the application?

[Answer]

## Development Questions

### Where do I start reading the code?

[Answer with file paths]

### How is the code organized?

[Answer]

### What are the main entry points?

[Answer]

### How do I run tests?

\`\`\`bash
[test command]
\`\`\`

### How do I debug issues?

[Answer]

## Architecture Questions

### What's the overall architecture?

[Answer]

### What design patterns are used?

[Answer]

### How does data flow through the system?

[Answer]

### What are the key dependencies?

[Answer]

## Common Issues

### Why does X fail?

**Cause**: [Explanation]
**Solution**: [How to fix]

### How do I fix Y error?

**Error**: [Error message]
**Solution**: [How to fix]

### What causes Z behavior?

**Explanation**: [Why it happens]
**Solution**: [How to handle it]

## Contributing

### How do I contribute?

[Answer with steps]

### What's the code review process?

[Answer]

### What are the coding standards?

[Answer]

### How do I submit changes?

[Answer]

## Deployment and Operations

### How is the application deployed?

[Answer]

### What are the production requirements?

[Answer]

### How do I monitor the application?

[Answer]

### What are common operational issues?

[Answer]

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
}

/**
 * Create a section template
 */
export function createSection(title: string, level: number = 2, content: string = ''): string {
  return md.heading(level, title) + (content ? md.paragraph(content) : '');
}

/**
 * Create a code example section
 */
export function createCodeExample(title: string, code: string, language: string = '', description: string = ''): string {
  let result = md.heading(3, title);
  
  if (description) {
    result += md.paragraph(description);
  }
  
  result += md.codeBlock(code, language);
  
  return result;
}

/**
 * Create a list section
 */
export function createListSection(title: string, items: string[], ordered: boolean = false): string {
  return md.heading(3, title) + md.list(items, ordered);
}

/**
 * Create a table section
 */
export function createTableSection(title: string, headers: string[], rows: string[][]): string {
  return md.heading(3, title) + md.table(headers, rows);
}

// Made with Bob
