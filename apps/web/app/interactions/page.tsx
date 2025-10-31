'use client'

import { useState } from 'react'

export default function InteractionsPage() {
  const [drugA, setDrugA] = useState('')
  const [drugB, setDrugB] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const onCheck = (e: React.FormEvent) => {
    e.preventDefault()
    if (drugA && drugB) {
      setResult(`${drugA} + ${drugB} interaction checked!`)
    } else {
      setResult('Please enter both drugs')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Team Name */}
      <h1 className="text-4xl font-bold mb-2 ">PhAIrm</h1>

      {/* Main Page Heading */}
      <h2 className="text-3xl font-semibold mb-6 ">Drug Interaction Checker</h2>

      <form onSubmit={onCheck} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col text-black">
            <span>Drug A</span>
            <input
              value={drugA}
              onChange={(e) => setDrugA(e.target.value)}
              placeholder="e.g., ibuprofen"
              className="mt-1 border rounded px-3 py-2 text-black"
            />
          </label>

          <label className="flex flex-col text-black">
            <span>Drug B</span>
            <input
              value={drugB}
              onChange={(e) => setDrugB(e.target.value)}
              placeholder="e.g., aspirin"
              className="mt-1 border rounded px-3 py-2 text-black"
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        >
          Check Interaction
        </button>
      </form>

      {result && <div className="mt-4 p-4 bg-gray-100 rounded text-black">{result}</div>}
    </div>
  )
}

