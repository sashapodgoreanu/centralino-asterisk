# AI Agent Audio Architecture

## Goal

Add a virtual AI agent, for example extension `6003`, that can receive call audio from Asterisk and stream it to an external AI module such as an NVIDIA Jetson.

The AI agent should not behave like a normal human WebRTC agent. Human agents register with SIP/WebRTC. The AI agent should be controlled by the backend and connected to the call through ARI.

## Recommended Architecture

```text
Browser/WebRTC Agent 6001
        |
        | SIP over WebSocket / WebRTC
        v
Asterisk
        |
        | ARI Stasis
        v
NestJS Backend
        |
        | ARI externalMedia
        v
AI Media Gateway
        |
        | PCM audio stream
        v
Jetson / STT / LLM / TTS
```

## Call Flow

```text
6001 calls 6003
    |
    v
Asterisk sends call into Stasis(telephony-app)
    |
    v
NestJS detects destination 6003 is an AI agent
    |
    v
NestJS creates an ARI bridge
    |
    v
NestJS adds caller channel to the bridge
    |
    v
NestJS creates an ARI externalMedia channel
    |
    v
Asterisk streams RTP audio to the AI Media Gateway
    |
    v
AI Media Gateway forwards decoded PCM to Jetson
    |
    v
Jetson/STT/LLM/TTS processes the audio
    |
    v
AI Media Gateway sends RTP audio back to Asterisk
```

## Protocol Between Asterisk And AI Gateway

The recommended transport between Asterisk and the AI Media Gateway is:

```text
RTP over UDP
```

Asterisk sends and receives audio using RTP packets.

```text
UDP packet
  |
  v
RTP header
  |
  v
Audio payload
```

## Audio Format

Use Asterisk codec:

```text
slin16
```

Meaning:

```text
Codec: signed linear PCM
Sample format: 16-bit signed integer
Sample rate: 16000 Hz
Channels: mono
Transport: RTP over UDP
```

This is a good default for AI/STT pipelines because many speech models accept 16 kHz mono PCM directly.

## Browser Agent Versus AI Agent

Human browser agents use WebRTC:

```text
Browser
  |
  | SIP over WSS/WS
  | DTLS-SRTP
  | Opus
  v
Asterisk
```

AI agents should use server-side RTP:

```text
Asterisk
  |
  | RTP over UDP
  | slin16 PCM
  v
AI Media Gateway
```

Asterisk handles the media translation between the WebRTC browser side and the AI gateway side.

## Why Not Register The AI Agent As SIP?

A SIP bot endpoint is possible, but ARI External Media is a better foundation for this platform because:

- the backend stays the orchestration layer
- call state stays event-driven
- routing remains API-driven
- the AI service does not need to implement SIP
- media streaming can be controlled per call
- future STT/TTS/LLM orchestration can be added behind the media gateway

## Backend Model

Possible database model:

```text
agents
  extension: 6003
  display_name: AI Agent
  type: ai

ai_agents
  agent_extension: 6003
  media_host: ai-gateway
  media_port: 40000
  codec: slin16
  sample_rate: 16000
```

## Runtime Responsibilities

### NestJS Backend

- identifies whether the destination is a human agent or AI agent
- creates ARI bridges
- creates ARI externalMedia channels
- tracks call state
- emits realtime frontend events
- decides routing/business behavior

### Asterisk

- handles SIP/WebRTC
- handles RTP/SRTP
- bridges media
- transcodes between Opus/WebRTC and slin16/RTP when needed

### AI Media Gateway

- receives RTP from Asterisk
- strips RTP headers
- extracts PCM frames
- forwards PCM to Jetson/STT
- receives PCM/TTS output
- wraps PCM back into RTP
- sends RTP back to Asterisk

### Jetson / AI Module

- receives decoded PCM audio
- runs VAD/STT/LLM/TTS or other models
- returns generated PCM audio to the AI Media Gateway

## Summary

Use this split:

```text
Human agents:
  WebRTC / SIP.js / Opus / SRTP

AI agents:
  ARI externalMedia / RTP over UDP / slin16 PCM
```

The AI agent should be a virtual backend-controlled agent, not a browser client and not necessarily a SIP endpoint.
