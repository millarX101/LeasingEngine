import { formatCurrency } from '../utils/formatCurrency';

export default function QuoteCard({ q }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Quote {q.quoteRef}
          </h3>
          <p className="text-sm text-gray-600">
            {q.data.make} {q.data.model} {q.data.year}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Price</p>
          <p className="text-lg font-bold text-purple-700">
            {formatCurrency(q.data.price)}
          </p>
        </div>
      </div>
      
      {/* Display generated car image if available */}
      {q.imageUrl && (
        <div className="mb-4">
          <img 
            src={q.imageUrl} 
            alt={`${q.data.make} ${q.data.model}`}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="bg-gray-50 p-4 rounded">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
          {q.quote}
        </pre>
      </div>
    </div>
  );
}
