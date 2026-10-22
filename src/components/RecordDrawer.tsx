import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { useDatabase } from '../store/databaseContext';
import { Drawer } from './ui/Drawer';

export interface RecordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  mode: 'create' | 'edit';
  initialRecord?: Record<string, any>;
  onSuccess?: () => void;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  isOpen,
  onClose,
  tableId,
  mode,
  initialRecord,
  onSuccess
}) => {
  const { tables, tableData, insertRow, updateRow, isAdmin, setAdminModalOpen } = useDatabase();
  const table = tables.find((t) => t.id === tableId);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && table) {
      setErrorMessage(null);
      if (mode === 'edit' && initialRecord) {
        setFormData({ ...initialRecord });
      } else {
        // Populate defaults for create mode
        const defaults: Record<string, any> = {};
        table.columns.forEach((col) => {
          if (col.defaultValue !== undefined) {
            defaults[col.name] = col.defaultValue;
          } else if (col.type.includes('NUMBER')) {
            defaults[col.name] = 0;
          } else {
            defaults[col.name] = '';
          }
        });
        setFormData(defaults);
      }
    }
  }, [isOpen, table, mode, initialRecord]);

  if (!table) return null;

  const pkColumn = table.columns.find((c) => c.isPrimaryKey);

  const handleChange = (columnName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [columnName]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAdmin) {
      setErrorMessage('Unauthorized: Administrator authentication required to modify database records.');
      setAdminModalOpen(true);
      return;
    }

    if (mode === 'create') {
      const res = insertRow(tableId, formData);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to insert row.');
        return;
      }
    } else {
      if (!pkColumn) {
        setErrorMessage('Cannot update record: Table missing primary key.');
        return;
      }
      const pkVal = initialRecord ? initialRecord[pkColumn.name] : formData[pkColumn.name];
      const res = updateRow(tableId, String(pkVal), formData);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update row.');
        return;
      }
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? `Insert Into ${table.name}` : `Edit ${table.name} Record`}
      subtitle={`Subsystem: ${table.category} • ${table.columns.length} Schema Attributes`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-danger-soft border border-danger-token flex items-start gap-2.5 text-xs font-mono text-danger-token">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3.5">
          {table.columns.map((col) => {
            const isPk = col.isPrimaryKey;
            const isFk = col.isForeignKey;
            const isReadOnly = mode === 'edit' && isPk;
            const val = formData[col.name] ?? '';

            // Check if foreign key parent rows are available for a select dropdown
            let fkOptions: { value: string; label: string }[] | null = null;
            if (isFk && col.referencesTable && col.referencesColumn) {
              const parentRows = tableData[col.referencesTable] || [];
              fkOptions = parentRows.map((r) => {
                const targetVal = String(r[col.referencesColumn!]);
                // Derive a friendly label
                const nameKey = Object.keys(r).find(
                  (k) => k.toLowerCase().includes('name') || k.toLowerCase().includes('tag')
                );
                const label = nameKey ? `${targetVal} - ${r[nameKey]}` : targetVal;
                return { value: targetVal, label };
              });
            }

            return (
              <div key={col.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="font-bold text-token flex items-center gap-1.5">
                    <span>{col.name}</span>
                    {isPk && (
                      <span className="px-1.5 py-0.5 rounded bg-primary-soft text-primary-token border border-token text-xs font-bold">
                        PK
                      </span>
                    )}
                    {isFk && (
                      <span className="px-1.5 py-0.5 rounded bg-accent-soft text-accent-token border border-token text-xs font-bold">
                        FK → {col.referencesTable}
                      </span>
                    )}
                    {!col.isNullable && <span className="text-danger-token font-bold">*</span>}
                  </label>
                  <span className="text-xs text-muted">{col.type}</span>
                </div>

                {fkOptions ? (
                  <select
                    value={val}
                    onChange={(e) => handleChange(col.name, e.target.value)}
                    disabled={isReadOnly}
                    required={!col.isNullable}
                    className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-token text-xs font-mono text-token focus:outline-none focus:border-primary-token disabled:opacity-50"
                  >
                    <option value="">Select referenced {col.referencesTable}...</option>
                    {fkOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={col.type.includes('NUMBER') ? 'number' : 'text'}
                    value={val}
                    onChange={(e) =>
                      handleChange(
                        col.name,
                        col.type.includes('NUMBER') ? Number(e.target.value) : e.target.value
                      )
                    }
                    disabled={isReadOnly}
                    required={!col.isNullable}
                    placeholder={`Enter ${col.name}...`}
                    className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-token text-xs font-mono text-token placeholder-muted focus:outline-none focus:border-primary-token disabled:opacity-50"
                  />
                )}

                {col.description && (
                  <p className="text-xs font-mono text-muted">
                    {col.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-token flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-mono text-xs text-muted hover:text-token transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary-hover transition-all cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{mode === 'create' ? 'Insert Record' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </Drawer>
  );
};
