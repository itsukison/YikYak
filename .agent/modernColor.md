#Dark mode
| Role           | HSL Value       | Usage                                            |
| -------------- | --------------- | ------------------------------------------------ |
| **bg-dark**    | `hsl(0 0% 0%)`  | Deepest background (base layer, app background)  |
| **bg**         | `hsl(0 0% 5%)`  | Main background for surfaces, cards              |
| **bg-light**   | `hsl(0 0% 10%)` | Slightly elevated surface (hover states, panels) |
| **text**       | `hsl(0 0% 95%)` | Primary text color                               |
| **text-muted** | `hsl(0 0% 70%)` | Secondary/disabled text color                    |
🌑 Dark Mode

Borders

Should not be pure grey or white.

Use a slightly lighter shade than the surface background to subtly separate layers.
→ e.g. if your bg = hsl(0 0% 5%), a border could be around hsl(0 0% 15%).

Borders should be low contrast — just enough to define edges without glowing.

Shadows

Real shadows are rarely visible on dark backgrounds, so instead use light “lift” effects:

Add a soft inner glow or subtle lighter outline to simulate depth.

Avoid pure black shadows (they won’t be visible).

Sometimes designers skip shadows entirely and rely on contrast in brightness (like bg vs bg-light) for elevation.

accent-primary	hsl(220 70% 65%)	#60A5FA	Main accent (buttons, highlights)
accent-secondary	hsl(215 60% 80%)	#A5B4FC	Subtle highlight (hover, secondary button)



# Light mode
| Role           | HSL Value        | Usage                                            |
| -------------- | ---------------- | ------------------------------------------------ |
| **bg-dark**    | `hsl(0 0% 100%)` | Deepest background (base layer, app background)  |
| **bg**         | `hsl(0 0% 95%)`  | Main background for surfaces, cards              |
| **bg-light**   | `hsl(0 0% 90%)`  | Slightly elevated surface (hover states, panels) |
| **text**       | `hsl(0 0% 5%)`   | Primary text color                               |
| **text-muted** | `hsl(0 0% 30%)`  | Secondary/disabled text color                    |

☀️ Light Mode

Borders

Use a slightly darker tone than the surface background.
→ e.g. if your bg = hsl(0 0% 95%), border ≈ hsl(0 0% 85%).

Helps separate components without harsh black outlines.

Should appear subtle — low opacity or low contrast grey.

Shadows

Shadows are more visible here.

Use soft, blurred shadows (like rgba black with low opacity) to lift elements.

Example: 0 1px 2px rgba(0,0,0,0.1) or 0 4px 12px rgba(0,0,0,0.08).

Combine shadow + border for a realistic sense of layering.

accent color: #4998e9
secondary colro: #ebf5fd