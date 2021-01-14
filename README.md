# Group Service

  A service that provides a REST API for CRUD operations on groups.
  
  The service should be connected to a mongodb in order to run.

## API Endpoints
| Method                    | Verb   | Route             | [User Header](###user-header) Required | Reference                                      |
|---------------------------|--------|-------------------|---------------------------------------------|------------------------------------------------|
| Get group by ID           | GET    | /:id              | Sometimes                                   |                                                |
| Get groups by user        | GET    | /users/:id        | **Yes**                                     |                                                |
| Search Group              | GET    | /                 | Sometimes                                   |                                                |
| Create Group              | POST   | /                 | **Yes**                                     | [body params](###create-group)                 |
| Update Group              | PATCH  | /:id              | **Yes**                                     | [body params](###update-group)                 |
| Delete Group              | DELETE | /:id              | **Yes**                                     |                                                |
| Add tag to group          | PUT    | /:id/tags/:label  | **Yes**                                     |                                                |
| Remove tag from group     | DELETE | /:id/tags/:label  | **Yes**                                     |                                                |
| Add user to group         | POST   | /groups/:id/users | **Yes**                                     | [body params](###add-user-to-group)            |
| Update user role in group | PATCH  | /:id/users/:id    | **Yes**                                     | [body params](###update-user's-role-in-group)  |
| Remove user from group    | DELETE | /:id/users/:id    | **Yes**                                     |                                                |
| Get users of group        | GET    | /:id/users        | Sometimes                                   |                                                |

## Roles and Permissions
### User Roles
Each user in a group have a single role which can be one of following:
| Value(number) | Role name | Role Description                                |
|---------------|-----------|-------------------------------------------------|
| 0             | member    | a simple member of the group                    |
| 1             | modifier  | a member who can modify the group in some ways  |
| 2             | manager   | have full control over the group                |

### User Header
Most of the API endpoints require a `requesterID` - the user ID of the requester. The ID should be sent in a header (usually `X-User-ID`).
Endpoints that do not always require a requester may return a `Forbidden` error in some cases where `requesterID` is necessary. Therefore sending a `requesterID` is always advised.

### Permissions
The endpoints that require a `requesterID` validate that the user have the permission for the action he requested. The service finds the requester role in the group, and then compares it with the required role for that action by the `requiredRole` found in [this file](src/group/user/user.role.ts).

The requester  must be in a group in order to make CRUD requests on it, unless it's a `GET` on a `public` group.

## Body Payload

### Create Group
| Key         | Optional  | Type    | Description                                                     | Example
|-------------|-----------|---------|-----------------------------------------------------------------|---------
| name        | **No**    | string  | The name of the group                                           | "my team"
| description | **No**    | string  | A description of the group                                      | "the best team ever!!1"
| type        | Yes       | string  | The type of the group can be `public` (by default) or `private` | "private"

### Update Group
| Key         | Optional  | Type    | Required Role | Description                                                     | Example
|-------------|-----------|---------|---------------|-----------------------------------------------------------------|---------
| name        | Yes       | string  | modifier      | The name of the group                                           | "my team"
| description | Yes       | string  | modifier      | A description of the group                                      | "the best team ever!!1"
| type        | Yes       | string  | modifier      | The type of the group can be `public` (by default) or `private` | "public"

### Add User to Group
| Key   | Optional  | Type    | Description                           | Example
|-------|-----------|---------|---------------------------------------|---------
| id    | **No**    | string  | The user ID to add to the group       | "12345678987"
| role  | Yes       | number  | The role of the new user in the group | 1

### Update User's Role in Group
| Key   | Optional  | Type    | Description                           | Example
|-------|-----------|---------|---------------------------------------|---------
| role  | **No**    | number  | The role of the new user in the group | 1