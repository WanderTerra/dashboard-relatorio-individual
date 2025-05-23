import React from 'react';
import KpiCard from './KpiCard';

interface PiorItem {
  categoria: string;
  pct_nao_conforme: number;
}

interface Props {
  media: number | null;
  total: number;
  pior: PiorItem | null;
}

const cor = (v: number | null) =>
  v == null ? '' : v < 50 ? 'text-red-600' : v < 70 ? 'text-yellow-600' : 'text-green-600';

const KpiCards: React.FC<Props> = ({ media, total, pior }) => (
  <div className="grid gap-4 md:grid-cols-3 mb-6">
    <KpiCard label="Pontuação média" value={media} color={cor(media)} />
    <KpiCard label="Ligações avaliadas" value={total} />
    <KpiCard
      label="Item com maior NC"
      value={pior ? `${pior.categoria} (${pior.pct_nao_conforme}%)` : '-'}
      color="text-red-600"
    />
  </div>
);

export default KpiCards;
