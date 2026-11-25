export function avaliarEpocaPlantio(dataPlantio, calendario) {
  if (!dataPlantio || !calendario?.mesesPlantio) return null;

  const mes = Number(String(dataPlantio).slice(5, 7));
  const dentroDaEpoca = calendario.mesesPlantio.includes(mes);

  return {
    dentroDaEpoca,
    mensagem: dentroDaEpoca
      ? `Plantio dentro da época ideal. Esta espécie pode ser plantada em ${calendario.epocaPlantio.toLowerCase()}.`
      : `Plantio fora da época ideal. Para esta espécie, a época recomendada é ${calendario.epocaPlantio.toLowerCase()}.`,
  };
}
