import { Module } from '@nestjs/common';
import { BullModule, RegisterQueueOptions } from '@nestjs/bullmq';
import { QueueConfigService } from './queue-config.service';
import { QUEUE } from '@constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      useClass: QueueConfigService,
    }),
    BullModule.registerQueue(
      ...Object.keys(QUEUE).map((queue) => ({ name: queue })),
    ),
  ],
})
export class QueueModule {}
