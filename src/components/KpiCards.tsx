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
  agentesCount: number | null;
}

const KpiCards: React.FC<Props> = ({ media, total, agentesCount }) => (
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
    <KpiCard label="Pontuação média" value={media} />
    <KpiCard label="Ligações avaliadas" value={total} />
    <KpiCard
      label="Agentes avaliados"
      value={agentesCount}
    />
  </div>
);

export default KpiCards;
