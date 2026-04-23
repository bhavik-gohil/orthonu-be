const sequelize = require('../config/sequelize');
const Sequelize = require('sequelize');
const definitions = require('./models');

const models = {};

// Initialize models
Object.keys(definitions).forEach(name => {
    models[name] = definitions[name](sequelize);
});

// Run associations
Object.keys(models).forEach(name => {
    if (models[name].associate) {
        models[name].associate(models);
    }
});

module.exports = {
    sequelize,
    Sequelize,
    ...models
};
