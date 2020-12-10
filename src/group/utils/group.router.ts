import { createFeatureRouter } from '../group.endpoint';

import GetGroupByID from '../group.getByID';
import GetGroupByUserID from '../group.getByUser';
import SearchGroupByName from '../group.searchByName';
import CreateGroup from '../group.create';
import UpdateGroup from '../group.update';
import DeleteGroup from '../group.delete';

import GetUsersOfGroup from '../user/group.user.get';
import AddUserToGroup from '../user/group.user.add';
import UpdateUserRole from '../user/group.user.update';
import RemoveUserFromGroup from '../user/group.user.remove';

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
