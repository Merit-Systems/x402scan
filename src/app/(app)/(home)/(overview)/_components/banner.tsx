import React from 'react';

export const Banner: React.FC = () => {
  return (
    <div className="bg-primary/5 border-primary/20 w-full border-b py-2 text-center text-[10px] md:text-xs">
      <div className="mx-auto w-fit flex items-center gap-2">
        <span className="text-primary/60 font-bold">
          x402scan currently only supports Base mainnet and will be multi-chain
          soon
        </span>
      </div>
    </div>
  );
};
