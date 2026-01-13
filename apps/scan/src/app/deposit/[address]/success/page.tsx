export default function SuccessPage() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <CheckCircle className="size-10 text-green-600" />
      <p className="text-center">
        You have successfully sent{' '}
        <span className="font-bold">{amount} USDC</span> to{' '}
        <span className="font-bold">{formatAddress(toAddress)}</span>
      </p>
    </div>
  );
}
