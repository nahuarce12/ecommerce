/**
 * Script para crear cuentas de prueba (test users) de MercadoPago.
 * Crea un comprador y un vendedor de prueba.
 * 
 * Uso: node scripts/create-test-users.mjs
 */

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

async function createTestUser(description) {
  const response = await fetch("https://api.mercadopago.com/users/test_user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      site_id: "MLA",
      description: description,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error creating test user "${description}": ${response.status} - ${error}`);
  }

  return response.json();
}

async function main() {
  console.log("=== Creando cuentas de prueba de MercadoPago ===\n");

  try {
    if (!ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN no está configurado en variables de entorno");
    }

    console.log("1. Creando comprador de prueba...");
    const buyer = await createTestUser("Comprador de prueba");
    console.log("\n✅ COMPRADOR DE PRUEBA creado:");
    console.log(`   ID: ${buyer.id}`);
    console.log(`   Email: ${buyer.email}`);
    console.log(`   Nickname: ${buyer.nickname}`);
    console.log(`   Password: ${buyer.password}`);
    console.log(`   Site: ${buyer.site_id}`);

    console.log("\n2. Creando vendedor de prueba...");
    const seller = await createTestUser("Vendedor de prueba");
    console.log("\n✅ VENDEDOR DE PRUEBA creado:");
    console.log(`   ID: ${seller.id}`);
    console.log(`   Email: ${seller.email}`);
    console.log(`   Nickname: ${seller.nickname}`);
    console.log(`   Password: ${seller.password}`);
    console.log(`   Site: ${seller.site_id}`);

    console.log("\n========================================");
    console.log("INSTRUCCIONES:");
    console.log("========================================");
    console.log("\n1. Cuando el checkout de MercadoPago se abra en el sandbox,");
    console.log("   logueate con las credenciales del COMPRADOR:");
    console.log(`   Email: ${buyer.email}`);
    console.log(`   Password: ${buyer.password}`);
    console.log("\n2. NO uses tu cuenta real de MercadoPago para pagar en sandbox.");
    console.log("\n3. Las cuentas de prueba ya tienen saldo disponible para testear.");
    console.log("========================================\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
