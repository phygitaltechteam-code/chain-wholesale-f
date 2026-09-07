import React from 'react';
import {GenericTable} from '@/components/Forms/Table/GenericTable';
import {getHistorySolderingColumns, hasMeltingStatus} from './solderingUtils';

interface HistorySolderingProps {
  filteredData: any[];
  historyLoading: boolean;
  fromDate: Date | null;
  toDate: Date | null;
}

const HistorySoldering: React.FC<HistorySolderingProps> = ({
  filteredData,
  historyLoading,
  fromDate,
  toDate,
}) => {
  const historyColumns = getHistorySolderingColumns();

  return (
    <div>
      <GenericTable
        data={filteredData}
        columns={historyColumns}
        emptyMessage={
          fromDate && toDate
            ? `No history records found for the selected date range (${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()})`
            : 'No history records found. Complete a soldering process to see history.'
        }
        isLoading={historyLoading}
        showSrNo={true}
        srNoLabel="Sr No."
        className="shadow-sm"
        rowClassName={(item) =>
          hasMeltingStatus(item)
            ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
            : ''
        }
      />
    </div>
  );
};

export default HistorySoldering;
