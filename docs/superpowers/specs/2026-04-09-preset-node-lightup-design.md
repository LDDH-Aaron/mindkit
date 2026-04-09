# Preset Node Light-up Effect Design

## Goal

Preset nodes (from forkProfiles) appear as gray, unconnected stars in the topology canvas when a Kit is created from a template. When AI activates a preset by calling `stello_create_session` with a matching profile, the node "lights up" — moving to its actual parent position, connecting with an edge, and becoming fully interactive.

## Architecture

Pure MindKit implementation. No changes to Stello core (TopologyNode, SessionMeta, SessionTreeNode remain untouched). Preset nodes are virtual frontend constructs merged into the topology rendering pipeline.

## Constraints

- Stello core is read-only for this feature
- Inactive preset nodes are not clickable (no early activation)
- Activation is AI-driven via `stello_create_session` with a profile parameter

---

## 1. Server: Profile Activation Mapping

### Data Model

Add `activatedPresets` to `SpaceMeta`:

```typescript
interface SpaceMeta {
  // ... existing fields
  activatedPresets?: Record<string, string>  // profileName → sessionId
}
```

### Write Timing

In `space-factory.ts`, when the Engine emits a `session_created` (or `node_forked`) event and the created session used a registered ForkProfile, write the mapping:

```
activatedPresets[profileName] = sessionId
```

Persist to `meta.json`.

### API Exposure

`activatedPresets` is already part of SpaceMeta, which is returned by the spaces API. No new endpoint needed. The topology endpoint remains unchanged.

---

## 2. Frontend: Virtual Node Merging

### TopoNode Type Extension

Extend the existing `status` field:

```typescript
export interface TopoNode {
  // ... existing fields
  status: 'active' | 'archived' | 'inactive'  // 'inactive' is new
  presetName?: string  // only for inactive virtual nodes
}
```

### Merge Logic (KitWorkspace)

After `flattenTree()` produces the real topology nodes:

1. Get `presetSessions` from SpaceMeta
2. Get `activatedPresets` from SpaceMeta
3. For each preset:
   - If `activatedPresets[preset.name]` exists → the real node is already in the tree, skip
   - Otherwise → create a virtual `TopoNode`:
     - `id`: `preset:${preset.name}` (prefix to avoid collision with real session IDs)
     - `parentId`: `null` (no connection)
     - `status`: `'inactive'`
     - `turns`: `0`
     - `children`: `[]`
     - `label`: `preset.label`
     - `presetName`: `preset.name`

---

## 3. TopologyCanvas: Rendering Inactive Nodes

### Layout

- Inactive nodes do NOT participate in BFS concentric ring layout
- Positioned on an outer ring at a fixed radius beyond the real topology
- Angles evenly distributed among inactive nodes

### Visual Style

| Property | Inactive | Active (existing) |
|----------|----------|-------------------|
| Color | Gray (`#4B5563`) | Purple/Green/Indigo |
| Size | 4px base | 6-18px based on turns |
| Opacity | 0.4 | 0.8-1.0 |
| Border | Dashed circle | Solid (existing glow) |
| Edge | None | Solid line to parent |
| Label | Gray text, smaller font | Normal |
| Glow/Pulse | None | Breathing effect |

### Interaction

- Hover: Show tooltip with preset name + description (from `activationHint` or label)
- Click: No action (no session to switch to)
- Not highlighted when other nodes are hovered

---

## 4. Activation Transition

### Trigger

WebSocket `node_forked` event → `refreshTopology()` → SpaceMeta now has updated `activatedPresets`.

### Animation Sequence

1. Identify which virtual node was activated (match by profileName)
2. Smooth position interpolation: node moves from outer ring to its BFS-computed position
3. Edge drawing: line from parent to activated node fades in
4. Color transition: gray → normal color (based on node type)
5. Size transition: 4px → normal computed size
6. Remove virtual node, replace with real TopoNode from topology data

### Implementation

Use the existing `requestAnimationFrame` loop in TopologyCanvas. Track "transitioning" nodes with start position, target position, and progress (0→1 over ~500ms ease-out).

---

## 5. Progress Indicator

Per PRD, template Kits show completion progress (e.g., "2/5 completed").

- Count: `Object.keys(activatedPresets).length` / `presetSessions.length`
- Display location: Kit card in SpaceList + top bar in KitWorkspace
- Only shown when `presetSessions` exists and has items

---

## Files to Modify

### Server
- `packages/server/src/space/space-manager.ts` — Add `activatedPresets` to SpaceMeta
- `packages/server/src/space/space-factory.ts` — Listen for fork events, record profileName → sessionId mapping

### Frontend
- `packages/web/src/lib/types.ts` — Extend TopoNode with 'inactive' status and presetName
- `packages/web/src/pages/KitWorkspace.tsx` — Merge virtual preset nodes into topology
- `packages/web/src/components/TopologyCanvas.tsx` — Render inactive nodes, activation animation
- `packages/web/src/pages/SpaceList.tsx` — Progress indicator on Kit cards

### Tests
- `packages/server/src/__tests__/space-manager.test.ts` — activatedPresets persistence
- `packages/server/src/__tests__/space-factory.test.ts` — profile activation mapping on fork events
