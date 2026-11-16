type Props = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children?: React.ReactNode;
};

export function CapabilityCard({ title, description, isLoading, error, empty, emptyMessage, children }: Props) {
  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{isLoading ? <p role="status">Loading…</p> : null}{error ? <p role="alert">{error}</p> : null}{!isLoading && !error && empty ? <p>{emptyMessage ?? 'No data available.'}</p> : null}{!isLoading && !error && !empty ? <>{children}</> : null}</div></section>;
}
