import { PrismaPg } from '@prisma/adapter-pg';
import type { PrismaConfig } from 'prisma';

export default {
    migrate: {
        async adapter(env: NodeJS.ProcessEnv) {
            return new PrismaPg({ connectionString: env['DATABASE_URL']! });
        },
    },
} satisfies PrismaConfig;
