# Retest — salas en vivo, avatar, foco, menú y login

Solo estos puntos. El resto de los reportes anteriores no entra en esta pasada.

URL: https://chat.criswe.org

Dos perfiles de Chrome, o una ventana normal y una de incógnito. No compartir la sesión.

| Usuario | Email | Password |
|---|---|---|
| testuser1 | testuser1@example.com | secret123 |
| dmcheck | dmcheck@example.com | secret123 |

El login usa el email.

Antes de empezar, en un perfil que ya tenía el sitio abierto, hacer un reload normal (F5). No hace falta Ctrl+Shift+R.

No ejecutar `GET /message/delete` ni `GET /room/delete`.

## 1. Crear una sala

1. Los dos perfiles logueados.
2. Con testuser1, en New Room, escribir `qa viva` y pulsar Add.
3. No hacer clic en la sala.

Esperado:

- testuser1 entra solo a esa sala. La barra de arriba muestra `qa viva`.
- dmcheck ve `qa viva` en Channels sin recargar.
- dmcheck puede entrar haciendo clic.

## 2. Foto que no carga

1. Entrar con testuser1 o dmcheck.
2. Mirar el avatar de la barra y el de los mensajes.

Esperado: si la foto no existe, se ve un avatar gris local, no el ícono de imagen rota. En el login, la imagen de arriba también es esa, no una imagen externa.

## 3. Foco después de enviar

1. Entrar a una sala.
2. Escribir en `Your message` y pulsar Submit.
3. Escribir el siguiente mensaje sin volver a hacer clic en el campo.

Esperado: el cursor sigue en el campo.

## 4. Menú del usuario

1. Clic en el username, una sola vez.
2. El menú debe abrirse. El texto es `Logout`, no `Logut`.
3. Pulsar Profile.

Esperado: abre una página Profile con el username. Hay un link para volver al chat. Logout sigue cerrando la sesión.

## 5. Enter en el login

1. Ventana sin sesión.
2. Completar email y password.
3. Pulsar Enter, sin hacer clic en Login.

Esperado: intenta el login. Con `testuser1@example.com` / `secret123` entra a la sala.
