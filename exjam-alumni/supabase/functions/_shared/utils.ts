import { corsHeaders } from "./cors.ts";

export function createResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function createErrorResponse(error: string, status = 400, details?: any) {
  return new Response(JSON.stringify({ error, details }), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function handleOptions() {
  return new Response("ok", { headers: corsHeaders });
}

export function validateAuth(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  // Extract Bearer token
  const token = authHeader.replace("Bearer ", "");
  return token || null;
}

export function logRequest(functionName: string, method: string, data?: any) {
  console.log(
    `[${functionName}] ${method} request:`,
    data ? JSON.stringify(data, null, 2) : "no data"
  );
}
