import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { generateFullQuote } from "./utils/fullQuoteGenerator";
import { generateCarSceneImage } from "./utils/carImageGenerator";
import QuoteCard from "./components/QuoteCard";
import QuoteDropdowns from "./QuoteDropdowns";

const purple = "bg-purple-700";
const purpleHover = "hover:bg-purple-800";

export default function App() {
  const [formData, setFormData] = useState({
    clientName: "", clientEmail: "",
    make: "", model: "", year: "", trim: "",
    state: "VIC", isEV: false, carType: "",
    price: 0, salary: 0, kms: 15000,
    termYears: 5, payCycle: "Monthly",
    ecm: "Employee Contribution Method",
    businessUsePercent: 0
  });

  const [quotes, setQuotes] = useState([]);

  const handleChange = ({ target }) => {
    const { name, type, value, checked } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked :
               type === "number" ? +value || 0 : value
    }));
  };

  const handleDropdown = (fields) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const generateQuoteID = () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const serial = quotes.length + 1;
    return `Q-${dateStr}-${String(serial).padStart(3, "0")}`;
  };

  const handleGenerateQuote = async () => {
    try {
      const fullForm = { ...formData };

      if (!fullForm.price || fullForm.price < 1000) {
        alert("Please enter a valid driveaway price (above $1,000).");
        return;
      }
      if (!fullForm.salary || fullForm.salary < 20000) {
        alert("Please enter a valid annual salary (above $20,000).");
        return;
      }

      const quoteData = generateFullQuote(fullForm);

      let imageUrl = "";
      try {
        imageUrl = await generateCarSceneImage(
          fullForm.make, fullForm.model, fullForm.carType
        );
      } catch (err) {
        console.warn("Image generation failed:", err);
      }

      setQuotes(prev => [
        ...prev,
        {
          id: uuidv4(),
          quoteRef: generateQuoteID(),
          data: fullForm,
          quote: quoteData,
          imageUrl,
          selected: false
        }
      ]);
    } catch (err) {
      console.error("Quote generation failed:", err);
      alert("Something went wrong while generating your quote.");
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 text-gray-800">
      <header className="bg-white shadow px-6 py-4 flex items-center gap-4">
        <img
          src="https://static.wixstatic.com/media/9c690e_2af82b66d9ad42dd9c186c2782642d00~mv2.png"
          alt="millarX"
          className="h-16"
        />
        <h1 className="text-2xl font-bold text-purple-800">millarX DriveIQ – Novated Quotes</h1>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <section className="bg-white p-8 rounded-2xl shadow space-y-6">
          {/* Contact + State */}
          <div className="grid md:grid-cols-2 gap-6">
            <TextInput label="Client Name" name="clientName" value={formData.clientName} onChange={handleChange} />
            <TextInput label="Client Email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} />
            <SelectInput label="State" name="state" value={formData.state} onChange={handleChange}
              options={["VIC", "NSW", "QLD", "SA", "WA", "TAS", "ACT", "NT"]} />
          </div>

          {/* Vehicle Info */}
          <QuoteDropdowns
            make={formData.make}
            model={formData.model}
            year={formData.year}
            onChange={handleDropdown}
          />
          <TextInput label="Variant" name="trim" value={formData.trim} onChange={handleChange} />

          {/* Pricing + Inputs */}
          <div className="grid md:grid-cols-2 gap-6">
            <NumberInput label="Price (Driveaway)" name="price" value={formData.price} onChange={handleChange} />
            <NumberInput label="Salary (Annual)" name="salary" value={formData.salary} onChange={handleChange} />
            <NumberInput label="Annual Kilometres" name="kms" value={formData.kms} onChange={handleChange} />
            <SelectInput label="Term" name="termYears" value={formData.termYears} onChange={handleChange}
              options={[1, 2, 3, 4, 5].map(y => `${y} Year`)} values={[1, 2, 3, 4, 5]} />
            <SelectInput label="Pay Cycle" name="payCycle" value={formData.payCycle} onChange={handleChange}
              options={["Weekly", "Fortnightly", "Monthly"]} />
            <SelectInput label="FBT Method" name="ecm" value={formData.ecm} onChange={handleChange}
              options={["Employee Contribution Method", "Operating Cost Method"]} />
            {formData.ecm === "Operating Cost Method" && (
              <NumberInput label="Business Use %" name="businessUsePercent" value={formData.businessUsePercent} onChange={handleChange} />
            )}
            <CheckboxInput label="Is this car an EV?" name="isEV" checked={formData.isEV} onChange={handleChange} />
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerateQuote}
              className={`px-6 py-3 rounded text-white ${purple} ${purpleHover}`}
            >
              Generate Quote
            </button>
          </div>
        </section>

        {/* Results */}
        <section className="mt-10 space-y-8">
          {quotes.map((q) => (
            <QuoteCard key={q.id} q={q} />
          ))}
        </section>
      </main>
    </div>
  );
}

// --- INPUT COMPONENTS ---

const TextInput = ({ label, ...props }) => (
  <label className="text-sm space-y-1">
    {label}
    <input
      type="text"
      {...props}
      className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-600"
    />
  </label>
);

const NumberInput = ({ label, ...props }) => (
  <label className="text-sm space-y-1">
    {label}
    <input
      type="number"
      {...props}
      className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-600"
    />
  </label>
);

const SelectInput = ({ label, options, values, ...props }) => (
  <label className="text-sm space-y-1">
    {label}
    <select
      {...props}
      className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-600"
    >
      {(values || options).map((val, i) => (
        <option key={val} value={values ? values[i] : val}>
          {val}
        </option>
      ))}
    </select>
  </label>
);

const CheckboxInput = ({ label, name, checked, onChange }) => (
  <label className="flex items-center space-x-3 text-sm mt-2">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-purple-600 border-gray-300 rounded"
    />
    <span>{label}</span>
  </label>
);
