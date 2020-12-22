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

export class UserIsNotInGroup extends ResourceNotFound {
  constructor(userID: string, groupID: string) {
    super(`The user ${userID} is not in the group ${groupID}. The group may not even exist.`);
  }
}

export class UserAlreadyExistsInGroup extends ClientError {
  constructor(groupID: string, userID: string) {
    super(`The user ${userID} already exists in the group ${groupID}.`, 409);
  }
}

export class CannotAccessGroup extends ClientError {
  constructor(groupID?: string, userID?: string) {
    super(`The user ${userID} cannot get details on private group ${groupID} that he is not in.`, 403);
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

/**
 * UniqueIndexExistsError is a type of a ClientError, where @code will
 * always be `CONFLICT`. The default error message will include the unique
 * index fields and value in it's metadata.
 */
export class UniqueIndexExistsError extends ClientError {
  /**
   * The constructor of UniqueIndexExistsError.
   * @param uniqueIndexFields list of the unique indexes fields that failed the action.
   * @param uniqueIndexValues list of the unique indexes value that already exists.
   * @param message A custom message
   */
  constructor(uniqueIndexFields: string, uniqueIndexValues: string, message?: string) {
    super(
      message || `unique index duplicate error: The unique index <${uniqueIndexFields}> already has the keys: ${uniqueIndexValues}`,
      409,
    );
  }
}
