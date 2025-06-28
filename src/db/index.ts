import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

// const DB_USERNAME = process.env.DB_USERNAME
// const DB_PASSWORD = process.env.DB_PASSWORD
// mongodb+srv://productanalystsubaa:QpAcu2cfuMXwTcUh@cluster0.zgqwiwu.mongodb.net/

const connectDB = async () => {
	try {
		const URL = `mongodb+srv://productanalystsubaa:Pahs2128!@cluster0.lt2arey.mongodb.net/DoctorsApp?retryWrites=true&w=majority`
		
		// Set mongoose options
		mongoose.set('strictQuery', false);
		
		await mongoose.connect(URL, {
			serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
			socketTimeoutMS: 45000,
			connectTimeoutMS: 30000,
			maxPoolSize: 10,
			minPoolSize: 5,
			retryWrites: true,
			retryReads: true,
			family: 4 // Force IPv4
		});

		// Handle connection events
		mongoose.connection.on('connected', () => {
			console.log('MongoDB connected successfully');
		});

		mongoose.connection.on('error', (err) => {
			console.error('MongoDB connection error:', err);
		});

		mongoose.connection.on('disconnected', () => {
			console.log('MongoDB disconnected');
		});
		// Handle process termination
		process.on('SIGINT', async () => {
			await mongoose.connection.close();
			process.exit(0);
		});

	} catch (error) {
		console.error('MongoDB connection error:', error);
		// Don't exit immediately, let the application handle the error
		throw error;
	}
};

export default connectDB;


