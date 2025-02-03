import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUE } from '@constants';

@Processor(QUEUE.EMAIL)
export class EmailConsumer {
  constructor(private readonly mailService: MailerService) {}

  private logger = new Logger(EmailConsumer.name);

  async sendMail({ data }: Job<ISendMailOptions>) {
    try {
      await this.mailService.sendMail(data);
      this.logger.log(
        `Email ${data.template || ''} has been sent with context ${
          JSON.stringify(data.context) || ''
        }`,
      );
    } catch (e) {
      this.logger.error(
        `An error occur while sending email ${data.template || ''} with context ${
          JSON.stringify(data.context) || ''
        }`,
        e,
      );
    }
  }
}
