"use client";

import { useContext } from "react";
import { ChainContext } from "./context";

export const useChain = () => {
  return useContext(ChainContext);
};
