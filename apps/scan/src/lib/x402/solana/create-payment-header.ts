import {
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  prependTransactionMessageInstruction,
  getBase64EncodedWireTransaction,
  fetchEncodedAccount,
  compileTransaction,
} from '@solana/kit';
import {
  fetchMint,
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstruction,
  getTransferCheckedInstruction,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '@solana-program/token-2022';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import {
  estimateComputeUnitLimitFactory,
  getSetComputeUnitLimitInstruction,
  setTransactionMessageComputeUnitPrice,
} from '@solana-program/compute-budget';

import { solanaRpc } from '@/services/rpc/solana';

import { encodePayment } from './encode-payment';

import type { PaymentRequirements } from 'x402/types';
import type {
  Address,
  TransactionSigner,
  Instruction,
  TransactionModifyingSigner,
} from '@solana/kit';

export async function createPaymentHeader(
  signer: TransactionModifyingSigner,
  x402Version: number,
  paymentRequirements: PaymentRequirements
): Promise<string> {
  const transactionMessage = await createTransferTransactionMessage(
    signer,
    paymentRequirements
  );

  const compiledTransaction = compileTransaction(transactionMessage);

  const [signedTransaction] = await signer.modifyAndSignTransactions([
    {
      messageBytes: compiledTransaction.messageBytes,
      signatures: compiledTransaction.signatures,
    },
  ]);

  const base64EncodedWireTransaction =
    getBase64EncodedWireTransaction(signedTransaction);

  return encodePayment({
    scheme: paymentRequirements.scheme,
    network: paymentRequirements.network,
    x402Version: x402Version,
    payload: {
      transaction: base64EncodedWireTransaction,
    },
  });
}

async function createTransferTransactionMessage(
  signer: TransactionModifyingSigner,
  paymentRequirements: PaymentRequirements
) {
  // create the transfer instruction
  const transferInstructions = await createAtaAndTransferInstructions(
    signer,
    paymentRequirements
  );

  // create tx to simulate
  const feePayer = paymentRequirements.extra?.feePayer as Address;
  const txToSimulate = pipe(
    createTransactionMessage({ version: 0 }),
    tx => setTransactionMessageComputeUnitPrice(1, tx), // 1 microlamport priority fee
    tx => setTransactionMessageFeePayer(feePayer, tx),
    tx => appendTransactionMessageInstructions(transferInstructions, tx)
  );

  // estimate the compute budget limit (gas limit)
  const estimateComputeUnitLimit = estimateComputeUnitLimitFactory({
    rpc: solanaRpc,
  });
  const estimatedUnits = await estimateComputeUnitLimit(txToSimulate).catch(
    e => {
      if (e instanceof Error) {
        console.error(e.cause);
        throw e;
      }
      throw new Error('Failed to estimate compute unit limit');
    }
  );

  // finalize the transaction message by adding the compute budget limit and blockhash
  const { value: latestBlockhash } = await solanaRpc
    .getLatestBlockhash()
    .send();
  const tx = pipe(
    txToSimulate,
    tx =>
      prependTransactionMessageInstruction(
        getSetComputeUnitLimitInstruction({ units: estimatedUnits }),
        tx
      ),
    tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
  );

  return tx;
}

async function createAtaAndTransferInstructions(
  signer: TransactionModifyingSigner,
  paymentRequirements: PaymentRequirements
): Promise<Instruction[]> {
  const { asset } = paymentRequirements;

  const tokenMint = await fetchMint(solanaRpc, asset as Address);
  const tokenProgramAddress = tokenMint.programAddress;

  // validate that the asset was created by a known token program
  if (
    tokenProgramAddress.toString() !== TOKEN_PROGRAM_ADDRESS.toString() &&
    tokenProgramAddress.toString() !== TOKEN_2022_PROGRAM_ADDRESS.toString()
  ) {
    throw new Error('Asset was not created by a known token program');
  }

  const instructions: Instruction[] = [];

  // create the ATA (if needed)
  const createAtaIx = await createAtaInstructionOrUndefined(
    paymentRequirements,
    tokenProgramAddress
  );
  if (createAtaIx) {
    instructions.push(createAtaIx);
  }

  // create the transfer instruction
  const transferIx = await createTransferInstruction(
    signer,
    paymentRequirements,
    tokenMint.data.decimals,
    tokenProgramAddress
  );
  instructions.push(transferIx);

  return instructions;
}

async function createAtaInstructionOrUndefined(
  paymentRequirements: PaymentRequirements,
  tokenProgramAddress: Address
): Promise<Instruction | undefined> {
  const { asset, payTo, extra } = paymentRequirements;
  const feePayer = extra?.feePayer as Address;

  // feePayer is required
  if (!feePayer) {
    throw new Error(
      'feePayer is required in paymentRequirements.extra in order to set the ' +
        'facilitator as the fee payer for the create associated token account instruction'
    );
  }

  // derive the ATA of the payTo address
  const [destinationATAAddress] = await findAssociatedTokenPda({
    mint: asset as Address,
    owner: payTo as Address,
    tokenProgram: tokenProgramAddress,
  });

  // check if the ATA exists
  const maybeAccount = await fetchEncodedAccount(
    solanaRpc,
    destinationATAAddress
  );

  // if the ATA does not exist, return an instruction to create it
  if (!maybeAccount.exists) {
    return getCreateAssociatedTokenInstruction({
      payer: paymentRequirements.extra?.feePayer as TransactionSigner,
      ata: destinationATAAddress,
      owner: payTo as Address,
      mint: asset as Address,
      tokenProgram: tokenProgramAddress,
    });
  }

  // if the ATA exists, return undefined
  return undefined;
}

async function createTransferInstruction(
  signer: TransactionModifyingSigner,
  paymentRequirements: PaymentRequirements,
  decimals: number,
  tokenProgramAddress: Address
): Promise<Instruction> {
  const { asset, maxAmountRequired: amount, payTo } = paymentRequirements;

  const [sourceATA] = await findAssociatedTokenPda({
    mint: asset as Address,
    owner: signer.address,
    tokenProgram: tokenProgramAddress,
  });

  const [destinationATA] = await findAssociatedTokenPda({
    mint: asset as Address,
    owner: payTo as Address,
    tokenProgram: tokenProgramAddress,
  });

  return getTransferCheckedInstruction(
    {
      source: sourceATA,
      mint: asset as Address,
      destination: destinationATA,
      authority: signer,
      amount: BigInt(amount),
      decimals: decimals,
    },
    { programAddress: tokenProgramAddress }
  );
}
