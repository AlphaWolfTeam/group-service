import { ClientError } from './application.error';

export class ResourceNotFound extends ClientError {
  constructor(message?: string) {
    super(message || 'resource not found', 404);
  }
}

export class InvalidArgument extends ClientError {
  constructor(message?: string) {
    super(message || 'One of the arguments is invalid', 400);
  }
}

export class NotAnObjectID extends InvalidArgument {
  constructor(value: any) {
    super(`The value: ${value} is not an object ID.
            \n Object ID must be a single String of 12 bytes or a string of 24 hex characters`);
  }
}

export class GroupNotFound extends ResourceNotFound {
  constructor(groupID: string) {
    super(`The requested group ${groupID} was not found`);
  }
}

export class UserIsNotInGroup extends ClientError {
  constructor(userID: string, groupID: string) {
    super(`The user ${userID} is not in the group ${groupID}`);
  }
}

export class UserAlreadyExistsInGroup extends ResourceNotFound {
  constructor(groupID: string, userID: string) {
    super(`The user ${userID} already exists in the group ${groupID}.`);
  }
}

export class UserCannotPreformActionOnGroup extends ClientError {
  constructor(groupID: string, userID: string, reason?: string) {
    let message = `The user ${userID} cannot preform action on group ${groupID}`;
    if (reason) {
      message += ` because: ${reason}`;
    }
    super(message, 403);
  }
}
