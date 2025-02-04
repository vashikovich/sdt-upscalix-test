import { User } from '../entities/users.entity';

export class UserUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly oldData: User | null,
    public readonly newData: User,
  ) {}
}
