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

    // Listar tablas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 TABLAS EN LA BASE DE DATOS:');
    console.log('================================');
    for (const row of tables.rows) {
      console.log(`  - ${row.table_name}`);
    }

    console.log('\n📊 CONTEO DE REGISTROS POR TABLA:');
    console.log('==================================');
    
    for (const row of tables.rows) {
      try {
        const count = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
        console.log(`  ${row.table_name}: ${count.rows[0].count} registros`);
      } catch (e) {
        console.log(`  ${row.table_name}: Error - ${e.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
