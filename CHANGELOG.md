# Changelog

All notable changes to this project will be documented in this file.

## [2026-03-06]
### Added
- Production operation scripts for frontend lifecycle (`prod:start/stop/restart/status/logs/deploy`).
- Bilingual project documentation and tutorials.
- API reference and open-source landscape report.
- MIT license and contribution guide.

### Changed
- Product naming unified to `OpenClaw Agent Control`.
- Dashboard layout reprioritized: core display first, important modules in responsive multi-column cards.
- Status semantics clarified (`idle`, `executing`, `waiting`, `stalled`, `blocked`).
- Frontend monitor fetch switched to `cache: no-store` for fresher state.

### Fixed
- Reduced stale-state mismatch between backend data and frontend rendering.
