// components/DrugCard.tsx

import Link from 'next/link';
import { Drug } from '@/lib/types';

interface DrugCardProps {
  drug: Drug;
}

export default function DrugCard({ drug }: DrugCardProps) {
  return (
    <Link 
      href={`/drug/${drug.rx_cui}`}
      className="block p-5 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-500 transition-all bg-white"
    >
      <div className="space-y-3">
        {/* Generic Name */}
        <h3 className="text-xl font-semibold text-gray-900 capitalize">
          {drug.generic_name}
        </h3>

        {/* Brand Names */}
        {drug.brand_names && drug.brand_names.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 font-medium">Brands:</span>
            {drug.brand_names.slice(0, 4).map((brand, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded border border-blue-200"
              >
                {brand}
              </span>
            ))}
            {drug.brand_names.length > 4 && (
              <span className="px-2 py-1 text-sm text-gray-500">
                +{drug.brand_names.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Drug Class */}
        {drug.drug_class && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Class:</span> {drug.drug_class}
          </p>
        )}

        {/* ATC Code */}
        {drug.atc_code && (
          <p className="text-xs text-gray-500 font-mono">
            ATC: {drug.atc_code}
          </p>
        )}

        {/* View Details Link */}
        <div className="pt-2">
          <span className="text-sm text-blue-600 font-medium hover:underline">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}