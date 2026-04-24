const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserSession = sequelize.define('UserSession', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    isAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sessionToken: { type: DataTypes.STRING, allowNull: false },
  }, {
    timestamps: true,
    indexes: [
      { fields: ['userId'], using: 'BTREE' },
      { fields: ['isAdmin'], using: 'BTREE' },
    ]
  });
  return UserSession;
};
