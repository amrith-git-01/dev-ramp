/**
 * WatsonX AI Client
 * 
 * Handles communication with IBM watsonx.ai for content generation
 */

import * as https from 'https';

interface WatsonXConfig {
  apiKey: string;
  projectId: string;
  modelId?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

interface GenerationParams {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

interface WatsonXResponse {
  results: Array<{
    generated_text: string;
    generated_token_count: number;
    input_token_count: number;
  }>;
}

export class WatsonXClient {
  private config: Required<WatsonXConfig>;
  private baseUrl = 'https://us-south.ml.cloud.ibm.com';

  constructor(config: WatsonXConfig) {
    this.config = {
      apiKey: config.apiKey,
      projectId: config.projectId,
      modelId: config.modelId || 'ibm/granite-13b-chat-v2',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7,
      topP: config.topP || 0.9,
    };
  }

  /**
   * Generate text using watsonx.ai
   */
  async generate(params: GenerationParams): Promise<string> {
    const requestBody = {
      input: params.prompt,
      parameters: {
        max_new_tokens: params.maxTokens || this.config.maxTokens,
        temperature: params.temperature || this.config.temperature,
        top_p: params.topP || this.config.topP,
        stop_sequences: params.stopSequences || [],
      },
      model_id: this.config.modelId,
      project_id: this.config.projectId,
    };

    try {
      const response = await this.makeRequest('/ml/v1/text/generation?version=2023-05-29', requestBody);
      
      if (response.results && response.results.length > 0 && response.results[0]) {
        return response.results[0].generated_text.trim();
      }
      
      throw new Error('No results returned from watsonx.ai');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`WatsonX generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate text with streaming (for future enhancement)
   */
  async generateStream(params: GenerationParams): Promise<AsyncGenerator<string>> {
    // Placeholder for streaming implementation
    const result = await this.generate(params);
    
    async function* streamGenerator() {
      yield result;
    }
    
    return streamGenerator();
  }

  /**
   * Make HTTP request to watsonx.ai API
   */
  private makeRequest(endpoint: string, body: unknown): Promise<WatsonXResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const postData = JSON.stringify(body);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const response = JSON.parse(data) as WatsonXResponse;
              resolve(response);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Test connection to watsonx.ai
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generate({
        prompt: 'Test connection',
        maxTokens: 10,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create WatsonX client from environment variables
 */
export function createWatsonXClient(): WatsonXClient {
  const apiKey = process.env['WATSONX_API_KEY'];
  const projectId = process.env['WATSONX_PROJECT_ID'];

  if (!apiKey || !projectId) {
    throw new Error('WATSONX_API_KEY and WATSONX_PROJECT_ID environment variables are required');
  }

  return new WatsonXClient({
    apiKey,
    projectId,
    modelId: process.env['WATSONX_MODEL_ID'],
    maxTokens: process.env['WATSONX_MAX_TOKENS'] ? parseInt(process.env['WATSONX_MAX_TOKENS'], 10) : undefined,
    temperature: process.env['WATSONX_TEMPERATURE'] ? parseFloat(process.env['WATSONX_TEMPERATURE']) : undefined,
    topP: process.env['WATSONX_TOP_P'] ? parseFloat(process.env['WATSONX_TOP_P']) : undefined,
  });
}

// Made with Bob
