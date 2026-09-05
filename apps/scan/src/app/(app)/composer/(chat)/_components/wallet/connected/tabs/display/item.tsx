export const ItemContainer = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="type-mono type-scale-supporting type-emphasis">{label}</p>
      {value}
    </div>
  );
};

export const AuthenticationMethod = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <ItemContainer
      label={label}
      value={<p className="rounded-md border bg-muted p-2">{value}</p>}
    />
  );
};
