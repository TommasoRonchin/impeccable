# Impeccable for VS Code & Antigravity

This is an **unofficial porting** developed by **[Tommaso Ronchin](https://tommasoronchin.it/)** for Visual Studio Code and Antigravity.

The original **[Impeccable](https://impeccable.style/)** tool was created and developed by **[Paul Bakaus](https://paulbakaus.com/)**. The source code for this port is available on **[GitHub](https://github.com/TommasoRonchin/impeccable)**.

---

## What is Impeccable?

Impeccable is a set of advanced design skills and commands for LLM-powered development. It fights the generic defaults of AI (like overused fonts and predictable gradients) by providing expert-level design guidance.

To see Impeccable in action and view design examples, visit **[impeccable.style](https://impeccable.style/)**.

---

## Demonstration

To use Impeccable in your IDE:
1. Click the ✨ **Impeccable** button in the status bar at the bottom.
2. Select the desired design tool from the menu (e.g., `/audit`, `/polish`).

![Impeccable Demo](https://i.imgur.com/pg2BAGF.gif)

> **Note:** In **VS Code**, the dedicated chat participant (`@impeccable`) is currently not available due to platform limitations. However, you can still use all features via the status bar, which will correctly initiate the task in your main chat window.

---

## What's Included

### 1. The Skill: `frontend-design`
A comprehensive design skill with domain-specific reference files:

| Reference | Covers |
| :--- | :--- |
| **typography** | Type systems, font pairing, modular scales, OpenType |
| **color-and-contrast** | OKLCH, tinted neutrals, dark mode, accessibility |
| **spatial-design** | Spacing systems, grids, visual hierarchy |
| **motion-design** | Easing curves, staggering, reduced motion |
| **interaction-design** | Forms, focus states, loading patterns |
| **responsive-design** | Mobile-first, fluid design, container queries |
| **ux-writing** | Button labels, error messages, empty states |

### 2. Steering Commands
| Command | What it does |
| :--- | :--- |
| **/audit** | Run technical quality checks (a11y, performance, responsive) |
| **/critique** | UX design review: hierarchy, clarity, emotional resonance |
| **/normalize** | Align with design system standards |
| **/polish** | Final pass before shipping |
| **/simplify** | Strip to essence |
| **/clarify** | Improve unclear UX copy |
| **/optimize** | Performance improvements |
| **/harden** | Error handling, i18n, edge cases |
| **/animate** | Add purposeful motion |
| **/colorize** | Introduce strategic color |
| **/bolder** | Amplify boring designs |
| **/quieter** | Tone down overly bold designs |
| **/delight** | Add moments of joy |
| **/extract** | Pull into reusable components |
| **/adapt** | Adapt for different devices |
| **/onboard** | Design onboarding flows |

### 3. Anti-Patterns
The skill explicitly guides the AI to avoid common mistakes:
- **Don't** use overused fonts (Arial, Inter, system defaults).
- **Don't** use gray text on colored backgrounds.
- **Don't** use pure black/gray (always tint with color).
- **Don't** wrap everything in multiple nested cards.
- **Don't** use dated bounce/elastic easing curves.

---

### Credits
- **Original Concept & Development**: [Paul Bakaus](https://impeccable.style/)
- **VS Code/Antigravity Porting**: [Tommaso Ronchin](https://tommasoronchin.it/)

For further credits and information, please visit the original repository: **[github.com/pbakaus/impeccable](https://github.com/pbakaus/impeccable)**.

---

## License

This project is licensed under the **Apache License, Version 2.0**. 


Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0).
