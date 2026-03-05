# Open-source Landscape (Agent Ops / Observability)

As of 2026-03-06, the following projects are strong references for product direction, repository structure, and community signals.

## Snapshot Table

| Project | Focus | GitHub Signals (approx) | Why it matters |
|---|---|---:|---|
| [microsoft/autogen](https://github.com/microsoft/autogen) | Multi-agent framework | ~53k stars, active discussions | Strong agent orchestration ecosystem and docs discipline |
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | Agent crews/workflows | ~34k stars | Practical workflow-first framing for users |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | Stateful agent graphs | ~16k stars | Good pattern for stateful execution and control flow |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | LLM observability | ~13k stars | Excellent observability UX and product positioning |
| [Arize-ai/phoenix](https://github.com/Arize-ai/phoenix) | AI tracing/eval | ~13k stars | Clear benchmark for trace + quality analysis features |
| [Signoz/signoz](https://github.com/SigNoz/signoz) | Open-source APM | ~23k stars | Mature OSS dashboard/documentation patterns |
| [helicone/helicone](https://github.com/helicone/helicone) | LLM monitoring gateway | ~4k stars | Good example of API-first monitoring posture |
| [openlit/openlit](https://github.com/openlit/openlit) | Open telemetry for LLM apps | ~2k stars | Lightweight integration patterns worth borrowing |

## What to learn for this repository
- README first screen should answer "what it solves" and "how to run in 3 minutes".
- Keep docs split by audience: operator guide, developer guide, API reference.
- Add operational scripts and troubleshooting before deep architecture details.
- Show explicit status semantics to avoid ambiguity in incident handling.
- Keep a clear changelog and contribution path for outside collaborators.

## Action list applied in this repo
- Added bilingual README and tutorials.
- Added API reference and changelog.
- Added MIT license and contribution guide.
- Clarified status semantics and startup commands.

## Note
GitHub metrics are approximate and should be rechecked periodically.
