// src/components/QuoteCard.jsx
export default function QuoteCard({ quote, toggleSelection }) {
  const { id, quoteRef, data, quote: q, selected, imageUrl } = quote;

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4 border border-purple-100">
      <div className="flex justify-between items-center">
        <h2 className="text-purple-700 font-bold text-xl">
          {data.termYears}-Year Quote | {quoteRef}
        </h2>
        <label className="text-sm flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={selected}
            onChange={() => toggleSelection(id)}
          />
          Include in PDF
        </label>
      </div>

      <div className="text-sm text-gray-600">
        {data.clientName} • {data.clientEmail}
      </div>

      <div className="text-3xl font-bold text-purple-800">
        ${q?.oopPerCycle?.toFixed(2) || "0.00"} / {data.payCycle.toLowerCase()}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-purple-700 text-white p-5 rounded-xl space-y-2">
          <h3 className="text-lg font-semibold">Finance</h3>
          <p>Amount Financed: ${q?.finance?.displayAmountFinanced?.toFixed(2) || "0.00"}</p>
          <p>Monthly Payment: ${q?.finance?.monthlyPayment?.toFixed(2) || "0.00"}</p>
          <p>Balloon: ${q?.finance?.balloon?.toFixed(2) || "0.00"}</p>
          <p>Establishment Fee: $29</p>
        </div>

        <div className="bg-orange-600 text-white p-5 rounded-xl space-y-2">
          <h3 className="text-lg font-semibold">Running Costs</h3>
          {Object.entries(q?.running || {})
            .filter(([k]) => k !== "total")
            .map(([k, v]) => (
              <p key={k}>{k}: ${v.toFixed(2)}</p>
            ))}
        </div>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt={`${data.make} ${data.model}`}
          className="w-full rounded-lg mt-6 shadow"
        />
      )}
    </div>
  );
}
