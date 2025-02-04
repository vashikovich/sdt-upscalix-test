import { Module } from '@nestjs/common';
import { BirthdayService } from './birthday/birthday.service';
import { BirthdayMessageConsumer } from './birthday/birthday.consumer';
import { EmailModule } from '@modules/utility/email/email.module';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE } from '@constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/users/entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EmailModule,
    BullModule.registerQueue({ name: QUEUE.BIRTHDAY_CRM }),
  ],
  providers: [BirthdayService, BirthdayMessageConsumer],
})
export class CrmModule {}
