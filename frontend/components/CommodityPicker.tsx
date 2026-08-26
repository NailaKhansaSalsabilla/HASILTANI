"use client";

import Image from "next/image";
import type { Commodity } from "@/lib/types";

const options: Array<{
  id: Commodity;
  label: string;
  image: string;
}> = [
  { id: "tomat", label: "Tomat", image: "/commodities/tomat.jpg" },
  { id: "pisang", label: "Pisang", image: "/commodities/pisang.jpg" },
  { id: "mangga", label: "Mangga", image: "/commodities/mangga.jpg" },
  { id: "jeruk", label: "Jeruk", image: "/commodities/jeruk.jpg" },
];

export function CommodityPicker({
  value,
  onChange,
}: {
  value: Commodity;
  onChange: (value: Commodity) => void;
}) {
  return (
    <div className="commodity-picker scan-commodity-picker">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`commodity-option scan-commodity-option ${
            value === option.id ? "active" : ""
          }`}
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
        >
          <span className="scan-commodity-image">
            <Image
              src={option.image}
              alt={option.label}
              fill
              sizes="(max-width: 620px) 45vw, (max-width: 920px) 22vw, 180px"
              priority
            />
          </span>
          <span className="scan-commodity-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
