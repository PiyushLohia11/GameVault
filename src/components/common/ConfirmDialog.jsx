import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Removal',
  message = 'Are you sure you want to remove this record from your library?',
  confirmLabel = 'Remove Record',
  cancelLabel = 'Cancel',
  isDanger = true,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={AlertTriangle}
      footer={
        <>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-secondary"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="dashboard-btn"
            style={{
              backgroundColor: isDanger ? 'var(--color-danger)' : 'var(--accent-primary)',
              color: isDanger ? '#ffffff' : 'var(--text-inverse)',
              fontWeight: 600,
            }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
        {message}
      </p>
    </Modal>
  );
}
