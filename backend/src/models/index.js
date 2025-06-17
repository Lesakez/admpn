const { sequelize } = require('../config/database');

// Import models
const Account = require('./Account');
const Profile = require('./Profile');
const Proxy = require('./Proxy');
const Project = require('./Project');
const Phone = require('./Phone');
const Activity = require('./Activity');
const Registration = require('./Registration');

// Initialize models
const models = {
  Account: Account(sequelize),
  Profile: Profile(sequelize),
  Proxy: Proxy(sequelize),
  Project: Project(sequelize),
  Phone: Phone(sequelize),
  Activity: Activity(sequelize),
  Registration: Registration(sequelize)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};