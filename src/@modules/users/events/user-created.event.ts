import { User } from '../entities/users.entity';

export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly user: User,
  ) {}
}
