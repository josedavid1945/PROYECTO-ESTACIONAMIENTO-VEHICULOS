const { Client } = require('pg');

async function checkDatabase() {
  const client = new Client({
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.jqqruzcbtcqcmzkogxqo',
    password: 'LBLvChbewiCvcb9m',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Supabase\n');

    // Ver clientes
    console.log('👥 CLIENTES:');
    console.log('=============');
    const clientes = await client.query('SELECT * FROM cliente');
    console.log(JSON.stringify(clientes.rows, null, 2));

    // Ver tickets
    console.log('\n🎫 TICKETS:');
    console.log('============');
    const tickets = await client.query('SELECT * FROM ticket');
    console.log(JSON.stringify(tickets.rows, null, 2));

    // Ver tipo_vehiculo
    console.log('\n🚗 TIPO VEHICULO:');
    console.log('==================');
    const tipoVeh = await client.query('SELECT * FROM tipo_vehiculo');
    console.log(JSON.stringify(tipoVeh.rows, null, 2));

    // Ver tipo_tarifa
    console.log('\n💰 TIPO TARIFA:');
    console.log('================');
    const tipoTar = await client.query('SELECT * FROM tipo_tarifa');
    console.log(JSON.stringify(tipoTar.rows, null, 2));

    // Ver users
    console.log('\n👤 USERS:');
    console.log('==========');
    const users = await client.query('SELECT id, email, username, is_active, created_at FROM users');
    console.log(JSON.stringify(users.rows, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
