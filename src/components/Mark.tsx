/** Small arch-with-keystone mark used as the logo. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M4 28V17a12 12 0 0 1 24 0v11h-6V17a6 6 0 0 0-12 0v11z" fill="#16263a" />
      <path d="M13.2 3.6h5.6l-1 7.2h-3.6z" fill="#a8741a" />
    </svg>
  );
}
