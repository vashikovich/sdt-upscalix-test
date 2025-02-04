import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import dayjs from 'dayjs';
import { User } from '@modules/users/entities/users.entity';
import { JOB, QUEUE } from '@constants';

@Injectable()
export class BirthdayService {
  private readonly logger = new Logger(BirthdayService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectQueue(QUEUE.BIRTHDAY_CRM)
    private birthdayQueue: Queue,
  ) {}

  // Run every 00:10 AM to get upcoming birthdays in 24 hours
  // (10 mins tolerance for not running on the edge of day and possibly missing some users)
  @Cron('0 10 0 * * *')
  async scheduleUpcomingBirthdayMessages() {
    this.logger.log('Scheduling upcoming birthday messages');

    const users = await this.findUsersWithUpcomingBirthdays();

    this.logger.log(`Found ${users.length} users with upcoming birthdays`);

    for (const user of users) {
      await this.scheduleUserBirthdayMessage(user);
    }
  }

  async findUsersWithUpcomingBirthdays(
    userId?: string,
  ): Promise<(User & { nextBirthday: Date })[]> {
    let qb = this.userRepository
      .createQueryBuilder('user')
      .select(['user.*', 'next_birthday.birthday_timestamp as next_birthday'])
      .innerJoin(
        (query) =>
          query.from(
            `
            WITH case_checks AS (
              SELECT 
                TO_CHAR(NOW(), 'MM-DD') = '12-31' as is_year_end,
                TO_CHAR(NOW(), 'MM-DD') = '01-01' as is_year_start,
                EXTRACT(DAY FROM (
                  MAKE_DATE(EXTRACT(YEAR FROM NOW())::INTEGER, 3, 1) - INTERVAL '1 day'
                ))::INTEGER = 29 as is_leap_year
            ),
            next_birthday AS (
              SELECT 
                user_id,
                TIMEZONE(user.timezone, 
                  MAKE_TIMESTAMPTZ(
                    CASE 
                      WHEN 
                        TO_CHAR(user.birth_date, 'MM-DD') = '01-01'
                        AND (SELECT is_year_end FROM case_checks)
                      THEN EXTRACT(YEAR FROM NOW())::INTEGER + 1

                      WHEN
                        TO_CHAR(user.birth_date, 'MM-DD') = '12-31'
                        AND (SELECT is_year_start FROM case_checks)
                      THEN EXTRACT(YEAR FROM NOW())::INTEGER - 1

                      ELSE EXTRACT(YEAR FROM NOW())::INTEGER
                    END,
                    CASE 
                      WHEN
                        EXTRACT(MONTH FROM user.birth_date)::INTEGER = 2 
                        AND EXTRACT(DAY FROM user.birth_date)::INTEGER = 29 
                        AND (SELECT is_leap_year FROM case_checks)
                      THEN 3
                      ELSE EXTRACT(MONTH FROM user.birth_date)::INTEGER
                    END,
                    CASE 
                      WHEN
                        EXTRACT(MONTH FROM user.birth_date)::INTEGER = 2 
                        AND EXTRACT(DAY FROM user.birth_date)::INTEGER = 29 
                        AND (SELECT is_leap_year FROM case_checks)
                      THEN 1
                      ELSE EXTRACT(DAY FROM user.birth_date)::INTEGER
                    END,
                    9, 0, 0
                  )
                ) as birthday_timestamp
              FROM user
            )
            `,
            'next_birthday',
          ),
        'next_birthday',
        'next_birthday.user_id = user.id',
      )
      .where(
        "next_birthday.birthday_timestamp BETWEEN NOW() AND NOW() + INTERVAL '24 hours'",
      );

    if (userId) qb = qb.andWhere({ id: userId });

    return qb.getMany() as Promise<(User & { nextBirthday: Date })[]>;
  }

  async scheduleUserBirthdayMessage(user: User & { nextBirthday: Date }) {
    const delayMs = dayjs(user.nextBirthday).diff();
    const jobId = user.id;

    this.logger.log(
      `Scheduling birthday message for ${user.fullName} ` +
        `in timezone ${user.timezone} at ${dayjs(user.nextBirthday).format()} (in ${delayMs}ms)`,
    );

    await this.birthdayQueue.add(
      JOB.BIRTHDAY_CRM,
      {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      {
        delay: delayMs,
        jobId,
      },
    );
  }

  async removeUserBirthdayMessage(userId: string) {
    const jobId = userId;

    await this.birthdayQueue.remove(jobId);
  }
}
