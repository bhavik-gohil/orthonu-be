const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminUser = sequelize.define('AdminUser', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },

    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: true }, // active/inactive/password_reset_pending
    userType: { type: DataTypes.STRING, allowNull: true }, // main_admin/editor/order_manager

  }, {
    timestamps: true,
    indexes: [
      { fields: ['uid'] },
      { fields: ['status'] },
      { fields: ['userType'] },
    ]
  });
  return AdminUser;
};
