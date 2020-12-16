import * as request from 'supertest';
import Server from '../../server';
import * as mongoose from 'mongoose';
import config from '../../config';
import CreateGroup from '../group.create';
import { IGroup, GroupType } from './group.interface';
import { UserRole } from '../user/user.role';

const GROUP_ID = mongoose.Types.ObjectId().toHexString();
const USER_ID = mongoose.Types.ObjectId().toHexString();
const USER_2_ID = mongoose.Types.ObjectId().toHexString();

describe('Group Service', () => {
  const app = new Server('8000').app;

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

  describe('Get Group By ID', () => {
    test('it should throw a validation error if the id sent is not an objectID', async () => {
      const res = await request(app).get(`/${123}`);
      expect(res.status).toEqual(400);
    });

    test('it should return 404 if group does not exist', async () => {
      const res = await request(app).get(`/${GROUP_ID}`);
      expect(res.status).toEqual(404);
    });

    test('it should return a group by its ID', async () => {
      const group = await createGroupHelper();

      const res = await request(app).get(`/${group.id}`);
      expect(res.status).toEqual(200);
      expect(res.body).toMatchObject({ name: 'group' });
    });
  });

  describe('Get Groups of user', () => {
    test('it should return an empty array if the users have no groups', async () => {
      const res = await request(app).get(`/users/${USER_ID}`);
      expect(res.status).toEqual(200);
      const groups: IGroup[] = res.body;
      expect(groups).toHaveLength(0);
    });

    test('it should return all of the users groups and only them', async () => {
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
    test('it should throw a validation error if partialName is not at least 2 chars', async () => {
      const res = await request(app).get('/').query({ partialName: 'j' });
      expect(res.status).toEqual(400);
    });

    test('it should return an empty array if there is no matching group', async () => {
      await createGroupHelper();

      const res = await request(app).get('/').query({ partialName: 'hello' });
      expect(res.status).toEqual(200);

      const groups: IGroup[] = res.body;
      expect(groups).toHaveLength(0);
    });

    test('it should return the groups that match the partialName', async() => {
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
    test('it should create a simple group', async () => {
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
      expect(groupUsers[0].role).toEqual(UserRole.Admin.toString());
    });

    test('it should create a public group by default', async () => {
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

    test('it should throw a validation error if some of the required fields are lacking', async () => {
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

    test('it should throw a validation error if a requester is not sent', async () => {
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
    test('it should throw a validation error if a requester is not sent', async () => {
      const group = await createGroupHelper();
      const res = await request(app)
        .put(`/${group.id}`)
        .send({});

      expect(res.status).toEqual(400);
    });

    test('it should return NotFound error if the group does not exist', async () => {
      const res = await request(app)
        .put(`/${GROUP_ID}`)
        .send({})
        .set({ [config.userHeader]: USER_ID });

      expect(res.status).toEqual(404);
    });

    test('it should return NotFound error if the user is not in the group', async () => {
      const group = await createGroupHelper();

      const partialGroup: Partial<IGroup> = {
        name: 'updated group',
        description: 'an updated group',
        type: GroupType.Private,
      };

      const res = await request(app)
        .put(`/${group.id}`)
        .send(partialGroup)
        .set({ [config.userHeader]: USER_2_ID });

      expect(res.status).toEqual(404);
    });

    test.skip('it should return a Forbidden error when user does not have required permission to group ', async () => {
      // TODO: check case when the user is only a member.
    });

    test('it should update a group', async () => {
      const group = await createGroupHelper();

      const partialGroup: Partial<IGroup> = {
        name: 'updated group',
        description: 'an updated group',
        type: GroupType.Private,
      };

      const res = await request(app)
        .put(`/${group.id}`)
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

    test('it should update just the name of a group', async () => {
      const group = await createGroupHelper();

      const partialGroup: Partial<IGroup> = {
        name: 'updated group',
      };

      const res = await request(app)
        .put(`/${group.id}`)
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

  describe.skip('Delete group by ID', () => {});

  describe.skip('Get users of group', () => {});

  describe.skip('Add user to group', () => {});

  describe.skip('Update user role in group', () => {});

  describe.skip('Remove user from group', () => {});
});

const createGroupHelper = async ({ userID, name }: { userID?: string, name?: string } = {}) => {
  const group: IGroup = {
    name: name || 'group',
    description: 'a group',
    type: GroupType.Public,
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
