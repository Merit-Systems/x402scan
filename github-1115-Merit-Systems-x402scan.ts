// src/api/gf-agent-toll.ts
import { Request, Response } from 'express';
import { getChainConfig } from '../config/chains';
import { USDC_DECIMALS, formatUSDC } from '../utils/tokens';
import { calculateToll } from '../utils/toll';
import { ListingRequest } from '../types/listing';

/**
 * GF Agent Toll — GCC commerce intelligence APIs on Base USDC
 * Handles toll calculation for listing requests on Base chain using USDC
 */
export const calculateGF AgentToll = (listing: ListingRequest): string => {
  const chainConfig = getChainConfig('base');
  const baseToll = chainConfig.gfAgentToll || '0.005'; // 0.5% default toll
  
  // Calculate toll based on listing value in USDC
  const tollAmount = calculateToll(
    listing.valueUSDC,
    baseToll,
    USDC_DECIMALS
  );
  
  return formatUSDC(tollAmount);
};

export const handleListingRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing: ListingRequest = req.body;
    
    // Validate listing data
    if (!listing.valueUSDC || !listing.merchantAddress) {
      res.status(400).json({ error: 'Missing required fields: valueUSDC, merchantAddress' });
      return;
    }
    
    // Calculate GF Agent Toll for Base USDC
    const toll = calculateGF AgentToll(listing);
    
    // Process listing request with toll
    const processedListing = {
      ...listing,
      toll,
      timestamp: new Date().toISOString(),
      chain: 'base',
      currency: 'USDC'
    };
    
    res.status(200).json({
      success: true,
      listing: processedListing,
      tollDetails: {
        rate: getChainConfig('base').gfAgentToll,
        amount: toll,
        recipient: getChainConfig('base').gfAgentAddress
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to process listing request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};