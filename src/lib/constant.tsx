import { CodeBlock } from "@/components/ui/code-block";

export const featuresContent = [
  {
    title: "Instant Code Understanding",
    description:
      "Navigate large codebases with ease. Our AI provides clear overviews, identifies key components, and traces data flows, turning complexity into clarity.",
    content: (
      <CodeBlock
        language="typescript"
        code={`// Ask a question in plain English
// Q: Where is the user authentication logic handled?

/**
 * A: User authentication is handled in the following files:
 * 
 * 1. src/lib/auth.ts - Main authentication middleware
 * 2. src/api/users/route.ts - User creation endpoint
 * 3. src/components/LoginButton.tsx - Frontend logic
 */`}
        highlightLines={[2, 6, 7, 8]}
      />
    ),
  },
  {
    title: "Centralized Knowledge Hub",
    description:
      "GITMIND acts as a single source of truth, capturing and organizing knowledge from your codebase and team discussions in one accessible place. Eliminate knowledge silos forever.",
    content: (
      <CodeBlock
        language="json"
        code={`{
  "summary": "Meeting: API v2 Planning",
  "date": "2024-05-21",
  "attendees": ["Alice", "Bob", "Charlie"],
  "key_decisions": [
    "Migrate to GraphQL for the new endpoint.",
    "Use 'id' instead of '_id' for all new models.",
    "Deprecate the v1 /users endpoint by Q4."
  ]
}`}
        highlightLines={[5, 6, 7, 8]}
      />
    ),
  },
  {
    title: "Enhanced Team Synergy",
    description:
      "Facilitate better communication with shared insights, automated summaries, and a common platform for discussing code. Keep everyone on the same page, effortlessly.",
    content: (
      <CodeBlock
        language="javascript"
        code={`import { GitMind } from '@gitmind/sdk';

const gitmind = new GitMind({ apiKey: '...' });

// Automatically generate release notes from recent commits
async function generateReleaseNotes() {
  const notes = await gitmind.summarize({
    repo: 'my-project',
    range: 'v1.2.0..HEAD',
    template: 'release-notes.md'
  });
  console.log(notes);
}`}
        highlightLines={[6, 7, 8, 9, 10]}
      />
    ),
  },
   {
    title: "Smart Analysis",
    description:
      "Get comprehensive insights into your codebase structure, dependencies, and complexity metrics. Identify potential refactoring opportunities and technical debt before they become major issues.",
    content: (
     <CodeBlock
        language="bash"
        code={`$ npx gitmind-cli analyze ./src

Analyzing codebase...

Code Complexity Report:
- High Complexity: src/utils/parsers.js (Cyclomatic: 25)
- High Churn: src/api/main.ts (32 commits last month)
- Deprecated Usage: Found 5 instances of 'request' library.

✨ Analysis complete. View full report at /report.html`}
        highlightLines={[5, 6, 7, 8]}
      />
    ),
  },
];