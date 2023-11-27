interface LockEntry {
    amount: string; // Assuming these are serialized as strings
    timestamp: string;
}

interface LockAccount {
    locks: LockEntry[];
}

