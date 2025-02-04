import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EMAIL_TEMPLATE, QUEUE } from '@constants';
import { EmailService } from '@modules/utility/email/email.service';

@Processor(QUEUE.BIRTHDAY_CRM)
export class BirthdayMessageConsumer extends WorkerHost {
  private readonly logger = new Logger(BirthdayMessageConsumer.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<{ userId: string; email: string; fullName: string }>) {
    const { email, fullName } = job.data;

    try {
      await this.emailService.sendEmail({
        template: EMAIL_TEMPLATE.HAPPY_BIRTHDAY_CRM,
        to: email,
        subject: `Happy Birthday, ${fullName}!`,
        context: job.data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send birthday message to ${fullName}: ${error.message}`,
      );
      throw error;
    }
  }
}
