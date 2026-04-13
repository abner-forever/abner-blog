import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AICommandService } from './services/ai-command.service';
import { AIService } from './ai.service';
import { CalendarModule } from '../calendar/calendar.module';
import { TodosModule } from '../todos/todos.module';
import { WeatherModule } from '../weather/weather.module';
import { AIConfigModule } from './ai-config.module';
import { AIChatSessionService } from './services/ai-chat-session.service';
import { AIWeatherService } from './services/ai-weather.service';
import { AIChatResponseService } from './services/ai-chat-response.service';
import { McpModule } from '../mcp/mcp.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { WebSearchModule } from '../web-search/web-search.module';
import { SkillsModule } from '../skills/skills.module';

@Module({
  imports: [
    AIConfigModule,
    CalendarModule,
    TodosModule,
    WeatherModule,
    WebSearchModule,
    McpModule,
    KnowledgeBaseModule,
    SkillsModule,
  ],
  controllers: [AIController],
  providers: [
    AIService,
    AICommandService,
    AIChatSessionService,
    AIWeatherService,
    AIChatResponseService,
  ],
  exports: [AIService],
})
export class AIModule {}
