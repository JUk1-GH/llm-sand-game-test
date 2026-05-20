# Falling Sand Simulation - Specification

## Project Overview
- **Project Name**: Particle Sandbox
- **Type**: Interactive physics simulation / game
- **Core Functionality**: Canvas-based falling sand simulation with multiple materials that interact via physics rules
- **Target Users**: Casual users interested in physics toys

## Visual & Rendering Specification

### Canvas Setup
- **Resolution**: 800x600 pixels, scaled with device pixel ratio
- **Rendering**: Pixel-level manipulation via ImageData for performance
- **Grid**: Each particle is 4x4 pixels for visible detail

### Visual Style
- **Aesthetic**: Retro pixel-art with subtle color variations per material
- **Background**: Dark charcoal (#1a1a2e) for contrast
- **UI Theme**: Minimal, semi-transparent overlays

### Materials & Colors
| Material | Color Range | Behavior |
|----------|-------------|----------|
| Sand | #e6c86e → #c9a227 | Falls, piles up at angle of repose |
| Water | #4a90d9 → #2d5a87 | Flows, spreads horizontally |
| Stone | #6b6b6b → #4a4a4a | Static, solid |
| Fire | #ff6b35 → #ff4500 | Rises, flickers, dies out |
| Smoke | #555555 → #333333 | Rises, dissipates |
| Oil | #3d2b1f → #1a1a1a | flammable liquid, flows |
| Steam | #aabbcc → #889999 | Rises, dissipates quickly |
| Wood | #8b4513 → #5d2e0c | Static, flammable |
| Lava | #ff4500 → #cc0000 | Falls, glows, ignites flammable |
| Ice | #aaddff → #88bbdd | Static, melts near heat |

### Color Variation
- Each particle gets slight random color variation (±10 RGB) when created
- Creates natural-looking texture instead of flat colors

## Simulation Specification

### Physics Engine
- **Type**: Grid-based cellular automaton with physics updates
- **Update Order**: Bottom-to-top, alternating left-right for horizontal movement
- **Frame Rate**: 60 FPS target, batch updates for performance

### Material Behaviors

**Sand**
- Falls down if empty below
- If blocked below, slides diagonally (left or right randomly)
- Angle of repose: piles up naturally
- Density: 3 (affects sinking in liquids)

**Water**
- Falls down if empty below
- If blocked, spreads horizontally (random direction preference)
- Flows to find lowest point
- Density: 1 (sands sink through it)

**Stone**
- Never moves (static)
- Created from sand + water reaction over time

**Fire**
- Rises upward with flicker
- Has lifetime (200-400 ticks), then becomes smoke
- Spreads to flammable neighbors (oil, wood)
- Can evaporate water into steam

**Smoke**
- Rises upward, drifts slightly
- Lifetime: 100-200 ticks, then disappears
- Created from fire death

**Oil**
- Similar to water but flammable
- Flows and pools at bottom
- Ignites when touching fire → becomes fire

**Steam**
- Rises faster than smoke
- Short lifetime: 50-100 ticks
- Condenses back to water if hitting ceiling

**Wood**
- Static until ignited
- When touching fire for 100+ ticks, becomes fire

**Lava**
- Falls like sand but slower
- Glows (brighter color)
- Ignites flammable materials on contact
- Hardens into stone over time (500+ ticks)

**Ice**
- Static like stone
- Melts when adjacent to lava/fire/steam → becomes water

### Chemical Reactions
- Fire + Water = Steam (instant)
- Lava + Water = Stone (instant)
- Lava + Ice = Stone (instant)
- Fire + Oil = Fire (ignition)
- Fire + Wood = Charred Wood (state change)

## Interaction Specification

### Mouse Controls
- **Left Click**: Draw with selected material
- **Right Click / Drag**: Erase particles
- **Mouse Wheel**: Change brush size (1-10)

### UI Elements
- **Material Selector**: 10 material buttons with color preview
- **Brush Size**: Slider 1-10
- **Clear Button**: Reset entire canvas
- **Pause/Play**: Toggle simulation

### Controls Layout
- Fixed panel on right side (200px width)
- Material buttons in 2-column grid
- Current selection highlighted

## Performance Targets
- **Particle Limit**: ~50,000 simultaneous particles
- **Target FPS**: 60 FPS with <10,000 particles
- **Graceful Degradation**: Reduce update frequency if overloaded

## Acceptance Criteria

1. ✓ Canvas renders at correct resolution with pixel grid visible
2. ✓ All 10 materials can be selected and drawn
3. ✓ Sand falls and piles naturally
4. ✓ Water flows and spreads horizontally
5. ✓ Fire rises and eventually dies to smoke
6. ✓ Material interactions work (fire ignites oil/wood, lava hardens, etc.)
7. ✓ Brush size adjustable via scroll wheel
8. ✓ Right-click erases particles
9. ✓ Clear button resets simulation
10. ✓ Pause/Play toggles simulation state
11. ✓ No critical console errors
