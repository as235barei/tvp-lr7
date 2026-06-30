// Tiny presentational star-rating display (★ filled / ☆ empty + numeric value).
export default function Stars({ value, showValue = true }) {
  const full = Math.round(value);
  return (
    <span className="card-rating" aria-label={`Rating ${value} out of 5`}>
      <span className="stars" aria-hidden="true">
        {'★'.repeat(full)}
        {'☆'.repeat(5 - full)}
      </span>{' '}
      {showValue && value.toFixed(1)}
    </span>
  );
}
