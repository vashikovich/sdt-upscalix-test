import { JOB, QUEUE } from '@constants';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue(QUEUE.EMAIL)
    private readonly emailQueue: Queue,
  ) {}

  private logger = new Logger(EmailService.name);

  async sendEmail(options: ISendMailOptions) {
    try {
      if (process.env.NODE_ENV === 'test') {
        return true;
      }

      await this.emailQueue.add(JOB.SEND_EMAIL, options);
      return true;
    } catch (e) {
      this.logger.error('An error occured while adding send mail job', e);
      return false;
    }
  }
}
