"use client";

import { useState } from "react";

import { EmbeddedWalletEmail } from "./email";
import { EmbeddedWalletOTP } from "./otp";

export const ConnectEmbeddedWalletEmail = () => {
  const [flowId, setFlowId] = useState("");

  if (flowId) {
    return (
      <div className="space-y-4">
        <EmbeddedWalletOTP
          flowId={flowId}
          handleReset={() => {
            setFlowId("");
          }}
        />
      </div>
    );
  }

  return <EmbeddedWalletEmail setFlowId={setFlowId} />;
};
