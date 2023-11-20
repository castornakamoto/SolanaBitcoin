// ... (previous code)

async function getLockInfo() {
    // Connect to the local Solana testnet
    const connection = new Connection('http://localhost:8899', 'confirmed');
  
    // Replace with the address of your deployed smart contract
    const contractAddress = new PublicKey('FcU8NsGEdmyTgCqvepLXeTmLZ6uuuSBFZ1bAT8qZEJSV');
  
    // Create a keypair from the private key
    const walletKeyPair = Keypair.fromSecretKey(Buffer.from(privateKey));
  
    // Replace with the address of your lock_data_account
    const lockDataAccount = new PublicKey('YOUR_LOCK_DATA_ACCOUNT_ADDRESS');
  
    // Define the instruction data for the getLockInfo method (if needed)
    const instructionData = Buffer.alloc(0); // Use an appropriate Buffer based on your contract's requirements
  
    // Create a transaction
    const transaction = new Transaction().add({
      keys: [
        { pubkey: walletKeyPair.publicKey, isSigner: true, isWritable: false },
        { pubkey: contractAddress, isSigner: false, isWritable: true },
        { pubkey: lockDataAccount, isSigner: false, isWritable: false }, // Add the lock_data_account
        // Add other account keys as needed
      ],
      programId: contractAddress, // Set the program ID to the contract's address
      data: instructionData, // Pass instruction data if required
    });
  
    // Sign and send the transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [walletKeyPair], // Sign with your wallet's keypair
      { commitment: 'confirmed' }
    );
  
    console.log(`Transaction signature: ${signature}`);
  }
  
  