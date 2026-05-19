import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ProvidersSeeder } from '../src/modules/providers/seeders';

async function run(): Promise<void> {
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    try {
        const seeder = app.get(ProvidersSeeder);
        const { created, skipped } = await seeder.seed();
        console.log(`[Seed] Providers — created: ${created}, skipped: ${skipped}`);
    } finally {
        await app.close();
    }
}

run().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
