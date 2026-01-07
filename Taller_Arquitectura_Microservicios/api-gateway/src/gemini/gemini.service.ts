import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Tool } from '../mcp-client/mcp-client.service';

export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface GeminiResponse {
  text?: string;
  functionCalls?: FunctionCall[];
  hasFunctionCalls: boolean;
}

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
      this.logger.warn('GEMINI_API_KEY not configured. AI features will be disabled.');
      return;
    }

    // Modelo configurable via .env (por defecto usa gemini-1.5-pro para usuarios Pro)
    const modelName = this.configService.get<string>('GEMINI_MODEL', 'gemini-1.5-pro');

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
    });

    this.logger.log(`Gemini AI initialized with model: ${modelName}`);
  }

  /**
   * Convierte Tools del formato MCP al formato Gemini
   */
  convertToolsToGeminiFormat(mcpTools: Tool[]): any[] {
    const functionDeclarations = mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: this.convertProperties(tool.inputSchema.properties),
        required: tool.inputSchema.required,
      },
    }));

    return [{ functionDeclarations }];
  }

  /**
   * Convierte las propiedades del schema MCP al formato Gemini
   */
  private convertProperties(properties: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      converted[key] = {
        type: this.mapType(value.type),
        description: value.description,
      };
    }
    
    return converted;
  }

  /**
   * Mapea tipos de JSON Schema a tipos de Gemini
   */
  private mapType(type: string): SchemaType {
    switch (type) {
      case 'string':
        return SchemaType.STRING;
      case 'number':
      case 'integer':
        return SchemaType.NUMBER;
      case 'boolean':
        return SchemaType.BOOLEAN;
      case 'array':
        return SchemaType.ARRAY;
      case 'object':
        return SchemaType.OBJECT;
      default:
        return SchemaType.STRING;
    }
  }

  /**
   * Genera contenido con Gemini, incluyendo Function Calling
   */
  async generateWithTools(
    prompt: string,
    tools: any[],
    history: any[] = [],
  ): Promise<GeminiResponse> {
    if (!this.model) {
      throw new Error('Gemini AI not initialized. Please configure GEMINI_API_KEY.');
    }

    try {
      const chat = this.model.startChat({
        tools,
        history,
      });

      const result = await chat.sendMessage(prompt);
      const response = result.response;
      
      // Verificar si hay function calls
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        this.logger.log(`Gemini decided to call ${functionCalls.length} function(s)`);
        return {
          functionCalls: functionCalls.map((fc: any) => ({
            name: fc.name,
            args: fc.args,
          })),
          hasFunctionCalls: true,
        };
      }

      // Si no hay function calls, retornar el texto
      return {
        text: response.text(),
        hasFunctionCalls: false,
      };
    } catch (error) {
      this.logger.error('Error generating with Gemini', error);
      throw error;
    }
  }

  /**
   * Continúa la conversación después de ejecutar tools
   */
  async continueWithToolResults(
    tools: any[],
    history: any[],
    toolResults: { name: string; response: any }[],
  ): Promise<GeminiResponse> {
    if (!this.model) {
      throw new Error('Gemini AI not initialized. Please configure GEMINI_API_KEY.');
    }

    try {
      const chat = this.model.startChat({
        tools,
        history,
      });

      // Enviar los resultados de las herramientas
      // IMPORTANTE: response DEBE ser un objeto, no un string
      const functionResponses = toolResults.map(tr => {
        let responseObj: object;
        if (typeof tr.response === 'string') {
          responseObj = { message: tr.response };
        } else if (typeof tr.response === 'object' && tr.response !== null) {
          responseObj = tr.response;
        } else {
          responseObj = { value: String(tr.response) };
        }

        return {
          functionResponse: {
            name: tr.name,
            response: responseObj,
          },
        };
      });

      const result = await chat.sendMessage(functionResponses);
      const response = result.response;

      // Verificar si Gemini quiere llamar más funciones
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        return {
          functionCalls: functionCalls.map((fc: any) => ({
            name: fc.name,
            args: fc.args,
          })),
          hasFunctionCalls: true,
        };
      }

      return {
        text: response.text(),
        hasFunctionCalls: false,
      };
    } catch (error) {
      this.logger.error('Error continuing with tool results', error);
      throw error;
    }
  }

  /**
   * Genera una respuesta simple sin tools
   */
  async generateSimple(prompt: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI not initialized. Please configure GEMINI_API_KEY.');
    }

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}
