import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueConfigService } from './queue-config.service';
import { QUEUE } from '@constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      useClass: QueueConfigService,
    }),
  ],
})
export class QueueModule {}
