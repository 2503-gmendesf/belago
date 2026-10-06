import { useState, type ReactNode } from 'react';
import { Icon } from '../../../components/Icon.js';

interface FaqAccordionProps {
  items: Array<[string, ReactNode]>;
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq">
      {items.map(([question, answer], i) => (
        <div className={`faq-q${openIndex === i ? ' faq-open' : ''}`} key={question}>
          <button onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            {question}
            <Icon name="chevron-down" />
          </button>
          <div className="faq-a">{answer}</div>
        </div>
      ))}
    </div>
  );
}
