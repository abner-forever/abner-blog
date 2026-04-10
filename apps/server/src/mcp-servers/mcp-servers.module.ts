import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MCPServersService } from './mcp-servers.service';
import { MCPServersController } from './mcp-servers.controller';
import { MCPServer } from '../entities/mcp-server.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MCPServer])],
  controllers: [MCPServersController],
  providers: [MCPServersService],
  exports: [MCPServersService],
})
export class MCPServersModule {}
