# Prueba de sesion y descarga en Railway

Dos servicios en el mismo repo, cada uno con su dominio `*.up.railway.app`, igual
que va a quedar SIGEP (front y API en origenes distintos).

## Subir a GitHub

Repo nuevo en la cuenta de prueba, desde esta carpeta:

    git init
    git add .
    git commit -m "chore: prueba de sesion y descarga"
    git branch -M main
    git remote add origin https://github.com/<usuario>/railway-prueba.git
    git push -u origin main

## En Railway

1. New Project, Deploy from GitHub repo, elegir el repo. Crea un servicio.
2. Servicio 1, Settings, Root Directory: `api`. Networking, Generate Domain.
3. New, GitHub Repo (el mismo), Root Directory: `web`. Generate Domain.
4. Variables:
   - `api`: `WEB_URL` = dominio del web (con `https://`, sin barra final) y `COOKIE_MODE` = `lax`
   - `web`: `API_URL` = dominio de la api (con `https://`, sin barra final)
5. Esperar a que los dos terminen el deploy.

## Probar desde la compu de YPF

Abrir el dominio del `web` y apretar, en orden, los botones 1 a 6. El 5 y el 6
prueban el bot: la API arranca `bot.py` como proceso hijo (Node + Python en la
misma imagen, como SIGEP). La `api` se construye con su `Dockerfile`.

1. Con `COOKIE_MODE=lax`.
2. Cambiar `COOKIE_MODE` a `none` en el servicio `api` (redeploya solo) y repetir.

Anotar para cada modo: si el paso 2 dice que la sesion se mantiene, y si bajan
los dos xlsx. Si `lax` falla y `none` anda, la cookie de SIGEP necesita dominio
propio compartido o un cambio de `SameSite`.

Usuario y clave de prueba: `prueba` / `prueba`. La sesion vive en memoria: se
pierde en cada redeploy.
