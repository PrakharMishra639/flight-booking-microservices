const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// Helper to use HOST from ENV or default to localhost
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || 'My$ecure@123';
const DB_NAME = process.env.DB_NAME || 'flight_booking_aero';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false
});

// Define minimal models for seeding
const User = sequelize.define('User', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  phone: { type: DataTypes.STRING },
  password_hash: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM('USER', 'ADMIN', 'SUPER_ADMIN'), defaultValue: 'USER' },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' }
}, { tableName: 'users' });

const Airline = sequelize.define('Airline', {
  airline_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, unique: true },
  country: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' }
}, { tableName: 'airlines' });

const Airport = sequelize.define('Airport', {
  airport_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, unique: true },
  city: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING },
  timezone: { type: DataTypes.STRING },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) }
}, { tableName: 'airports' });

const Flight = sequelize.define('Flight', {
  flight_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  flight_no: { type: DataTypes.STRING, unique: true },
  airline_id: { type: DataTypes.INTEGER },
  base_price: { type: DataTypes.DECIMAL(10, 2) },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' }
}, { tableName: 'flights' });

const Schedule = sequelize.define('Schedule', {
  schedule_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  flight_id: { type: DataTypes.INTEGER },
  source_airport_id: { type: DataTypes.INTEGER },
  dest_airport_id: { type: DataTypes.INTEGER },
  departure_time: { type: DataTypes.DATE },
  arrival_time: { type: DataTypes.DATE },
  duration_minutes: { type: DataTypes.INTEGER },
  base_price: { type: DataTypes.DECIMAL(10, 2) },
  available_seats: { type: DataTypes.INTEGER }
}, { tableName: 'schedules' });

const Seat = sequelize.define('Seat', {
  seat_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  seat_number: { type: DataTypes.STRING },
  class: { type: DataTypes.ENUM('ECONOMY', 'BUSINESS', 'FIRST') },
  row_number: { type: DataTypes.INTEGER },
  column_letter: { type: DataTypes.STRING }
}, { tableName: 'seats' });

const FlightSeat = sequelize.define('FlightSeat', {
  flight_seat_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  schedule_id: { type: DataTypes.INTEGER },
  seat_id: { type: DataTypes.INTEGER },
  price: { type: DataTypes.DECIMAL(10, 2) },
  status: { type: DataTypes.ENUM('AVAILABLE', 'LOCKED', 'BOOKED'), defaultValue: 'AVAILABLE' }
}, { tableName: 'flight_seats' });

// Associations for seeding
Schedule.belongsTo(Flight, { foreignKey: 'flight_id' });
Flight.hasMany(Schedule, { foreignKey: 'flight_id' });
Flight.belongsTo(Airline, { foreignKey: 'airline_id' });

const seedDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('📦 Connected to MySQL for seeding...');
        
        await sequelize.sync({ force: true });
        console.log('✅ Database synchronized.');

        // Seed Users
        const hashedPassword = await bcrypt.hash('User@123', 10);
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            phone: '1234567890',
            password_hash: hashedPassword,
            role: 'SUPER_ADMIN'
        });

        // Seed Airlines
        const indigo = await Airline.create({ name: 'Indigo', code: '6E', country: 'India' });
        const airindia = await Airline.create({ name: 'Air India', code: 'AI', country: 'India' });

        // Seed Airports
        const del = await Airport.create({ name: 'Indira Gandhi', code: 'DEL', city: 'Delhi', country: 'India', timezone: 'IST' });
        const bom = await Airport.create({ name: 'Chhatrapati Shivaji', code: 'BOM', city: 'Mumbai', country: 'India', timezone: 'IST' });

        // Seed Flights
        const f1 = await Flight.create({ flight_no: '6E101', airline_id: indigo.airline_id, base_price: 3500 });
        const f2 = await Flight.create({ flight_no: 'AI202', airline_id: airindia.airline_id, base_price: 4200 });

        // Seed Schedules for today and tomorrow
        const today = new Date();
        today.setHours(10, 0, 0, 0);
        
        const s1 = await Schedule.create({
            flight_id: f1.flight_id,
            source_airport_id: del.airport_id,
            dest_airport_id: bom.airport_id,
            departure_time: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
            arrival_time: new Date(today.getTime() + 26 * 60 * 60 * 1000),
            duration_minutes: 120,
            base_price: 3500,
            available_seats: 180
        });

        // Seed Seats
        const baseSeats = [];
        for (let row = 1; row <= 5; row++) {
            for (const col of ['A', 'B', 'C']) {
                baseSeats.push({ seat_number: `${row}${col}`, class: 'ECONOMY', row_number: row, column_letter: col });
            }
        }
        const createdSeats = await Seat.bulkCreate(baseSeats);

        // Seed FlightSeats for s1
        const flightSeats = createdSeats.map(seat => ({
            schedule_id: s1.schedule_id,
            seat_id: seat.seat_id,
            price: 500,
            status: 'AVAILABLE'
        }));
        await FlightSeat.bulkCreate(flightSeats);

        console.log('🚀 SEEDING COMPLETE!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
