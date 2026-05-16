UPDATE ps_endpoints
SET media_address = '192.168.0.52'
WHERE transport IN ('transport-ws', 'transport-wss')
  AND webrtc = 'yes';
