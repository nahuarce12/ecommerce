# Go-Live 15 Minutos - Supplyworld (Checkout Pro)

Este runbook es para pasar de pruebas a produccion con foco en `payment` para Mercado Pago Checkout Pro.

## Datos de referencia

- App objetivo en Mercado Pago: `supplyworld`
- Application ID: `8439722475740116`
- Endpoint webhook del proyecto: `/api/mercadopago/webhook`

## Ventana sugerida

- Duracion: 15 minutos
- Requisito: no deployar otros cambios durante esta ventana

## T-5 min (pre-check rapido)

1. Confirmar URL publica productiva (HTTPS):
   - Ejemplo: `https://supplyworld.com`
2. Confirmar que el deploy actual incluye los cambios de webhook y preference.
3. Confirmar que no hay `TEST-` en credenciales productivas.
4. Confirmar que tenes acceso al panel de Mercado Pago de la app `supplyworld`.

## Min 0-3 (ENV de produccion)

Configurar estas variables en tu entorno productivo (hosting/secret manager):

```env
NEXT_PUBLIC_APP_URL=https://TU_DOMINIO_REAL
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXX
MP_WEBHOOK_SECRET=XXXXXXXXXXXXXXXX
MP_NOTIFICATION_URL=https://TU_DOMINIO_REAL/api/mercadopago/webhook?source_news=webhooks
MP_USE_SANDBOX_INIT_POINT=false
```

Notas:
- `MP_NOTIFICATION_URL` es opcional, pero recomendado.
- `MP_ACCESS_TOKEN` debe ser de produccion (`APP_USR-...`).
- Reiniciar/redeployar despues de guardar variables.

## Min 3-6 (Panel Mercado Pago Developers)

1. Entrar a Developers > Tus integraciones.
2. Abrir app `supplyworld` (ID `8439722475740116`).
3. Ir a Webhooks/Notificaciones.
4. Configurar callback de produccion:
   - `https://TU_DOMINIO_REAL/api/mercadopago/webhook?source_news=webhooks`
5. Topic habilitado:
   - `payment` unicamente.
6. Guardar cambios.
7. Copiar clave secreta de webhook del panel y verificar que coincide con `MP_WEBHOOK_SECRET`.

## Min 6-10 (Smoke test funcional)

1. Crear orden real de bajo monto en tu ecommerce.
2. Completar checkout en Mercado Pago.
3. Verificar en app:
   - Redireccion correcta a success.
   - Orden pasa de `pending_payment` a `paid/confirmed`.
4. Verificar logs backend:
   - webhook recibido.
   - procesamiento de `payment`.
   - respuesta HTTP 200.
5. Verificar que no haya reintentos repetidos por timeout.

## Min 10-12 (Observabilidad minima)

Validar durante 2-3 minutos:

1. No hay errores 500 en:
   - creacion de preference.
   - webhook.
2. No hay errores de firma (`INVALID SIGNATURE`).
3. No hay ordenes aprobadas sin actualizar estado.

## Min 12-15 (Cierre)

1. Documentar resultado del smoke test:
   - payment id
   - order id
   - timestamp
2. Confirmar habilitacion oficial de produccion.
3. Mantener monitoreo aumentado durante la primera hora.

## Rollback rapido (si falla)

Aplicar solo si hay falla critica de cobro/estado:

1. En Mercado Pago panel:
   - desactivar temporalmente topic `payment` o apuntar webhook a endpoint de contingencia.
2. En infraestructura:
   - restaurar ultimo deploy estable.
3. En variables:
   - revisar `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`.
4. Repetir smoke test en entorno controlado antes de reabrir.

## Criterio de exito

Se considera go-live exitoso cuando:

1. Se crea preference sin error.
2. Se completa pago real.
3. Llega webhook `payment` firmado.
4. Se actualiza la orden correctamente.
5. No hay reintentos por falta de ACK (200/201) fuera de lo esperado.
