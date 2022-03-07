const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);


Reflect.defineProperty(Users.prototype, 'addVirginity', {
	/* eslint-disable-next-line func-name-matching */
	value: async function addVirginity(virginity) {
		const user = await Users.findOne({
			where: { user_id: this.user_id, virginity: virginity },
		});

		if (user) {
			user.virginity += 1;
			return user.save();
		}

		return UserItems.create({ user_id: this.user_id, virginity: virginity, amount: 1 });
	},
});

module.exports = { Users};