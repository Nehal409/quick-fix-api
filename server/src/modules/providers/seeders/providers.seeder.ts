import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { LogModuleTypes } from 'src/common';
import { User } from '../../users/entities';
import { Provider } from '../entities';
import { SEED_PROVIDER_PASSWORD, SEED_PROVIDERS } from './providers.data';

@Injectable()
export class ProvidersSeeder {
    private readonly logger = new Logger(LogModuleTypes.PROVIDERS);

    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    async seed(): Promise<{ created: number; skipped: number }> {
        const passwordHash = await bcrypt.hash(SEED_PROVIDER_PASSWORD, 12);
        let created = 0;
        let skipped = 0;

        await this.dataSource.transaction(async (manager) => {
            for (const seed of SEED_PROVIDERS) {
                const existingUser = await manager.findOne(User, {
                    where: { email: seed.user.email },
                });
                if (existingUser) {
                    skipped += 1;
                    continue;
                }

                const user = await manager.save(
                    manager.create(User, {
                        email: seed.user.email,
                        name: seed.user.name,
                        passwordHash,
                        role: seed.role,
                    }),
                );

                await manager.save(
                    manager.create(Provider, {
                        userId: user.id,
                        ...seed.provider,
                    }),
                );

                created += 1;
            }
        });

        this.logger.log({
            message: `Seeded ${created} providers (${skipped} already existed)`,
            data: { password: SEED_PROVIDER_PASSWORD },
        });
        return { created, skipped };
    }
}
