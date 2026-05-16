/**
 * Prompt Templates for Documentation Generation
 * 
 * Contains structured prompts for generating different types of documentation
 */

export interface PromptContext {
  projectName?: string;
  structure?: unknown;
  entryPoints?: unknown;
  dependencies?: unknown;
  hotspots?: unknown;
  contributors?: unknown;
  complexity?: unknown;
}

/**
 * Generate onboarding guide prompt
 */
export function getOnboardingGuidePrompt(context: PromptContext): string {
  return `You are a technical documentation expert. Generate a comprehensive onboarding guide for a legacy codebase.

Project Information:
${context.projectName ? `Project Name: ${context.projectName}` : ''}

Codebase Structure:
${JSON.stringify(context.structure, null, 2)}

Entry Points:
${JSON.stringify(context.entryPoints, null, 2)}

Dependencies:
${JSON.stringify(context.dependencies, null, 2)}

Code Hotspots (frequently changed files):
${JSON.stringify(context.hotspots, null, 2)}

Create an ONBOARDING_GUIDE.md that includes:

1. **Project Overview**
   - Brief description of the project
   - Key technologies and frameworks used
   - Architecture overview

2. **Getting Started**
   - Prerequisites and system requirements
   - Installation steps
   - Configuration guide
   - How to run the project

3. **Codebase Structure**
   - Directory organization
   - Key modules and their purposes
   - Entry points and main execution flows

4. **Development Workflow**
   - How to make changes
   - Testing procedures
   - Code review process
   - Deployment process

5. **Key Concepts**
   - Important design patterns used
   - Core business logic locations
   - Data flow and architecture

6. **Common Tasks**
   - How to add new features
   - How to fix bugs
   - How to run tests
   - How to debug issues

7. **Resources**
   - Important files to review first
   - External documentation links
   - Team contacts

Format the output as a well-structured Markdown document with clear headings, code examples where appropriate, and actionable guidance for new developers.`;
}

/**
 * Generate API reference prompt
 */
export function getAPIReferencePrompt(context: PromptContext): string {
  return `You are a technical documentation expert. Generate a comprehensive API reference for a codebase.

Codebase Structure:
${JSON.stringify(context.structure, null, 2)}

Entry Points:
${JSON.stringify(context.entryPoints, null, 2)}

Dependencies:
${JSON.stringify(context.dependencies, null, 2)}

Complexity Metrics:
${JSON.stringify(context.complexity, null, 2)}

Create an API_REFERENCE.md that includes:

1. **Overview**
   - Purpose of the API/codebase
   - Main components and modules

2. **Core APIs and Functions**
   - List all major functions, classes, and methods
   - For each, include:
     - Name and signature
     - Purpose and description
     - Parameters and return values
     - Usage examples
     - Related functions

3. **Module Documentation**
   - Document each major module/package
   - Explain its role in the system
   - List its public interfaces

4. **Data Structures**
   - Key data types and structures
   - Their purposes and usage

5. **Configuration**
   - Configuration options
   - Environment variables
   - Config file formats

6. **Error Handling**
   - Common error codes
   - Exception types
   - Error handling patterns

7. **Examples**
   - Common usage patterns
   - Code snippets
   - Integration examples

Format the output as a well-structured Markdown document with clear sections, code blocks, and tables where appropriate.`;
}

/**
 * Generate FAQ prompt
 */
export function getFAQPrompt(context: PromptContext): string {
  return `You are a technical documentation expert. Generate a comprehensive FAQ document for a legacy codebase.

Codebase Structure:
${JSON.stringify(context.structure, null, 2)}

Entry Points:
${JSON.stringify(context.entryPoints, null, 2)}

Dependencies:
${JSON.stringify(context.dependencies, null, 2)}

Code Hotspots:
${JSON.stringify(context.hotspots, null, 2)}

Contributors:
${JSON.stringify(context.contributors, null, 2)}

Create an FAQ.md that includes:

1. **General Questions**
   - What is this project?
   - What problem does it solve?
   - Who maintains it?
   - What's the project history?

2. **Setup and Installation**
   - How do I set up the development environment?
   - What are the system requirements?
   - Common installation issues and solutions
   - How do I configure the application?

3. **Development Questions**
   - Where do I start reading the code?
   - How is the code organized?
   - What are the main entry points?
   - How do I run tests?
   - How do I debug issues?

4. **Architecture Questions**
   - What's the overall architecture?
   - What design patterns are used?
   - How does data flow through the system?
   - What are the key dependencies?

5. **Common Issues**
   - Why does X fail?
   - How do I fix Y error?
   - What causes Z behavior?
   - Performance issues and solutions

6. **Contributing**
   - How do I contribute?
   - What's the code review process?
   - What are the coding standards?
   - How do I submit changes?

7. **Deployment and Operations**
   - How is the application deployed?
   - What are the production requirements?
   - How do I monitor the application?
   - What are common operational issues?

Format each question and answer clearly. Use code examples where helpful. Make answers concise but complete.`;
}

/**
 * Generate section update prompt
 */
export function getSectionUpdatePrompt(
  documentType: string,
  sectionName: string,
  currentContent: string,
  context: PromptContext
): string {
  return `You are a technical documentation expert. Update a specific section of a ${documentType} document.

Section to Update: ${sectionName}

Current Content:
${currentContent}

Updated Context:
${JSON.stringify(context, null, 2)}

Instructions:
1. Review the current content of the section
2. Incorporate the new context information
3. Maintain the existing structure and style
4. Ensure consistency with the rest of the document
5. Keep the tone professional and clear
6. Add or update examples if relevant
7. Preserve any important existing information

Generate the updated section content in Markdown format. Only output the section content, not the entire document.`;
}

/**
 * Generate validation prompt
 */
export function getValidationPrompt(documentContent: string, documentType: string): string {
  return `You are a technical documentation quality reviewer. Review the following ${documentType} document for quality and completeness.

Document Content:
${documentContent}

Evaluate the document on:

1. **Completeness**
   - Are all expected sections present?
   - Is the information comprehensive?
   - Are there any obvious gaps?

2. **Clarity**
   - Is the language clear and concise?
   - Are technical terms explained?
   - Is the structure logical?

3. **Accuracy**
   - Does the information appear correct?
   - Are code examples valid?
   - Are there any inconsistencies?

4. **Usefulness**
   - Would this help a new developer?
   - Are there actionable instructions?
   - Are examples practical?

5. **Formatting**
   - Is Markdown formatting correct?
   - Are headings properly structured?
   - Are code blocks formatted correctly?

Provide a JSON response with:
{
  "isValid": true/false,
  "score": 0-100,
  "issues": [
    {
      "severity": "error|warning|info",
      "section": "section name",
      "message": "description of issue",
      "suggestion": "how to fix"
    }
  ],
  "strengths": ["list of strong points"],
  "recommendations": ["list of improvements"]
}`;
}

/**
 * Generate summary prompt for combining multiple data sources
 */
export function getSummaryPrompt(data: unknown, purpose: string): string {
  return `Analyze the following data and provide a concise summary for ${purpose}:

${JSON.stringify(data, null, 2)}

Provide a clear, structured summary that highlights:
- Key findings
- Important patterns
- Notable statistics
- Actionable insights

Keep the summary focused and relevant to ${purpose}.`;
}

// Made with Bob
