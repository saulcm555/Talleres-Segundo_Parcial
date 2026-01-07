# 🎯 Taller 3: MCP + Gemini AI - COMPLETADO

**Estado:** ✅ COMPLETADO Y FUNCIONANDO

---

## 📋 Resumen Ejecutivo

Se implementó exitosamente un sistema de integración entre **Model Context Protocol (MCP)** y **Google Gemini AI** para orquestar herramientas de gestión de inventario y órdenes mediante lenguaje natural.

---

## 🎯 Objetivos del Taller (Completados)

| Objetivo | Estado | Descripción |
|----------|--------|-------------|
| Implementar servidor MCP | ✅ | Servidor JSON-RPC 2.0 con 3 herramientas |
| Integrar Gemini AI | ✅ | Function Calling para decisión automática de herramientas |
| Conectar con Backend | ✅ | Comunicación REST con Products y Orders services |
| Arquitectura 3 capas | ✅ | API Gateway → MCP Server → Backend Services |

---

## 🏗️ Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USUARIO                                    │
│                    (Lenguaje Natural)                               │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Puerto 3000)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │   Gemini    │  │ MCP Client  │  │     Processor Service       │  │
│  │   Service   │◄─┤   Service   │◄─┤  (Orquestador Principal)    │  │
│  │             │  │             │  │                             │  │
│  │ - Function  │  │ - JSON-RPC  │  │ - Recibe solicitudes        │  │
│  │   Calling   │  │ - Tool Exec │  │ - Coordina Gemini + MCP     │  │
│  │ - AI Model  │  │ - Caching   │  │ - Genera respuestas         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼ JSON-RPC 2.0
┌─────────────────────────────────────────────────────────────────────┐
│                      MCP SERVER (Puerto 3004)                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Tool Registry                             │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │    │
│  │  │  buscar_    │ │  validar_   │ │     crear_orden     │    │    │
│  │  │  producto   │ │    stock    │ │                     │    │    │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Backend Client                             │    │
│  │            (Comunicación REST con servicios)                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼ REST HTTP
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                                │
│  ┌────────────────────────┐    ┌────────────────────────┐          │
│  │  Products Service      │    │   Orders Service       │          │
│  │  (Puerto 3001)         │    │   (Puerto 3002)        │          │
│  │                        │    │                        │          │
│  │  GET /products         │    │  POST /orders          │          │
│  │  GET /products/search  │    │  GET /orders/:id       │          │
│  │  GET /products/:id     │    │                        │          │
│  │  GET /products/:id/stock│   │                        │          │
│  │                        │    │                        │          │
│  │  [SQLite Database]     │    │  [SQLite Database]     │          │
│  └────────────────────────┘    └────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Archivos Creados

### MCP Server (`mcp-server/`)

```
mcp-server/
├── package.json              # Dependencias del servidor
├── tsconfig.json             # Configuración TypeScript
├── .env                      # Variables de entorno
└── src/
    ├── server.ts             # Servidor Express + JSON-RPC 2.0
    ├── services/
    │   └── backend-client.ts # Cliente HTTP para backend
    └── tools/
        ├── registry.ts       # Registro de herramientas
        ├── buscar-producto.tool.ts   # Tool: buscar_producto
        ├── validar-stock.tool.ts     # Tool: validar_stock
        └── crear-orden.tool.ts       # Tool: crear_orden
```

### API Gateway - Módulos Nuevos (`api-gateway/src/`)

```
api-gateway/src/
├── gemini/
│   ├── gemini.module.ts      # Módulo Gemini
│   └── gemini.service.ts     # Servicio Gemini AI + Function Calling
├── mcp-client/
│   ├── mcp-client.module.ts  # Módulo MCP Client
│   └── mcp-client.service.ts # Cliente JSON-RPC para MCP Server
└── processor/
    ├── processor.module.ts   # Módulo Processor
    ├── processor.controller.ts # Endpoints /api/procesar, /api/tools, /api/health
    └── processor.service.ts  # Orquestador principal
```

---

## 🔧 Herramientas MCP Implementadas

### 1. `buscar_producto`

**Descripción:** Busca productos en el inventario por nombre o descripción.

**Parámetros:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| query | string | ✅ | Término de búsqueda |

**Ejemplo de uso:**
```
Usuario: "Busca productos que contengan laptop"
Gemini: Llama buscar_producto({ query: "laptop" })
Resultado: Lista de productos encontrados
```

**Archivo:** `mcp-server/src/tools/buscar-producto.tool.ts`

---

### 2. `validar_stock`

**Descripción:** Verifica si hay suficiente stock disponible de un producto.

**Parámetros:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| productId | string | ✅ | ID UUID del producto |
| quantity | number | ✅ | Cantidad a validar |

**Ejemplo de uso:**
```
Usuario: "Valida si hay 5 unidades del producto X"
Gemini: Llama validar_stock({ productId: "uuid", quantity: 5 })
Resultado: Confirmación de disponibilidad
```

**Archivo:** `mcp-server/src/tools/validar-stock.tool.ts`

---

### 3. `crear_orden`

**Descripción:** Crea una nueva orden de compra.

**Parámetros:**
| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| productId | string | ✅ | ID UUID del producto |
| quantity | number | ✅ | Cantidad a ordenar |

**Ejemplo de uso:**
```
Usuario: "Crea una orden de 2 laptops"
Gemini: 
  1. Llama validar_stock (automáticamente)
  2. Llama crear_orden({ productId: "uuid", quantity: 2 })
Resultado: Orden creada con ID único
```

**Archivo:** `mcp-server/src/tools/crear-orden.tool.ts`

---

## 🔄 Flujo de Funcionamiento

### Paso a paso de una solicitud:

```
1. Usuario envía mensaje en lenguaje natural
   POST /api/procesar { message: "Busca laptops" }
   
2. ProcessorService recibe la solicitud
   - Obtiene tools disponibles del MCP Server
   - Convierte tools al formato Gemini
   
3. GeminiService analiza con Function Calling
   - Gemini decide qué herramienta usar
   - Retorna: functionCalls: [{ name: "buscar_producto", args: { query: "laptop" } }]
   
4. ProcessorService ejecuta las herramientas
   - Llama a McpClientService.callTool()
   - McpClientService envía JSON-RPC al MCP Server
   
5. MCP Server ejecuta la herramienta
   - Busca en ToolRegistry
   - BackendClient hace GET a Products Service
   - Retorna resultado formateado
   
6. ProcessorService envía resultado a Gemini
   - Gemini genera respuesta en lenguaje natural
   - Si necesita más tools, repite el ciclo
   
7. Respuesta final al usuario
   { success: true, response: "Encontré 1 laptop...", toolsUsed: ["buscar_producto"] }
```

---

## 📡 Endpoints API

### API Gateway (Puerto 3000)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/procesar` | Procesa solicitud con Gemini + MCP |
| GET | `/api/tools` | Lista herramientas disponibles |
| GET | `/api/health` | Estado del sistema |

### MCP Server (Puerto 3004)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/rpc` | Endpoint JSON-RPC 2.0 |
| GET | `/health` | Estado del servidor |

---

## ⚙️ Configuración

### Variables de Entorno

**API Gateway (`.env`):**
```env
PORT=3000
MCP_SERVER_URL=http://localhost:3004
GEMINI_API_KEY=tu-api-key-de-gemini
GEMINI_MODEL=gemini-2.5-flash
```

**MCP Server (`.env`):**
```env
PORT=3004
PRODUCTS_SERVICE_URL=http://localhost:3001
ORDERS_SERVICE_URL=http://localhost:3002
```

---

## 🧪 Cómo Probar el Sistema


### Paso 1: Detener procesos existentes

```powershell
taskkill /F /IM node.exe 2>$null; Start-Sleep -Seconds 2; Write-Host "Listo"
```

### Paso 2: Iniciar los 4 servicios (en terminales separadas)

**Terminal 1 - MCP Server:**
```powershell
cd "c:\Users\Lilibeth\Desktop\EVENT-DRIVEN---WEBHOOKS-Y-SERVERLESS---PRACTICA\Taller_Arquitectura_Microservicios\mcp-server"
npm run dev
```

**Terminal 2 - Products Service:**
```powershell
cd "c:\Users\Lilibeth\Desktop\EVENT-DRIVEN---WEBHOOKS-Y-SERVERLESS---PRACTICA\Taller_Arquitectura_Microservicios\products-service"
npm run start:dev
```

**Terminal 3 - Orders Service:**
```powershell
cd "c:\Users\Lilibeth\Desktop\EVENT-DRIVEN---WEBHOOKS-Y-SERVERLESS---PRACTICA\Taller_Arquitectura_Microservicios\orders-service"
npm run start:dev
```

**Terminal 4 - API Gateway:**
```powershell
cd "c:\Users\Lilibeth\Desktop\EVENT-DRIVEN---WEBHOOKS-Y-SERVERLESS---PRACTICA\Taller_Arquitectura_Microservicios\api-gateway"
npm run start:dev
```

### Paso 3: Verificar que todo esté corriendo

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/health" | ConvertTo-Json
```

**Resultado esperado:**
```json
{
   "status": "ok",
   "service": "api-gateway-processor",
   "mcpServer": "connected",
   "toolsAvailable": 3
}
```

### Paso 4: Cargar productos de prueba (solo primera vez)

```powershell
cd "c:\Users\Lilibeth\Desktop\EVENT-DRIVEN---WEBHOOKS-Y-SERVERLESS---PRACTICA\Taller_Arquitectura_Microservicios\products-service"
npx ts-node src/seed.ts
```

---

## 🖥️ Probar con la Interfaz de Chat en Terminal (CLI)

Ahora puedes interactuar con el sistema de forma conversacional usando la interfaz de chat en terminal:

### Paso 5: Ejecutar la interfaz de chat

En una terminal nueva, desde la raíz del proyecto:

```powershell
cd "c:\Users\Lilibeth\Desktop\EVENT-DRIVEN---WEBHOOKS-Y-SERVERLESS---PRACTICA\Taller_Arquitectura_Microservicios"
node cli-chat.js
```

Verás un prompt donde puedes escribir preguntas en lenguaje natural y recibir respuestas del sistema, usando Gemini + MCP + backend.

---

## 💬 Ejemplos de Preguntas para Probar

Puedes probar con las siguientes preguntas/conversaciones:

- "Hola, ¿qué puedes hacer?"
- "¿Qué productos tienes disponibles?"
- "Busca productos que contengan laptop"
- "¿Cuántas laptops hay en stock?"
- "Valida si hay 5 unidades disponibles de la laptop"
- "Crea una orden de 2 unidades de Laptop"
- "Quiero comprar 3 monitores, ¿hay stock?"
- "Muéstrame los productos con la palabra 'mouse'"
- "Haz una orden de 1 teclado y 2 mouse" *(el sistema solo permite un producto por orden, pero puedes probar la respuesta)*
- "¿Cuáles son las herramientas disponibles?"
- "¿Puedes validar el stock del producto X?"
- "¿Puedes crear una orden para el producto Y?"

Puedes escribir cualquier pregunta relacionada con productos, stock u órdenes, y el sistema decidirá automáticamente qué herramientas usar.

---

## 🧪 Pruebas Avanzadas (opcional)

Si prefieres seguir usando PowerShell para pruebas directas a la API, puedes usar los siguientes ejemplos:

#### Test 1: Saludo simple (sin herramientas)
```powershell
$body = '{"message": "Hola"}'; Invoke-RestMethod -Uri "http://localhost:3000/api/procesar" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```

#### Test 2: Buscar productos (herramienta buscar_producto)
```powershell
$body = '{"message": "Busca productos que contengan laptop"}'; Invoke-RestMethod -Uri "http://localhost:3000/api/procesar" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

#### Test 3: Validar stock (herramienta validar_stock)
```powershell
$body = '{"message": "Valida si hay 5 unidades disponibles de la laptop"}'; Invoke-RestMethod -Uri "http://localhost:3000/api/procesar" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

#### Test 4: Crear orden (herramientas validar_stock + crear_orden)
```powershell
$body = '{"message": "Crea una orden de 2 unidades de Laptop"}'; Invoke-RestMethod -Uri "http://localhost:3000/api/procesar" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

#### Test 5: Ver herramientas disponibles
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tools" | ConvertTo-Json -Depth 5
```

---

## 📊 Ejemplo de Respuesta Exitosa

```json
{
  "success": true,
  "response": "¡Claro! He creado la orden para el producto Laptop con una cantidad de 2 unidades.\n\nDetalles:\n- ID de Orden: c178a9ac-3bad-43a2-b8a0-9cb5442535b5\n- Estado: PENDING",
  "toolsUsed": ["validar_stock", "crear_orden"],
  "executionLog": [
    { "step": 1, "type": "user_input", "data": {...} },
    { "step": 2, "type": "ai_decision", "data": { "hasFunctionCalls": true, "functionCalls": [...] } },
    { "step": 3, "type": "tool_call", "data": { "name": "validar_stock", "args": {...} } },
    { "step": 4, "type": "tool_result", "data": { "success": true, "result": "..." } },
    { "step": 5, "type": "ai_decision", "data": { "hasFunctionCalls": true, "functionCalls": [...] } },
    { "step": 6, "type": "tool_call", "data": { "name": "crear_orden", "args": {...} } },
    { "step": 7, "type": "tool_result", "data": { "success": true, "result": "..." } },
    { "step": 8, "type": "ai_response", "data": { "response": "..." } }
  ]
}
```

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|------------|-----|
| **NestJS** | API Gateway, Products Service, Orders Service |
| **Express** | MCP Server |
| **TypeScript** | Todos los servicios |
| **Google Gemini AI** | Function Calling, generación de respuestas |
| **JSON-RPC 2.0** | Protocolo de comunicación MCP |
| **Axios** | Cliente HTTP |
| **TypeORM + SQLite** | Persistencia de datos |

---

## ✅ Checklist de Completado

- [x] Servidor MCP con JSON-RPC 2.0
- [x] 3 herramientas (buscar_producto, validar_stock, crear_orden)
- [x] Integración con Gemini AI Function Calling
- [x] Cliente MCP en API Gateway
- [x] Procesador que orquesta Gemini + MCP
- [x] Endpoints REST funcionales
- [x] Comunicación con backend services
- [x] Manejo de errores
- [x] Logging detallado
- [x] Respuestas en español
- [x] Documentación completa

---

## 🎉 Conclusión

El Taller 3 de MCP + Gemini AI está **100% completado y funcional**. El sistema permite:

1. **Interacción en lenguaje natural** - El usuario escribe lo que necesita
2. **Decisión inteligente de herramientas** - Gemini decide qué tools usar
3. **Ejecución automática** - El sistema ejecuta las herramientas necesarias
4. **Respuestas contextuales** - Gemini genera respuestas amigables con los resultados

El flujo demuestra el poder de combinar **IA generativa** con **herramientas estructuradas** mediante el protocolo MCP.
