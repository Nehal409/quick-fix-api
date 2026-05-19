import { IsNotEmpty, IsObject } from 'class-validator';

export class ClarifyRequestDto {
    @IsObject({ message: 'Answers must be an object keyed by clarification id.' })
    @IsNotEmpty({ message: 'Answers are required.' })
    answers: Record<string, string>;
}
