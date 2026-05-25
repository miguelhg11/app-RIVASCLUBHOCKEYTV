# FEDERATION_SCRAPING

## 1. Objetivo

Ayudar a rellenar automáticamente datos de partidos desde FMP y RFEP, sin convertir el scraping en dependencia crítica del producto.

## 2. Principio

El modo manual siempre debe existir. Si falla la federación, la app debe seguir creando directos.

## 3. Adaptadores

```text
src/lib/federations/
  types.ts
  normalizer.ts
  fmp-adapter.ts
  rfep-adapter.ts
  federation-service.ts
```

## 4. Tipo normalizado

```ts
export type FederationMatch = {
  source: 'fmp' | 'rfep';
  competitionName: string;
  date: string;
  time: string;
  venue: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeCrestUrl: string | null;
  awayCrestUrl: string | null;
  rawUrl: string;
  confidence: number;
};
```

## 5. Configuración inicial

```env
FMP_CLUB_NAME=CP RIVAS LAS LAGUNAS
RFEP_CLUB_NAME=ADISS HOCKEY RIVAS
FEDERATION_LOOKAHEAD_DAYS=14
FEDERATION_CACHE_MINUTES=60
```

## 6. UX

En el formulario:

- Mostrar estado `Buscando partidos...`.
- Mostrar resultados sugeridos.
- Permitir elegir uno.
- Permitir editar todos los campos.
- Mostrar botón `Rellenar manualmente`.

## 7. Logs

Registrar:

- fuente;
- fecha de consulta;
- filtros;
- número de resultados;
- errores de parsing;
- HTML inesperado;
- fallback manual.

## 8. Casos límite

- Partido aplazado.
- Hora ausente.
- Pista ausente.
- Escudo roto.
- Dos partidos del mismo equipo.
- Equipo con nombre distinto entre club y federación.
- Nacional/autonómico mal clasificado.

## 9. No hacer

- No bloquear creación por fallo de scraping.
- No guardar HTML completo salvo debug local.
- No scrapear agresivamente en cada carga.
- No asumir que URLs de escudos son permanentes.
