# ManaRoom Visual Design System

## Design Philosophy

ManaRoom embraces the **dark fantasy aesthetic** of Magic: The Gathering while maintaining **clarity for gameplay**. The design language balances arcane mysticism with functional usability.

---

## Page 1: Sign In / Authentication

### Design Direction: "The Planeswalker's Gate"

**Mood:** Arcane, mysterious, inviting yet powerful. Like stepping through a portal to begin your journey.

**Key Visual Elements:**

1. **Background**
   - Deep cosmic void with subtle animated particle effects (floating mana motes)
   - Faint arcane sigils that pulse gently in the background
   - Gradient overlay: Deep purple (#1a0a2e) to black (#0a0a0a)

2. **Central Portal Frame**
   - The login card sits within an ornate frame suggesting a magical gateway
   - Border uses a subtle gold/bronze metallic gradient with rune engravings
   - Soft glow emanates from behind the card (mana-colored based on time of day or random)

3. **ManaRoom Logo**
   - Stylized text with subtle magical aura
   - The "M" could incorporate a mana symbol silhouette
   - Tagline in elegant serif: "Where Planeswalkers Duel"

4. **Form Styling**
   - Inputs have a subtle inner glow on focus (blue mana)
   - Labels use a condensed, mystical font
   - Buttons pulse gently with magical energy
   - "Sign In" button: Warm gold/amber with fire undertones
   - "Register" button: Cool silver/blue with arcane undertones

5. **Mana Symbol Accents**
   - Five mana symbols arranged subtly around the form
   - Each symbol barely visible, gains opacity on hover
   - Represents the connection to all five colors of magic

**Color Palette:**
- Background: `#0a0a0a` → `#1a0a2e` gradient
- Card Background: `#12121a` with `#1a1a2e` border
- Primary Gold: `#c9a227` (buttons, highlights)
- Accent Purple: `#6b21a8`
- Input Focus: `#3b82f6` (blue mana)
- Text Primary: `#e8e8f0`
- Text Secondary: `#9ca3af`

---

## Page 2: Room Entry / Deck Selection

### Design Direction: "The Summoner's Hall"

**Mood:** A mystical war room where champions prepare for battle. Deck selection feels like choosing your grimoire.

**Key Visual Elements:**

1. **Background**
   - Dark stone texture with subtle magical veins running through
   - Ambient torchlight effects in corners (warm orange glow points)
   - Faint fog/mist at the bottom of the screen

2. **Deck Display: "The Grimoire Shelf"**
   - Each deck appears as a magical tome on a shelf
   - Commander card peeks out from the top of each "book"
   - Active/selected deck has glowing edges matching the commander's colors
   - Hover effect: book lifts slightly, spine glows

3. **Deck Card Design**
   - Leather texture background with metal corner accents
   - Deck name in elegant script font
   - Commander image prominently displayed
   - Color identity shown as glowing orbs at the bottom
   - Card count displayed on a small scroll/banner

4. **Create Room Section: "The Summoning Circle"**
   - Room code displayed in runic/mystical font
   - Circular progress indicator when waiting for opponent
   - Magical energy particles flowing toward the center

5. **Join Room Section: "The Portal Key"**
   - Input field styled as a stone tablet
   - Characters appear as glowing runes as typed
   - "Join" button is a magical key icon

**Layout:**
- 60/40 split: Decks take more space (the focus)
- Deck grid: 2-3 columns depending on screen size
- Actions in a sidebar or bottom panel on mobile

**Color Palette:**
- Background: `#0d0d12` with stone texture overlay
- Deck Cards: `#1a1814` (worn leather brown-gray)
- Gold Accents: `#b8860b` (dark goldenrod)
- Selection Glow: Based on commander's color identity
- Button Green: `#166534` with `#22c55e` glow

---

## Page 3: Battlefield

### Design Direction: "The Arena"

**Mood:** Clear, focused, competitive. The battlefield must serve gameplay first, but themes add personality.

**Core Layout (Unchanging):**
- Header: Room info, life counters, controls
- Main Area: Opponent battlefield (top), Your battlefield (bottom)
- Bottom Bar: Hand, zones (library, graveyard, exile, command zone)

**Theme System:**
The battlefield supports multiple visual themes that change only the background, ambient effects, and zone styling - never the card display or UI controls.

---

## Battlefield Themes

### 1. **Classic Arena** (Default)
- **Mood:** Timeless MTG tournament feel
- **Background:** Deep charcoal with subtle hexagonal grid pattern
- **Zone Styling:** Clean dark panels with thin gold borders
- **Ambient:** None - pure focus
- **Colors:** `#1a1a1a` bg, `#c9a227` accents

### 2. **Dominaria Sunset**
- **Mood:** Warm, nostalgic, home plane vibes
- **Background:** Gradient from deep orange to purple (sunset over plains)
- **Zone Styling:** Weathered stone with copper accents
- **Ambient:** Floating ember particles, distant bird silhouettes
- **Colors:** `#2d1810` bg, `#d97706` accents, `#7c2d12` secondary

### 3. **Phyrexian Corruption**
- **Mood:** Dark, oily, biomechanical horror
- **Background:** Black with iridescent oil-slick patterns
- **Zone Styling:** Organic/metal hybrid with green-black glow
- **Ambient:** Dripping oil effects, pulsing vein-like lines
- **Colors:** `#0a0a0a` bg, `#22c55e` accents (sickly green), `#1e3a1a` secondary

### 4. **Ravnica Cityscape**
- **Mood:** Urban fantasy, guild intrigue
- **Background:** Art deco architecture silhouettes, distant city lights
- **Zone Styling:** Stone and iron with guild-inspired geometric patterns
- **Ambient:** Rain drops on invisible glass, distant lightning flashes
- **Colors:** `#1a1a24` bg, `#60a5fa` accents, `#374151` secondary

### 5. **Innistrad Manor**
- **Mood:** Gothic horror, candlelit tension
- **Background:** Dark wood paneling with portraits that feel like they're watching
- **Zone Styling:** Ornate Victorian frames, deep mahogany
- **Ambient:** Flickering candle light, occasional shadow movement
- **Colors:** `#1a0a0a` bg, `#991b1b` accents (blood red), `#292524` secondary

### 6. **Zendikar Hedron Field**
- **Mood:** Ancient, mysterious, adventure
- **Background:** Floating hedron structures against a sky of roiling energy
- **Zone Styling:** Stone tablets with glowing geometric carvings
- **Ambient:** Hedrons slowly rotating, energy crackling between them
- **Colors:** `#0c1929` bg, `#0ea5e9` accents (sky blue), `#1e3a5f` secondary

### 7. **Theros Starfield**
- **Mood:** Divine, mythological, constellation magic
- **Background:** Deep navy with animated constellation patterns
- **Zone Styling:** White marble with gold Nyx-pattern edges
- **Ambient:** Stars twinkling, occasional shooting star
- **Colors:** `#0a0a1a` bg, `#eab308` accents (divine gold), `#1e1b4b` secondary

### 8. **Kamigawa Neon Dynasty**
- **Mood:** Cyberpunk meets tradition, high-tech shrines
- **Background:** Dark with neon circuit patterns and torii gate silhouettes
- **Zone Styling:** Sleek black with neon edge lighting
- **Ambient:** Data streams, cherry blossom petals mixed with pixels
- **Colors:** `#0a0a12` bg, `#f472b6` accents (hot pink), `#7c3aed` secondary

### 9. **Eldraine Enchanted Forest**
- **Mood:** Fairy tale, whimsical but dark
- **Background:** Misty forest with twisted trees, distant castle
- **Zone Styling:** Organic wood frames with glowing mushroom accents
- **Ambient:** Fireflies, falling leaves, subtle magic sparkles
- **Colors:** `#0a1a0a` bg, `#a855f7` accents (fairy purple), `#14532d` secondary

### 10. **Amonkhet Pyramid**
- **Mood:** Egyptian mythology, desert grandeur
- **Background:** Sandstone interior with hieroglyphic walls, distant pyramid view
- **Zone Styling:** Gold and lapis lazuli trim, scarab motifs
- **Ambient:** Sand particles drifting, torch flame flicker
- **Colors:** `#1a1408` bg, `#eab308` accents (pharaoh gold), `#78350f` secondary

---

## Theme Dropdown Implementation

### Location
Top-right corner of the battlefield, near the room controls. Small, unobtrusive.

### Behavior
1. Click dropdown → Shows theme list with small preview swatches
2. Hover preview → Subtle indication of theme colors
3. Select theme → Smooth 500ms transition to new theme
4. Preference saved to localStorage
5. Theme persists across sessions

### UI Design
```
┌─────────────────────────────┐
│ Theme: Classic Arena    ▼  │
└─────────────────────────────┘

Expanded:
┌─────────────────────────────┐
│ ● Classic Arena         ✓  │
│ ○ Dominaria Sunset         │
│ ○ Phyrexian Corruption     │
│ ○ Ravnica Cityscape        │
│ ○ Innistrad Manor          │
│ ○ Zendikar Hedron Field    │
│ ○ Theros Starfield         │
│ ○ Kamigawa Neon Dynasty    │
│ ○ Eldraine Enchanted Forest│
│ ○ Amonkhet Pyramid         │
└─────────────────────────────┘
```

---

## Theming Architecture

### CSS Variables Approach

```css
:root {
  /* Base Theme Variables */
  --theme-bg-primary: #1a1a1a;
  --theme-bg-secondary: #252525;
  --theme-bg-tertiary: #2a2a2a;
  --theme-accent: #c9a227;
  --theme-accent-glow: rgba(201, 162, 39, 0.3);
  --theme-text-primary: #e8e8f0;
  --theme-text-secondary: #9ca3af;
  --theme-border: #3a3a3a;

  /* Zone-specific */
  --theme-battlefield-bg: var(--theme-bg-primary);
  --theme-hand-bg: var(--theme-bg-secondary);
  --theme-zone-bg: var(--theme-bg-tertiary);

  /* Effects */
  --theme-ambient-opacity: 0;
  --theme-ambient-color: transparent;
}

[data-theme="dominaria-sunset"] {
  --theme-bg-primary: #2d1810;
  --theme-bg-secondary: #3d2820;
  --theme-accent: #d97706;
  --theme-accent-glow: rgba(217, 119, 6, 0.3);
  --theme-ambient-opacity: 0.6;
  --theme-ambient-color: #d97706;
}

/* ... more themes ... */
```

### Theme Object Structure (TypeScript)

```typescript
interface BattlefieldTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    accent: string;
    accentGlow: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
  effects: {
    ambientEnabled: boolean;
    ambientType: 'particles' | 'rain' | 'fire' | 'none';
    ambientColor: string;
    ambientOpacity: number;
  };
  textures?: {
    background?: string; // URL to texture image
    overlay?: string;    // URL to overlay pattern
  };
}
```

### Implementation Files

1. `src/lib/themes.ts` - Theme definitions
2. `src/hooks/useTheme.ts` - Theme state management
3. `src/components/game/ThemeSelector.tsx` - Dropdown component
4. `src/components/game/AmbientEffects.tsx` - Particle/effect system
5. `src/app/globals.css` - CSS variable definitions

---

## Typography Recommendations

### Fonts

1. **Display/Headers:** "Cinzel" or "Uncial Antiqua" - Elegant, medieval feel
2. **Body/UI:** "Inter" or current system font - Clean and readable
3. **Magical Accents:** "MedievalSharp" - For runes, room codes, special text

### Usage
- Page titles: Display font, larger sizes
- Form labels, buttons: Body font
- Room codes, mana costs: Accent font

---

## Animation Guidelines

1. **Transitions:** 200-500ms, ease-out for UI, ease-in-out for themes
2. **Hover Effects:** Scale 1.02-1.08 max, don't obstruct gameplay
3. **Ambient Effects:** Very subtle, 0.3-0.6 opacity max, pauseable
4. **Loading States:** Pulsing glow preferred over spinners where thematic

---

## Accessibility Considerations

1. All themes maintain WCAG AA contrast ratios
2. Ambient effects can be disabled in settings
3. Color-blind friendly: Don't rely on color alone for state
4. Reduce motion option respects `prefers-reduced-motion`
5. Focus states visible in all themes
