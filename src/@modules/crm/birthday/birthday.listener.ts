import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BirthdayService } from './birthday.service';
import { UserCreatedEvent } from '../../users/events/user-created.event';
import { UserUpdatedEvent } from '../../users/events/user-updated.event';
import { UserDeletedEvent } from '../../users/events/user-deleted.event';
import { EVENT } from '@constants';

@Injectable()
export class BirthdayListener {
  constructor(private readonly birthdayService: BirthdayService) {}

  @OnEvent(EVENT.USER_CREATED)
  async handleUserCreated(event: UserCreatedEvent) {
    const upcomings = await this.birthdayService.findUsersWithUpcomingBirthdays(
      event.userId,
    );
    if (upcomings.length > 0)
      await this.birthdayService.scheduleUserBirthdayMessage(upcomings[0]);
  }

  @OnEvent(EVENT.USER_UPDATED)
  async handleUserUpdated(event: UserUpdatedEvent) {
    const upcomings = await this.birthdayService.findUsersWithUpcomingBirthdays(
      event.userId,
    );
    await this.birthdayService.removeUserBirthdayMessage(event.userId);
    if (upcomings.length > 0)
      await this.birthdayService.scheduleUserBirthdayMessage(upcomings[0]);
  }

  @OnEvent(EVENT.USER_DELETED)
  async handleUserDeleted(event: UserDeletedEvent) {
    await this.birthdayService.removeUserBirthdayMessage(event.userId);
  }
}
