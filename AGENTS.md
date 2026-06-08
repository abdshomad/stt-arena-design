# Agent Instructions

You must follow these workflow rules strictly to support rapid, iterative enhancements of the platform:

## 1. Trigger "e" or "enhance"
If the user types "e", "enhance", or requests an enhancement plan:
- Read `/plan/next-enhancements.md` to understand the current platform structure, history, and active tasks.
- Overwrite or update the active tasks list inside `/plan/next-enhancements.md`.
- The plan must cover each main section/module of the application.
- Inside the tasks list, define **exactly 3 new enhancements per section** with:
  1. A unique number (e.g., `1.1`, `1.2`, `1.3`).
  2. A clear, specific description of the functional change.
  3. A status (initially set to `[TODO]`).
- Present this plan to the user in your final summary response.

## 2. Trigger "n", "next", or "n{x}" / "next {x}"
If the user types "n", "next", "n{x}", "next {x}" (where `{x}` is an integer like 2, 3, etc.), or requests execution of the next enhancement task(s):
- Read `/plan/next-enhancements.md` to check the status of tasks.
- Determine the number of enhancements to execute, `{x}` (defaulting to 1 if only "n" or "next" is typed).
- If all enhancement tasks in `/plan/next-enhancements.md` are marked `[DONE]` (or there are no tasks marked `[TODO]`), automatically execute the **Trigger "e" or "enhance"** workflow first to generate a new set of tasks.
- Sequentially execute exactly `{x}` enhancement tasks in a loop:
  1. Identify and select the most impactful enhancement task currently marked `[TODO]` (evaluating which task has the highest strategic value, functional impact, or user experience contribution).
  2. Implement that specific enhancement task fully in the codebase (strictly adhering to the 256 LOC refactoring limit).
  3. Update that specific task's status in `/plan/next-enhancements.md` to `[DONE]`.
  4. Document the new or updated feature in the `/docs/feature-list.md` file (maintaining an organized list of all platform features under the appropriate section heading).
- Verify the build integrity of the workspace.
- In your final response, list all tasks completed during this turn, and inform the user of the exact menu or navigation path where they can view and interact with the new/updated features.

## 3. File Size & Refactoring Rules
- **Threshold Rule**: Any new or refactored file exceeding 256 lines of code (LOC) must be refactored and split into multiple smaller, modular, and logical components/files.