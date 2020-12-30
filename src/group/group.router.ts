import { createFeatureRouter } from '../utils/endpoint';
// Group Endpoints
import CreateGroup from './endpoints/group.create';
import DeleteGroup from './endpoints/group.delete';
import GetGroupByID from './endpoints/group.getByID';
import GetGroupByUserID from './endpoints/group.getByUser';
import SearchGroupByName from './endpoints/group.searchByName';
import UpdateGroup from './endpoints/group.update';
// Tag Endpoints
import AddTagToGroup from './tag/endpoints/group.tag.add';
import RemoveTagFromGroup from './tag/endpoints/group.tag.remove';
// User Endpoints
import AddUserToGroup from './user/endpoints/group.user.add';
import GetUsersOfGroup from './user/endpoints/group.user.get';
import RemoveUserFromGroup from './user/endpoints/group.user.remove';
import UpdateUserRole from './user/endpoints/group.user.update';

export default createFeatureRouter(
  new GetGroupByID(),         // GET    /:id
  new GetGroupByUserID(),     // GET    /users/:id
  new SearchGroupByName(),    // GET    /
  new CreateGroup(),          // POST   /
  new UpdateGroup(),          // PATCH  /:id
  new DeleteGroup(),          // DELETE /:id
  new AddTagToGroup(),        // PUT    /:id/tags
  new RemoveTagFromGroup(),   // DELETE /:id/tags/:label
  new GetUsersOfGroup(),      // GET    /:id/users
  new AddUserToGroup(),       // POST   /:id/users
  new UpdateUserRole(),       // PUT    /:id/users/:userID
  new RemoveUserFromGroup(),  // DELETE /:id/users/:userID
);
