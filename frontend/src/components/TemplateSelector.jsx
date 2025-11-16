import React from 'react';

const TemplateSelector = ({ templates = [], onSelect }) => {
  if (templates.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className="card p-4 text-left hover:shadow-card-hover transition-all hover:scale-105 active:scale-95"
        >
          <div className="font-semibold text-text-primary mb-1">
            {template.name}
          </div>
          <div className="text-sm text-text-secondary mb-2">
            📍 {template.location}
          </div>
          <div className="text-xs text-primary font-semibold">
            ⏰ {template.duration} min
          </div>
        </button>
      ))}
    </div>
  );
};

export default TemplateSelector;
