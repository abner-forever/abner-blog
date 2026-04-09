import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import {
  McpOauthCompatController,
  McpOauthController,
  McpOauthService,
} from './oauth';
import { McpRequestContextService, McpSessionAuthService } from './services';
import { WeatherTools } from './tools/weather.tools';
import { CalendarTools } from './tools/calendar.tools';
import { TodoTools } from './tools/todo.tools';
import { WeatherModule } from '../weather/weather.module';
import { CalendarModule } from '../calendar/calendar.module';
import { TodosModule } from '../todos/todos.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    WeatherModule,
    CalendarModule,
    TodosModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [McpController, McpOauthController, McpOauthCompatController],
  providers: [
    McpService,
    McpRequestContextService,
    McpSessionAuthService,
    McpOauthService,
    WeatherTools,
    CalendarTools,
    TodoTools,
  ],
  exports: [McpService],
})
export class McpModule {}
