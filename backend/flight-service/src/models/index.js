const Airline = require('./Airline');
const Airport = require('./Airport');
const Flight = require('./Flight');
const Schedule = require('./Schedule');

// Associations
Airline.hasMany(Flight, { foreignKey: 'airline_id' });
Flight.belongsTo(Airline, { foreignKey: 'airline_id' });

Flight.hasMany(Schedule, { foreignKey: 'flight_id' });
Schedule.belongsTo(Flight, { foreignKey: 'flight_id' });

Airport.hasMany(Schedule, { as: 'DepartureSchedules', foreignKey: 'source_airport_id' });
Airport.hasMany(Schedule, { as: 'ArrivalSchedules', foreignKey: 'dest_airport_id' });
Schedule.belongsTo(Airport, { as: 'SourceAirport', foreignKey: 'source_airport_id' });
Schedule.belongsTo(Airport, { as: 'DestAirport', foreignKey: 'dest_airport_id' });

module.exports = { Airline, Airport, Flight, Schedule };
