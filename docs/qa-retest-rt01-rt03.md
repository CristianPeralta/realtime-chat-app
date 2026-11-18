# Retest — nombre largo, historial de MD y caché

Solo estos tres puntos. El resto del retest anterior ya quedó verificado.

URL: https://chat.criswe.org

Dos perfiles de Chrome, o una ventana normal y una de incógnito. No compartir la sesión.

| Usuario | Email | Password |
|---|---|---|
| testuser1 | testuser1@example.com | secret123 |
| dmcheck | dmcheck@example.com | secret123 |

El login usa el email.

Antes de empezar, en el perfil que ya tenía la app abierta, hacer un reload normal (F5). No hace falta Ctrl+Shift+R. Si Enter no envía después de ese F5, reportarlo: el arreglo de caché no alcanzó.

No ejecutar `GET /message/delete` ni `GET /room/delete`.

Las salas `qa-sala`, `qa-ñandú-acción`, el nombre de 120 caracteres y `!@#$%^&*` ya no están. No buscarlas.

## 1. Nombre de más de 40 caracteres

1. Entrar con testuser1.
2. En New Room, pegar `qa sala con nombre muy largo para prueba 12345`.
3. El campo debe mostrar el texto completo, no cortarlo solo.
4. Pulsar Add.

Esperado: no se crea la sala. Se ve `Room names must be 1 to 40 characters`. No aparece en Channels.

Un nombre de 40 o menos, solo letras, números y espacios, sí se crea.

## 2. Historial del MD después de F5

1. Los dos perfiles logueados.
2. testuser1 abre el MD de dmcheck y manda un mensaje, por ejemplo `historial-dm`.
3. dmcheck debe verlo en la ventana.
4. En dmcheck, dejar un texto sin enviar en esa ventana y otro en la sala.
5. F5 en dmcheck.

Esperado:

- Sigue logueado y en la misma sala.
- El borrador de la sala sigue.
- La ventana de MD sigue abierta, con su borrador.
- `historial-dm` vuelve a verse en esa ventana, sin esperar a que llegue un mensaje nuevo.

## 3. Reload normal trae el código nuevo

Esto se comprueba con el paso inicial. Si el perfil ya tenía el sitio abierto desde antes de este deploy, F5 debe alcanzar para ver el rechazo del nombre largo y el historial del MD. No pedir hard refresh.

Si solo se ve el comportamiento nuevo en incógnito, y en la ventana normal hace falta Ctrl+Shift+R, el arreglo de caché falló.
