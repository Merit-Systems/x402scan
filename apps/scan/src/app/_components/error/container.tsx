export const ErrorPageContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex flex-1 flex-col">
      <div className="h-4 border-b bg-card" />
      {children}
    </div>
  );
};
