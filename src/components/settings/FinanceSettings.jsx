import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

const ITEM_TO_PANEL = {
  'fee-structure': 'fee',
  'payment-plans': 'plans',
  'scholarship-rules': 'scholarships',
  'late-fee-policies': 'late-fee',
  'payroll-configuration': 'payroll',
  'salary-components': 'salary',
  'invoice-templates': 'invoice',
  'payment-gateway-settings': 'gateway',
};

function AccordionItem({ id, title, openPanel, onToggle, children }) {
  const expanded = openPanel === id;

  return (
    <div className={`settings-accordion-item${expanded ? ' open' : ''}`}>
      <button type="button" className="settings-accordion-trigger" onClick={() => onToggle(id)}>
        <span>{title}</span>
        <strong>{expanded ? '-' : '+'}</strong>
      </button>
      {expanded ? <div className="settings-accordion-body">{children}</div> : null}
    </div>
  );
}

export default function FinanceSettings({ activeItemId }) {
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [openPanel, setOpenPanel] = useState('fee');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await settingsApi.getFinanceSettings();
      setForm(data);
      setBaseline(data);
    }

    load();
  }, []);

  useEffect(() => {
    const preferredPanel = ITEM_TO_PANEL[activeItemId];
    if (preferredPanel) {
      setOpenPanel(preferredPanel);
    }
  }, [activeItemId]);

  if (!form) {
    return <div className="settings-skeleton">Loading finance settings...</div>;
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    const updated = await settingsApi.updateFinanceSettings(form);
    setBaseline(updated);
    setForm(updated);
    setToast({ type: 'success', message: 'Finance settings updated successfully.' });
    setSaving(false);
  }

  function handleReset() {
    setForm(baseline);
    setToast({ type: 'success', message: 'Finance settings reset.' });
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <h3>Finance Configuration</h3>
        <p>Manage fees, payroll, scholarships, invoice templates, and payment channels.</p>

        <div className="settings-accordion">
          <AccordionItem id="fee" title="Fee Structure" openPanel={openPanel} onToggle={setOpenPanel}>
            <div className="settings-form-grid compact">
              <label>
                Tuition Fee
                <input
                  type="number"
                  min="0"
                  value={form.tuitionFee}
                  onChange={(event) => updateField('tuitionFee', Number(event.target.value) || 0)}
                />
              </label>

              <label>
                Late Fee Percent
                <input
                  type="number"
                  min="0"
                  value={form.lateFeePercent}
                  onChange={(event) => updateField('lateFeePercent', Number(event.target.value) || 0)}
                />
              </label>
            </div>
          </AccordionItem>

          <AccordionItem id="plans" title="Payment Plans" openPanel={openPanel} onToggle={setOpenPanel}>
            <label>
              Default Plan
              <select value={form.paymentPlan} onChange={(event) => updateField('paymentPlan', event.target.value)}>
                <option>Semester Split</option>
                <option>Monthly Installments</option>
                <option>Quarterly Plan</option>
              </select>
            </label>
          </AccordionItem>

          <AccordionItem
            id="scholarships"
            title="Scholarship Rules"
            openPanel={openPanel}
            onToggle={setOpenPanel}
          >
            <label className="settings-inline-toggle">
              <input
                type="checkbox"
                checked={form.scholarshipEnabled}
                onChange={(event) => updateField('scholarshipEnabled', event.target.checked)}
              />
              <span>Enable scholarship logic</span>
            </label>
            <label>
              Scholarship Policy
              <textarea
                rows="3"
                value={form.scholarshipRule}
                onChange={(event) => updateField('scholarshipRule', event.target.value)}
              />
            </label>
          </AccordionItem>

          <AccordionItem id="late-fee" title="Late Fee Policies" openPanel={openPanel} onToggle={setOpenPanel}>
            <label>
              Late Fee Percentage Rule
              <input
                type="number"
                min="0"
                value={form.lateFeePercent}
                onChange={(event) => updateField('lateFeePercent', Number(event.target.value) || 0)}
              />
            </label>
          </AccordionItem>

          <AccordionItem
            id="payroll"
            title="Payroll Configuration"
            openPanel={openPanel}
            onToggle={setOpenPanel}
          >
            <label>
              Payroll Cycle
              <select value={form.payrollCycle} onChange={(event) => updateField('payrollCycle', event.target.value)}>
                <option>Monthly</option>
                <option>Bi-Weekly</option>
                <option>Weekly</option>
              </select>
            </label>
          </AccordionItem>

          <AccordionItem id="salary" title="Salary Components" openPanel={openPanel} onToggle={setOpenPanel}>
            <label>
              Components
              <textarea
                rows="2"
                value={form.salaryComponents}
                onChange={(event) => updateField('salaryComponents', event.target.value)}
              />
            </label>
          </AccordionItem>

          <AccordionItem id="invoice" title="Invoice Templates" openPanel={openPanel} onToggle={setOpenPanel}>
            <label>
              Active Invoice Template
              <select value={form.invoiceTemplate} onChange={(event) => updateField('invoiceTemplate', event.target.value)}>
                <option>MIT Standard Invoice v2</option>
                <option>Compact Invoice</option>
                <option>Detailed GST Invoice</option>
              </select>
            </label>
          </AccordionItem>

          <AccordionItem
            id="gateway"
            title="Payment Gateway Settings"
            openPanel={openPanel}
            onToggle={setOpenPanel}
          >
            <label>
              Payment Gateway
              <select value={form.paymentGateway} onChange={(event) => updateField('paymentGateway', event.target.value)}>
                <option>Razorpay</option>
                <option>PayU</option>
                <option>Stripe</option>
              </select>
            </label>
          </AccordionItem>
        </div>

        <SettingsActionBar onSave={handleSave} onReset={handleReset} saving={saving} />
      </article>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
