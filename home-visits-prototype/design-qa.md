# Design QA

source visual truth path: `/Users/xiaoguoba/Desktop/petcare/design-qa-implementation-desktop.png` plus the Home Visits-only brief in the current task.
implementation screenshot path: unavailable — the in-app browser could not reconnect to the local Vite preview after the server was started.
viewport: intended desktop 1440 × 1024.
source and implementation pixel dimensions: source screenshot is 1280 × 1440; implementation capture unavailable.
density normalization: not performed because the implementation capture was blocked.
state: Home Visits flow after care type selection, starting at Pets.

## Comparison evidence

Full-view comparison: blocked. The source capture is the current PetNido visual language; the prototype is a redesigned Home Visits-only flow with six clickable states.

Focused-region comparison: blocked. The browser preview could not be captured in the current browser session.

## Findings

- [P2] Browser-rendered verification is blocked.
  Location: local preview at `http://127.0.0.1:4173/`.
  Evidence: the prototype build succeeds, but the in-app browser reports a local connection/policy block when reconnecting to the preview.
  Impact: visual spacing, responsive behavior, and click-through states still need a live browser pass.
  Fix: reopen the local preview in a browser session that can access the running Vite server, then capture the six states and rerun QA.

## Implementation checklist

- Confirm the progress rail moves through Pets → Dates & visits → Care plan → Area → Budget → Preview.
- Confirm edits update the right-hand request snapshot.
- Confirm Save & exit, task toggles, budget modes, and Preview edit links respond.
- Capture the desktop preview and test one narrow responsive breakpoint.

final result: blocked
