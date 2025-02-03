import { User } from '../entities/users.entity';

export class UserCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly user: User,
  ) {}
}
