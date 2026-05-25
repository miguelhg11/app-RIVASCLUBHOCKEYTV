# AUDITORÍA — ESCUDOS PARA STREAM / FMP + RFEP

## 1. Resultado ejecutivo

Se ha auditado el ZIP local `ESCUDOS PARA STREAM.zip` y se ha generado un inventario para que la app pueda resolver escudos por nombre de equipo, alias y ruta de archivo.

El ZIP contiene **171 PNG**: **20 escudos FMP** en la raíz, **140 escudos RFEP/nacionales** en `ESCUDOS HOCKEY ESPAÑA`, y **11 selecciones autonómicas**.

El archivo `codigo.txt` incluido en el ZIP ya trae una base de mapeo FMP con nombre, abreviatura e icono. Ese mapeo se ha incorporado al inventario.

## 2. Entregables generados

- `escudos_inventory.csv`: inventario completo para revisión humana.
- `club_badges_seed.json`: semilla lista para importar en la app.
- `badges/`: copia saneada de los escudos con rutas recomendadas.
- `contact_sheet_fmp.jpg`: vista rápida de escudos FMP.
- `contact_sheet_rfep_01.jpg` ...: vistas rápidas de escudos RFEP.
- `contact_sheet_selecciones.jpg`: vista rápida de selecciones autonómicas.

## 3. Limitación de verificación web

La verificación automática contra web oficial se ha podido hacer principalmente por texto indexado y estructura visible. Las páginas FMP/RFEP son dinámicas y no exponen de forma estable todos los logos en el HTML recuperable por las herramientas disponibles. Por tanto:

- `LOCAL_ZIP_PLUS_CODIGO_TXT`: alta confianza para FMP por coincidencia con `codigo.txt`.
- `LOCAL_ZIP_FILENAME`: confianza razonable por nombre de archivo, pendiente de validación visual final si se quiere comparar píxel a píxel con logos oficiales.

## 4. Duplicados exactos detectados

- ESCUDOS HOCKEY ESPAÑA/cubelles.png | ESCUDOS HOCKEY ESPAÑA/salt.png
- ESCUDOS HOCKEY ESPAÑA/ene oposicionclubpatinmieres.png | ESCUDOS HOCKEY ESPAÑA/mieres.png

## 5. Inventario FMP raíz

| Equipo canónico | Archivo | Alias principales | Estado |
|---|---:|---|---|
| Alameda de Osuna | `alameda.png` | Alameda Osuna | AOA | Alameda de Osuna | Colegio Alameda de Osuna | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Alcalá | `alcala.png` | Alcala | ALCA | CP Alcalá | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Alcobendas | `alcobendas.png` | Alcobendas | ALB | CP Alcobendas | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Alcorcón | `alcorcon.png` | Alcorcon | ALCR | CP Alcorcón | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Aldovea | `aldovea.png` | Aldovea | ALD | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Aluche | `aluche.png` | Aluche | ALU | CHP Aluche | Gestas de España CHP Aluche | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Coslada | `coslada.png` | Coslada | COS | CP Coslada | LOCAL_ZIP_PLUS_CODIGO_TXT |
| CP Rivas Las Lagunas | `rivas.png` | Rivas | RIV | Rivas A | RIV A | Rivas B | RIV B | CP Rivas Las Lagunas | Rivas Hockey | ADISS Hockey Rivas | Hockey Rivas | LOCAL_ZIP_PLUS_CODIGO_TXT |
| El Casar | `casar.png` | Casar | CAS | CDE El Casar | El Casar | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Gredos | `gredos.png` | Gredos | GRD | Gredos San Diego | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Las Rozas | `lasrozas.png` | Las Rozas | ROZ | CP Las Rozas | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Majadahonda | `majadahonda.png` | Majadahonda | MJH | CHP Majadahonda | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Retamar | `retamar.png` | Retamar | RET | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Sanse | `sanse.png` | Sanse | SANS | San Sebastián de los Reyes | CP Sanse | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Santa María del Pilar | `pilar.png` | Sta.Maria del Pilar | SMP | Santa María del Pilar | CP Pilar | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Santa María La Blanca | `lablanca.png` | Sta.Maria La Blanca | SMB | Santa María La Blanca | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Tres Cantos | `trescantos.png` | Tres Cantos | TCS | Tres Cantos Ibercenter PC | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Vetonia | `vetonia.png` | Vetonia | VET | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Viejasgloriasvde | `viejasgloriasVDE.png` | Viejas Glorias Virgen de Europa | Viejas Glorias VDE | LOCAL_ZIP_PLUS_CODIGO_TXT |
| Virgen de Europa | `vdeuropa.png` | Virgen de Europa | CVE | Club Virgen de Europa | LOCAL_ZIP_PLUS_CODIGO_TXT |

## 6. RFEP / nacionales prioritarios para Rivas y competiciones estatales

Estos son los archivos más relevantes para OK Liga, OK Plata/Bronce y campeonatos con Rivas detectado o probable.

| Equipo canónico | Archivo | Alias principales | Estado |
|---|---:|---|---|
| Alcoi | `alcoi.png` | Alcoi | PAS Alcoi | AITEX PAS Alcoi | LOCAL_ZIP_FILENAME |
| Barça | `barsa.png` | Barça | barsa | FCB | FC Barcelona | LOCAL_ZIP_FILENAME |
| Calafell | `calafell.png` | Calafell | CP Calafell | Calafell La Menorquina | LOCAL_ZIP_FILENAME |
| Liceo | `liceo.png` | Liceo | HC Liceo | Hockey Club Liceo | LOCAL_ZIP_FILENAME |
| Noia | `noia.png` | Noia | CE Noia | CE Noia Freixenet | LOCAL_ZIP_FILENAME |
| SHUM Frit Ravich | `shum frit ravich.png` | SHUM Frit Ravich | SHUM | LOCAL_ZIP_FILENAME |
| Cerdanyola | `cerdanyola.png` | Cerdanyola | Cerdanyola CH | Cerdanyola Club d'Hoquei | LOCAL_ZIP_FILENAME |
| Sevilla | `sevilla.png` | Sevilla | CPI Sevilla | LOCAL_ZIP_FILENAME |
| Dominicos | `dominicos.png` | Dominicos | CAA Dominicos | LOCAL_ZIP_FILENAME |
| Oviedo | `oviedo.png` | Oviedo | Oviedo Roller HC | LOCAL_ZIP_FILENAME |
| Igualada | `igualada.png` | Igualada | Igualada HC | LOCAL_ZIP_FILENAME |
| Mieres | `mieres.png` | Mieres | CP Mieres | Club Patín Mieres | LOCAL_ZIP_FILENAME |
| Olot | `olot.png` | Olot | CH Olot | B-Sensible CH Olot | LOCAL_ZIP_FILENAME |
| Taradell | `taradell.png` | Taradell | CP Taradell | LOCAL_ZIP_FILENAME |
| Sant Feliu | `sant feliu.png` | Sant Feliu | CHP Sant Feliu | LOCAL_ZIP_FILENAME |
| Telecable | `telecable.png` | Telecable | Telecable HC | LOCAL_ZIP_FILENAME |
| Vila-sana | `vila-sana.png` | Vila-sana | CP Vila-sana | LOCAL_ZIP_FILENAME |
| Manlleu | `manlleu.png` | Manlleu | CP Manlleu | LOCAL_ZIP_FILENAME |
| Palau | `palau.png` | Palau | Palau de Plegamans | Generali HC Palau | LOCAL_ZIP_FILENAME |
| Voltregà | `voltrega.png` | Voltregà | CP Voltregà | LOCAL_ZIP_FILENAME |
| Reus | `reus.png` | Reus | Reus Deportiu | Reus Deportiu Virginias | LOCAL_ZIP_FILENAME |
| Mataró | `mataro.png` | Mataró | CH Mataró | LOCAL_ZIP_FILENAME |
| Alpicat | `alpicat.png` | Alpicat | Lleida.net Alpicat | LOCAL_ZIP_FILENAME |
| Lleida | `lleida.png` | Lleida | Lleida.net Alpicat | Finques Prats Lleida | LOCAL_ZIP_FILENAME |

## 7. Regla de uso en la app

La app debe resolver escudos así:

1. Normalizar el nombre extraído de FMP/RFEP.
2. Buscar coincidencia exacta en `normalizedAliases`.
3. Si no hay coincidencia, buscar coincidencia parcial segura.
4. Para cualquier equipo que contenga `RIVAS`, usar siempre `badges/fmp/rivas.png` salvo override explícito del admin.
5. Si no hay coincidencia clara, usar placeholder y registrar el equipo como pendiente de mapeo.

## 8. Campos recomendados para tabla `club_badges`

```ts
export type ClubBadgeSeed = {
  sourceScope: 'fmp' | 'rfep' | 'seleccion_autonomica';
  canonicalTeamName: string;
  shortCode: string | null;
  aliases: string[];
  normalizedAliases: string[];
  assetPath: string;
  originalZipPath: string;
  sha256: string;
  verificationStatus: string;
  needsManualReview: boolean;
};
```

## 9. Pendiente recomendado

- Hacer una revisión visual rápida de los contact sheets.
- Confirmar manualmente los escudos RFEP que en la app vayan a usarse de forma inmediata.
- Alimentar el catálogo de alias desde partidos reales FMP/RFEP capturados por la app.
- Mantener una cola `unmapped_team_names` para nuevos rivales.
