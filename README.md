# shadcn/ui monorepo template

This is a Vite monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Estrutura do Monorepo
```
    monorepo/
    ├── apps/
    │   ├── web-app/       # React frontend
    │   └── api-server/    # Node.js backend
    ├── packages/
    │   ├── shared-ui/     # Reusable React components
    │   └── utils/         # Shared utility functions
    ├── tools/             # Scripts for builds/testing
    ├── configs/           # ESLint, Jest, etc.
    └── package.json       # Root workspace config
```