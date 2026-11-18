type Props = {
  label: string;
  totalMinutes: number;
  progress: number;
};

export default function ProgressEta({ label, totalMinutes, progress }: Props) {
  const remaining = Math.max(1, Math.ceil(totalMinutes * (1 - progress)));

  return (
    <div className="card">
      <div className="price">
        <span>{label}</span>
        <b>{remaining} min</b>
      </div>
      <div className="progress" aria-hidden="true">
        <i style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
