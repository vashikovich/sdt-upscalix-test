import { Module } from '@nestjs/common';
import { BirthdayService } from './birthday.service';
import { BirthdayMessageConsumer } from './birthday.consumer';

@Module({
  providers: [BirthdayService, BirthdayMessageConsumer],
})
export class CrmModule {}
