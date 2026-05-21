import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini';
import { MatchingModule } from '../matching';
import { PricingModule } from '../pricing';
import { ProvidersModule } from '../providers';
import { BookingAgentService } from './booking';
import { DiscoveryAgentService } from './discovery';
import { IntentAgentService } from './intent';
import { PricingAgentService } from './pricing';
import { RankingAgentService } from './ranking';
import { AgentOrchestratorService } from './services';

@Module({
    imports: [GeminiModule, MatchingModule, PricingModule, ProvidersModule],
    providers: [
        AgentOrchestratorService,
        IntentAgentService,
        DiscoveryAgentService,
        RankingAgentService,
        PricingAgentService,
        BookingAgentService,
    ],
    exports: [
        AgentOrchestratorService,
        IntentAgentService,
        DiscoveryAgentService,
        RankingAgentService,
        PricingAgentService,
        BookingAgentService,
    ],
})
export class AgentsModule {}
