import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { DatabaseTable } from '../data/databaseData';
import { X, Check, AlertCircle, PlusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useIsMobile } from '../hooks/useMediaQuery';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  table: DatabaseTable;
  allTablesData: Record<string, any[]>;
  onInsertRow: (tableId: string, newRow: Record<string, any>) => void;
}

export const RecordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  table,
  allTablesData,
  onInsertRow,
}) => {
  const isMobile = useIsMobile(640);
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    table.columns.forEach((col) => {
      if (col.type === 'DATE') {
        initial[col.name] = new Date().toISOString().split('T')[0];
      } else if (col.type === 'TIMESTAMP') {
        initial[col.name] = new Date().toISOString().replace('T', ' ').substring(0, 19);
      } else if (col.type.startsWith('DECIMAL') || col.type === 'INTEGER') {
        initial[col.name] = '';
      } else if (col.type === 'STRUCT') {
        initial[col.name] = JSON.stringify({ metric_name: 'Voltage', reading_value: 230.5, unit: 'V' });
      } else if (col.type.includes('[]')) {
        initial[col.name] = 'NORMAL, AUTO_CALIBRATED';
      } else {
        initial[col.name] = '';
      }
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (colName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [colName]: value }));
    if (errors[colName]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[colName];
        return copy;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    table.columns.forEach((col) => {
      if (!col.isNullable && (formData[col.name] === '' || formData[col.name] === undefined)) {
        newErrors[col.name] = `${col.name} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const processedRow: Record<string, any> = {};
    table.columns.forEach((col) => {
      let val = formData[col.name];
      if (col.type.startsWith('DECIMAL')) {
        processedRow[col.name] = val !== '' ? parseFloat(val) : 0;
      } else if (col.type === 'INTEGER') {
        processedRow[col.name] = val !== '' ? parseInt(val, 10) : 0;
      } else if (col.type === 'STRUCT') {
        try {
          processedRow[col.name] = typeof val === 'string' ? JSON.parse(val) : val;
        } catch {
          processedRow[col.name] = { metric: 'Custom', val };
        }
      } else if (col.type.includes('[]')) {
        processedRow[col.name] = typeof val === 'string' ? val.split(',').map((s) => s.trim()) : val;
      } else {
        processedRow[col.name] = val;
      }
    });

    onInsertRow(table.id, processedRow);

    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.6 }
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 10 : 20
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: isMobile ? '94vh' : '90vh',
          backgroundColor: '#08080a',
          border: '1px solid var(--border-metallic)',
          borderRadius: isMobile ? 'var(--radius-lg)' : 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: isMobile ? '14px 16px' : '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 255, 255, 0.015)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <PlusCircle size={16} style={{ color: '#ffffff' }} />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: isMobile ? 15 : 16,
                  fontWeight: 700,
                  color: '#ffffff'
                }}
              >
                Insert Record: {table.name}
              </h3>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Add a verified row conforming to the DuckDB columnar schema
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 6, borderRadius: 'var(--radius-xs)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 16px' : '22px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {table.columns.map((col) => {
              const error = errors[col.name];
              const isFK = col.isForeignKey && col.referencesTable;
              const parentRows = isFK ? allTablesData[col.referencesTable!] || [] : [];
              const parentPK = col.referencesColumn || 'id';

              return (
                <div key={col.name}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 6
                    }}
                  >
                    <span>
                      {col.name} {!col.isNullable && <span style={{ color: '#ef4444' }}>*</span>}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {col.type}
                    </span>
                  </label>

                  {isFK && parentRows.length > 0 ? (
                    <select
                      value={formData[col.name]}
                      onChange={(e) => handleChange(col.name, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: error ? '1px solid #ef4444' : '1px solid var(--border)',
                        color: '#ffffff',
                        fontSize: 12.5
                      }}
                    >
                      <option value="" style={{ background: '#08080a' }}>Select {col.referencesTable}...</option>
                      {parentRows.map((pRow, idx) => {
                        const pkVal = pRow[parentPK];
                        const labelCol = Object.keys(pRow).find((k) => k.toLowerCase().includes('name')) || parentPK;
                        return (
                          <option key={idx} value={pkVal} style={{ background: '#08080a' }}>
                            {pkVal} - {pRow[labelCol]}
                          </option>
                        );
                      })}
                    </select>
                  ) : col.name.toLowerCase().includes('status') ? (
                    <select
                      value={formData[col.name]}
                      onChange={(e) => handleChange(col.name, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: error ? '1px solid #ef4444' : '1px solid var(--border)',
                        color: '#ffffff',
                        fontSize: 12.5
                      }}
                    >
                      <option value="Operational" style={{ background: '#08080a' }}>Operational</option>
                      <option value="Maintenance" style={{ background: '#08080a' }}>Maintenance</option>
                      <option value="Active" style={{ background: '#08080a' }}>Active</option>
                      <option value="Compliant" style={{ background: '#08080a' }}>Compliant</option>
                      <option value="Standby" style={{ background: '#08080a' }}>Standby</option>
                    </select>
                  ) : (
                    <input
                      type={col.type === 'DATE' ? 'date' : col.type.startsWith('DECIMAL') || col.type === 'INTEGER' ? 'number' : 'text'}
                      step={col.type.startsWith('DECIMAL') ? '0.01' : undefined}
                      value={formData[col.name] ?? ''}
                      onChange={(e) => handleChange(col.name, e.target.value)}
                      placeholder={`Enter ${col.name}...`}
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: error ? '1px solid #ef4444' : '1px solid var(--border)',
                        color: '#ffffff',
                        fontSize: 12.5,
                        fontFamily: col.type.includes('TIMESTAMP') || col.type.startsWith('DECIMAL') ? 'var(--font-mono)' : 'inherit'
                      }}
                    />
                  )}

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444', fontSize: 11, marginTop: 5 }}>
                      <AlertCircle size={11} />
                      {error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer buttons */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              width: '100%'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: 12.5,
                fontWeight: 500,
                flex: isMobile ? 1 : 'none',
                textAlign: 'center'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffffff',
                border: '1px solid #ffffff',
                color: '#000000',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                flex: isMobile ? 1 : 'none',
                boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)'
              }}
            >
              <Check size={14} />
              Confirm Insertion
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
