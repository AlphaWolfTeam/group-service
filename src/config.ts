import * as env from 'env-var';

export default {
  service: {
    port: env.get('PORT').default('8000').asPortNumber().toString(),
    environment: env.get('NODE_ENV').default('development').asString(),
  },
  mongo: {
    uri: env.get('MONGO_URI').default('mongodb://localhost:27017/devDB').asUrlString(),
    featureCollectionName: env.get('MONGO_FEATURE_COLLECTION_NAME').default('groups').asString(),
  },
  apm: {
    isActive: env.get('ELASTIC_APM_ACTIVE').default('false').asString(),
    secretToken: env.get('ELASTIC_APM_SECRET_TOKEN').default('').asString(),
    serverUrl: env.get('ELASTIC_APM_SERVER_URL').default('http://apm:8200').asString(),
    traceParentHeader: env.get('APM_TRACEPARENT_HEADER').default('X-traceparent').asString(),
  },
  userHeader: env.get('USER_HEADER').default('X-User-ID').asString().toLowerCase(),
  tagLengthMin: env.get('TAG_LENGTH_MIN').default('2').asInt(),
  searchQueryLengthMin: env.get('SEARCH_QUERY_LENGTH_MIN').default('2').asInt(),
};
