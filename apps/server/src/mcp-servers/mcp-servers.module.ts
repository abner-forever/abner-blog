import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MCPServersService } from './mcp-servers.service';
import { MCPServersController } from './mcp-servers.controller';
import { MCPServer } from '../entities/mcp-server.entity';
import { McpModule } from '../mcp';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MCPServer]), McpModule, AuthModule],
  controllers: [MCPServersController],
  providers: [MCPServersService],
  exports: [MCPServersService],
})
export class MCPServersModule {}
