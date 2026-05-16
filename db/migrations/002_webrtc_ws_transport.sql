UPDATE ps_endpoints
SET transport = 'transport-ws'
WHERE id IN ('6001', '6002')
  AND transport = 'transport-wss';

