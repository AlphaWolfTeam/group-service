import * as env from 'env-var';

export default {
  service: {
    port: env.get('PORT').default('8000').asPortNumber().toString(),
  },
  mongo: {
    uri: env.get('MONGO_URI').default('mongodb://localhost:27017/devDB').asUrlString(),
    featureCollectionName: env.get('MONGO_FEATURE_COLLECTION_NAME').default('groups').asString(),
  },
  userHeader: env.get('USER_HEADER').default('X-User-ID').asString().toLowerCase(),
  tagLengthMin: env.get('TAG_LENGTH_MIN').default('2').asInt(),
  searchQueryLengthMin: env.get('SEARCH_QUERY_LENGTH_MIN').default('2').asInt(),
};
