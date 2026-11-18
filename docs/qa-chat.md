# QA — chat.criswe.org

App de chat en tiempo real: login, salas (channels) y mensajes directos. La UI está en inglés.

## Datos de prueba

| Usuario | Email | Password |
|---|---|---|
| testuser1 | testuser1@example.com | secret123 |
| dmcheck | dmcheck@example.com | secret123 |

El login usa el **email**, no el username.

URL: https://chat.criswe.org

Usar dos perfiles de Chrome, o una ventana normal y una de incógnito. No compartir la misma sesión.

## Cómo reportar

Para cada problema anotar:

- Perfil (testuser1 o dmcheck) y el otro perfil, si aplica.
- Pasos exactos.
- Qué se esperaba y qué pasó.
- Si se puede repetir.
- Captura de la pantalla. Si el fallo es de tiempo real, también la pestaña Network, filtro WS o Socket.IO, del perfil que debía recibir el evento.

No hace falta proponer la solución. Sí hace falta decir si es bloqueante.

## Fuera de alcance — no ejecutar

Estos endpoints, con sesión iniciada, borran datos de todos:

- `GET /message/delete`
- `GET /room/delete`

No llamarlos desde el browser ni desde Postman.

## Preparación

1. Abrir https://chat.criswe.org en el perfil A.
2. Abrir la misma URL en el perfil B.
3. En A, login con testuser1. En B, login con dmcheck.
4. Después del login la app entra a la sala `home`. Si esa sala no existe, el panel puede quedar vacío. No es un fallo de login si el navbar muestra el username.

Resultado esperado: cada perfil ve su username arriba a la derecha. El menú dice `Logut` (typo conocido). Anotarlo solo si el logout no funciona.

## 1. Login

### 1.1 Login correcto

1. En una ventana sin sesión, ir a https://chat.criswe.org
2. Email `testuser1@example.com`, password `secret123`.
3. Botón `Login`.

Esperado: entra a la sala. Se ve el username.

### 1.2 Password incorrecta

1. Email `testuser1@example.com`, password `no-es-esta`.
2. `Login`.

Esperado: no entra. Hoy la pantalla no muestra un mensaje de error. Anotar si eso confunde: es un problema de UX, no de seguridad. La request `POST /login` debe responder 401.

### 1.3 Email que no existe

1. Email `nadie@example.com`, cualquier password.
2. `Login`.

Esperado: igual que 1.2. No debe colgarse ni mostrar datos de otro usuario.

### 1.4 Campos vacíos

1. `Login` sin email y sin password.

Esperado: no entra. Anotar si la página se rompe, queda en blanco o no da ninguna pista.

## 2. Alta de usuario

Ir a `Sign Up` desde el login, o abrir https://chat.criswe.org/signup

Campos: foto, username, email, password, confirm password, gender. Botón `Sign Me Up`.

### 2.1 Alta válida

Usar un email nuevo, por ejemplo `qa1@example.com`. Las dos passwords iguales. Elegir un archivo de imagen. Elegir gender.

Esperado: entra a la app. No hace falta borrar este usuario después.

### 2.2 Sin foto

Completar todo menos el archivo y enviar.

Esperado: no debe dejar la app rota para los demás. Anotar el mensaje que ve el usuario. Hoy, sin foto, el alta puede fallar sin una explicación clara.

### 2.3 Passwords distintas

Esperado: alerta `Password doesnt match`. No crea el usuario.

### 2.4 Email o username ya usado

Repetir `testuser1` o `testuser1@example.com`.

Esperado: no crea un duplicado. Anotar si el error se entiende.

## 3. Salas

En el panel izquierdo: `Channels`, un input `New Room` y el botón `Add`.

### 3.1 Crear una sala

1. Con testuser1, escribir `qa-sala` y `Add`.
2. La sala debe aparecer en la lista.
3. Hacer clic en el nombre. La barra de arriba debe mostrar esa sala.

Anotar si `Add` no cambia de sala y hay que hacer clic a mano. Eso es UX, no un fallo de guardado, si la sala sí queda en la lista.

### 3.2 Mensaje de sala, misma sala

1. Los dos perfiles entran a `qa-sala`.
2. En el centro, escribir en `Your message` y pulsar `Submit`. No usar el botón `Send` de una ventana de MD.
3. El otro perfil, en la misma sala, debe ver el texto sin recargar.

Anotar demora, mensaje duplicado, texto cortado, o que el propio remitente no lo ve hasta recargar.

### 3.3 Mensaje de sala, salas distintas

1. testuser1 se queda en `qa-sala` y manda `solo-sala-a`.
2. dmcheck entra a otra sala, o a `home`.
3. dmcheck no debe ver `solo-sala-a` en el chat ni en Network como evento `messageAdded`.
4. dmcheck vuelve a `qa-sala`.

Esperado al volver: puede ver el historial de esa sala. Si no lo ve al entrar, pero sí estaba guardado, reportarlo.

### 3.4 Sala vacía y nombres raros

Probar un nombre con espacios, acentos, muy largo, y solo símbolos.

Esperado: no tumba la página. Anotar si el nombre se ve mal, no se puede entrar, o se crean dos salas iguales.

## 4. Mensajes directos

Para abrir un MD: en la columna derecha, `Users Online`, clic en el username del otro. Se abre una ventana abajo. El botón de esa ventana es `Send`, no `Submit`.

### 4.1 Llega al destinatario y no a la sala

1. Los dos logueados. dmcheck no tiene la ventana de MD abierta.
2. testuser1 abre el MD hacia dmcheck y manda `hola-dm`.
3. En dmcheck debe abrirse sola la ventana de testuser1, con el texto.
4. El chat de la sala, en el centro, no debe mostrar `hola-dm`.
5. En Network de dmcheck debe verse el evento `addMessagePrivated`. En un tercer perfil, si lo hubiera, no.

### 4.2 Cerrar y volver a recibir

1. En dmcheck, cerrar la ventana con `x`.
2. testuser1 manda otro MD.
3. La ventana debe volver a abrirse, visible, no solo quedar oculta.

### 4.3 Minimizar y volver a recibir

1. En dmcheck, clic en el encabezado de la ventana para minimizarla.
2. testuser1 manda otro MD.
3. La ventana debe quedar expandida de nuevo.

### 4.4 Respuesta con la ventana cerrada del otro

1. testuser1 cierra su ventana de MD.
2. dmcheck responde desde la suya.
3. A testuser1 se le debe abrir la ventana de dmcheck con la respuesta.

### 4.5 No duplicar

Con la ventana ya abierta, otro MD del mismo usuario no debe abrir una segunda ventana del mismo chat.

### 4.6 Usuario offline

Si el otro no está en `Users Online`, no se puede abrir el MD desde esa lista. No es un fallo si no hay otra forma visible de escribirle. Anotarlo como hueco de UX.

## 5. Sesión

### 5.1 Logout

Clic en el username, luego `Logut`.

Esperado: vuelve al login. Recargar no debe entrar solo. El otro perfil sigue logueado.

### 5.2 Recargar

F5 en la sala.

Esperado: sigue logueado y en la misma sala, o vuelve a entrar sin pedir password. Anotar si pierde la sala, el texto a medio escribir, o la ventana de MD.

### 5.3 Dos pestañas del mismo perfil

Abrir la app dos veces con testuser1.

Esperado: las dos reciben el mensaje de sala. Anotar si una se desconecta o el usuario aparece duplicado en `Users Online`.

## 6. Qué mirar de UI y UX

No hace falta que esté en la lista de arriba. Si molesta o no se entiende, reportarlo.

- Textos cortados, superpuestos, o que se salen del cuadro en una laptop y en una ventana angosta.
- Botones que no dicen qué hacen: `Submit`, `Send`, `Write`, `Add`, `Logut`.
- La ventana de MD trae un mensaje de ejemplo fijo, "John Doe" y "Your partner is typing…", aunque nadie escriba. El contador de la ventana dice `3` siempre.
- `Need Help` en login y signup.
- `Profile` en el menú del usuario: hoy no navega.
- Después de `Add`, la sala nueva no queda seleccionada sola.
- Login fallido sin mensaje.
- Alta sin foto, sin explicación.
- Foto de perfil rota o enorme.
- El historial de la sala no baja solo al último mensaje. El botón `Write` debería llevar al campo de texto.
- Un MD se mezcla con el chat de la sala, o aparece en todas las ventanas de MD abiertas.
- Al cambiar de sala, siguen viéndose mensajes de la sala anterior.
- `Users Online` no se actualiza cuando el otro entra o sale. Probar esperando unos segundos y también después de F5.
- Focus: después de enviar, el cursor queda en el campo o hay que hacer clic de nuevo.
- Tecla Enter: anotar si envía o solo baja de línea. No es fallo si no envía, pero sí si el usuario no tiene forma clara de mandar el mensaje.

## 7. Funcionamiento que no se espera

Cualquiera de estos es defecto, aunque la pantalla "más o menos" funcione:

- Un perfil ve un mensaje de una sala en la que no está.
- Un MD aparece en el centro de la sala.
- Un MD no llega al otro perfil, o llega y la ventana no se abre.
- La ventana se abre vacía y el texto solo aparece al recargar.
- Se puede actuar como el otro usuario desde la UI.
- Login correcto no entra, o un login malo entra.
- La página queda en blanco, el socket se reconecta en bucle, o hay que recargar para cada mensaje.
- Un clic manda el mensaje dos veces.
- Al cerrar sesión, el otro perfil se cae.

## 8. No es el objetivo de esta pasada

No hace falta Postman ni armar sockets a mano. La prueba de identidad del socket ya se hizo fuera de la UI. Si en Network un evento llega a un perfil que no corresponde, eso sí se reporta.
