const Sequelize = require('sequelize');
//const Users = require('./models/Users.js');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {

    var user = [
		Users.upsert({user_id: 420, virginity: 69})
	];

	await Promise.all(user);
	console.log('Database synced');
	
	sequelize.close();
}).catch(console.error);
