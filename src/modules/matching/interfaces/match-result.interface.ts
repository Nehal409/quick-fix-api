import { FactorComputation } from './factor.interface';

export interface MatchResult {
    providerId: number;
    matchScore: number;
    factors: FactorComputation[];
}
