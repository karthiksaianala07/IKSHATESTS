const { supabaseAdmin } = require('../config/supabase');

async function testRpc() {
  console.log("Checking if exec_sql RPC exists...");
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: 'SELECT 1;' });
    if (error) {
      console.log("Error or RPC does not exist:", error.message);
    } else {
      console.log("RPC exists! Return value:", data);
    }
  } catch (err) {
    console.log("Catch error:", err.message);
  }
}

testRpc();
