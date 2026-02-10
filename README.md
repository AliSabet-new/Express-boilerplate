# Project Information

This project, hosted in the following repository:

**https://github.com/sina-abedi/express-shop**

has been developed and maintained by **Sina Abedi**.

## Licensing
This project is released under the **MIT License**, a permissive open-source license that allows:

* Commercial and non-commercial use
* Modification
* Distribution
* Private use

as long as the conditions of the MIT License are met, including the requirement to include the original copyright notice and the license text in any substantial portions of the software.

## Permissions and Attribution
Users, contributors, and integrators are explicitly permitted to use and extend this project. Any reuse, modification, or redistribution **must** include proper attribution to the original author, **Sina Abedi**, to comply with the license.

## Warranty and Liability Notice
This project is provided **"as is"**, without any warranties or guarantees of fitness for a particular purpose. The author assumes **no liability** for any issues, damages, or losses arising from the use of this software. This notice helps ensure that the project can be safely used in professional and commercial environments without creating unintended legal obligations for the author.

For further details, refer to the full MIT License text included in the repository.



# Bun TypeScript Express Prisma Zod Base Template

A modern, minimal boilerplate for building scalable Node.js APIs using:

- [Bun](https://bun.sh/) for fast runtime and package management
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Express](https://expressjs.com/) for routing
- [Prisma](https://www.prisma.io/) for database ORM
- [Zod](https://zod.dev/) for schema validation

## Author

Ali Sabet

## Features

- **Bun** as the runtime and package manager
- **TypeScript** for static typing
- **Express** for HTTP server and routing
- **Prisma** for database access
- **Zod** for request/response validation
- Modular folder structure for scalability
- Centralized error handling and async utilities

## Project Structure

```
bun.lock
package.json
tsconfig.json
prisma/
  schema.prisma
src/
  app.ts
  index.ts
  constants/
    index.ts
  core/
    index.ts
  db/
    index.ts
  errors/
    index.ts
  middlewares/
    error/
      global-error-handler.ts
    validate/
      request-validate-types.ts
      request-validate.ts
  routes/
    index.ts
  schemas/
    test.schema.ts
  services/
  types/
    index.ts
  utils/
    catch-async.ts
    errors/
      app-error.ts
      format-prisma-error.ts
```

## Getting Started

1. **Install dependencies**
   ```sh
   bun install
   ```
2. **Setup your database**
   - Edit `prisma/schema.prisma` as needed
   - Run Prisma migrations:
     ```sh
     bunx prisma migrate dev
     ```
3. **Start the development server**
   ```sh
   bun run src/index.ts
   ```

## Scripts

- `bun run src/index.ts` — Start the server
- `bunx prisma migrate dev` — Run database migrations

## License

MIT
