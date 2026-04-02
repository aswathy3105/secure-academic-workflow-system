const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

/**
 * MIGRATION SCRIPT: test -> secureAcademicDB
 * This script copies the 'users' and 'requests' collections from the 'test' database
 * to the new 'secureAcademicDB' database in the same cluster.
 */

// Use the existing MONGODB_URI (which currently points to 'test')
const uri = process.env.MONGODB_URI;

async function runMigration() {
    if (!uri) {
        console.error("Error: MONGODB_URI not found in .env file.");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB Cluster...");
        // Connect via mongoose
        await mongoose.connect(uri);
        console.log("Connection established successfully.\n");

        // Access the native MongoDB client through Mongoose
        const client = mongoose.connection.client;
        
        const sourceDb = client.db('test');
        const targetDb = client.db('secureAcademicDB');

        const collectionsToMigrate = ['users', 'requests'];

        for (const colName of collectionsToMigrate) {
            console.log(`--- Migrating Collection: [${colName}] ---`);
            
            const sourceCol = sourceDb.collection(colName);
            const targetCol = targetDb.collection(colName);

            // Fetch all documents from the source collection
            const documents = await sourceCol.find({}).toArray();

            if (documents.length > 0) {
                console.log(`Found ${documents.length} documents in 'test.${colName}'.`);
                
                // Clear target collection if it already has data (optional, but ensures clean migration)
                const existingCount = await targetCol.countDocuments();
                if (existingCount > 0) {
                    console.log(`Target collection 'secureAcademicDB.${colName}' already has ${existingCount} documents. Overwriting...`);
                    await targetCol.deleteMany({});
                }

                // Insert into the new database
                const result = await targetCol.insertMany(documents);
                console.log(`Successfully migrated ${result.insertedCount} documents to 'secureAcademicDB.${colName}'.\n`);
            } else {
                console.log(`Collection 'test.${colName}' is empty or does not exist. Skipping.\n`);
            }
        }

        console.log("=========================================");
        console.log("MIGRATION COMPLETED SUCCESSFULLY!");
        console.log("New Database: secureAcademicDB");
        console.log("=========================================");
        
        process.exit(0);
    } catch (err) {
        console.error("Migration failed with error:", err);
        process.exit(1);
    }
}

runMigration();
