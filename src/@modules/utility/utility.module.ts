import { Module } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [QueueModule, EmailModule],
})
export class UtilityModule {}
