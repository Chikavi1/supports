const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.RD_HOSTNAME || "localhost",
  username: process.env.RD_USER || "root",
  password: process.env.RD_PASSWORD || "",
  database: process.env.RD_DATABASE || "radi",
});

// COPIAR DEL MODELS EN RADI-NODEJS

const Support = sequelize.define('Supports', {
  amount: DataTypes.INTEGER,
  amount_radi: DataTypes.INTEGER,
  visible: DataTypes.INTEGER,
  payment: DataTypes.STRING,
  id_user: DataTypes.INTEGER,
  id_organization: DataTypes.INTEGER,
  status: DataTypes.INTEGER
});


// CAMBIAR ADSPOST POR EL NOMBRE REAL
module.exports = { sequelize, Support };