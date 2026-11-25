// "Ver em tabela": os mesmos números do gráfico, sem depender de cor nem de toque.
export default function TabelaDoGrafico({ cabecalhos, linhas }) {
  return (
    <details className="grafico-painel__tabela">
      <summary>Ver em tabela</summary>
      <div className="tabela-envoltorio">
        <table className="tabela tabela--compacta">
          <thead>
            <tr>
              {cabecalhos.map((c, i) => (
                <th key={c} scope="col" className={i ? 'tabela__numero' : ''}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map(([primeira, ...resto]) => (
              <tr key={primeira}>
                <th scope="row">{primeira}</th>
                {resto.map((valor, i) => (
                  <td key={cabecalhos[i + 1]} className="tabela__numero">
                    {valor}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
