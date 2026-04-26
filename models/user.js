const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },

    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: true }, // pending/rejected/active/inactive 
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    userType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'regular',
      validate: {
        isIn: [['regular', 'professional']]
      }
    },

    isProfessionalUser: { type: DataTypes.BOOLEAN, defaultValue: false },
    profession: { type: DataTypes.STRING, allowNull: true }, // DSO/OSO/Professional
    npiNumber: { type: DataTypes.STRING, allowNull: true },
    emailProfessional: { type: DataTypes.STRING, allowNull: true, unique: true },

    // shipping address
    fullName: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    streetAddress1: { type: DataTypes.STRING, allowNull: true },
    streetAddress2: { type: DataTypes.STRING, allowNull: true }, // optinal
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    zipcode: { type: DataTypes.STRING, allowNull: true },

    isBillingSameAsShipping: { type: DataTypes.BOOLEAN, defaultValue: true },

    // billing address
    billingNameOnCard: { type: DataTypes.STRING, allowNull: true },
    billingStreetAddress1: { type: DataTypes.STRING, allowNull: true },
    billingStreetAddress2: { type: DataTypes.STRING, allowNull: true }, // optinal
    billingCity: { type: DataTypes.STRING, allowNull: true },
    billingState: { type: DataTypes.STRING, allowNull: true },
    billingCountry: { type: DataTypes.STRING, allowNull: true },
    billingZipcode: { type: DataTypes.STRING, allowNull: true },
  }, {
    timestamps: true,
    indexes: [
      { fields: ['uid'] },
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['userType'] },
      { fields: ['isProfessionalUser'] },
      { fields: ['profession'] },
      { fields: ['emailProfessional'] },
    ]
  });
  return User;
};
