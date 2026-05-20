# Module Scaffold Guide

Follow this exact pattern every time you add a new feature module to QuickFix.

---

## File Structure

```
src/modules/<module-name>/
├── <module-name>.module.ts      ← NestJS module declaration
├── <module-name>.controller.ts  ← HTTP handlers only — no logic
├── <module-name>.service.ts     ← All business logic
├── dto/
│   ├── create-<entity>.dto.ts   ← Input DTO (POST body)
│   ├── update-<entity>.dto.ts   ← Update DTO (PATCH body) — usually extends PartialType
│   └── index.ts                 ← Re-exports all DTOs
├── entities/
│   ├── <entity>.entity.ts       ← TypeORM entity
│   └── index.ts
├── repositories/
│   ├── <entity>.repository.ts   ← DB access layer
│   └── index.ts
├── interfaces/
│   ├── <entity>.interface.ts    ← TypeScript interfaces for responses
│   └── index.ts
└── index.ts                     ← Re-exports everything public
```

---

## Step-by-Step: Adding a New Module

### 1. Create the Entity

```typescript
// src/modules/providers/entities/provider.entity.ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Roles } from 'src/common/enums';

@Entity('providers')
export class Provider {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    // ... other columns

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
```

### 2. Generate a Migration

```bash
PG_HOST=localhost npm run migrate:generate -- database/migrations/CreateProvidersTable
```

Review the generated file in `database/migrations/` before running it.

### 3. Create the Repository

```typescript
// src/modules/providers/repositories/providers.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../entities';

@Injectable()
export class ProvidersRepository {
    constructor(
        @InjectRepository(Provider)
        private readonly repo: Repository<Provider>,
    ) {}

    async findAll(): Promise<Provider[]> {
        return this.repo.find();
    }

    async findById(id: number): Promise<Provider | null> {
        return this.repo.findOneBy({ id });
    }

    async create(data: Partial<Provider>): Promise<Provider> {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
}
```

### 4. Create DTOs

```typescript
// src/modules/providers/dto/create-provider.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProviderDto {
    @ApiProperty({ example: 'Ahmed AC Technician', description: 'Provider display name' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
```

```typescript
// src/modules/providers/dto/update-provider.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProviderDto } from './create-provider.dto';

export class UpdateProviderDto extends PartialType(CreateProviderDto) {}
```

### 5. Create the Service

```typescript
// src/modules/providers/providers.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { notFound } from '@hapi/boom';
import { messages, LogModuleTypes } from 'src/common';
import { ProvidersRepository } from './repositories';
import { CreateProviderDto } from './dto';
import { Provider } from './entities';

@Injectable()
export class ProvidersService {
    private readonly logger = new Logger(ProvidersService.name);

    constructor(private readonly providersRepository: ProvidersRepository) {}

    async findAll(): Promise<Provider[]> {
        this.logger.log('Fetching all providers', { module: LogModuleTypes.PROVIDERS });
        return this.providersRepository.findAll();
    }

    async findById(id: number): Promise<Provider> {
        const provider = await this.providersRepository.findById(id);
        if (!provider) throw notFound(messages.PROVIDER.NOT_FOUND);
        return provider;
    }

    async create(dto: CreateProviderDto): Promise<Provider> {
        return this.providersRepository.create(dto);
    }
}
```

### 6. Create the Controller

```typescript
// src/modules/providers/providers.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { messages, descriptions } from 'src/common';
import { JwtAuthGuard } from '../authentication/guards';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto';
import { Provider } from './entities';

@ApiTags('Providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('providers')
export class ProvidersController {
    constructor(private readonly providersService: ProvidersService) {}

    @ApiOperation({ summary: 'List all providers' })
    @Get()
    async findAll(): Promise<{ message: string; data: Provider[] }> {
        const data = await this.providersService.findAll();
        return { message: messages.DATA_FETCHED_SUCCESS, data };
    }

    @ApiOperation({ summary: 'Create a provider' })
    @Post()
    async create(@Body() dto: CreateProviderDto): Promise<{ message: string; data: Provider }> {
        const data = await this.providersService.create(dto);
        return { message: messages.RECORD_CREATED_SUCCESS, data };
    }
}
```

### 7. Wire the Module

```typescript
// src/modules/providers/providers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from './entities';
import { ProvidersRepository } from './repositories';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Provider])],
    providers: [ProvidersRepository, ProvidersService],
    controllers: [ProvidersController],
    exports: [ProvidersService],  // export if other modules need it
})
export class ProvidersModule {}
```

### 8. Register in AppModule

```typescript
// src/app.module.ts — add to imports array:
import { ProvidersModule } from './modules';

@Module({
    imports: [
        // ... existing imports
        ProvidersModule,
    ],
})
export class AppModule {}
```

### 9. Update Common Layer

- Add `PROVIDERS` messages to `src/common/constants/messages.ts`
- Add `PROVIDERS` to `LogModuleTypes` enum if not already there
- Add Swagger descriptions to `src/common/constants/api-description.ts`
- Export the module from `src/modules/index.ts`

---

## Checklist When Adding a Module

- [ ] Entity created with proper TypeORM decorators
- [ ] Migration generated and reviewed
- [ ] Repository wraps all DB access (no raw queries in service)
- [ ] DTOs have `class-validator` + `@ApiProperty` decorators
- [ ] Service uses `Logger` (not `console.log`)
- [ ] Service throws typed exceptions (`@hapi/boom` or NestJS built-ins)
- [ ] Controller is thin (delegates all logic to service)
- [ ] Controller uses `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth` as needed
- [ ] Module registered in `AppModule`
- [ ] Messages added to `src/common/constants/messages.ts`
- [ ] Module exported from `src/modules/index.ts`
