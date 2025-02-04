import { ISendMailOptions } from '@nestjs-modules/mailer';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUE } from '@constants';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import { readFileSync } from 'fs';
import { compile } from 'handlebars';

@Processor(QUEUE.EMAIL)
export class EmailConsumer extends WorkerHost {
  constructor(private configService: ConfigService) {
    super();
  }

  private logger = new Logger(EmailConsumer.name);

  async process({ data }: Job<ISendMailOptions>) {
    try {
      await this.sendEmail(data);
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
      throw e;
    }
  }

  private async sendEmail(options: ISendMailOptions) {
    const templatePath = path.join(
      __dirname,
      'template',
      `${options.template}.hbs`,
    );
    const templateContent = readFileSync(templatePath, 'utf-8');
    const template = compile(templateContent);
    const content = template(options.context);
    await axios.post(
      `${this.configService.get('email.apiUrl')}/send-email`,
      {
        email: options.to,
        message: content,
      },
      {
        timeout: 5000,
      },
    );
  }
}
