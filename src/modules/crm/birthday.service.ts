import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';
import { User } from 'modules/users/entities/users.entity';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

@Injectable()
export class BirthdayService {
  private readonly logger = new Logger(BirthdayService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectQueue('birthday-messages')
    private birthdayQueue: Queue,
  ) {}

  // Run every hour to get upcoming birthdays
  @Cron('0 0 * * * *')
  async scheduleUpcomingBirthdayMessages() {
    this.logger.log('Scheduling upcoming birthday messages');

    // Get all users who will have their birthday in the next 24 hours
    const users = await this.findUsersWithUpcomingBirthdays();

    this.logger.log(`Found ${users.length} users with upcoming birthdays`);

    for (const user of users) {
      await this.scheduleUserBirthdayMessage(user);
    }
  }

  private async findUsersWithUpcomingBirthdays(): Promise<User[]> {
    const users = await this.userRepository.find();
    const now = dayjs().utc();

    return users.filter((user) => {
      const userNow = now.tz(user.timezone);
      const userNext9AM = this.getNext9AM(userNow, user.timezone);
      const birthdayThisYear = dayjs(user.birthDate)
        .year(userNow.year())
        .tz(user.timezone);
      const birthdayNextYear = birthdayThisYear.add(1, 'year');

      // Check if either this year's or next year's birthday is within 24 hours
      return (
        birthdayThisYear.isSame(userNext9AM, 'day') ||
        birthdayNextYear.isSame(userNext9AM, 'day')
      );
    });
  }

  private getNext9AM(date: dayjs.Dayjs, timezone: string): dayjs.Dayjs {
    let next9AM = date.hour(9).minute(0).second(0).millisecond(0);
    if (date.hour() >= 9) {
      next9AM = next9AM.add(1, 'day');
    }
    return next9AM;
  }

  private async scheduleUserBirthdayMessage(user: User) {
    const userNow = dayjs().tz(user.timezone);
    const userTarget = this.getNext9AM(userNow, user.timezone);
    const delayMs = userTarget.diff(userNow);
    const jobId = `birthday-${user.id}-${userTarget.format('YYYY-MM-DD')}`;

    this.logger.log(
      `Scheduling birthday message for ${user.firstName} ${user.lastName} ` +
        `in timezone ${user.timezone} with delay of ${delayMs}ms`,
    );

    await this.birthdayQueue.add(
      'send-birthday-message',
      {
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        scheduledFor: userTarget.toISOString(),
      },
      {
        delay: delayMs,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
        jobId,
      },
    );
  }

  // Handle user updates
  async handleUserUpdate(userId: string, oldData: User, newData: User) {
    const shouldReSchedule = this.shouldRescheduleBirthday(oldData, newData);

    if (shouldReSchedule) {
      // Remove existing scheduled jobs for this user
      await this.removeScheduledJobs(userId);

      // If the user's new birthday is upcoming, schedule new job
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        const users = await this.findUsersWithUpcomingBirthdays();
        if (users.some((u) => u.id === userId)) {
          await this.scheduleUserBirthdayMessage(user);
        }
      }
    }
  }

  private shouldRescheduleBirthday(oldData: User, newData: User): boolean {
    return (
      oldData.birthDate !== newData.birthDate ||
      oldData.timezone !== newData.timezone
    );
  }

  private async removeScheduledJobs(userId: string) {
    const jobs = await this.birthdayQueue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      if (job.data.userId === userId) {
        await job.remove();
      }
    }
  }
}
