import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCallItems } from '../lib/api';
import { formatItemName } from '../lib/format';

interface Item {
  categoria:  string;
  descricao:  string;
  resultado:  'CONFORME' | 'NAO CONFORME' | 'NAO SE APLICA';
}

const cor = (r: Item['resultado']) =>
  r === 'CONFORME'      ? 'text-green-600'
  : r === 'NAO SE APLICA'? 'text-gray-600'
  :                       'text-red-600';

export default function CallItems() {
  const { avaliacaoId } = useParams();
  const location = useLocation();
  const agentId = location.state?.agentId;

  const { data = [], isLoading } = useQuery<Item[]>({
    queryKey: ['callItems', avaliacaoId],
    queryFn : () => getCallItems(avaliacaoId!),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <Link to={-1 as any} className="inline-block mb-4 rounded bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 transition-colors">&larr; Voltar</Link>
      <h2 className="text-xl font-bold">
        Itens da ligação {avaliacaoId}
      </h2>
      <Link
        to={`/call/${avaliacaoId}/transcription`}
        state={{ agentId }}
        className="inline-block rounded bg-blue-700 px-3 py-1 mb-4 text-xs font-semibold text-white hover:bg-blue-600"
      >
        TRANSCRIÇÃO
      </Link>

      {isLoading ? (
        <p>Carregando…</p>
      ) : (
        <ul className="space-y-3">
          {data.map((it, idx) => (
            <li key={idx} className="rounded-xl bg-white p-4 shadow flex flex-col gap-1">
              <span className="text-sm font-semibold">{formatItemName(it.categoria)}</span>
              <span className="text-xs text-gray-500">{it.descricao}</span>
              <span className={`text-xs font-medium ${cor(it.resultado)}`}>
                {formatItemName(it.resultado)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
