"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: readonly FAQItem[];
  initialOpenIndex?: number | null;
};

export function FAQAccordion({
  items,
  initialOpenIndex = null,
}: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpenIndex);

  return (
    <div>
      {items.map((item, index) => {
        const isOpen = index === openIndex;

        return (
          <div className={`faq-item ${isOpen ? "open" : ""}`} key={item.question}>
            <button
              className="faq-question"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              type="button"
            >
              <span>{item.question}</span>
              <span className="faq-icon">+</span>
            </button>
            <div className="faq-answer">{item.answer}</div>
          </div>
        );
      })}
    </div>
  );
}
