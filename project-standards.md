# Project Standards and Rules

## Import Rules

### 1. Import Order

All imports MUST follow this order:

1. **3rd-party libraries** (npm packages)
2. **Local modules** (project files)

Add a blank line between these two groups.

### 2. Import Aliases Only

- **ALWAYS** use import aliases starting with `@/`
- **NEVER** use relative imports (`./` or `../`)
- All imports must be absolute using the configured path aliases

### 3. Import Alias Patterns

Available aliases:

- `@/*` - Root src folder
- `@core/*` - Core folder

#### Examples:

✅ **Correct:**

```typescript
// 3rd-party lib
import express from "express";
import { Router } from "express";
import { z } from "zod";

// local modules
import { BaseService } from "@/core";
import { prisma } from "@/core/db";
import { ExampleService } from "@/modules/example/example.service";
```

❌ **Wrong:**

```typescript
import { BaseService } from "./core";
import { prisma } from "../db";
import express from "express";
import { ExampleService } from "./example.service";
```

## Project Structure

```
src/
├── core/                    # Base/shared functionality (DO NOT MODIFY)
│   ├── base-service.ts     # Base service class
│   ├── index.ts            # Core exports
│   ├── constants/          # Shared constants
│   ├── db/                 # Database (Prisma)
│   ├── errors/             # Error definitions
│   ├── middlewares/        # Shared middlewares
│   ├── types/              # Shared types
│   └── utils/              # Shared utilities
│
├── modules/                # Feature modules
│   └── [module-name]/      # Each module is self-contained
│       ├── index.ts
│       ├── [name].controller.ts
│       ├── [name].service.ts
│       ├── [name].schema.ts
│       └── [name].route.ts
│
├── app.ts                  # Express app config
├── index.ts                # Entry point
└── routes.ts               # Root router
```

## Module Structure Rules

Each module in `src/modules/` MUST follow this structure:

1. **Controller** (`[name].controller.ts`) - Request handlers
2. **Service** (`[name].service.ts`) - Business logic (extends BaseService)
3. **Schema** (`[name].schema.ts`) - Zod validation schemas
4. **Route** (`[name].route.ts`) - Express route definitions
5. **Index** (`index.ts`) - Module exports

### Module Template

```typescript
// [name].controller.ts
// 3rd-party lib
import type { Request, Response } from "express";

// local modules
import { catchAsync } from "@/core";
import { ExampleService } from "@/modules/example/example.service";

class ExampleController {
  example = catchAsync(async (req, res, next) => {
    // implementation
  });
}

export const exampleController = new ExampleController();
```

```typescript
// [name].service.ts
// 3rd-party lib
import type { Prisma } from "@prisma/client";

// local modules
import { BaseService } from "@/core";
import { prisma } from "@/core/db";

type Example = typeof prisma.example;

export class ExampleService extends BaseService<Example> {
  constructor() {
    super(prisma, prisma.example);
  }
}
```

```typescript
// [name].route.ts
// 3rd-party lib
import { Router } from "express";

// local modules
import { exampleController } from "@/modules/example/example.controller";
import { validate } from "@/core";
import { exampleSchema } from "@/modules/example/example.schema";

const router = Router();

router.get("/", exampleController.example);

export default router;
```

```typescript
// index.ts
export { default as exampleRoutes } from "@/modules/example/example.route";
```

## Code Style Rules

1. **Comments** - Use `// 3rd-party lib` and `// local modules` to separate import groups
2. **Exports** - Use named exports for classes/functions, default export for routers
3. **Services** - Always extend `BaseService` from core
4. **Controllers** - Use `catchAsync` wrapper for async handlers
5. **Validation** - Use Zod schemas with the `validate` middleware
6. **Error Handling** - Use `AppError` from core for custom errors

## Adding New Modules

1. Create folder: `src/modules/[module-name]/`
2. Create files: controller, service, schema, route, index
3. Export routes in module's `index.ts`
4. Register in `src/routes.ts`:

```typescript
import { [name]Routes } from "@/modules/[name]";
rootRouter.use("/[name]", [name]Routes);
```

## Core Usage

Import from core barrel export when possible:

```typescript
import {
  BaseService,
  prisma,
  Errors,
  AppError,
  globalErrorHandler,
  validate,
  catchAsync,
  formatPrismaError,
} from "@/core";
```

Or import from specific paths:

```typescript
import { prisma } from "@/core/db";
import { catchAsync } from "@/core/utils/catch-async";
```

## Enforcement

- All code MUST follow these rules
- Use ESLint/Prettier for formatting
- Review imports in every file
- Keep 3rd-party imports at the top
- Always use `@/` aliases
