import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailConsumer } from './email.consumer';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE } from '@constants';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: QUEUE.EMAIL })],
  providers: [EmailService, EmailConsumer],
  exports: [EmailService],
})
export class EmailModule {}
