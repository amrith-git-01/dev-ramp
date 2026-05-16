/**
 * Section Updater Tool
 * 
 * Updates specific sections of existing documentation
 */

import { WatsonXClient } from '../ai/watsonx-client.js';
import { DataCollector } from '../orchestrator/data-collector.js';
import { getSectionUpdatePrompt } from '../ai/prompts.js';
import { extractSection, replaceSection } from '../formatters/markdown.js';
import * as fs from 'fs';
import * as path from 'path';

export interface SectionUpdateOptions {
  documentPath: string;
  sectionName: string;
  documentType?: string;
  outputPath?: string;
}

export class SectionUpdater {
  constructor(
    private watsonx: WatsonXClient,
    private dataCollector: DataCollector
  ) {}

  /**
   * Update a specific section in a document
   */
  async updateSection(options: SectionUpdateOptions): Promise<string> {
    console.error(`Updating section "${options.sectionName}" in ${options.documentPath}...`);

    // Read the existing document
    if (!fs.existsSync(options.documentPath)) {
      throw new Error(`Document not found: ${options.documentPath}`);
    }

    const currentContent = fs.readFileSync(options.documentPath, 'utf-8');

    // Extract the current section content
    const currentSection = extractSection(currentContent, options.sectionName);
    
    if (!currentSection) {
      throw new Error(`Section "${options.sectionName}" not found in document`);
    }

    // Collect fresh data
    console.error('Collecting updated codebase data...');
    const data = await this.dataCollector.collectAll();

    // Generate updated section content
    console.error('Generating updated section content with watsonx.ai...');
    const documentType = options.documentType || this.inferDocumentType(options.documentPath);
    
    const prompt = getSectionUpdatePrompt(
      documentType,
      options.sectionName,
      currentSection,
      {
        structure: data.structure,
        entryPoints: data.entryPoints,
        dependencies: data.dependencies,
        hotspots: data.hotspots,
        contributors: data.contributors,
        complexity: data.complexity,
      }
    );

    let updatedSection: string;
    
    try {
      updatedSection = await this.watsonx.generate({
        prompt,
        maxTokens: 2000,
        temperature: 0.7,
      });
    } catch (error) {
      console.error('AI generation failed:', error);
      throw new Error('Failed to generate updated section content');
    }

    // Replace the section in the document
    const updatedDocument = replaceSection(currentContent, options.sectionName, updatedSection);

    // Save to file
    const outputPath = options.outputPath || options.documentPath;
    await this.saveToFile(updatedDocument, outputPath);

    console.error(`Section updated successfully in ${outputPath}`);
    return updatedDocument;
  }

  /**
   * Update multiple sections in a document
   */
  async updateMultipleSections(
    documentPath: string,
    sectionNames: string[],
    options: { documentType?: string; outputPath?: string } = {}
  ): Promise<string> {
    console.error(`Updating ${sectionNames.length} sections in ${documentPath}...`);

    let currentContent = fs.readFileSync(documentPath, 'utf-8');

    for (const sectionName of sectionNames) {
      try {
        const result = await this.updateSection({
          documentPath,
          sectionName,
          documentType: options.documentType,
          outputPath: documentPath, // Update in place
        });
        currentContent = result;
      } catch (error) {
        console.error(`Failed to update section "${sectionName}":`, error);
      }
    }

    // Save final result
    const outputPath = options.outputPath || documentPath;
    await this.saveToFile(currentContent, outputPath);

    return currentContent;
  }

  /**
   * Infer document type from file path
   */
  private inferDocumentType(filePath: string): string {
    const fileName = path.basename(filePath).toLowerCase();
    
    if (fileName.includes('onboarding')) {
      return 'Onboarding Guide';
    } else if (fileName.includes('api') || fileName.includes('reference')) {
      return 'API Reference';
    } else if (fileName.includes('faq')) {
      return 'FAQ';
    } else if (fileName.includes('readme')) {
      return 'README';
    }
    
    return 'Documentation';
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
    console.error(`Saved updated document to ${filePath}`);
  }

  /**
   * Preview section update without saving
   */
  async previewSectionUpdate(options: SectionUpdateOptions): Promise<{
    original: string;
    updated: string;
  }> {
    console.error(`Previewing update for section "${options.sectionName}"...`);

    const currentContent = fs.readFileSync(options.documentPath, 'utf-8');
    const currentSection = extractSection(currentContent, options.sectionName);
    
    if (!currentSection) {
      throw new Error(`Section "${options.sectionName}" not found in document`);
    }

    const data = await this.dataCollector.collectAll();
    const documentType = options.documentType || this.inferDocumentType(options.documentPath);
    
    const prompt = getSectionUpdatePrompt(
      documentType,
      options.sectionName,
      currentSection,
      {
        structure: data.structure,
        entryPoints: data.entryPoints,
        dependencies: data.dependencies,
        hotspots: data.hotspots,
        contributors: data.contributors,
        complexity: data.complexity,
      }
    );

    const updatedSection = await this.watsonx.generate({
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
    });

    return {
      original: currentSection,
      updated: updatedSection,
    };
  }
}

// Made with Bob
