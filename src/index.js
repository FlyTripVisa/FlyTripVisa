/**
 * FlyTripVisa - Core Router Gateway
 * Cloudflare Workers Entry Point
 * Handles routing, middleware, and error handling
 */

import authRoutes from './api/auth.js';
import visaRoutes from './api/visa.js';
import chatRoutes from './api/chat.js';

/**
 * CORS Headers Configuration
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Authentication Middleware - Validates JWT Tokens
 */
async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return { authenticated: false, user: null };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // TODO: Implement JWT verification with your secret key
  // For now, basic validation
  if (!token || token.length < 10) {
    return { authenticated: false, user: null };
  }

  return { authenticated: true, user: { token } };
}

/**
 * CORS Handler - Preflight Requests
 */
function handleCORS(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }
  return null;
}

/**
 * Route Matcher - Maps URL patterns to handlers
 */
async function routeRequest(request, env, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // Auth Routes: /api/auth/*
  if (pathname.startsWith('/api/auth')) {
    return authRoutes(request, env, ctx);
  }

  // Visa Routes: /api/visa/*
  if (pathname.startsWith('/api/visa')) {
    return visaRoutes(request, env, ctx);
  }

  // Chat Routes: /api/chat/*
  if (pathname.startsWith('/api/chat')) {
    return chatRoutes(request, env, ctx);
  }

  // Health Check
  if (pathname === '/health' && method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // 404 - Not Found
  return new Response(JSON.stringify({ error: 'Route not found', path: pathname }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/**
 * Error Handler - Centralized error management
 */
function handleError(error, env) {
  console.error('Router Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  return new Response(
    JSON.stringify({
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
}

/**
 * Main Request Handler
 * Entry point for all Cloudflare Worker requests
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight
      const corsResponse = handleCORS(request);
      if (corsResponse) return corsResponse;

      // Route the request
      const response = await routeRequest(request, env, ctx);

      // Add CORS headers to response
      const newResponse = new Response(response.body, response);
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        if (!newResponse.headers.has(key)) {
          newResponse.headers.set(key, value);
        }
      });

      return newResponse;
    } catch (error) {
      return handleError(error, env);
    }
  },

  /**
   * Scheduled Handler - For cron jobs
   */
  async scheduled(event, env, ctx) {
    try {
      console.log('Scheduled event triggered:', event.cron);
      
      // TODO: Implement cleanup tasks, email reminders, etc.
      // Example: Clean up expired sessions, send visa expiry notifications
      
      ctx.waitUntil(
        Promise.resolve().then(() => {
          console.log('Scheduled task completed');
        })
      );
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  },
};

/**
 * Utility Functions for API handlers
 */

/**
 * Parse request body safely
 */
export async function parseJSON(request) {
  try {
    return await request.json();
  } catch (error) {
    throw { statusCode: 400, message: 'Invalid JSON payload' };
  }
}

/**
 * Validate required fields
 */
export function validateFields(data, requiredFields) {
  const missing = requiredFields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw {
      statusCode: 400,
      message: `Missing required fields: ${missing.join(', ')}`,
    };
  }
}

/**
 * Success Response Builder
 */
export function successResponse(data, statusCode = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/**
 * Error Response Builder
 */
export function errorResponse(message, statusCode = 400) {
  return new Response(
    JSON.stringify({ success: false, error: message, statusCode }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
}
