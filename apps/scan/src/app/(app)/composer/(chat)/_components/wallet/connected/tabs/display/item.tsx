interface ItemContainerProps {
  label: string;
  value: React.ReactNode;
}

export const ItemContainer = ({ label, value }: ItemContainerProps) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="type-mono type-scale-supporting type-emphasis">{label}</p>
      {value}
    </div>
  );
};

interface AuthenticationMethodProps {
  label: string;
  value: string;
}

export const AuthenticationMethod = ({
  label,
  value,
}: AuthenticationMethodProps) => {
  return (
    <ItemContainer
      label={label}
      value={<p className="rounded-md border bg-muted p-2">{value}</p>}
    />
  );
};
