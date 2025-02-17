import {
  BullRootModuleOptions,
  SharedBullConfigurationFactory,
} from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueConfigService implements SharedBullConfigurationFactory {
  constructor(private configService: ConfigService) {}
  createSharedConfiguration(): BullRootModuleOptions {
    return {
      connection: {
        host: this.configService.get('redis.host'),
        port: +this.configService.get('redis.port'),
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    };
  }
}
