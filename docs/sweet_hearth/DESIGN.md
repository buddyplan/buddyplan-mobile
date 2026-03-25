```markdown
# Design System Strategy: The Culinary Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Artisanal Kitchen."** 

We are moving away from the cold, clinical efficiency of traditional utility apps. Instead, we are building a digital space that feels like a high-end, sun-drenched kitchen—tactile, warm, and curated. This system rejects the rigid "grid-of-boxes" approach. We utilize intentional asymmetry, exaggerated "Pill" geometry, and deep tonal layering to create an experience that feels as much like a premium lifestyle magazine as it does a functional tool.

To achieve this "Editorial" feel, we prioritize white space (negative space) as a primary design element. Layouts should feel "breathtakingly airy," using the `16` (5.5rem) and `20` (7rem) spacing tokens to separate major content blocks rather than restrictive lines.

---

## 2. Colors & Surface Philosophy
The palette is rooted in organic, culinary tones. We avoid pure blacks and harsh whites to maintain a "soft-focus" premium aesthetic.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
Structure is defined through **Background Color Shifts**. To separate a sidebar or a card, transition from `surface` (#fbf9f5) to `surface-container-low` (#f5f4ef). This creates a "soft edge" that feels intentional and high-end.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like ceramic plates stacked on a linen tablecloth.
*   **Base:** `surface` (#fbf9f5)
*   **Sectioning:** `surface-container-low` (#f5f4ef)
*   **Primary Interaction Cards:** `surface-container-lowest` (#ffffff) for a "lifted" clean look.
*   **Active/Inset States:** `surface-container-high` (#e9e8e3) to show depth.

### Glass & Signature Textures
For floating navigation or top-level modals, use **Glassmorphism**. Combine `surface` at 80% opacity with a `backdrop-blur` of 20px. 
*   **Signature CTA Gradient:** To give buttons "soul," use a subtle linear gradient from `primary` (#765a3b) to `primary_dim` (#694e30) at a 135-degree angle. This mimics the soft sheen of polished wood or copper cookware.

---

### 3. Typography: The Editorial Voice
We use **Plus Jakarta Sans** exclusively. Its rounded terminals provide a "friendly" accessibility, while its modern metrics maintain a "premium" edge.

*   **Display (Large/Medium):** Used for "Hero Moments" (e.g., "Good Morning, Chef"). Use `display-lg` with `-0.02em` letter spacing to feel tight and custom.
*   **Headlines:** Use `headline-md` for recipe titles or plan names. These are the anchors of your page.
*   **Body:** `body-lg` is your workhorse. Use `on_surface_variant` (#5e605b) for secondary body text to reduce visual noise.
*   **Labels:** Use `label-md` in all-caps with `+0.05em` letter spacing for a "tabbed" or "tagged" editorial look.

---

## 4. Elevation & Depth
In this system, we do not "drop shadows"; we "create atmosphere."

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural, soft lift without any CSS shadow properties.
*   **Ambient Shadows:** If a card must float (e.g., a dragging state), use a shadow color tinted with the `on_surface` (#31332f) at 5% opacity. 
    *   *Spec:* `0px 20px 40px rgba(49, 51, 47, 0.05)`
*   **The Ghost Border Fallback:** If a container is placed on an identical color background, use the `outline_variant` (#b2b2ad) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons (Maximum Roundness)
*   **Primary:** Pill-shaped (`rounded-full`). Background: `primary` gradient. Text: `on_primary`.
*   **Secondary:** Pill-shaped. Background: `primary_container` (#fdd6af). Text: `on_primary_container`.
*   **Tertiary:** No background. Bold `plusJakartaSans` with an icon.

### Input Fields
Forbid the "box" look. Use a `surface-container-low` background with a `rounded-md` (1.5rem) corner radius. On focus, transition the background to `surface-container-lowest` and add a subtle `primary` tint to the label.

### Cards & Lists
*   **Card Radius:** Always use `rounded-lg` (2rem) or `rounded-xl` (3rem) for large feature cards.
*   **No Dividers:** In lists, never use a horizontal line. Use `spacing-4` (1.4rem) between items. If items need distinct separation, give each item a `surface-container-low` background with a `rounded-sm` (0.5rem) radius.

### Signature Component: The "Chef's Note" Chip
A floating chip using `tertiary_container` (#dcfcd9) with a `tertiary` (#4a664b) icon and text. Used for success states, tips, or "Buddy" suggestions.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** Place a `display-lg` headline on the left and a small `label-md` descriptive text on the right, misaligned vertically to create a bespoke, non-templated look.
*   **Embrace the Pill:** Every interactive element should feel "tossable" and soft. If it's a button or a tag, use `rounded-full`.
*   **Color as Information:** Use `tertiary` (Sage) for success and `error` (Peach-Red) for warnings, but always keep them in their "container" variants (`tertiary_container`) to keep the palette soft.

### Don't:
*   **No Sharp Corners:** Never use `rounded-none` or `rounded-sm` for main UI containers. It breaks the "Friendly Kitchen" metaphor.
*   **No Pure Grey:** Never use #000000 or generic greys. Always use the "Warm Charcoal" (`on_surface`) or "Cream" (`background`) derivatives.
*   **No Information Density:** Avoid cramming. If a screen feels full, use a "Pagination" or "Progressive Disclosure" pattern. A premium kitchen is never cluttered.

---

## 7. Spacing Patterns
To maintain the high-end editorial feel, use **Variable Padding**:
*   **Outer Page Margins:** `8` (2.75rem) to `12` (4rem).
*   **Internal Card Padding:** `6` (2rem).
*   **Vertical Section Gaps:** `16` (5.5rem).

*Director's Final Note: Design this system like you are plating a five-star meal. Every element should have room to breathe, and every interaction should feel like a soft, tactile click.*```