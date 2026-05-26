const mongoose = require('mongoose');
require('dotenv').config();
const readline = require('readline');
const logger = require('./src/utils/logger');

const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function createAdmin() {

    try {

        const name = await ask('Enter admin name: ');
        const email = await ask('Enter admin email: ');
        const password = await ask('Enter password: ');

        const exists = await User.findOne({
            email: email.toLowerCase()
        });

        if (exists) {
            logger.info('User already exists');
            process.exit();
        }

        const admin = await User.create({

            name,
            email,
            password,
            role: 'admin'

        });

        logger.info('Admin created successfully', {
            name: admin.name,
            email: admin.email,
            role: admin.role
        });

        rl.close();

        process.exit();

    }
    catch (err) {

        logger.error('Admin creation failed', { message: err.message, stack: err.stack });

        rl.close();

        process.exit(1);

    }

}

createAdmin();
