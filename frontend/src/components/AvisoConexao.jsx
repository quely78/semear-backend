// =============================================================
// components/AvisoConexao.jsx — Faixa no topo das telas internas:
//   - sem internet ............ "Sem internet. O que você anotar fica guardado."
//   - registros esperando ..... "2 registros esperando internet" (+ Enviar agora)
//   - enviados ................ "2 registros enviados" (some sozinho)
//   - recusados pela API ...... lista com o motivo (+ Entendi)
// Também dispara o envio da fila: ao abrir, ao reconectar e a cada 30 s.
// =============================================================
import { useCallback, useEffect, useState } from 'react';
import { descartarFalhas, enviarFila, EVENTO_FILA, falhasDaFila, itensNaFila } from '../services/filaOffline';
import Icone from './Icone';

export default function AvisoConexao() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pendentes, setPendentes] = useState(() => itensNaFila().length);
  const [falhas, setFalhas] = useState(() => falhasDaFila());
  const [enviados, setEnviados] = useState(0);

  const atualizar = useCallback(() => {
    setPendentes(itensNaFila().length);
    setFalhas(falhasDaFila());
  }, []);

  const tentarEnviar = useCallback(async () => {
    const quantos = await enviarFila();
    if (quantos) setEnviados(quantos);
    atualizar();
  }, [atualizar]);

  useEffect(() => {
    const aoConectar = () => {
      setOnline(true);
      tentarEnviar();
    };
    const aoDesconectar = () => setOnline(false);
    window.addEventListener('online', aoConectar);
    window.addEventListener('offline', aoDesconectar);
    window.addEventListener(EVENTO_FILA, atualizar);
    tentarEnviar();
    const relogio = setInterval(() => {
      if (itensNaFila().length) tentarEnviar();
    }, 30000);
    return () => {
      window.removeEventListener('online', aoConectar);
      window.removeEventListener('offline', aoDesconectar);
      window.removeEventListener(EVENTO_FILA, atualizar);
      clearInterval(relogio);
    };
  }, [atualizar, tentarEnviar]);

  // "Enviados" some depois de 6 s
  useEffect(() => {
    if (!enviados) return undefined;
    const t = setTimeout(() => setEnviados(0), 6000);
    return () => clearTimeout(t);
  }, [enviados]);

  if (online && !pendentes && !falhas.length && !enviados) return null;

  return (
    <div className="aviso-conexao" role="status" aria-live="polite">
      {!online && (
        <p className="aviso-conexao__linha aviso-conexao__linha--offline">
          <Icone nome="alerta" tamanho={16} /> Sem internet. O que você anotar fica guardado no celular.
        </p>
      )}
      {pendentes > 0 && (
        <p className="aviso-conexao__linha">
          <span>
            {pendentes} {pendentes === 1 ? 'registro esperando' : 'registros esperando'} internet para enviar
          </span>
          {online && (
            <button type="button" className="botao-texto" onClick={tentarEnviar}>
              Enviar agora
            </button>
          )}
        </p>
      )}
      {enviados > 0 && (
        <p className="aviso-conexao__linha aviso-conexao__linha--ok">
          <Icone nome="check" tamanho={16} /> {enviados} {enviados === 1 ? 'registro enviado' : 'registros enviados'}. Abra a
          tela de novo para ver.
        </p>
      )}
      {falhas.length > 0 && (
        <div className="aviso-conexao__falhas">
          <p className="aviso-conexao__linha aviso-conexao__linha--erro">
            <Icone nome="alerta" tamanho={16} /> Não foi possível enviar:
          </p>
          <ul>
            {falhas.map((f) => (
              <li key={f.id}>
                <strong>{f.descricao}</strong> — {f.motivo}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="botao-texto"
            onClick={() => {
              descartarFalhas();
              atualizar();
            }}
          >
            Entendi
          </button>
        </div>
      )}
    </div>
  );
}
