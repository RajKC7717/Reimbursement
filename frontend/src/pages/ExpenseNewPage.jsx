import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { submitExpense, uploadReceipt } from '../api/expenseApi';
import { getCategories } from '../api/categoryApi';
import toast from 'react-hot-toast';

export default function ExpenseNewPage() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [ocrData, setOcrData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.data))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await submitExpense(data);
      toast.success('Expense submitted successfully!');
      navigate('/expenses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const res = await uploadReceipt(formData);
      const ocr = res.data.data.ocr_data;
      setOcrData(ocr);

      // Auto-fill suggestions from OCR
      if (ocr.extracted.amount) {
        setValue('amount', ocr.extracted.amount);
      }
      if (ocr.extracted.description) {
        setValue('description', ocr.extracted.description);
      }
      toast.success('Receipt scanned! Review the extracted data.');
    } catch (err) {
      toast.error('OCR scan failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
        Submit New Expense
      </h1>

      <div className="card">
        <div className="card-body">
          {/* OCR Upload Section */}
          <div className="form-group" style={{ background: 'var(--color-primary-50)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }}>
            <label className="form-label">📷 Scan Receipt (Optional)</label>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-slate-500)', marginBottom: 'var(--space-3)' }}>
              Upload a receipt image and we'll auto-extract the details for you.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleReceiptUpload}
              className="form-input"
              style={{ height: 'auto', padding: 'var(--space-2)' }}
            />
            {uploading && <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-primary-600)', fontSize: 'var(--font-size-sm)' }}>Scanning receipt...</p>}
            {ocrData && (
              <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'white', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                <strong>OCR Results:</strong>
                <p>Amount: {ocrData.extracted.amount || 'N/A'} | Date: {ocrData.extracted.date || 'N/A'} | Vendor: {ocrData.extracted.vendor || 'N/A'}</p>
                <p style={{ color: 'var(--color-slate-400)', fontSize: 'var(--font-size-xs)' }}>Confidence: {Math.round(ocrData.confidence)}%</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="expense-title">Title *</label>
                <input
                  id="expense-title"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Business lunch, Flight ticket..."
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && <span className="form-error">{errors.title.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expense-category">Category *</label>
                <select
                  id="expense-category"
                  className={`form-select ${errors.category_id ? 'error' : ''}`}
                  {...register('category_id', { required: 'Category is required' })}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.category_id && <span className="form-error">{errors.category_id.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="expense-amount">Amount *</label>
                <input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  className={`form-input ${errors.amount ? 'error' : ''}`}
                  placeholder="0.00"
                  {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be positive' } })}
                />
                {errors.amount && <span className="form-error">{errors.amount.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expense-currency">Currency *</label>
                <input
                  id="expense-currency"
                  className={`form-input ${errors.currency_code ? 'error' : ''}`}
                  placeholder="USD, EUR, INR..."
                  maxLength={3}
                  style={{ textTransform: 'uppercase' }}
                  {...register('currency_code', { required: 'Currency is required', maxLength: 10 })}
                />
                {errors.currency_code && <span className="form-error">{errors.currency_code.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="expense-date">Expense Date *</label>
                <input
                  id="expense-date"
                  type="date"
                  className={`form-input ${errors.expense_date ? 'error' : ''}`}
                  {...register('expense_date', { required: 'Date is required' })}
                />
                {errors.expense_date && <span className="form-error">{errors.expense_date.message}</span>}
              </div>
              <div />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expense-description">Description</label>
              <textarea
                id="expense-description"
                className="form-textarea"
                rows={3}
                placeholder="Optional details about this expense..."
                {...register('description')}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/expenses')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
