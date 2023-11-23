interface TokenLock {
    amount: string; // Assuming these are serialized as strings
    timestamp: string;
}

interface LedgerData {
    locks: TokenLock[];
}

