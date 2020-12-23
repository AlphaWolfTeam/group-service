import * as request from 'supertest';
import Server from '../server';
import * as mongoose from 'mongoose';
import config from '../config';
import CreateGroup from './endpoints/group.create';
import { IGroup, GroupType, IGroupPrimal } from './group.interface';
import { UserRole } from './user/user.role';
import GetGroupByID from './endpoints/group.getByID';
import { GroupNotFound } from '../utils/errors/client.error';
import GroupRepository from './group.repository';
import GroupFunctions from './group.sharedFunctions';

const GROUP_ID = mongoose.Types.ObjectId().toHexString();
const USER_ID = mongoose.Types.ObjectId().toHexString();
const USER_2_ID = mongoose.Types.ObjectId().toHexString();
const USER_3_ID = mongoose.Types.ObjectId().toHexString();
const USER_4_ID = mongoose.Types.ObjectId().toHexString();

describe('Group Service', () => {
  const app = new Server('8000', 'test').app;

  beforeAll(async () => {
    await mongoose.connect(config.mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });
    await mongoose.connection.db.dropDatabase();
  });

  beforeEach(async () => {
    const removeCollectionPromises = [];
    for (const i in mongoose.connection.collections) {
      removeCollectionPromises.push(mongoose.connection.collections[i].deleteMany({}));
    }
    await Promise.all(removeCollectionPromises);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Get Group By ID', () => {
    test('should throw a validation error if the id sent is not an objectID', async () => {
      const res = await request(app).get(`/${123}`);
      expect(res.status).toEqual(400);
    });

    test('should return NotFound if group does not exist', async () => {
      const res = await request(app).get(`/${GROUP_ID}`);
      expect(res.status).toEqual(404);
    });

    test('should return a public group by its ID', async () => {
      const group = await createGroupHelper();

      const res = await request(app).get(`/${group._id}`);
      expect(res.status).toEqual(200);
      expect(res.body).toMatchObject({ name: 'group' });
    });

    test('should return a private group by its ID, if requested by a user in the group', async () => {
      const group = await createGroupHelper({ userID: USER_ID, type: GroupType.Private });

      const res = await request(app)
        .get(`/${group._id}`)
        .send({})
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(200);
      expect(res.body).toMatchObject({ name: 'group' });
    });

    test('should return Forbidden error if the group is private and the requester is not in it', async() => {
      const group = await createGroupHelper({ userID: USER_ID, type: GroupType.Private });

      let res = await request(app).get(`/${group._id}`);
      expect(res.status).toEqual(403);

      res = await request(app)
        .get(`/${group._id}`)
        .send({})
        .set({ [config.userHeader]: USER_2_ID });
    });
  });

  describe('Get Groups of user', () => {
    test('should return an empty array if the users have no groups', async () => {
      const res = await request(app).get(`/users/${USER_ID}`);
      expect(res.status).toEqual(200);
      const groups: IGroup[] = res.body;
      expect(groups).toHaveLength(0);
    });

    test('should return all of the users groups and only them', async () => {
      await createGroupHelper();
      await createGroupHelper({ userID: USER_2_ID });
      await createGroupHelper({ userID: USER_2_ID });
      // TODO: add a group which user2 is just a member of.

      const res = await request(app).get(`/users/${USER_2_ID}`);
      expect(res.status).toEqual(200);

      const groups: IGroup[] = res.body;
      expect(groups).toHaveLength(2);
    });
  });

  describe('Search groups by name', () => {
    test('should throw a validation error if partialName is not at least 2 chars', async () => {
      const res = await request(app).get('/').query({ partialName: 'j' });
      expect(res.status).toEqual(400);
    });

    test('should return an empty array if there is no matching group', async () => {
      await createGroupHelper();

      const res = await request(app).get('/').query({ partialName: 'hello' });
      expect(res.status).toEqual(200);

      const groups: IGroup[] = res.body;
      expect(groups).toHaveLength(0);
    });

    test('should return the groups that match the partialName', async() => {
      const group1 = await createGroupHelper({ name: 'fox' });
      const group2 = await createGroupHelper({ name: 'firefox' });
      const group3 = await createGroupHelper({ name: 'fox-news' });
      const group4 = await createGroupHelper({ name: 'proxy' });

      const res = await request(app).get('/').query({ partialName: 'fox' });
      expect(res.status).toEqual(200);

      const groups: IGroup[] = res.body;
      expect(groups).toHaveLength(3);

    });
  });

  describe('Create a new group', () => {
    test('should create a simple group', async () => {
      const partialGroup: Partial<IGroup> = {
        name: 'group',
        description: 'a group',
        type: GroupType.Private,
      };

      const res = await request(app)
        .post('/')
        .send(partialGroup)
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(201);

      const group: IGroup = res.body;
      expect(group).toHaveProperty('_id');
      expect(group).toHaveProperty('name', partialGroup.name);
      expect(group).toHaveProperty('description', partialGroup.description);
      expect(group).toHaveProperty('type', partialGroup.type);
      expect(group).toHaveProperty('modifiedBy', USER_ID);
      expect(group).toHaveProperty('createdBy', USER_ID);

      // Check the the requester was added as manager
      const groupUsers = group.users;
      expect(groupUsers).toHaveLength(1);
      expect(groupUsers[0].id).toEqual(USER_ID);
      expect(groupUsers[0].role).toEqual(UserRole.Admin);
    });

    test('should create a public group by default', async () => {
      const partialGroup: Partial<IGroup> = {
        name: 'group',
        description: 'a group',
      };
      const res = await request(app)
        .post('/')
        .send(partialGroup)
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(201);

      const group: IGroup = res.body;
      expect(group).toHaveProperty('type', GroupType.Public);
    });

    test('should throw a validation error if some of the required fields are lacking', async () => {
      // name is missing
      let res = await request(app)
        .post('/')
        .send({
          description: 'a group',
        })
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(400);

      // description is missing
      res = await request(app)
        .post('/')
        .send({
          name: 'group',
        })
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(400);

      // both name and description are missing.
      res = await request(app)
        .post('/')
        .send({})
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(400);
    });

    test('should throw a validation error if a requester is not sent', async () => {
      const res = await request(app)
        .post('/')
        .send({
          name: 'group',
          description: 'a group',
        });

      expect(res.status).toEqual(400);
    });
  });

  describe('Update group values', () => {
    test('should throw a validation error if a requester is not sent', async () => {
      const group = await createGroupHelper();
      const res = await request(app)
        .put(`/${group._id}`)
        .send({});

      expect(res.status).toEqual(400);
    });

    test('should return NotFound error if the group does not exist', async () => {
      const res = await request(app)
        .put(`/${GROUP_ID}`)
        .send({})
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(404);
    });

    test('should return Forbidden error if the requester is not in the group', async () => {
      const group = await createGroupHelper();

      const partialGroup: Partial<IGroup> = {
        name: 'updated group',
        description: 'an updated group',
        type: GroupType.Private,
      };

      const res = await request(app)
        .put(`/${group._id}`)
        .send(partialGroup)
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(403);
    });

    test('should return a Forbidden error when user does not have required permission to group ', async () => {
      const group = await createGroupHelper({ userID: USER_ID });

      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Member);

      const partialGroup: Partial<IGroup> = {
        name: 'updated group',
        description: 'an updated group',
        type: GroupType.Private,
      };

      const res = await request(app)
        .put(`/${group._id}`)
        .send(partialGroup)
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(403);
    });

    test('should let a user with modifier permission to update group ', async () => {
      const group = await createGroupHelper({ userID: USER_ID });

      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);

      const partialGroup: Partial<IGroup> = {
        name: 'updated group',
        description: 'an updated group',
        type: GroupType.Private,
      };

      const res = await request(app)
        .put(`/${group._id}`)
        .send(partialGroup)
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(200);
    });

    test('should update a group', async () => {
      const group = await createGroupHelper();

      const partialGroup: Partial<IGroup> = {
        name: 'updated group',
        description: 'an updated group',
        type: GroupType.Private,
      };

      const res = await request(app)
        .put(`/${group._id}`)
        .send(partialGroup)
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(200);

      const updatedGroup: IGroup = res.body;
      expect(updatedGroup).toHaveProperty('_id');
      expect(updatedGroup).toHaveProperty('name', partialGroup.name);
      expect(updatedGroup).toHaveProperty('description', partialGroup.description);
      expect(updatedGroup).toHaveProperty('type', partialGroup.type);
      expect(updatedGroup).toHaveProperty('modifiedBy', USER_ID);
      expect(updatedGroup).toHaveProperty('createdBy', USER_ID);

    });

    test('should update just the name of a group', async () => {
      const group = await createGroupHelper();

      const partialGroup: Partial<IGroup> = {
        name: 'updated group',
      };

      const res = await request(app)
        .put(`/${group._id}`)
        .send(partialGroup)
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(200);

      const updatedGroup: IGroup = res.body;
      expect(updatedGroup).toHaveProperty('_id');
      expect(updatedGroup).toHaveProperty('name', partialGroup.name);
      expect(updatedGroup).toHaveProperty('description', group.description);
      expect(updatedGroup).toHaveProperty('type', group.type);
      expect(updatedGroup).toHaveProperty('modifiedBy', USER_ID);
      expect(updatedGroup).toHaveProperty('createdBy', USER_ID);

    });
  });

  describe('Delete group by ID', () => {
    test('should delete group by ID', async () => {
      const group = await createGroupHelper({ userID: USER_ID  });
      const res = await request(app)
        .delete(`/${group._id}`)
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(200);
      const deletedID: string = res.body.id;

      await expect(GetGroupByID.logic(deletedID))
        .rejects
        .toThrow(GroupNotFound);
    });

    test('should return a NotFound error if requesting to delete a file which does not exist', async () => {
      const res = await request(app)
        .delete(`/${GROUP_ID}`)
        .set({ [config.userHeader]: USER_ID });
      expect(res.status).toEqual(404);
    });

    test('should return a Forbidden error if the requester is not in the group', async () => {
      const group = await createGroupHelper({ userID: USER_ID  });
      const res = await request(app)
        .delete(`/${group._id}`)
        .set({ [config.userHeader]: USER_2_ID });
      expect(res.status).toEqual(403);
    });

    test('should return a Validation error if no requester sent', async () => {
      const group = await createGroupHelper({ userID: USER_ID  });
      const res = await request(app)
        .delete(`/${group._id}`);
      expect(res.status).toEqual(400);
    });

    test('should return a Forbidden error if the requester does not have permission to delete group', async () => {
      const group = await createGroupHelper({ userID: USER_ID  });
      const res = await request(app)
        .delete(`/${group._id}`)
        .set({ [config.userHeader]: USER_2_ID });
      expect(res.status).toEqual(403);
    });
  });

  describe('Get users of group', () => {
    test('should return the creator of the public group, even if the user is not in group', async () => {
      const group = await createGroupHelper({ userID: USER_ID, type: GroupType.Public });
      const res = await request(app)
        .get(`/${group._id}/users`)
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(200);

      const users = res.body;
      expect(users).toHaveLength(1);
      expect(users[0]).toHaveProperty('id', USER_ID);
      expect(users[0]).toHaveProperty('role', UserRole.Admin);
    });

    test('should return Forbidden error if the group is private and the requester is not in it', async () => {
      const group = await createGroupHelper({ userID: USER_ID, type: GroupType.Private });
      let res = await request(app)
        .get(`/${group._id}/users`)
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(403);

      // Without sending a requester
      res = await request(app)
        .get(`/${group._id}/users`);

      expect(res.status).toEqual(403);
    });

    test('should return all the users of a group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Member);
      await addUserToGroupHelper(group._id, USER_3_ID, UserRole.Modifier);

      const res = await request(app)
        .get(`/${group._id}/users`)
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(200);

      const users = res.body;

      expect(users).toHaveLength(3);
      expect(users[0]).toHaveProperty('id', USER_ID);
      expect(users[0]).toHaveProperty('role', UserRole.Admin);
      expect(users[1]).toHaveProperty('id', USER_2_ID);
      expect(users[1]).toHaveProperty('role', UserRole.Member);
      expect(users[2]).toHaveProperty('id', USER_3_ID);
      expect(users[2]).toHaveProperty('role', UserRole.Modifier);
    });
  });

  describe('Add user to group', () => {
    test('should add user to a group as member by default', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      const res = await request(app)
        .post(`/${group._id}/users`)
        .send({ id: USER_2_ID })
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(201);
      const user = res.body;
      expect(user).toHaveProperty('id', USER_2_ID);
      expect(user).toHaveProperty('role', UserRole.Member);

      const updatedGroup = await GroupFunctions.getGroupByID(group._id);
      expect(updatedGroup).toHaveProperty('users');
      expect(updatedGroup?.users).toHaveLength(2);
      expect(updatedGroup?.users[0]).toHaveProperty('id', USER_ID);
      expect(updatedGroup?.users[0]).toHaveProperty('role', UserRole.Admin);
      expect(updatedGroup?.users[1]).toHaveProperty('id', USER_2_ID);
      expect(updatedGroup?.users[1]).toHaveProperty('role', UserRole.Member);

    });

    test('should return NotFound if the group does not exist', async () => {
      const res = await request(app)
      .post(`/${GROUP_ID}/users`)
      .send({ id: USER_2_ID })
      .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(404);
    });

    test('should return Conflict error if the user already exist in the group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      const res = await request(app)
        .post(`/${group._id}/users`)
        .send({ id: USER_ID })
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(409);
    });

    test('should return Forbidden error if the requester does not have a permission to add a user to group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Member);

      const res = await request(app)
        .post(`/${group._id}/users`)
        .send({ id: USER_3_ID })
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(403);
    });

    test('should return Forbidden error if the requester does not have a permission to add a user to group with a strong role', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);

      const res = await request(app)
        .post(`/${group._id}/users`)
        .send({ id: USER_3_ID, role: UserRole.Admin })
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(403);
    });
  });

  describe('Update user role in group', () => {
    test('should update user role in group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);

      let res = await request(app)
        .put(`/${group._id}/users/${USER_2_ID}`)
        .send({ role: UserRole.Admin })
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(200);

      expect(res.body).toHaveProperty('id', USER_2_ID);
      expect(res.body).toHaveProperty('role', UserRole.Admin);

      res = await request(app)
        .put(`/${group._id}/users/${USER_2_ID}`)
        .send({ role: UserRole.Member })
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(200);

      expect(res.body).toHaveProperty('id', USER_2_ID);
      expect(res.body).toHaveProperty('role', UserRole.Member);
    });

    test('should return NotFound error if the group does not exist', async () => {
      const res = await request(app)
        .put(`/${GROUP_ID}/users/${USER_2_ID}`)
        .send({ role: UserRole.Admin })
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(404);
    });

    test('should return InvalidArgument error if no role is sent', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);

      const res = await request(app)
        .put(`/${group._id}/users/${USER_2_ID}`)
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(400);
    });

    test('should return Forbidden error if the requester is not in the group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);

      const res = await request(app)
        .put(`/${group._id}/users/${USER_2_ID}`)
        .send({ role: UserRole.Admin })
        .set({ [config.userHeader]: USER_3_ID });

      expect(res.status).toEqual(403);
    });

    test('should return NotFound error if the user is not in the group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });

      const res = await request(app)
        .put(`/${group._id}/users/${USER_2_ID}`)
        .send({ role: UserRole.Admin })
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(404);
    });

    test('should return Forbidden error if the requesting user does not have a sufficient role', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);
      await addUserToGroupHelper(group._id, USER_3_ID, UserRole.Member);

      // a modifier trying to promote himself to admin
      let res = await request(app)
        .put(`/${group._id}/users/${USER_2_ID}`)
        .send({ role: UserRole.Admin })
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(403);

      // a modifier trying to demote an admin
      res = await request(app)
        .put(`/${group._id}/users/${USER_ID}`)
        .send({ role: UserRole.Modifier })
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(403);

      // a modifier trying to promote himself to admin
      res = await request(app)
        .put(`/${group._id}/users/${USER_2_ID}`)
        .send({ role: UserRole.Member })
        .set({ [config.userHeader]: USER_3_ID });

      expect(res.status).toEqual(403);
    });
  });

  describe('Remove user from group', () => {
    test('should remove user from group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);
      await addUserToGroupHelper(group._id, USER_3_ID, UserRole.Member);

      let res = await request(app)
        .delete(`/${group._id}/users/${USER_3_ID}`)
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(200);

      expect(res.body).toEqual(USER_3_ID);

      res = await request(app)
        .delete(`/${group._id}/users/${USER_2_ID}`)
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(200);

      expect(res.body).toEqual(USER_2_ID);
    });

    test('should let an admin remove another admin from group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Admin);

      const res = await request(app)
        .delete(`/${group._id}/users/${USER_2_ID}`)
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(200);

      expect(res.body).toEqual(USER_2_ID);
    });

    test('should let a user remove himself from a group regardless of his role', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);
      await addUserToGroupHelper(group._id, USER_3_ID, UserRole.Member);

      // A member trying to remove himself
      let res = await request(app)
        .delete(`/${group._id}/users/${USER_3_ID}`)
        .set({ [config.userHeader]: USER_3_ID });
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(USER_3_ID);

      // A modifier trying to remove himself
      res = await request(app)
        .delete(`/${group._id}/users/${USER_2_ID}`)
        .set({ [config.userHeader]: USER_2_ID });
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(USER_2_ID);

      // An admin trying to remove himself
      res = await request(app)
        .delete(`/${group._id}/users/${USER_ID}`)
        .set({ [config.userHeader]: USER_ID });
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(USER_ID);
    });

    test('should return NotFound error if the group does not exist', async () => {
      const res = await request(app)
        .delete(`/${GROUP_ID}/users/${USER_2_ID}`)
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(404);
    });

    test('should return Forbidden error if the requester is not in the group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);

      const res = await request(app)
        .delete(`/${group._id}/users/${USER_2_ID}`)
        .set({ [config.userHeader]: USER_3_ID });

      expect(res.status).toEqual(403);
    });

    test('should return NotFound error if the user is not in the group', async () => {
      const group = await createGroupHelper({ userID: USER_ID });

      const res = await request(app)
        .delete(`/${group._id}/users/${USER_2_ID}`)
        .send({ role: UserRole.Admin })
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(404);
    });

    test('should return Forbidden error if the requesting user does not have a sufficient role', async () => {
      const group = await createGroupHelper({ userID: USER_ID });
      await addUserToGroupHelper(group._id, USER_2_ID, UserRole.Modifier);
      await addUserToGroupHelper(group._id, USER_3_ID, UserRole.Modifier);
      await addUserToGroupHelper(group._id, USER_4_ID, UserRole.Member);

      // a modifier trying to delete an admin
      let res = await request(app)
        .put(`/${group._id}/users/${USER_ID}`)
        .send({ role: UserRole.Admin })
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(403);

      // a modifier trying to delete another modifier
      res = await request(app)
        .put(`/${group._id}/users/${USER_2_ID}`)
        .send({ role: UserRole.Modifier })
        .set({ [config.userHeader]: USER_3_ID });

      expect(res.status).toEqual(403);

      // a member trying to delete a member
      res = await request(app)
        .put(`/${group._id}/users/${USER_3_ID}`)
        .send({ role: UserRole.Member })
        .set({ [config.userHeader]: USER_4_ID });

      expect(res.status).toEqual(403);
    });
  });
});

/**
 * create a new group with option to configure userID and group name.
 * @param userID
 * @param name
 * @returns the new created group.
 */
const createGroupHelper = async ({ userID, name, type }: { userID?: string, name?: string, type?: GroupType } = {}) => {
  const group: IGroupPrimal = {
    name: name || 'group',
    description: 'a group',
    type: type || GroupType.Public,
    users: [{
      id: userID || USER_ID,
      role: UserRole.Admin,
    }],
    modifiedBy: userID || USER_ID,
    createdBy: userID || USER_ID,
  };
  const createdGroup: IGroup = await CreateGroup.logic(group);
  return createdGroup;
};

/**
 * add a user to a group with a specific role.
 * @param groupID
 * @param userID
 * @param role
 */
const addUserToGroupHelper = async (groupID: string, userID: string, role: UserRole = UserRole.Member): Promise<void> => {
  await GroupRepository.addUser(groupID, userID, role);
};
