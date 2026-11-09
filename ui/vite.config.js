import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {
  createServiceNowRequest,
  listServiceNowRequests,
  testServiceNowConnection,
  testServiceNowSchema,
  testServiceNowCmdb,
  testServiceNowWorkNotes,
  testServiceNowE2E,
  getItsmDashboardOverview,
  getLiveEngineeringRequests,
  updateTicketWorkNotes,
  autoAssignTicket,
  discoverLlmModels,
  testLlmConfiguration,
  generateLlmCompletion,
  updateTicketStateAndComments,
  evaluateTicketWithAi
} from './serverSnowClient.js';

function snowApiPlugin() {
  return {
    name: 'snow-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/snow/list') {
          try {
            const data = await listServiceNowRequests(15);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, records: data }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        if (req.url === '/api/snow/create' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await createServiceNowRequest(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, result }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/snow/batch-generate' && req.method === 'POST') {
          try {
            const samples = [
              {
                short_description: 'Restart Print Spooler Service on PRD-APP-SRV01',
                description: 'Service Request to perform clean restart of Print Spooler service.',
                procedureId: 'PROC-WIN-001',
                targetCi: 'PRD-APP-SRV01',
                parameters: { ServiceName: 'Spooler', TargetHost: 'PRD-APP-SRV01' }
              },
              {
                short_description: 'Active Directory User Account Unlock & MFA Reset',
                description: 'Service Request to unlock locked Active Directory account for finance user.',
                procedureId: 'PROC-IAM-002',
                targetCi: 'DC01.corp.internal',
                parameters: { UserPrincipalName: 'claire.daniels@corp.yash.com', JustificationCode: 'INC-ACCOUNT-LOCKED' }
              },
              {
                short_description: 'Linux Filesystem Clean & Log Truncate on PRD-LNX-AP02',
                description: 'Clean /var/log when threshold exceeds 85% disk utilization.',
                procedureId: 'PROC-LNX-003',
                targetCi: 'PRD-LNX-AP02',
                parameters: { TargetHost: 'PRD-LNX-AP02', ThresholdPercent: '85' }
              },
              {
                short_description: 'Restart IIS Web Service W3SVC on PRD-WEB-02',
                description: 'Clean restart of IIS Web Publishing Service.',
                procedureId: 'PROC-WIN-001',
                targetCi: 'PRD-WEB-02',
                parameters: { ServiceName: 'W3SVC', TargetHost: 'PRD-WEB-02' }
              },
              {
                short_description: 'INCOMPLETE: Web Service Restart (Missing Service Name)',
                description: 'Sample request intentionally submitted without mandatory ServiceName to test Missing Information Engine.',
                procedureId: 'PROC-WIN-001',
                targetCi: 'PRD-APP-SRV01',
                parameters: { TargetHost: 'PRD-APP-SRV01' }
              }
            ];

            const created = [];
            for (const sample of samples) {
              const resObj = await createServiceNowRequest(sample);
              created.push(resObj);
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: created.length, results: created }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        // --- DIAGNOSTIC TEST ENDPOINTS ---
        if (req.url === '/api/snow/test-connection' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await testServiceNowConnection(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/snow/test-schema' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await testServiceNowSchema(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/snow/test-cmdb' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await testServiceNowCmdb(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/snow/test-worknotes' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await testServiceNowWorkNotes(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/snow/test-e2e' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await testServiceNowE2E(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/snow/itsm-overview') {
          try {
            const overview = await getItsmDashboardOverview();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(overview));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        if (req.url === '/api/snow/live-engineering-requests') {
          try {
            const data = await getLiveEngineeringRequests();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        if (req.url === '/api/snow/update-worknote' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await updateTicketWorkNotes(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/snow/auto-assign' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await autoAssignTicket(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/llm/discover' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await discoverLlmModels(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/llm/test' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await testLlmConfiguration(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/snow/update-ticket-state-comments' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await updateTicketStateAndComments(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/llm/evaluate-ticket' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await evaluateTicketWithAi(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/llm/generate' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await generateLlmCompletion(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), snowApiPlugin()],
});
