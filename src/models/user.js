var Sequelize = require('sequelize');
var passwordHash = require('password-hash'); // słabe
var bcrypt = require('bcrypt');

const sequelize = new Sequelize({
    database: 'tescik',
    username: 'root',
    password: 'test',
    dialect: 'mysql'
});

var User = sequelize.define('users',
        {
            first_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            last_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false
            }
        },
        {
            classMethod: {
                // coś to nie działa
                validPassword: function (password) {
                   return bcrypt.compareSync(password, this.password);
                }
            },

            hooks: {
                beforeCreate: (user) => {
                    const salt = bcrypt.genSaltSync();
                    user.password = bcrypt.hashSync(user.password, salt);
                }
            },

            timestamps: false,
        });

//sequelize.sync()
//        .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
//        .catch(error => console.log('This error occured', error));

module.exports = User;