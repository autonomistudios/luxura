/**
 * api/v1/docs.js
 * GET /api/v1/docs — OpenAPI 3.0 spec for LuxAura B2B API
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const spec = {
    openapi: '3.0.0',
    info: {
      title:   'LuxAura B2B API',
      version: '1.0.0',
      description: 'Sovereign AI fashion photography platform — REST API for brand integrations.',
    },
    servers: [{ url: 'https://luxaura.app/api/v1', description: 'Production' }],
    security: [{ BrandApiKey: [] }],
    components: {
      securitySchemes: {
        BrandApiKey: { type: 'apiKey', in: 'header', name: 'X-Brand-API-Key' },
        BearerAuth:  { type: 'http', scheme: 'bearer' },
      },
      schemas: {
        SKU: {
          type: 'object',
          properties: {
            skuId:            { type: 'string' },
            name:             { type: 'string' },
            skuCode:          { type: 'string' },
            category:         { type: 'string' },
            season:           { type: 'string' },
            anchorType:       { type: 'string' },
            referenceImage:   { type: 'string', format: 'uri' },
            enrollmentStatus: { type: 'string', enum: ['pending', 'processing', 'ready', 'failed', 'archived'] },
            fidelityScore:    { type: 'integer', minimum: 0, maximum: 100 },
            createdAt:        { type: 'string', format: 'date-time' },
          },
        },
        Job: {
          type: 'object',
          properties: {
            jobId:       { type: 'string' },
            status:      { type: 'string', enum: ['queued', 'processing', 'complete', 'failed'] },
            skuId:       { type: 'string' },
            results:     { type: 'object' },
            error:       { type: 'string' },
            createdAt:   { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Usage: {
          type: 'object',
          properties: {
            currentPeriodImages:   { type: 'integer' },
            currentPeriodApiCalls: { type: 'integer' },
            imagesPerMonth:        { type: 'integer' },
            apiCallsPerMonth:      { type: 'integer' },
            percentUsedImages:     { type: 'number' },
            imagesRemaining:       { type: 'integer' },
          },
        },
      },
    },
    paths: {
      '/skus/enroll': {
        post: {
          summary: 'Enroll a new SKU',
          description: 'Run Agent 01 DNA extraction and Agent 01b isolation render. Returns when enrollment is complete.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: {
              required: ['name', 'anchorType', 'sourceImage'],
              properties: {
                name:             { type: 'string' },
                skuCode:          { type: 'string' },
                category:         { type: 'string' },
                season:           { type: 'string' },
                anchorType:       { type: 'string', example: 'FULL_OUTFIT' },
                sourceImage:      { type: 'string', description: 'Base64 data URI of primary garment image' },
                additionalImages: { type: 'array', items: { type: 'string' }, maxItems: 2 },
              },
            }}},
          },
          responses: {
            '200': { description: 'Enrollment complete', content: { 'application/json': { schema: {
              properties: {
                skuId: { type: 'string' }, status: { type: 'string' }, fidelityScore: { type: 'integer' },
              },
            }}}},
          },
        },
      },
      '/skus': {
        get: {
          summary: 'List brand SKUs',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'limit',  in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: { '200': { description: 'SKU list', content: { 'application/json': { schema: {
            properties: { skus: { type: 'array', items: { $ref: '#/components/schemas/SKU' } }, total: { type: 'integer' } },
          }}}}}
        },
      },
      '/skus/{skuId}': {
        get: { summary: 'Get SKU details', responses: { '200': { description: 'SKU document' } } },
        delete: { summary: 'Archive SKU', responses: { '200': { description: 'Archived' } } },
      },
      '/forge/generate': {
        post: {
          summary: 'Generate campaign images',
          description: 'SSE stream by default. Pass async:true for job-based async generation.',
          requestBody: { required: true, content: { 'application/json': { schema: {
            properties: {
              skuId:      { type: 'string', description: 'Enrolled SKU ID — bypasses Agent 01+01b' },
              config:     { type: 'object', description: 'Forge configuration (lighting, camera, etc.)' },
              async:      { type: 'boolean', default: false },
              webhookUrl: { type: 'string', format: 'uri' },
            },
          }}}},
          responses: {
            '200': { description: 'SSE stream of { type, slot, image } events, or { jobId } if async:true' },
          },
        },
      },
      '/forge/batch': {
        post: {
          summary: 'Batch generate for multiple SKUs',
          requestBody: { required: true, content: { 'application/json': { schema: {
            required: ['skuIds'],
            properties: {
              skuIds:     { type: 'array', items: { type: 'string' }, maxItems: 10 },
              config:     { type: 'object' },
              webhookUrl: { type: 'string', format: 'uri' },
            },
          }}}},
          responses: { '200': { description: 'Batch job created', content: { 'application/json': { schema: {
            properties: { batchId: { type: 'string' }, jobs: { type: 'array' } },
          }}}}}
        },
      },
      '/jobs/{jobId}': {
        get: {
          summary: 'Poll job status',
          parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Job status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Job' } } } } },
        },
      },
      '/usage': {
        get: {
          summary: 'Get usage stats for current billing period',
          responses: { '200': { description: 'Usage data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usage' } } } } },
        },
      },
    },
  };

  if (req.query.format === 'html') {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`<!DOCTYPE html><html><head><title>LuxAura API</title>
<style>body{font-family:monospace;background:#050505;color:#fff;padding:40px;max-width:900px;margin:0 auto}
h1{font-family:serif;font-style:italic;color:#B8952A}h2{color:#B8952A;font-size:12px;letter-spacing:.4em;text-transform:uppercase;font-family:monospace}
pre{background:#0B0B0E;border:1px solid rgba(255,255,255,.08);padding:16px;border-radius:4px;overflow-x:auto;font-size:11px;color:rgba(255,255,255,.6)}
table{width:100%;border-collapse:collapse}td,th{padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.06);font-size:11px;text-align:left}
th{color:rgba(255,255,255,.3);font-size:9px;letter-spacing:.3em;text-transform:uppercase}.gold{color:#B8952A}</style></head>
<body><h1>LuxAura B2B API</h1><p style="color:rgba(255,255,255,.4);font-size:11px">v1.0.0 — Sovereign AI fashion photography</p>
<h2>Authentication</h2><pre>X-Brand-API-Key: lux_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</pre>
<h2>Endpoints</h2><table><tr><th>Method</th><th>Path</th><th>Description</th></tr>
${Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.entries(methods).map(([method, def]) =>
    `<tr><td class="gold">${method.toUpperCase()}</td><td>${path}</td><td style="color:rgba(255,255,255,.5)">${def.summary}</td></tr>`
  )
).join('')}</table>
<h2>Full Spec</h2><pre>${JSON.stringify(spec, null, 2)}</pre></body></html>`);
  }

  return res.status(200).json(spec);
}
