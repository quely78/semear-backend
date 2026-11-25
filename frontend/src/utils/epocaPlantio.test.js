import test from 'node:test';
import assert from 'node:assert/strict';
import { avaliarEpocaPlantio } from './epocaPlantio.js';

const calendarioMilho = {
  epocaPlantio: 'Dezembro a fevereiro',
  mesesPlantio: [12, 1, 2],
};

test('reconhece plantio dentro da época ideal', () => {
  const resultado = avaliarEpocaPlantio('2026-01-15', calendarioMilho);

  assert.equal(resultado.dentroDaEpoca, true);
  assert.match(resultado.mensagem, /dentro da época ideal/);
});

test('reconhece plantio fora da época ideal', () => {
  const resultado = avaliarEpocaPlantio('2026-07-15', calendarioMilho);

  assert.equal(resultado.dentroDaEpoca, false);
  assert.match(resultado.mensagem, /fora da época ideal/);
});

test('omite o alerta quando não há calendário', () => {
  assert.equal(avaliarEpocaPlantio('2026-01-15', null), null);
});

test('omite o alerta quando não há data', () => {
  assert.equal(avaliarEpocaPlantio(null, calendarioMilho), null);
});
