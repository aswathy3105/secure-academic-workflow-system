const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB:', mongoose.connection.name);
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in', mongoose.connection.name, ':', collections.map(c => c.name));
        
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(` - ${col.name}: ${count} docs`);
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
