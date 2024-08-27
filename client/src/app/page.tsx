'use client'
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type EntryType = {
  date: string;
  price: number;
};

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<EntryType[]>([]);
  const [error, setError] = useState("");

  const companies = ["AAPL", "MSFT", "AMZN", "TSLA", "GOOG", "NVDA", "INFY"];

  const handleSubmitted = async () => {
    setLoading(true);
    setError("");
    setPredictions([]);
    try {
      const response = await fetch('http://localhost:8000/predict/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: selectedCompany,
          start: selectedDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const res = await response.json();
      const predictionsData = res.map((entry: EntryType) => ({
        date: new Date(entry.date).toLocaleDateString(),
        price: Math.round(entry.price),  // Changed from `prediction` to `price`
      }));
      
      setPredictions(predictionsData);
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching predictions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen justify-between p-10 bg-gray-900">
      <div className="bg-gray-800 p-6 flex-col rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-4xl font-bold text-white text-center">Stock Analysis Tool</h1>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="company">
            Select a Company
          </label>
          <select
            id="company"
            className="w-full p-2 border border-gray-700 bg-gray-900 text-white rounded-lg"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="" disabled className="text-gray-500">Select a company</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="date">
            Select a Date <small>*(preferably before 01-01-2020)</small>
          </label>
          <input
            type="date"
            id="date"
            className="w-full p-2 border border-gray-700 bg-gray-900 text-white rounded-lg"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <button 
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          onClick={handleSubmitted}
        >
          Analyze
        </button>
        <p className="pt-10 text-center text-sm text-gray-300">
          This project uses a state of the art model to predict stocks of companies listed on NASDAQ, NSE and the Fortune 500<br/><br/>
          The model used is an LSTM with peephole connections that efficiently analyses relationships in time series and provides predictions on a weekly, monthly and yearly basis.<br/><br/>
          Uses the python wrapper for the Yfinance API to obtain real-time OHCV data on 1000+ stocks.<br/><br/>
          Disclaimer: Do not under any circumstances, take advice from this model😁.
        </p>
      </div>
      <div className="bg-gray-800 p-6 flex-col items-center justify-center rounded-lg shadow-lg w-full ml-4">
        <h2 className="text-3xl font-bold text-white mb-20">Stock Price Graph</h2>
        {loading ? (
          <p className="text-2xl text-gray-700 font-semibold">Loading...</p>
        ) : error ? (
          <p className="text-2xl text-red-700 font-semibold">{error}</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="date" stroke="#ddd" />
              <YAxis stroke="#ddd" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </main>
  );
}
