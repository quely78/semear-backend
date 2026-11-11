// =============================================================
// components/CalendarioMes.jsx — Grade de um mês (domingo a sábado).
//
// Em cada dia aparecem:
//   - faixa azul ............ chuva prevista (os dias seguidos se ligam)
//   - círculo verde ......... dia do plantio
//   - "HOJE" ................ o dia de hoje
//   - bolinhas coloridas .... etapas do ciclo (crescimento, cuidados, colheita)
//
// Cada dia é um botão: ao tocar, a tela mostra o que acontece nele.
// =============================================================
import { diaEMes, partes, semanasDoMes, somarDias } from '../utils/datas';

const DIAS_SEMANA = [
  { curto: 'D', nome: 'domingo' },
  { curto: 'S', nome: 'segunda' },
  { curto: 'T', nome: 'terça' },
  { curto: 'Q', nome: 'quarta' },
  { curto: 'Q', nome: 'quinta' },
  { curto: 'S', nome: 'sexta' },
  { curto: 'S', nome: 'sábado' },
];

// Ordem das bolinhas embaixo do número
const CATEGORIAS_BOLINHA = ['desenvolvimento', 'cuidados', 'colheita'];

/** Períodos que incluem a data (comparação de texto "AAAA-MM-DD"). */
export function periodosDoDia(periodos, data) {
  return periodos.filter((p) => p.inicio <= data && data <= p.fim);
}

const temChuva = (periodos, data) =>
  periodos.some((p) => p.categoria === 'chuva' && p.inicio <= data && data <= p.fim);

export default function CalendarioMes({ ano, mes, periodos, hoje, selecionado, aoSelecionar }) {
  const semanas = semanasDoMes(ano, mes);

  return (
    <table className="cal-mes">
      <thead>
        <tr>
          {DIAS_SEMANA.map((d) => (
            <th key={d.nome} scope="col">
              <abbr title={d.nome}>{d.curto}</abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {semanas.map((semana) => (
          <tr key={semana.find(Boolean)}>
            {semana.map((data, coluna) => {
              if (!data) return <td key={`vazio-${coluna}`} />;

              const doDia = periodosDoDia(periodos, data);
              const chuva = doDia.some((p) => p.categoria === 'chuva');
              const plantio = doDia.some((p) => p.categoria === 'plantio');
              const bolinhas = CATEGORIAS_BOLINHA.filter((c) => doDia.some((p) => p.categoria === c));
              const ehHoje = data === hoje;

              // A faixa de chuva arredonda onde começa/termina (ou na quebra da semana)
              const chuvaInicio = chuva && (coluna === 0 || !temChuva(periodos, somarDias(data, -1)));
              const chuvaFim = chuva && (coluna === 6 || !temChuva(periodos, somarDias(data, 1)));

              const classes = [
                'cal-dia',
                chuva && 'cal-dia--chuva',
                chuvaInicio && 'cal-dia--chuva-inicio',
                chuvaFim && 'cal-dia--chuva-fim',
                plantio && 'cal-dia--plantio',
                ehHoje && 'cal-dia--hoje',
                data === selecionado && 'cal-dia--selecionado',
              ]
                .filter(Boolean)
                .join(' ');

              // Leitura completa para leitores de tela: "16 de abril, hoje: Chuva prevista, Capina"
              const descricao = [
                diaEMes(data),
                ehHoje && 'hoje',
              ]
                .filter(Boolean)
                .join(', ');
              const rotulo = doDia.length
                ? `${descricao}: ${doDia.map((p) => p.nome).join(', ')}`
                : descricao;

              return (
                <td key={data}>
                  <button
                    type="button"
                    className={classes}
                    onClick={() => aoSelecionar(data)}
                    aria-pressed={data === selecionado}
                    aria-label={rotulo}
                  >
                    {ehHoje && <span className="cal-dia__hoje">HOJE</span>}
                    <span className="cal-dia__numero">{partes(data).dia}</span>
                    <span className="cal-dia__bolinhas">
                      {bolinhas.map((c) => (
                        <span key={c} className={`cal-bolinha cal-bolinha--${c}`} />
                      ))}
                    </span>
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
