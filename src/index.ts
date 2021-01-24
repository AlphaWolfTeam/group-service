import * as mongoose from 'mongoose';
import Server from './server';
import config from './config';

const initializeMongo = async () => {
  console.log('Connecting to Mongo...');

  await mongoose.connect(
    config.mongo.uri,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    },
  )
    .catch((err) => {
      console.log('Unable to connect to the mongo. Please start the server. Error: ', err);
      process.exit(1);
    });

  console.log('Mongo connection established');
};

const main = async () => {
  await initializeMongo();

  const server = new Server(config.service.port);

  await server.start();

  console.log(`Server started on port: ${config.service.port}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
