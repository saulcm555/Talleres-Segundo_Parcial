import { Injectable, Logger } from '@nestjs/common';
import { McpClientService, Tool } from '../mcp-client/mcp-client.service';
import { GeminiService, FunctionCall } from '../gemini/gemini.service';
import { Tool as GeminiTool } from '@google/generative-ai';

export interface ProcessResult {
  success: boolean;
  response: string;
  toolsUsed: string[];
  executionLog: ExecutionStep[];
}

export interface ExecutionStep {
  step: number;
  type: 'user_input' | 'ai_decision' | 'tool_call' | 'tool_result' | 'ai_response';
  data: any;
  timestamp: string;
}

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);
  private readonly MAX_ITERATIONS = 10; // Prevenir loops infinitos

  constructor(
    private readonly mcpClient: McpClientService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Procesa una solicitud del usuario utilizando Gemini y MCP Tools
   */
  async processRequest(message: string, context?: string): Promise<ProcessResult> {
    const executionLog: ExecutionStep[] = [];
    const toolsUsed: string[] = [];
    let iteration = 0;

    // Step 1: Registrar input del usuario
    this.addStep(executionLog, 'user_input', { message, context });
    this.logger.log(`Processing request: "${message}"`);

    try {
      // Step 2: Obtener Tools disponibles del MCP Server
      const mcpTools = await this.mcpClient.listTools();
      this.logger.log(`Loaded ${mcpTools.length} tools from MCP Server`);

      // Step 3: Convertir Tools al formato Gemini
      const geminiTools = this.geminiService.convertToolsToGeminiFormat(mcpTools);

      // Step 4: Construir el prompt con contexto del sistema
      const systemPrompt = this.buildSystemPrompt(mcpTools);
      const fullPrompt = context 
        ? `${systemPrompt}\n\nContexto adicional: ${context}\n\nSolicitud del usuario: ${message}`
        : `${systemPrompt}\n\nSolicitud del usuario: ${message}`;

      // Step 5: Enviar a Gemini
      let history: any[] = [];
      let response = await this.geminiService.generateWithTools(fullPrompt, geminiTools, history);

      this.addStep(executionLog, 'ai_decision', {
        hasFunctionCalls: response.hasFunctionCalls,
        functionCalls: response.functionCalls,
        text: response.text,
      });

      // Step 6: Loop de ejecución de Tools
      while (response.hasFunctionCalls && iteration < this.MAX_ITERATIONS) {
        iteration++;
        this.logger.log(`Iteration ${iteration}: Executing ${response.functionCalls?.length} tool(s)`);

        // Ejecutar cada Tool que Gemini decidió usar
        const toolResults: { name: string; response: any }[] = [];

        for (const functionCall of response.functionCalls || []) {
          this.addStep(executionLog, 'tool_call', {
            name: functionCall.name,
            args: functionCall.args,
          });

          try {
            const result = await this.mcpClient.callTool(functionCall.name, functionCall.args);
            
            toolResults.push({
              name: functionCall.name,
              response: result,
            });

            toolsUsed.push(functionCall.name);

            this.addStep(executionLog, 'tool_result', {
              name: functionCall.name,
              success: true,
              result,
            });

            this.logger.log(`Tool ${functionCall.name} executed successfully`);
          } catch (error) {
            const errorResult = {
              error: true,
              message: error.message,
            };

            toolResults.push({
              name: functionCall.name,
              response: errorResult,
            });

            this.addStep(executionLog, 'tool_result', {
              name: functionCall.name,
              success: false,
              error: error.message,
            });

            this.logger.error(`Tool ${functionCall.name} failed: ${error.message}`);
          }
        }

        // Actualizar historial para Gemini
        history = this.buildHistory(fullPrompt, response.functionCalls || [], toolResults);

        // Continuar conversación con resultados de Tools
        response = await this.geminiService.continueWithToolResults(
          geminiTools,
          history,
          toolResults,
        );

        this.addStep(executionLog, 'ai_decision', {
          hasFunctionCalls: response.hasFunctionCalls,
          functionCalls: response.functionCalls,
          text: response.text,
        });
      }

      // Step 7: Obtener respuesta final
      const finalResponse = response.text || 'No pude generar una respuesta.';

      this.addStep(executionLog, 'ai_response', { response: finalResponse });

      this.logger.log(`Request processed successfully. Tools used: ${toolsUsed.join(', ') || 'none'}`);

      return {
        success: true,
        response: finalResponse,
        toolsUsed: [...new Set(toolsUsed)], // Eliminar duplicados
        executionLog,
      };
    } catch (error) {
      this.logger.error(`Error processing request: ${error.message}`);
      
      return {
        success: false,
        response: `Error procesando la solicitud: ${error.message}`,
        toolsUsed,
        executionLog,
      };
    }
  }

  /**
   * Construye el prompt del sistema con información de los Tools disponibles
   */
  private buildSystemPrompt(tools: Tool[]): string {
    const toolDescriptions = tools
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    return `Eres un asistente inteligente para un sistema de gestión de inventario y órdenes.
Tienes acceso a las siguientes herramientas:

${toolDescriptions}

INSTRUCCIONES:
1. Analiza la solicitud del usuario y decide qué herramientas usar.
2. Si necesitas información de productos, usa "buscar_producto" primero.
3. Antes de crear una orden, SIEMPRE valida el stock con "validar_stock".
4. Proporciona respuestas claras y útiles en español.
5. Si ocurre un error, explica el problema de manera comprensible.

Responde siempre en español de manera amigable y profesional.`;
  }

  /**
   * Construye el historial de conversación para Gemini
   */
  private buildHistory(
    userPrompt: string,
    functionCalls: FunctionCall[],
    toolResults: { name: string; response: any }[],
  ): any[] {
    const history: any[] = [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
      {
        role: 'model',
        parts: functionCalls.map(fc => ({
          functionCall: {
            name: fc.name,
            args: fc.args,
          },
        })),
      },
    ];

    // Agregar resultados de funciones - response DEBE ser un objeto, no string
    const functionResponseParts = toolResults.map(tr => {
      // Asegurar que response sea siempre un objeto
      let responseObj: object;
      if (typeof tr.response === 'string') {
        responseObj = { message: tr.response };
      } else if (typeof tr.response === 'object' && tr.response !== null) {
        responseObj = tr.response;
      } else {
        responseObj = { value: tr.response };
      }

      return {
        functionResponse: {
          name: tr.name,
          response: responseObj,
        },
      };
    });

    history.push({
      role: 'function',
      parts: functionResponseParts,
    });

    return history;
  }

  /**
   * Agrega un paso al log de ejecución
   */
  private addStep(
    log: ExecutionStep[],
    type: ExecutionStep['type'],
    data: any,
  ): void {
    log.push({
      step: log.length + 1,
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Obtiene la lista de Tools disponibles (para debugging)
   */
  async getAvailableTools(): Promise<Tool[]> {
    return this.mcpClient.listTools();
  }
}
