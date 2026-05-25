# Reporte de Descubrimiento FMP

## URL Base y Endpoint Detectado
- **URL Base pública:** `https://competiciones.fmp.es/`
- **Endpoint real de carga:** `https://sidgad.cloud/shared/portales_files/agenda_portales.php`
- **Método HTTP:** `POST`
- **Cabeceras:** `Content-Type: application/x-www-form-urlencoded`
- **Parámetros del Body (POST):**
  - `cliente`: `fmp`
  - `idm`: `1` (Agenda)
  - `id_temp`: `21` (ID de temporada por defecto de la FMP)

## Funcionamiento del Filtrado
La web descarga la agenda completa del servidor en formato HTML (aproximadamente 158 KB). El filtrado se realiza localmente en el navegador mediante Javascript.
Cada fila de partido tiene la clase `.fila_agenda` y expone un atributo `param_game` con el siguiente formato:
`[idm]_[offset_dias]_[id_club_local]_[id_club_visitante]_[id_competicion]`

Ejemplo: `param_game="1_7_434_395_4302"`
- Modidad ID: `1` (HOCKEY PATINES)
- Offset días: `7` (días transcurridos o previstos en relación con el día actual)
- ID Club Local: `434` (CDE El Casar C)
- ID Club Visitante: `395` (Hockey Rivas Las Lagunas HP)
- ID Competición: `4302`

Para los filtros requeridos:
- **Modalidad:** `HOCKEY PATINES` (ID `1`).
- **Club:** Rivas (ID `395`).
- **Fecha:** Próximos 7 días (offset en `param_game` `< 8`, o validación directa por campo de fecha en servidor).

## Estructura HTML de las Fila
Cada `.fila_agenda` es una fila `<tr>` con 10 celdas `<td>`:
- `td[0]`: Modalidad (ej. `HP`)
- `td[1]`: Nombre de competición
- `td[2]`: Fecha (`DD/MM/YYYY`)
- `td[3]`: Hora (`HH:mm`, o vacío si no está programada)
- `td[4]`: Vacío (reservado para escudo local)
- `td[5]`: Nombre de equipo local
- `td[6]`: Vacío (reservado para escudo visitante)
- `td[7]`: Nombre de equipo visitante
- `td[8]`: Resultado (vacío en próximos partidos)
- `td[9]`: Pista / Pabellón

## Estrategia Seleccionada
Realizaremos una consulta HTTP POST directa a `https://sidgad.cloud/shared/portales_files/agenda_portales.php` utilizando `fetch` desde Node/Next.js. Usaremos `cheerio` para parsear la respuesta HTML completa en el servidor, aplicando los filtros de modalidad, club (Rivas ID 395 o por nombre) y rango de fechas. Esta estrategia evita el consumo de recursos de navegadores como Playwright y es extremadamente rápida.
