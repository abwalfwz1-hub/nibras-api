# Nibras Platform API

NestJS API for the Nibras Syria educational platform. The service uses Prisma/PostgreSQL, Arabic RTL-compatible API contracts, RBAC, school isolation, progress persistence, and offline event synchronization.

## Render deployment

Render uses `render.yaml`. Set `DATABASE_URL` as a secret and let Render generate the JWT secrets. The build generates Prisma Client and compiles NestJS; the start command applies migrations before listening on Render's port.
