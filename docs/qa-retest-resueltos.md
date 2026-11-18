# Revisión de arreglos — chat.criswe.org

Solo hay que volver a probar lo que se corrigió. El resto del reporte anterior no entra en esta pasada.

URL: https://chat.criswe.org

Usar dos perfiles de Chrome, o una ventana normal y una de incógnito. No compartir la sesión.

| Usuario | Email | Password |
|---|---|---|
| testuser1 | testuser1@example.com | secret123 |
| dmcheck | dmcheck@example.com | secret123 |

El login usa el email, no el username.

Si un arreglo no se cumple, anotar perfil, pasos, qué se esperaba, qué pasó y una captura. Si es de tiempo real, también Network del perfil que debía recibir el evento.

No ejecutar `GET /message/delete` ni `GET /room/delete`. Borran datos de todos.

## 1. Nombres de sala

En New Room, botón Add.

- `!@#$%^&*` no se crea y no aparece en Channels. El formulario muestra un error.
- Un nombre de más de 40 caracteres no se crea.
- `qa ñandú acción` sí se crea. Al hacer clic, la sala abre y la barra muestra ese nombre.
- Crear otra sala que termine en el mismo identificador, por ejemplo `qa nandu accion` después de `qa ñandú acción`, no se crea y se ve un error. No aparece duplicada.
- Un nombre con guion, como `qa-sala`, también se rechaza. El guion no está permitido. Letras, números y espacios sí.

## 2. Alta duplicada

Ir a Sign Up.

- Repetir username `testuser1` o email `testuser1@example.com`, con foto y las dos passwords iguales.
- No se crea otro usuario.
- La pantalla dice que esa cuenta ya está registrada. No se queda en silencio.

## 3. Login fallido

- Password incorrecta para `testuser1@example.com`: no entra, y se lee `Email or password is incorrect`.
- Email que no existe: el mismo mensaje. No dice si falló el correo o la contraseña.
- Login correcto: entra a la sala.

## 4. Enter envía

Los dos perfiles en la misma sala.

- En el cuadro de la sala, escribir y pulsar Enter. El otro lo ve sin usar Submit.
- Shift+Enter en la sala solo baja de línea. No envía.
- En la ventana de MD, Enter envía. El otro lo recibe.

## 5. Ventana de MD sin contenido falso

Abrir un MD desde Users Online.

- No aparece John Doe, ni el texto de ejemplo, ni "Your partner is typing…", ni un contador fijo en 3.
- Solo se ven los mensajes reales.

## 6. Bajar al último mensaje

- En la sala, mandar varios mensajes hasta llenar el panel. El último queda visible sin bajar a mano.
- En un MD abierto, igual: el último mensaje queda visible.

## 7. F5 conserva borrador y MD

- Dejar texto sin enviar en la sala y en un MD abierto.
- Recargar.
- Sigue logueado, en la misma sala. El texto sin enviar sigue ahí. La ventana de MD sigue abierta, con su texto.

## 8. Sala sin sesión

En una ventana sin login:

- Abrir https://chat.criswe.org/#/room/home
- Abrir https://chat.criswe.org/#/room/qa-sala

Se ve el login, no la lista de salas ni el campo de mensaje.

Con sesión, entrar a una sala sigue funcionando.

## Fuera de esta pasada

No revisar de nuevo el logout, las fotos rotas, el menú `Logut`, Profile, usuarios offline, ni el resto de pulido del reporte anterior. Eso no se tocó.
