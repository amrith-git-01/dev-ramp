/**
 * Onboarding Guide Generator Tool
 * 
 * Generates comprehensive onboarding documentation for legacy codebases
 */

import { WatsonXClient } from '../ai/watsonx-client.js';
import { DataCollector } from '../orchestrator/data-collector.js';
import { getOnboardingGuidePrompt } from '../ai/prompts.js';
import { getOnboardingTemplate } from '../formatters/templates.js';
import * as fs from 'fs';
import * as path from 'path';

export interface OnboardingOptions {
  outputPath?: string;
  projectName?: string;
  useTemplate?: boolean;
}

export class OnboardingGenerator {
  constructor(
    private watsonx: WatsonXClient,
    private dataCollector: DataCollector
  ) {}

  /**
   * Generate onboarding guide
   */
  async generate(options: OnboardingOptions = {}): Promise<string> {
    console.error('Generating onboarding guide...');

    // Collect data from MCP servers
    console.error('Collecting codebase data...');
    const data = await this.dataCollector.collectForOnboarding();

    // Get project name
    const projectName = options.projectName || this.extractProjectName(data);

    // Generate content using AI
    console.error('Generating content with watsonx.ai...');
    const prompt = getOnboardingGuidePrompt({
      projectName,
      structure: data.structure,
      entryPoints: data.entryPoints,
      dependencies: data.dependencies,
      hotspots: data.hotspots,
      contributors: data.contributors,
    });

    let content: string;
    
    if (options.useTemplate) {
      // Use template and fill in sections
      content = getOnboardingTemplate(projectName);
      console.error('Using template-based generation');
    } else {
      // Generate full content with AI
      try {
        content = await this.watsonx.generate({
          prompt,
          maxTokens: 4000,
          temperature: 0.7,
        });
      } catch (error) {
        console.error('AI generation failed, falling back to template:', error);
        content = getOnboardingTemplate(projectName);
      }
    }

    // Save to file if output path provided
    if (options.outputPath) {
      await this.saveToFile(content, options.outputPath);
    }

    console.error('Onboarding guide generated successfully');
    return content;
  }

  /**
   * Extract project name from data
   */
  private extractProjectName(data: unknown): string {
    // Try to extract from structure or use default
    const structureData = data as { structure?: { directoryStructure?: string[] } };
    
    if (structureData.structure?.directoryStructure && structureData.structure.directoryStructure.length > 0) {
      const firstDir = structureData.structure.directoryStructure[0];
      if (firstDir) {
        const parts = firstDir.split('/');
        return parts[0] || 'Project';
      }
    }
    
    return 'Project';
  }

  /**
   * Save content to file
   */
  private async saveToFile(content: string, filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.error(`Saved onboarding guide to ${filePath}`);
  }

  /**
   * Generate with custom context
   */
  async generateWithContext(context: Record<string, unknown>, options: OnboardingOptions = {}): Promise<string> {
    console.error('Generating onboarding guide with custom context...');

    const projectName = options.projectName || 'Project';
    const prompt = getOnboardingGuidePrompt({
      projectName,
      ...context,
    });

    let content: string;
    
    try {
      content = await this.watsonx.generate({
        prompt,
        maxTokens: 4000,
        temperature: 0.7,
      });
    } catch (error) {
      console.error('AI generation failed, falling back to template:', error);
      content = getOnboardingTemplate(projectName);
    }

    if (options.outputPath) {
      await this.saveToFile(content, options.outputPath);
    }

    return content;
  }
}

// Made with Bob
