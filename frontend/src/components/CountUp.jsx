const CountUp = ({ end, duration = 1000, suffix = '', prefix = '', className = '' }) => {
  // Display value directly without animation
  const value = parseInt(end) || 0;

  return (
    <span className={className}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
};

export default CountUp;
