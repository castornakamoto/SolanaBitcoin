use anchor_lang::error_code;

#[error_code]
pub enum ErrorCode {
    #[msg("Overflow when adding to the balance")]
    Overflow,
    #[msg("Insufficient funds for the transaction")]
    InsufficientFunds,
    #[msg("Failed to retrieve balance")]
    BalanceRetrievalFailure,
    #[msg("Not authorized to perform this action")]
    NotAuthorized,
    #[msg("Lock index out of bounds")]
    LockIndexOutOfBounds,
}