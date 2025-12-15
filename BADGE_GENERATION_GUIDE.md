# Badge Generation Guide

This guide documents the process for creating high-quality SVG badges consistent with the "Besties" app style (Gold Metallic, Glossy).

## 1. The Badge Style
The badges are composed of:
1.  **Gold Metallic Gradient**: For the outline/stroke.
2.  **Thick Gold Outline Filter**: Gives a 3D embossed look.
3.  **Drop Shadow**: For depth.
4.  **Glass Shine Overlay**: A standard overlay on top of every badge.
5.  **Inner Icon**: A simple vector path (usually filled with a solid color or gradient) representing the achievement.

## 2. The Master Template
All badges share this common SVG structure. To create a new badge, you only need to replace the `<!-- ICON CONTENT -->` section.

```html
<!-- BADGE CONTAINER -->
<svg width="200" height="200" viewBox="0 0 200 200" style="overflow:visible">
    <defs>
        <!-- GOLD METALLIC GRADIENT -->
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="25%" stopColor="#FFCA28" />
            <stop offset="50%" stopColor="#FF6F00" />
            <stop offset="75%" stopColor="#FFCA28" />
            <stop offset="100%" stopColor="#FFE082" />
        </linearGradient>

        <!-- THICK OUTLINE FILTER -->
        <filter id="gold-outline" x="-50%" y="-50%" width="200%" height="200%">
            <feMorphology operator="dilate" radius="4" in="SourceAlpha" result="outline_shape" />
            <feFlood flood-color="#FFB300" result="gold_color" />
            <feComposite in="gold_color" in2="outline_shape" operator="in" result="gold_outline" />
            <feGaussianBlur in="gold_outline" stdDeviation="1" result="blurred_outline" />
            <feSpecularLighting in="blurred_outline" surfaceScale="2" specularConstant="1" specularExponent="10"
                lighting-color="#FFF" result="specular">
                <fePointLight x="-5000" y="-10000" z="20000" />
            </feSpecularLighting>
            <feComposite in="specular" in2="outline_shape" operator="in" result="specular_out" />
            <feMerge>
                <feMergeNode in="gold_outline" />
                <feMergeNode in="specular_out" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>

        <!-- DROP SHADOW -->
        <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>

        <!-- GLASS SHINE GRADIENT -->
        <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.7" />
            <stop offset="40%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
    </defs>

    <!-- MAIN CONTENT GROUP -->
    <g filter="url(#drop-shadow)">
        <g filter="url(#gold-outline)">
            
            <!-- INSERT ICON PATHS HERE -->
            <!-- Example: A simple circle -->
            <!-- <circle cx="100" cy="100" r="50" fill="#4CAF50" stroke="white" stroke-width="3" /> -->

        </g>
    </g>

    <!-- GLOSSY OVERLAY (Don't touch this) -->
    <path d="M 20 20 Q 100 0 180 20 Q 180 90 100 90 Q 20 90 20 20 Z" fill="url(#glass-gradient)"
        style="mix-blend-mode: overlay; pointer-events: none;" />
    <ellipse cx="100" cy="170" rx="60" ry="10" fill="white" fill-opacity="0.2" filter="blur(5px)" />
</svg>
```

## 3. How to Generate New Icons (The "Prompt")

To create a new badge, you need the SVG path for the icon itself. You can ask an AI (or use a vector editing tool) to generate this.

**Prompt Template:**
> "Create an SVG path for a **[BADGE NAME]** icon. The style should be simple, bold vector art. It fits inside a 200x200px viewbox, centered at roughly 100,100.
> JUST provide the `<path>` or `<g>` elements. No `<svg>` wrapper.
> The fill color should be **[COLOR e.g., #4CAF50]**. It should have a white stroke of width 3."

### Example Prompts:
*   **Safety Pro**: "Create a shield icon with a star in the center."
*   **Friend Squad**: "Create an icon of three simple user avatars grouped together."
*   **Night Owl**: "Create a simple owl face icon."

## 4. Assembly Step
1.  Copy the **Master Template** code.
2.  Paste your generated Icon Path into the `<!-- INSERT ICON PATHS HERE -->` section.
3.  Save as `.svg` or add to your HTML preview.
