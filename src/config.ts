import * as env from 'env-var';

export default {
  service: {
    port: env.get('PORT').required().asPortNumber().toString(),
  },
  mongo: {
    uri: env.get('MONGO_URI').required().asUrlString(),
    featureCollectionName: env.get('MONGO_FEATURE_COLLECTION_NAME').required().asString(),
  },
  userHeader: env.get('USER_HEADER').required().asString() || 'X-User-ID',
};
