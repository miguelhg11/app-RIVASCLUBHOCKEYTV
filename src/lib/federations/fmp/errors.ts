export class FmpUnavailableError extends Error {
  constructor(message = "No se han podido cargar partidos desde FMP. Puedes introducir los datos manualmente.") {
    super(message);
    this.name = "FmpUnavailableError";
  }
}

export class FmpParseError extends Error {
  constructor(message = "La FMP ha devuelto datos incompletos. Revisa el partido o introdúcelo manualmente.") {
    super(message);
    this.name = "FmpParseError";
  }
}

export class FmpNoMatchesError extends Error {
  constructor(message = "No se han encontrado partidos de Hockey Rivas en los próximos 7 días.") {
    super(message);
    this.name = "FmpNoMatchesError";
  }
}

export class FmpAmbiguousMatchError extends Error {
  constructor(message = "Se encontraron múltiples coincidencias para el partido seleccionado.") {
    super(message);
    this.name = "FmpAmbiguousMatchError";
  }
}
