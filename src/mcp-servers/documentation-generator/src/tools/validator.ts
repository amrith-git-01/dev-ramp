/**
 * Documentation Validator Tool
 * 
 * Validates generated documentation for quality and completeness
 */

import { WatsonXClient } from '../ai/watsonx-client.js';
import { getValidationPrompt } from '../ai/prompts.js';
import { getSectionNames } from '../formatters/markdown.js';
import * as fs from 'fs';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  section: string;
  message: string;
  suggestion: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  strengths: string[];
  recommendations: string[];
}

export interface ValidatorOptions {
  documentPath?: string;
  content?: string;
  documentType?: string;
  useAI?: boolean;
}

export class DocumentValidator {
  constructor(private watsonx: WatsonXClient) {}

  /**
   * Validate documentation
   */
  async validate(options: ValidatorOptions): Promise<ValidationResult> {
    console.error('Validating documentation...');

    // Get content
    let content: string;
    if (options.content) {
      content = options.content;
    } else if (options.documentPath) {
      if (!fs.existsSync(options.documentPath)) {
        throw new Error(`Document not found: ${options.documentPath}`);
      }
      content = fs.readFileSync(options.documentPath, 'utf-8');
    } else {
      throw new Error('Either content or documentPath must be provided');
    }

    // Perform basic validation
    const basicValidation = this.performBasicValidation(content);

    // Perform AI-powered validation if requested
    let aiValidation: Partial<ValidationResult> = {};
    if (options.useAI !== false) {
      try {
        aiValidation = await this.performAIValidation(content, options.documentType || 'Documentation');
      } catch (error) {
        console.error('AI validation failed:', error);
      }
    }

    // Combine results
    const result: ValidationResult = {
      isValid: basicValidation.isValid && (aiValidation.isValid !== false),
      score: Math.round((basicValidation.score + (aiValidation.score || basicValidation.score)) / 2),
      issues: [...basicValidation.issues, ...(aiValidation.issues || [])],
      strengths: [...basicValidation.strengths, ...(aiValidation.strengths || [])],
      recommendations: [...basicValidation.recommendations, ...(aiValidation.recommendations || [])],
    };

    console.error(`Validation complete. Score: ${result.score}/100`);
    return result;
  }

  /**
   * Perform basic validation checks
   */
  private performBasicValidation(content: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    const strengths: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check if content is empty
    if (!content.trim()) {
      issues.push({
        severity: 'error',
        section: 'General',
        message: 'Document is empty',
        suggestion: 'Add content to the document',
      });
      return {
        isValid: false,
        score: 0,
        issues,
        strengths,
        recommendations,
      };
    }

    // Check for title
    if (!content.match(/^#\s+.+/m)) {
      issues.push({
        severity: 'error',
        section: 'General',
        message: 'Document missing main title',
        suggestion: 'Add a level 1 heading at the start of the document',
      });
      score -= 10;
    } else {
      strengths.push('Document has a clear title');
    }

    // Check for sections
    const sections = getSectionNames(content);
    if (sections.length < 3) {
      issues.push({
        severity: 'warning',
        section: 'Structure',
        message: 'Document has very few sections',
        suggestion: 'Consider adding more sections to organize content better',
      });
      score -= 5;
    } else {
      strengths.push(`Document is well-structured with ${sections.length} sections`);
    }

    // Check for code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (codeBlocks && codeBlocks.length > 0) {
      strengths.push(`Contains ${codeBlocks.length} code examples`);
    } else {
      recommendations.push('Consider adding code examples to illustrate concepts');
    }

    // Check for links
    const links = content.match(/\[.+?\]\(.+?\)/g);
    if (links && links.length > 0) {
      strengths.push(`Contains ${links.length} reference links`);
    } else {
      recommendations.push('Consider adding links to external resources');
    }

    // Check for lists
    const lists = content.match(/^[\s]*[-*+]\s+.+$/gm);
    if (lists && lists.length > 5) {
      strengths.push('Uses lists effectively for organization');
    }

    // Check for tables
    const tables = content.match(/\|.+\|/g);
    if (tables && tables.length > 0) {
      strengths.push('Includes tables for structured information');
    }

    // Check content length
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 100) {
      issues.push({
        severity: 'warning',
        section: 'Content',
        message: 'Document is very short',
        suggestion: 'Add more detailed content and explanations',
      });
      score -= 10;
    } else if (wordCount > 500) {
      strengths.push('Document has substantial content');
    }

    // Check for TOC
    if (content.toLowerCase().includes('table of contents')) {
      strengths.push('Includes table of contents for navigation');
    } else if (sections.length > 5) {
      recommendations.push('Consider adding a table of contents for easier navigation');
    }

    // Check for placeholder text
    const placeholders = content.match(/\[.*?\]/g);
    if (placeholders && placeholders.some(p => p.toLowerCase().includes('todo') || p.toLowerCase().includes('tbd'))) {
      issues.push({
        severity: 'warning',
        section: 'Content',
        message: 'Document contains placeholder text',
        suggestion: 'Replace placeholder text with actual content',
      });
      score -= 5;
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      score: Math.max(0, score),
      issues,
      strengths,
      recommendations,
    };
  }

  /**
   * Perform AI-powered validation
   */
  private async performAIValidation(content: string, documentType: string): Promise<Partial<ValidationResult>> {
    console.error('Performing AI-powered validation...');

    const prompt = getValidationPrompt(content, documentType);

    try {
      const response = await this.watsonx.generate({
        prompt,
        maxTokens: 1000,
        temperature: 0.3,
      });

      // Parse JSON response
      const result = JSON.parse(response) as ValidationResult;
      return result;
    } catch (error) {
      console.error('Failed to parse AI validation response:', error);
      return {};
    }
  }

  /**
   * Validate multiple documents
   */
  async validateMultiple(documentPaths: string[]): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};

    for (const docPath of documentPaths) {
      try {
        results[docPath] = await this.validate({
          documentPath: docPath,
          useAI: false, // Skip AI for batch validation to save time
        });
      } catch (error) {
        console.error(`Failed to validate ${docPath}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate validation report
   */
  generateReport(result: ValidationResult): string {
    let report = '# Documentation Validation Report\n\n';
    
    report += `**Overall Score**: ${result.score}/100\n`;
    report += `**Status**: ${result.isValid ? '✅ Valid' : '❌ Invalid'}\n\n`;

    if (result.strengths.length > 0) {
      report += '## Strengths\n\n';
      result.strengths.forEach(strength => {
        report += `- ✅ ${strength}\n`;
      });
      report += '\n';
    }

    if (result.issues.length > 0) {
      report += '## Issues\n\n';
      result.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        report += `### ${icon} ${issue.severity.toUpperCase()}: ${issue.section}\n\n`;
        report += `**Problem**: ${issue.message}\n\n`;
        report += `**Suggestion**: ${issue.suggestion}\n\n`;
      });
    }

    if (result.recommendations.length > 0) {
      report += '## Recommendations\n\n';
      result.recommendations.forEach(rec => {
        report += `- 💡 ${rec}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

// Made with Bob
