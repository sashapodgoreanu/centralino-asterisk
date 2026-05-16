# centralino-asterisk

Programmable telephony platform foundation using Asterisk 22, PostgreSQL realtime
configuration over ODBC, NestJS, React, WebRTC, ARI, and AMI.

## Architecture

```text
React Frontend
        |
        | SIP over WSS
        v
Asterisk 22
        |
        | ARI + AMI
        v
NestJS Backend
        |
        v
PostgreSQL
```

Asterisk stays the SIP/media engine. The backend owns provisioning, routing,
queues, call state, APIs, and frontend events.

## Static Asterisk Configuration

The static files live in `asterisk/`:

- `modules.conf`
- `http.conf`
- `ari.conf`
- `manager.conf`
- `rtp.conf`
- `logger.conf`
- `res_odbc.conf`
- `extconfig.conf`
- `sorcery.conf`
- `pjsip.conf` for static transports only
- `extensions.conf` for the minimal `Stasis(telephony-app)` handoff

PJSIP endpoints, auths, AORs, queues, queue members, agents, tenants, and routing
data are database-driven.

## Run

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Asterisk ARI: `http://localhost:8088`
- Asterisk AMI: `localhost:5038`
- Asterisk WSS: `wss://localhost:8089/ws`
- PostgreSQL: `localhost:5432`

Seeded WebRTC agents:

```text
6001 / 6001pass
6002 / 6002pass
```

The Asterisk container generates a development TLS certificate at
`/etc/asterisk/keys/asterisk.pem` if one is not mounted.

## API Examples

Create or update a WebRTC agent:

```powershell
Invoke-RestMethod http://localhost:3000/agents `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"extension":"6003","password":"6003pass","displayName":"Agent 6003"}'
```

Create a queue:

```powershell
Invoke-RestMethod http://localhost:3000/queues `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"name":"support","strategy":"ringall"}'
```

Add a queue member:

```powershell
Invoke-RestMethod http://localhost:3000/queues/support/members `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"extension":"6001","penalty":0}'
```

## Local Builds

If your npm registry is configured for a private feed, install with an explicit
registry when needed:

```powershell
node --version

cd backend
npm install --registry=https://registry.npmjs.org/
npm run build

cd ..\frontend
npm install --registry=https://registry.npmjs.org/
npm run build
```

Validate Prisma:

```powershell
cd backend
$env:DATABASE_URL='postgresql://asterisk:asterisk@localhost:5432/asterisk?schema=public'
npx prisma validate
```

The repository pins Node `22.16.0` through `.nvmrc`, `.node-version`, and
`.tool-versions`. Use your Node selector before installing dependencies.
