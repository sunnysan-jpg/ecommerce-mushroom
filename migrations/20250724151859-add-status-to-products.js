'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'status', {
      type: Sequelize.BOOLEAN,       // ya Sequelize.INTEGER if you want 1/0 explicitly
      allowNull: false,
      defaultValue: true             // ya 1 if INTEGER
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('products', 'status');
  }
};
