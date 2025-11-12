export const ItemContainer = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium font-mono">{label}</p>
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
      value={<p className="border rounded-md p-2 bg-muted">{value}</p>}
    />
  );
};
