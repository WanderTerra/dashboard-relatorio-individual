import React from 'react';
import KpiCard from './KpiCard';
import { formatItemName } from '../lib/format';

interface PiorItem {
  categoria: string;
  pct_nao_conforme: number;
}

interface Props {
  media: number | null;
  total: number;
  pior: PiorItem | null;
}

const getIntent = (v: number | null): 'success' | 'warning' | 'danger' | undefined =>
  v == null ? undefined : v < 50 ? 'danger' : v < 70 ? 'warning' : 'success';

const KpiCards: React.FC<Props> = ({ media, total, pior }) => (
  <div className="grid gap-4 md:grid-cols-3 mb-6">
    <KpiCard label="Pontuação média" value={media} intent={getIntent(media)} />
    <KpiCard label="Ligações avaliadas" value={total} />
    <KpiCard
      label="Item com maior NC"
      value={pior ? `${formatItemName(pior.categoria)} (${pior.pct_nao_conforme}%)` : '-'}
      intent="danger"
    />
  </div>
);

export default KpiCards;
