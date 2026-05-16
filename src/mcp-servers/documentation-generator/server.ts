#!/usr/bin/env node

/**
 * Documentation Generator MCP Server
 * 
 * Provides tools for generating comprehensive documentation for legacy codebases.
 * Integrates with code-analyzer and git-analyzer MCP servers and uses watsonx.ai for content generation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { createWatsonXClient } from './src/ai/watsonx-client.js';
import { createMCPClient } from './src/orchestrator/mcp-client.js';
import { DataCollector } from './src/orchestrator/data-collector.js';
import { OnboardingGenerator } from './src/tools/onboarding.js';
import { APIReferenceGenerator } from './src/tools/api-reference.js';
import { FAQGenerator } from './src/tools/faq.js';
import { SectionUpdater } from './src/tools/section-updater.js';
import { DocumentValidator } from './src/tools/validator.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

// Load .env file manually (no dotenv dependency needed)
function loadEnvFile(): void {
  const repoPath = process.env['REPO_PATH'] || process.cwd();
  const searchPaths = [
    path.resolve(repoPath, '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(currentDir, '../../../.env'),
    path.resolve(currentDir, '../../../../.env'),
    path.join(path.dirname(repoPath), '.env'),
  ];
  console.error('[loadEnvFile] Searching for .env in paths:', searchPaths);
  for (const envPath of searchPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const value = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      }
      console.error(`[loadEnvFile] Loaded environment from ${envPath}`);
      return;
    }
  }
  console.error('Warning: No .env file found');
}

loadEnvFile();

// Get repository path from environment variable
const REPO_PATH = process.env['REPO_PATH'] || process.cwd();
const OUTPUT_DIR = process.env['OUTPUT_DIR'] || 'docs/onboarding';

/**
 * Main server setup
 */
async function main() {
  console.error('Starting Documentation Generator MCP Server...');
  console.error(`Repository path: ${REPO_PATH}`);
  console.error(`Output directory: ${OUTPUT_DIR}`);

  // Initialize clients with better error handling
  let watsonxClient: ReturnType<typeof createWatsonXClient> | undefined;
  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | undefined;
  let dataCollector: DataCollector | undefined;
  let onboardingGen: OnboardingGenerator | undefined;
  let apiRefGen: APIReferenceGenerator | undefined;
  let faqGen: FAQGenerator | undefined;
  let sectionUpdater: SectionUpdater | undefined;
  let validator: DocumentValidator | undefined;

  // Track initialization errors
  const initErrors: string[] = [];

  // Initialize WatsonX client
  try {
    watsonxClient = createWatsonXClient();
    console.error('✓ WatsonX client initialized successfully');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    initErrors.push(`WatsonX client: ${errorMsg}`);
    console.error('✗ Failed to initialize WatsonX client:', errorMsg);
    console.error('  Make sure WATSONX_API_KEY and WATSONX_PROJECT_ID are set in environment');
  }

  // Initialize MCP client
  try {
    mcpClient = await createMCPClient(REPO_PATH);
    dataCollector = new DataCollector(mcpClient);
    console.error('✓ MCP client and data collector initialized successfully');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    initErrors.push(`MCP client: ${errorMsg}`);
    console.error('✗ Failed to initialize MCP client:', errorMsg);
    console.error('  Code and git analysis features may be limited');
  }

  // Initialize tool generators - require at minimum watsonxClient
  // dataCollector is optional for some tools
  if (watsonxClient) {
    try {
      if (dataCollector) {
        onboardingGen = new OnboardingGenerator(watsonxClient, dataCollector);
        apiRefGen = new APIReferenceGenerator(watsonxClient, dataCollector);
        faqGen = new FAQGenerator(watsonxClient, dataCollector);
        sectionUpdater = new SectionUpdater(watsonxClient, dataCollector);
        console.error('✓ All tool generators initialized successfully');
      } else {
        console.error('⚠ Tool generators initialized without data collector (limited functionality)');
        // Initialize with a mock data collector that returns empty data
        const mockDataCollector = new DataCollector(mcpClient!);
        onboardingGen = new OnboardingGenerator(watsonxClient, mockDataCollector);
        apiRefGen = new APIReferenceGenerator(watsonxClient, mockDataCollector);
        faqGen = new FAQGenerator(watsonxClient, mockDataCollector);
        sectionUpdater = new SectionUpdater(watsonxClient, mockDataCollector);
      }
      validator = new DocumentValidator(watsonxClient);
      console.error('✓ Document validator initialized successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      initErrors.push(`Tool generators: ${errorMsg}`);
      console.error('✗ Failed to initialize tool generators:', errorMsg);
    }
  } else {
    initErrors.push('Cannot initialize tools: WatsonX client is required');
    console.error('✗ Cannot initialize tools: WatsonX client is required');
  }

  // Log initialization summary
  if (initErrors.length === 0) {
    console.error('\n✓ All components initialized successfully');
  } else {
    console.error('\n⚠ Server started with initialization warnings:');
    initErrors.forEach(err => console.error(`  - ${err}`));
    console.error('\nSome tools may not be available. Check environment variables and dependencies.');
  }

  const server = new Server(
    {
      name: 'documentation-generator',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define available tools
  const tools: Tool[] = [
    {
      name: 'generate_onboarding_guide',
      description: 'Generates a comprehensive onboarding guide (ONBOARDING_GUIDE.md) for the codebase',
      inputSchema: {
        type: 'object',
        properties: {
          output_path: {
            type: 'string',
            description: 'Path where the onboarding guide should be saved',
          },
          project_name: {
            type: 'string',
            description: 'Name of the project',
          },
          use_template: {
            type: 'boolean',
            description: 'Use template-based generation instead of AI (faster but less customized)',
            default: false,
          },
        },
      },
    },
    {
      name: 'generate_api_reference',
      description: 'Generates API reference documentation (API_REFERENCE.md) for the codebase',
      inputSchema: {
        type: 'object',
        properties: {
          output_path: {
            type: 'string',
            description: 'Path where the API reference should be saved',
          },
          project_name: {
            type: 'string',
            description: 'Name of the project',
          },
          use_template: {
            type: 'boolean',
            description: 'Use template-based generation instead of AI',
            default: false,
          },
        },
      },
    },
    {
      name: 'generate_faq',
      description: 'Generates FAQ documentation (FAQ.md) for the codebase',
      inputSchema: {
        type: 'object',
        properties: {
          output_path: {
            type: 'string',
            description: 'Path where the FAQ should be saved',
          },
          project_name: {
            type: 'string',
            description: 'Name of the project',
          },
          use_template: {
            type: 'boolean',
            description: 'Use template-based generation instead of AI',
            default: false,
          },
        },
      },
    },
    {
      name: 'regenerate_section',
      description: 'Updates a specific section in an existing documentation file',
      inputSchema: {
        type: 'object',
        properties: {
          document_path: {
            type: 'string',
            description: 'Path to the documentation file to update',
          },
          section_name: {
            type: 'string',
            description: 'Name of the section to update',
          },
          document_type: {
            type: 'string',
            description: 'Type of document (e.g., "Onboarding Guide", "API Reference")',
          },
          output_path: {
            type: 'string',
            description: 'Path where the updated document should be saved (defaults to original path)',
          },
        },
        required: ['document_path', 'section_name'],
      },
    },
    {
      name: 'validate_documentation',
      description: 'Validates documentation for quality, completeness, and correctness',
      inputSchema: {
        type: 'object',
        properties: {
          document_path: {
            type: 'string',
            description: 'Path to the documentation file to validate',
          },
          document_type: {
            type: 'string',
            description: 'Type of document being validated',
          },
          use_ai: {
            type: 'boolean',
            description: 'Use AI-powered validation (more thorough but slower)',
            default: true,
          },
        },
        required: ['document_path'],
      },
    },
  ];

  // Handle tool list requests
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  // Handle tool execution requests
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case 'generate_onboarding_guide': {
          if (!onboardingGen) {
            throw new Error('Onboarding generator not initialized');
          }

          const outputPath = (args as { output_path?: string })?.output_path || `${OUTPUT_DIR}/ONBOARDING_GUIDE.md`;
          const projectName = (args as { project_name?: string })?.project_name;
          const useTemplate = (args as { use_template?: boolean })?.use_template || false;

          const content = await onboardingGen.generate({
            outputPath,
            projectName,
            useTemplate,
          });

          result = {
            success: true,
            message: `Onboarding guide generated successfully at ${outputPath}`,
            path: outputPath,
            preview: content.substring(0, 500) + '...',
          };
          break;
        }

        case 'generate_api_reference': {
          if (!apiRefGen) {
            throw new Error('API reference generator not initialized');
          }

          const outputPath = (args as { output_path?: string })?.output_path || `${OUTPUT_DIR}/API_REFERENCE.md`;
          const projectName = (args as { project_name?: string })?.project_name;
          const useTemplate = (args as { use_template?: boolean })?.use_template || false;

          const content = await apiRefGen.generate({
            outputPath,
            projectName,
            useTemplate,
          });

          result = {
            success: true,
            message: `API reference generated successfully at ${outputPath}`,
            path: outputPath,
            preview: content.substring(0, 500) + '...',
          };
          break;
        }

        case 'generate_faq': {
          if (!faqGen) {
            throw new Error('FAQ generator not initialized');
          }

          const outputPath = (args as { output_path?: string })?.output_path || `${OUTPUT_DIR}/FAQ.md`;
          const projectName = (args as { project_name?: string })?.project_name;
          const useTemplate = (args as { use_template?: boolean })?.use_template || false;

          const content = await faqGen.generate({
            outputPath,
            projectName,
            useTemplate,
          });

          result = {
            success: true,
            message: `FAQ generated successfully at ${outputPath}`,
            path: outputPath,
            preview: content.substring(0, 500) + '...',
          };
          break;
        }

        case 'regenerate_section': {
          if (!sectionUpdater) {
            throw new Error('Section updater not initialized');
          }

          const documentPath = (args as { document_path: string }).document_path;
          const sectionName = (args as { section_name: string }).section_name;
          const documentType = (args as { document_type?: string })?.document_type;
          const outputPath = (args as { output_path?: string })?.output_path;

          if (!documentPath || !sectionName) {
            throw new Error('document_path and section_name are required');
          }

          await sectionUpdater.updateSection({
            documentPath,
            sectionName,
            documentType,
            outputPath,
          });

          result = {
            success: true,
            message: `Section "${sectionName}" updated successfully`,
            path: outputPath || documentPath,
          };
          break;
        }

        case 'validate_documentation': {
          if (!validator) {
            throw new Error('Validator not initialized');
          }

          const documentPath = (args as { document_path: string }).document_path;
          const documentType = (args as { document_type?: string })?.document_type;
          const useAI = (args as { use_ai?: boolean })?.use_ai !== false;

          if (!documentPath) {
            throw new Error('document_path is required');
          }

          const validationResult = await validator.validate({
            documentPath,
            documentType,
            useAI,
          });

          const report = validator.generateReport(validationResult);

          result = {
            success: true,
            validation: validationResult,
            report,
          };
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      } as const;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error executing tool ${name}:`, errorMessage);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      } as const;
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Documentation Generator MCP Server running on stdio');

  // Cleanup on exit
  process.on('SIGINT', async () => {
    console.error('Shutting down...');
    if (mcpClient) {
      await mcpClient.disconnectAll();
    }
    process.exit(0);
  });
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Made with Bob
