// =============================================================
// hooks/useFinancasDoPlantio.js — Carrega as finanças de UM plantio
// (usado nas telas Dinheiro, Gastos e Vendas do plantio).
//
//   const { financas, setFinancas, carregando, erro } = useFinancasDoPlantio(id);
//   financas = { plantio, gastos, vendas, resumo }
// =============================================================
import { useEffect, useState } from 'react';
import { buscarFinancasDoPlantio } from '../services/financasService';

export default function useFinancasDoPlantio(id) {
  const [financas, setFinancas] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    buscarFinancasDoPlantio(id)
      .then((dados) => ativo && setFinancas(dados))
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [id]);

  return { financas, setFinancas, carregando, erro };
}
