import { SetMetadata } from '@nestjs/common';

export const Roles = (...args: string[]): ReturnType<typeof SetMetadata> =>
    SetMetadata('roles', args);
