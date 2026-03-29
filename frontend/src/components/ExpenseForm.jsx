import { useState } from 'react'

export default function ExpenseForm({ onSubmit, onCancel }) {
  const [employee, setEmployee] = useState('')
  const [category, setCategory] = useState('Travel')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const valid = employee.trim() && category && parseFloat(amount) > 0

  return (
    <div className="form-panel">
      <h3>Submit New Expense</h3>
      <div className="form-row">
        <label>Employee</label>
        <input
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <div className="form-row">
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Travel</option>
          <option>Meals</option>
          <option>Supplies</option>
          <option>Software</option>
          <option>Other</option>
        </select>
      </div>
      <div className="form-row">
        <label>Amount</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 120.00"
        />
      </div>
      <div className="form-row">
        <label>Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Trip to client site"
        />
      </div>
      <div className="form-actions">
        <button
          className="btn secondary"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="btn primary"
          type="button"
          disabled={!valid}
          onClick={() => {
            onSubmit({
              id: Date.now().toString(),
              employee: employee.trim(),
              category,
              amount: parseFloat(amount),
              status: 'Pending',
              note: note.trim(),
            })
            setEmployee('')
            setCategory('Travel')
            setAmount('')
            setNote('')
          }}
        >
          Submit Request
        </button>
      </div>
    </div>
  )
}
