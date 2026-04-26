const {
  sequelize,
  User,
  Airline,
  Airport,
  Flight,
  Schedule,
  Seat,
  FlightSeat,
  Booking,
  BookingDetail,
  Payment
} = require('../flight-booking-backend/src/models');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🧹 Cleaning up old leftover tables from the database...');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.query('DROP TABLE IF EXISTS route_segments;');
    await sequelize.query('DROP TABLE IF EXISTS routes;');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: true });

    // ============================================
    // 1. USERS
    // ============================================
    console.log('👤 Creating users...');

    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@flightbooking.com',
      phone: '1111111111',
      password_hash: 'SuperAdmin@123',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    });

    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      password_hash: 'User@123',
      role: 'USER',
      status: 'ACTIVE'
    });

    // ============================================
    // 2. AIRLINES
    // ============================================
    console.log('✈️ Creating airlines...');
    const airlinesData = [
      { name: 'Indigo Airlines', code: '6E', country: 'India', status: 'ACTIVE' },
      { name: 'Air India', code: 'AI', country: 'India', status: 'ACTIVE' },
      { name: 'SpiceJet', code: 'SG', country: 'India', status: 'ACTIVE' },
      { name: 'Vistara', code: 'UK', country: 'India', status: 'ACTIVE' },
      { name: 'Akasa Air', code: 'QP', country: 'India', status: 'ACTIVE' },
      { name: 'Emirates', code: 'EK', country: 'UAE', status: 'ACTIVE' }
    ];
    await Airline.bulkCreate(airlinesData);
    const dbAirlines = await Airline.findAll();
    const domesticCarriers = dbAirlines.filter(a => ['6E', 'AI', 'SG', 'UK', 'QP'].includes(a.code));

    // ============================================
    // 3. AIRPORTS
    // ============================================
    console.log('🏢 Creating airports...');
    await Airport.bulkCreate([
      { name: 'Indira Gandhi International Airport', code: 'DEL', city: 'Delhi', country: 'India', timezone: 'Asia/Kolkata', latitude: 28.5562, longitude: 77.1000, terminal_count: 4 },
      { name: 'Chhatrapati Shivaji International Airport', code: 'BOM', city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', latitude: 19.0896, longitude: 72.8656, terminal_count: 3 },
      { name: 'Kempegowda International Airport', code: 'BLR', city: 'Bangalore', country: 'India', timezone: 'Asia/Kolkata', latitude: 13.1986, longitude: 77.7066, terminal_count: 2 },
      { name: 'Rajiv Gandhi International Airport', code: 'HYD', city: 'Hyderabad', country: 'India', timezone: 'Asia/Kolkata', latitude: 17.2403, longitude: 78.4294, terminal_count: 1 },
      { name: 'Netaji Subhas Chandra Bose Airport', code: 'CCU', city: 'Kolkata', country: 'India', timezone: 'Asia/Kolkata', latitude: 22.6520, longitude: 88.4463, terminal_count: 2 },
      { name: 'Jaipur International Airport', code: 'JAI', city: 'Jaipur', country: 'India', timezone: 'Asia/Kolkata', latitude: 26.8241, longitude: 75.8122, terminal_count: 2 },
      { name: 'Chaudhary Charan Singh Airport', code: 'LKO', city: 'Lucknow', country: 'India', timezone: 'Asia/Kolkata', latitude: 26.7606, longitude: 80.8893, terminal_count: 2 },
      { name: 'Goa International Airport', code: 'GOI', city: 'Goa', country: 'India', timezone: 'Asia/Kolkata', latitude: 15.3808, longitude: 73.8314, terminal_count: 2 },
      { name: 'Pune Airport', code: 'PNQ', city: 'Pune', country: 'India', timezone: 'Asia/Kolkata', latitude: 18.5822, longitude: 73.9197, terminal_count: 2 }
    ]);
    const dbAirports = await Airport.findAll();
    const getAirportCode = (code) => dbAirports.find(a => a.code === code);

    // ============================================
    // 4. FLIGHT GENERATION FOR APRIL 26, 27, 28, 29, 30
    // ============================================
    const targetDates = ['2026-04-26', '2026-04-27', '2026-04-28', '2026-04-29', '2026-04-30'];
    console.log(`🚀 Generating flights for dates: ${targetDates.join(', ')}...`);

    let globalFlightCounter = 1000;

    const getFlightDuration = (src, dest) => {
      const pair = [src, dest].sort().join('-');
      const times = {
        'BOM-DEL': 135, 'BLR-DEL': 165, 'DEL-HYD': 130, 'CCU-DEL': 140,
        'BLR-BOM': 105, 'BOM-HYD': 85, 'DEL-JAI': 55, 'DEL-GOI': 135,
        'DEL-PNQ': 110, 'BOM-GOI': 75, 'BOM-PNQ': 45
      };
      return times[pair] || 90;
    };

    // Flight network paths for all dates
    const networkPaths = [
      // DIRECT FLIGHTS
      { path: ['DEL', 'BOM'], frequency: 10, type: 'direct' },
      { path: ['BOM', 'DEL'], frequency: 10, type: 'direct' },
      { path: ['DEL', 'BLR'], frequency: 8, type: 'direct' },
      { path: ['BLR', 'DEL'], frequency: 8, type: 'direct' },
      { path: ['DEL', 'GOI'], frequency: 4, type: 'direct' },
      { path: ['BOM', 'GOI'], frequency: 6, type: 'direct' },
      { path: ['DEL', 'PNQ'], frequency: 4, type: 'direct' },

      // 1-STOP FLIGHTS
      { path: ['DEL', 'JAI', 'BOM'], frequency: 6, type: '1stop' },
      { path: ['DEL', 'BLR', 'BOM'], frequency: 5, type: '1stop' },
      { path: ['BOM', 'HYD', 'DEL'], frequency: 6, type: '1stop' },
      { path: ['DEL', 'LKO', 'BOM'], frequency: 4, type: '1stop' },
      { path: ['DEL', 'JAI', 'GOI'], frequency: 3, type: '1stop' },

      // 2-STOP FLIGHTS
      { path: ['DEL', 'JAI', 'HYD', 'BOM'], frequency: 4, type: '2stop' },
      { path: ['BOM', 'BLR', 'CCU', 'DEL'], frequency: 3, type: '2stop' },
      { path: ['DEL', 'LKO', 'PNQ', 'BOM'], frequency: 3, type: '2stop' },
      { path: ['DEL', 'JAI', 'BLR', 'GOI'], frequency: 2, type: '2stop' },

      // 3-STOP FLIGHTS
      { path: ['DEL', 'JAI', 'LKO', 'CCU', 'BOM'], frequency: 2, type: '3stop' },
      { path: ['DEL', 'PNQ', 'BLR', 'CCU', 'GOI'], frequency: 2, type: '3stop' }
    ];

    const allSchedulesToInsert = [];

    // Generate flights for each date
    for (const dateStr of targetDates) {
      console.log(`  📅 Generating flights for ${dateStr}...`);

      for (const config of networkPaths) {
        const startHourStep = 16 / config.frequency;

        for (let i = 0; i < config.frequency; i++) {
          const airline = domesticCarriers[globalFlightCounter % domesticCarriers.length];

          // Different pricing based on flight type
          let basePriceMultiplier = 1;
          if (config.type === 'direct') basePriceMultiplier = 1;
          else if (config.type === '1stop') basePriceMultiplier = 0.85;
          else if (config.type === '2stop') basePriceMultiplier = 0.75;
          else basePriceMultiplier = 0.65;

          let currentLegTime = new Date(`${dateStr}T06:00:00+05:30`);
          currentLegTime.setMinutes(currentLegTime.getMinutes() + (i * startHourStep * 60));

          for (let leg = 0; leg < config.path.length - 1; leg++) {
            const legSrc = getAirportCode(config.path[leg]);
            const legDest = getAirportCode(config.path[leg + 1]);
            const durationMins = getFlightDuration(config.path[leg], config.path[leg + 1]);

            const flightNo = `${airline.code}${globalFlightCounter}`;
            const basePrice = Math.round((Math.floor(Math.random() * 30) + 35) * 100 * basePriceMultiplier);

            const arrivalTime = new Date(currentLegTime.getTime() + durationMins * 60000);

            const [flight] = await Flight.findOrCreate({
              where: { flight_no: flightNo },
              defaults: {
                airline_id: airline.airline_id,
                seat_capacity: 180,
                aircraft_type: 'A320neo',
                base_price: basePrice,
                status: 'ACTIVE'
              }
            });

            const schedule = await Schedule.create({
              flight_id: flight.flight_id,
              source_airport_id: legSrc.airport_id,
              dest_airport_id: legDest.airport_id,
              departure_time: currentLegTime,
              arrival_time: arrivalTime,
              duration_minutes: durationMins,
              base_price: basePrice,
              available_seats: 180,
              status: 'SCHEDULED'
            });

            allSchedulesToInsert.push(schedule);

            if (leg < config.path.length - 2) {
              const layover = Math.floor(Math.random() * 150) + 90;
              currentLegTime = new Date(arrivalTime.getTime() + layover * 60000);
            }
          }
          globalFlightCounter++;
        }
      }
    }

    console.log(`  ✅ Generated ${allSchedulesToInsert.length} total schedules`);

    // ============================================
    // 5. BASE SEATS
    // ============================================
    console.log(`💺 Generating base seat layout...`);
    const baseSeats = [];
    let seatCounter = 0;
    for (let row = 1; row <= 30 && seatCounter < 180; row++) {
      for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
        if (seatCounter < 180) {
          let seatClass = row <= 2 ? 'FIRST' : row <= 6 ? 'BUSINESS' : 'ECONOMY';
          baseSeats.push({
            seat_number: `${row}${col}`,
            class: seatClass,
            row_number: row,
            column_letter: col,
            is_window: col === 'A' || col === 'F',
            is_aisle: col === 'C' || col === 'D',
            has_extra_legroom: row === 1 || row === 3 || row === 12
          });
          seatCounter++;
        }
      }
    }
    await Seat.bulkCreate(baseSeats);
    const dbCreatedSeats = await Seat.findAll();

    // ============================================
    // 6. FLIGHT SEATS (Inventory)
    // ============================================
    console.log(`🎟️ Creating seat inventory for ${allSchedulesToInsert.length} schedules...`);

    const flightSeats = [];
    for (const schedule of allSchedulesToInsert) {
      for (const seat of dbCreatedSeats) {
        let seatSelectionFee = parseFloat(schedule.base_price) * 0.10;
        if (seat.column_letter === 'B' || seat.column_letter === 'E') {
          seatSelectionFee = 0;
        }
        flightSeats.push({
          schedule_id: schedule.schedule_id,
          seat_id: seat.seat_id,
          price: Math.round(seatSelectionFee),
          status: 'AVAILABLE'
        });
      }
    }

    const chunkSize = 5000;
    for (let i = 0; i < flightSeats.length; i += chunkSize) {
      await FlightSeat.bulkCreate(flightSeats.slice(i, i + chunkSize));
      process.stdout.write('.');
    }
    console.log(`\n✅ Seat inventory complete.`);

    // ============================================
    // 7. MOCK BOOKINGS FOR EACH DATE
    // ============================================
    console.log('💳 Creating mock bookings...');

    for (let idx = 0; idx < targetDates.length; idx++) {
      const dateStr = targetDates[idx];
      const dateSchedules = allSchedulesToInsert.filter(schedule => {
        const scheduleDate = schedule.departure_time.toISOString().split('T')[0];
        return scheduleDate === dateStr;
      });

      if (dateSchedules.length > 0) {
        const targetSchedule = dateSchedules[0];
        const pnr = `BOOK${idx + 1}`;

        const booking = await Booking.create({
          user_id: user.user_id,
          total_price: targetSchedule.base_price,
          status: 'CONFIRMED',
          pnr: pnr,
          contact_email: 'john@example.com',
          passenger_count: 1,
          expires_at: new Date(Date.now() + 10 * 60 * 1000),
          confirmed_at: new Date()
        });

        const seat3A = dbCreatedSeats.find(s => s.seat_number === '3A');
        const dbFlightSeat = await FlightSeat.findOne({
          where: { schedule_id: targetSchedule.schedule_id, seat_id: seat3A.seat_id }
        });

        if (dbFlightSeat) {
          await BookingDetail.create({
            booking_id: booking.booking_id,
            schedule_id: targetSchedule.schedule_id,
            flight_seat_id: dbFlightSeat.flight_seat_id,
            passenger_name: `John Doe ${dateStr}`,
            passenger_age: 30,
            passenger_gender: 'MALE',
            passenger_id_type: 'Passport',
            passenger_id_number: `AB${idx}23456`,
            leg_order: 1,
            price_paid: targetSchedule.base_price
          });

          await Payment.create({
            booking_id: booking.booking_id,
            amount: targetSchedule.base_price,
            status: 'SUCCESS',
            gateway_reference: `pi_BOOK${idx}`,
            payment_method: 'CARD',
            payment_time: new Date()
          });

          console.log(`  ✅ Booking created for ${dateStr} with PNR: ${pnr}`);
        }
      }
    }

    // Extra multi-passenger booking for April 27
    const april20Schedules = allSchedulesToInsert.filter(schedule => {
      const scheduleDate = schedule.departure_time.toISOString().split('T')[0];
      return scheduleDate === '2026-04-27';
    });

    if (april20Schedules.length > 1) {
      const multiBooking = await Booking.create({
        user_id: user.user_id,
        total_price: 7000,
        status: 'CONFIRMED',
        pnr: 'MULTI20',
        contact_email: 'john@example.com',
        passenger_count: 2,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        confirmed_at: new Date()
      });

      const seat3B = dbCreatedSeats.find(s => s.seat_number === '3B');
      const flightSeat1 = await FlightSeat.findOne({
        where: { schedule_id: april20Schedules[0].schedule_id, seat_id: seat3B.seat_id }
      });

      if (flightSeat1) {
        await BookingDetail.create({
          booking_id: multiBooking.booking_id,
          schedule_id: april20Schedules[0].schedule_id,
          flight_seat_id: flightSeat1.flight_seat_id,
          passenger_name: 'John Doe',
          passenger_age: 30,
          passenger_gender: 'MALE',
          passenger_id_type: 'Passport',
          passenger_id_number: 'AB123456',
          leg_order: 1,
          price_paid: 3500
        });
      }

      const seat3C = dbCreatedSeats.find(s => s.seat_number === '3C');
      const flightSeat2 = await FlightSeat.findOne({
        where: { schedule_id: april20Schedules[1].schedule_id, seat_id: seat3C.seat_id }
      });

      if (flightSeat2) {
        await BookingDetail.create({
          booking_id: multiBooking.booking_id,
          schedule_id: april20Schedules[1].schedule_id,
          flight_seat_id: flightSeat2.flight_seat_id,
          passenger_name: 'Jane Doe',
          passenger_age: 28,
          passenger_gender: 'FEMALE',
          passenger_id_type: 'Passport',
          passenger_id_number: 'CD789012',
          leg_order: 1,
          price_paid: 3500
        });
      }

      await Payment.create({
        booking_id: multiBooking.booking_id,
        amount: 7000,
        status: 'SUCCESS',
        gateway_reference: 'pi_MULTI20',
        payment_method: 'UPI',
        payment_time: new Date()
      });

      console.log(`  ✅ Multi-passenger booking created for 2026-04-27 with PNR: MULTI20`);
    }

    // ============================================
    // 8. SUMMARY
    // ============================================
    console.log('\n✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('=================================================');
    console.log(`📍 DATES: ${targetDates.join(', ')}`);
    console.log(`📍 TOTAL SCHEDULES: ${allSchedulesToInsert.length}`);
    console.log('=================================================');

    console.log('\n📊 DATE-WISE STATISTICS:');
    for (const date of targetDates) {
      const count = allSchedulesToInsert.filter(s => {
        return s.departure_time.toISOString().split('T')[0] === date;
      }).length;
      console.log(`  📅 ${date}: ${count} schedules`);
    }

    console.log('\n✈️ FLIGHT TYPES AVAILABLE:');
    console.log('  → Direct: DEL-BOM, BOM-DEL, DEL-BLR, BLR-DEL, DEL-GOI, BOM-GOI');
    console.log('  → 1-Stop: DEL-JAI-BOM, DEL-BLR-BOM, BOM-HYD-DEL, DEL-LKO-BOM');
    console.log('  → 2-Stop: DEL-JAI-HYD-BOM, BOM-BLR-CCU-DEL, DEL-LKO-PNQ-BOM');
    console.log('  → 3-Stop: DEL-JAI-LKO-CCU-BOM, DEL-PNQ-BLR-CCU-GOI');

    console.log('\n📝 BOOKINGS CREATED:');
    console.log('  → Single bookings: BOOK1, BOOK2, BOOK3, BOOK4');
    console.log('  → Multi-passenger: MULTI20');

    console.log('\n💡 TIP: Test connecting flights search across multiple dates!');
    console.log('=================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();