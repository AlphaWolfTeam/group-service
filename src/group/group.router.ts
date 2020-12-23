import { createFeatureRouter } from './endpoints/group.endpoint';

import GetGroupByID from './endpoints/group.getByID';
import GetGroupByUserID from './endpoints/group.getByUser';
import SearchGroupByName from './endpoints/group.searchByName';
import CreateGroup from './endpoints/group.create';
import UpdateGroup from './endpoints/group.update';
import DeleteGroup from './endpoints/group.delete';

import GetUsersOfGroup from './user/enpoints/group.user.get';
import AddUserToGroup from './user/enpoints/group.user.add';
import UpdateUserRole from './user/enpoints/group.user.update';
import RemoveUserFromGroup from './user/enpoints/group.user.remove';

export default createFeatureRouter(
  new GetGroupByID(),         // GET    /:id
  new GetGroupByUserID(),     // GET    /users/:id
  new SearchGroupByName(),    // GET    /
  new CreateGroup(),          // POST   /
  new UpdateGroup(),          // PUT    /:id
  new DeleteGroup(),          // DELETE /:id
  new GetUsersOfGroup(),      // GET    /:id/users
  new AddUserToGroup(),       // POST   /:id/users
  new UpdateUserRole(),       // PUT    /:id/users/:id
  new RemoveUserFromGroup(),  // DELETE /:id/users/:id
);
