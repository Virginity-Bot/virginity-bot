module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		virginity: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
        join_time: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
        server_id: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};