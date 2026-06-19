import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: './apps/krypto/core/db/schema.ts',
	out: './apps/krypto/core/db/migrations',
	dialect: 'sqlite',
	driver: 'd1-http',
})
