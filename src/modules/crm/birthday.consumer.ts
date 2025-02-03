import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Processor('birthday-messages')
export class BirthdayMessageConsumer extends WorkerHost {
  private readonly logger = new Logger(BirthdayMessageConsumer.name);

  constructor(private configService: ConfigService) {
    super();
  }

  async process(job: Job) {
    const { userId, fullName, scheduledFor } = job.data;

    try {
      await axios.post(
        `${this.configService.get('email.apiUrl')}/send-email`,
        {
          userId,
          message: `Hey, ${fullName} it's your birthday`,
        },
        {
          timeout: 5000,
        },
      );

      this.logger.log(
        `Birthday message sent successfully to ${fullName} (scheduled for ${scheduledFor})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send birthday message to ${fullName}: ${error.message}`,
      );
      throw error;
    }
  }
}
